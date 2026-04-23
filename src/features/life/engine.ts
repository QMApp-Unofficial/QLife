import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

import {
  ACTIONS,
  EVENTS,
  FIRST_NAMES,
  GENETIC_BUNDLES,
  HOUSEHOLD_TONES,
  JOBS,
  LAST_NAMES,
  LOCATIONS,
  START_DISTRICTS,
  getLocation,
} from '../../data/world';
import { clamp, sample, seededValue } from '../../lib/utils';
import type {
  ActionDefinition,
  ActiveTimer,
  CreateSaveInput,
  EffectBundle,
  EventDefinition,
  JobId,
  LifeMoment,
  LifeStage,
  LocationId,
  PendingEvent,
  SaveState,
  SaveSummary,
  SessionUser,
  WorldSnapshot,
} from '../../types/game';

const LIFE_DAYS = 14;
const MAX_AGE = 92;

export function getLifeStage(age: number): LifeStage {
  if (age < 1) return 'birth';
  if (age < 5) return 'infancy';
  if (age < 13) return 'childhood';
  if (age < 19) return 'adolescence';
  if (age < 28) return 'young_adult';
  if (age < 50) return 'adulthood';
  if (age < 70) return 'maturity';
  return 'elder';
}

export function getWorldSnapshot(save: SaveState, nowIso = new Date().toISOString()): WorldSnapshot {
  const now = dayjs(nowIso);
  const lifeStarted = dayjs(save.lifeStartedAt);
  const age = clamp(now.diff(lifeStarted, 'minute', true) / (LIFE_DAYS * 24 * 60) * MAX_AGE, 0, MAX_AGE);
  const dayIndex = now.diff(lifeStarted, 'day');
  const clockHour = now.hour();
  const phase =
    clockHour < 7 ? 'dawn' : clockHour < 17 ? 'day' : clockHour < 20 ? 'golden' : 'night';

  const weatherScore = seededValue(save.userId, `${now.format('YYYY-MM-DD')}:${dayIndex}`);
  const weather =
    weatherScore < 0.14
      ? 'storm'
      : weatherScore < 0.28
        ? 'rain'
        : weatherScore < 0.46
          ? 'overcast'
          : weatherScore < 0.62
            ? 'fog'
            : phase === 'night'
              ? 'neon-night'
              : phase === 'dawn'
                ? 'sunrise'
                : 'clear';

  const skylineLabel =
    phase === 'night'
      ? 'The skyline hums in lacquered gold.'
      : phase === 'golden'
        ? 'The city glows like it is selling a better life.'
        : phase === 'dawn'
          ? 'Morning cuts softly through the concrete.'
          : 'Everything feels one choice away from changing.';

  return {
    age,
    stage: getLifeStage(age),
    weather,
    timeOfDay: phase,
    dayIndex,
    skylineLabel,
  };
}

function buildSummary(save: SaveState, snapshot = getWorldSnapshot(save), nowIso = new Date().toISOString()): SaveSummary {
  const location = getLocation(save.locationId);
  const characterName = `${save.character.firstName} ${save.character.lastName}`;
  const legacyBase =
    save.stats.reputation +
    save.stats.familyHonor +
    save.stats.netWorth / 120 +
    save.relationships.reduce((total, entry) => total + entry.closeness, 0) / 15 +
    save.education.credits / 3;

  return {
    saveName: save.saveName,
    characterName,
    age: Number(snapshot.age.toFixed(1)),
    lifeStage: snapshot.stage,
    money: save.stats.cash + save.stats.bank,
    locationName: location.name,
    statusPreview:
      save.status === 'dead'
        ? save.endingType === 'victory'
          ? 'A complete life. The city remembers.'
          : `Life ended: ${save.deathCause ?? 'Unknown'}`
        : `${snapshot.weather.replace('-', ' ')} over ${location.district}`,
    thumbnailTone:
      snapshot.timeOfDay === 'night' ? 'burgundy' : snapshot.timeOfDay === 'golden' ? 'gold' : 'ash',
    legacyScore: Math.round(legacyBase),
    updatedAt: nowIso,
  };
}

function createMoment(title: string, description: string, kind: LifeMoment['kind'] | string = 'milestone'): LifeMoment {
  const resolvedKind: LifeMoment['kind'] =
    kind === 'event' || kind === 'relationship' || kind === 'finance' || kind === 'death' || kind === 'ending'
      ? kind
      : 'milestone';
  return {
    id: nanoid(),
    title,
    description,
    kind: resolvedKind,
    at: new Date().toISOString(),
  };
}

function upsertRelationship(save: SaveState, role: string, delta: number, locationId: LocationId) {
  const existing = save.relationships.find((entry) => entry.role === role);
  if (existing) {
    existing.closeness = clamp(existing.closeness + delta, 0, 100);
    existing.chemistry = clamp(existing.chemistry + Math.round(delta / 2), 0, 100);
    existing.locationId = locationId;
    existing.memory.unshift(delta >= 0 ? 'You showed up.' : 'Things got colder.');
    existing.memory = existing.memory.slice(0, 4);
    return;
  }

  save.relationships.unshift({
    id: nanoid(),
    kind: 'npc',
    name: `${sample(FIRST_NAMES, save.userId, role)} ${sample(LAST_NAMES, save.userId, `${role}:last`)}`,
    role,
    chemistry: clamp(40 + delta, 10, 95),
    closeness: clamp(36 + delta, 10, 95),
    tension: 18,
    loyalty: 42,
    attraction: role === 'Partner' || role === 'Crush' || role === 'Old Flame' ? 60 : 12,
    mood: 'curious',
    locationId,
    status: role === 'Partner' ? 'Complicated' : 'Warming up',
    memory: ['You crossed paths at the right moment.'],
  });
}

function applyEffectBundle(save: SaveState, bundle?: EffectBundle) {
  if (!bundle) return;

  if (bundle.stats) {
    for (const [key, value] of Object.entries(bundle.stats)) {
      const statKey = key as keyof SaveState['stats'];
      const nextValue = (save.stats[statKey] ?? 0) + (value ?? 0);
      save.stats[statKey] = statKey === 'cash' || statKey === 'bank' || statKey === 'debt' || statKey === 'netWorth' || statKey === 'rent'
        ? Math.round(nextValue)
        : clamp(nextValue, statKey === 'stress' ? 0 : -9999, statKey === 'stress' ? 100 : 10000);
    }
  }

  save.stats.health = clamp(save.stats.health, 0, 100);
  save.stats.happiness = clamp(save.stats.happiness, 0, 100);
  save.stats.intelligence = clamp(save.stats.intelligence, 0, 100);
  save.stats.looks = clamp(save.stats.looks, 0, 100);
  save.stats.discipline = clamp(save.stats.discipline, 0, 100);
  save.stats.stress = clamp(save.stats.stress, 0, 100);
  save.stats.energy = clamp(save.stats.energy, 0, 100);
  save.stats.karma = clamp(save.stats.karma, 0, 100);
  save.stats.familyHonor = clamp(save.stats.familyHonor, 0, 100);
  save.stats.reputation = clamp(save.stats.reputation, 0, 100);
  save.stats.addictionRisk = clamp(save.stats.addictionRisk, 0, 100);
  save.stats.addictionState = clamp(save.stats.addictionState, 0, 100);
  save.stats.criminalHeat = clamp(save.stats.criminalHeat, 0, 100);
  save.stats.focus = clamp(save.stats.focus, 0, 100);

  if (bundle.educationCredits) {
    save.education.credits = clamp(save.education.credits + bundle.educationCredits, 0, 100);
    save.education.gradeAverage = clamp(save.education.gradeAverage + Math.round(bundle.educationCredits / 6), 0, 100);
    save.education.prestige = clamp(save.education.prestige + Math.round(bundle.educationCredits / 8), 0, 100);
  }

  if (bundle.careerReputation) {
    save.career.reputation = clamp(save.career.reputation + bundle.careerReputation, 0, 100);
  }

  if (bundle.relationshipDelta && bundle.relationshipRole) {
    upsertRelationship(save, bundle.relationshipRole, bundle.relationshipDelta, save.locationId);
  }

  if (bundle.healthMental) {
    save.health.mental = clamp(save.health.mental + bundle.healthMental, 0, 100);
  }

  if (bundle.healthPhysical) {
    save.health.physical = clamp(save.health.physical + bundle.healthPhysical, 0, 100);
  }

  if (bundle.addCondition && !save.health.conditions.includes(bundle.addCondition)) {
    save.health.conditions.unshift(bundle.addCondition);
  }

  if (bundle.addictionLabel && !save.health.addictions.includes(bundle.addictionLabel)) {
    save.health.addictions.unshift(bundle.addictionLabel);
  }

  if (bundle.addCrimeRecord) {
    save.crime.record.unshift(bundle.addCrimeRecord);
    save.crime.record = save.crime.record.slice(0, 8);
  }

  if (bundle.unlockLocation && !save.unlockedLocations.includes(bundle.unlockLocation as LocationId)) {
    save.unlockedLocations.push(bundle.unlockLocation as LocationId);
  }

  if (bundle.notification) {
    save.phone.notifications.unshift({
      id: nanoid(),
      ...bundle.notification,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  if (bundle.moment) {
    save.moments.unshift(createMoment(bundle.moment.title, bundle.moment.description, bundle.moment.kind ?? 'milestone'));
  }
}

function maybeUnlockSystems(save: SaveState, snapshot: WorldSnapshot) {
  if (!save.progression.timeControlUnlocked && (save.stats.experience >= 28 || snapshot.age >= 22)) {
    save.progression.timeControlUnlocked = true;
    save.phone.notifications.unshift({
      id: nanoid(),
      app: 'QLife',
      title: 'Strategic time controls unlocked',
      body: 'You can now shave time off one active process per session.',
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  if (snapshot.age >= 16 && !save.unlockedLocations.includes('airport')) {
    save.unlockedLocations.push('airport');
  }
}

function maybeCreateChild(save: SaveState, trigger: string) {
  if (trigger !== 'campus_romance' && trigger !== 'park_date') return;
  if (save.children.length >= 3 || save.summary.age < 22) return;
  const chance = seededValue(save.userId, `${trigger}:${save.moments.length}`);
  if (chance < 0.82) return;

  save.children.push({
    id: nanoid(),
    name: sample(FIRST_NAMES, save.userId, `child:${save.children.length}`),
    age: 0,
    traits: [sample(GENETIC_BUNDLES, save.userId, 'child-trait')],
    bond: 48,
    futurePotential: 58,
  });

  save.phone.notifications.unshift({
    id: nanoid(),
    app: 'Family',
    title: 'Your life just widened',
    body: 'A child is now part of your legacy.',
    createdAt: new Date().toISOString(),
    read: false,
  });
}

function maybeTriggerEvent(save: SaveState, snapshot: WorldSnapshot) {
  if (save.pendingEvent) return;

  const lastPassive = save.progression.lastPassiveEventAt ? dayjs(save.progression.lastPassiveEventAt) : null;
  if (lastPassive && dayjs().diff(lastPassive, 'hour') < 4) return;

  const eligible = EVENTS.filter((event) => {
    if (snapshot.age < event.minAge || snapshot.age > event.maxAge) return false;
    if (event.locations && !event.locations.includes(save.locationId)) return false;
    if (event.requiredStage && !event.requiredStage.includes(snapshot.stage)) return false;
    return seededValue(save.userId, `${event.id}:${snapshot.dayIndex}:${save.locationId}`) > 0.58;
  });

  const selected = eligible[0];
  if (!selected) return;

  save.pendingEvent = materializeEvent(selected);
  save.progression.lastPassiveEventAt = new Date().toISOString();
}

function materializeEvent(event: EventDefinition): PendingEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    tone: event.tone,
    createdAt: new Date().toISOString(),
    choices: event.choices,
  };
}

function applyRecurringEconomy(save: SaveState, worldDay: number) {
  const deltaDays = Math.max(0, worldDay - save.progression.lastWorldDayProcessed);
  if (deltaDays === 0) return;

  for (let step = 0; step < deltaDays; step += 1) {
    save.stats.bank -= Math.round(save.stats.rent + save.stats.taxBurden * 4 + save.vehicles.length * 25);
    save.stats.energy = clamp(save.stats.energy + 18, 0, 100);
    save.stats.stress = clamp(save.stats.stress + 2, 0, 100);
    save.stats.netWorth = Math.round(save.stats.cash + save.stats.bank + save.properties.reduce((total, property) => total + property.value, 0) + save.vehicles.reduce((total, vehicle) => total + vehicle.value, 0) - save.stats.debt);
  }

  save.progression.lastWorldDayProcessed = worldDay;
}

function resolveTimer(save: SaveState, timer: ActiveTimer) {
  applyEffectBundle(save, timer.effects);

  if (timer.type === 'job_application') {
    const eligibleJobs = JOBS.filter((job) => canQualifyForJob(save, job.id));
    const selected = eligibleJobs[0];
    if (selected) {
      save.career.currentJobId = selected.id;
      save.career.applicationsInFlight = Math.max(0, save.career.applicationsInFlight - 1);
      save.phone.notifications.unshift({
        id: nanoid(),
        app: 'Jobs',
        title: `Offer: ${selected.name}`,
        body: `The ${selected.name} route just opened for you.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
      save.moments.unshift(createMoment('Job offer secured', `You landed a ${selected.name} role.`, 'finance'));
    }
  }

  if (timer.type === 'school_application') {
    save.education.currentTier = 'university';
    save.education.prestige = clamp(save.education.prestige + 8, 0, 100);
    save.moments.unshift(createMoment('University acceptance', 'The next chapter finally said yes.', 'milestone'));
  }

  if (timer.type === 'prison_sentence') {
    save.crime.prisonUntil = undefined;
    save.locationId = 'home';
    save.phone.notifications.unshift({
      id: nanoid(),
      app: 'Legal',
      title: 'Released',
      body: 'You walked back into the city carrying a different kind of silence.',
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

function canQualifyForJob(save: SaveState, jobId: JobId) {
  const job = JOBS.find((entry) => entry.id === jobId);
  if (!job) return false;
  const age = getWorldSnapshot(save).age;
  return (
    age >= job.minAge &&
    save.education.credits >= job.minEducation &&
    save.stats.intelligence >= job.minIntelligence &&
    save.stats.discipline >= job.minDiscipline
  );
}

export function applyOfflineProgress(save: SaveState, nowIso = new Date().toISOString()) {
  const next = structuredClone(save);
  const snapshot = getWorldSnapshot(next, nowIso);

  applyRecurringEconomy(next, snapshot.dayIndex);

  const remainingTimers: ActiveTimer[] = [];
  for (const timer of next.timers) {
    if (dayjs(timer.completesAt).isBefore(dayjs(nowIso)) || dayjs(timer.completesAt).isSame(dayjs(nowIso))) {
      resolveTimer(next, timer);
    } else {
      remainingTimers.push(timer);
    }
  }
  next.timers = remainingTimers;

  const hoursAway = Math.max(0, dayjs(nowIso).diff(dayjs(save.lastPlayedAt), 'hour', true));
  next.stats.energy = clamp(next.stats.energy + Math.round(hoursAway * 2.6), 0, 100);
  next.stats.stress = clamp(next.stats.stress - Math.round(hoursAway * 0.6), 0, 100);
  next.health.mental = clamp(next.health.mental + Math.round(hoursAway * 0.35), 0, 100);
  next.health.physical = clamp(next.health.physical + Math.round(hoursAway * 0.25), 0, 100);

  maybeUnlockSystems(next, snapshot);
  maybeTriggerEvent(next, snapshot);

  if (snapshot.age >= 89 && next.status === 'alive') {
    next.status = 'dead';
    next.deathCause = 'Old age';
    next.endingType = 'victory';
    next.moments.unshift(createMoment('A full life', 'You reached old age and beat the city at its own pace.', 'ending'));
  } else if (next.stats.health <= 0 || next.health.physical <= 0) {
    next.status = 'dead';
    next.deathCause = 'Critical health collapse';
    next.endingType = 'collapse';
    next.moments.unshift(createMoment('Life ended early', 'Your body ran out before your plans did.', 'death'));
  } else if (next.stats.criminalHeat >= 90) {
    next.status = 'dead';
    next.deathCause = 'Violent crime retaliation';
    next.endingType = 'crime';
    next.moments.unshift(createMoment('The city collected its debt', 'Heat rose too high and the night struck back.', 'death'));
  }

  next.lastPlayedAt = nowIso;
  next.updatedAt = nowIso;
  next.summary = buildSummary(next, snapshot, nowIso);

  return next;
}

function withActionCosts(save: SaveState, action: ActionDefinition) {
  if (!action.cost) return;
  applyEffectBundle(save, { stats: action.cost });
}

export function getVisibleActions(save: SaveState) {
  const snapshot = getWorldSnapshot(save);
  return ACTIONS.filter((action) => {
    if (action.locationId !== save.locationId) return false;
    if (action.requirements?.minAge && snapshot.age < action.requirements.minAge) return false;
    if (action.requirements?.maxAge && snapshot.age > action.requirements.maxAge) return false;
    if (action.requirements?.minCash && save.stats.cash < action.requirements.minCash) return false;
    if (action.requirements?.needsJob && !save.career.currentJobId) return false;
    if (action.requirements?.needsPrison && save.locationId !== 'prison') return false;
    if (action.requirements?.forbidPrison && save.locationId === 'prison') return false;
    if (action.requirements?.minExperience && save.stats.experience < action.requirements.minExperience) return false;
    return true;
  });
}

export function performAction(save: SaveState, actionId: string, skillScore = 0.66, nowIso = new Date().toISOString()) {
  const action = ACTIONS.find((entry) => entry.id === actionId);
  if (!action) {
    throw new Error(`Unknown action: ${actionId}`);
  }

  const next = applyOfflineProgress(save, nowIso);
  if (next.status === 'dead') return next;

  withActionCosts(next, action);

  const scaledEffects = structuredClone(action.effects ?? {});
  if (scaledEffects.stats) {
    for (const [key, value] of Object.entries(scaledEffects.stats)) {
      scaledEffects.stats[key as keyof typeof scaledEffects.stats] = Math.round((value ?? 0) * (0.55 + skillScore));
    }
  }
  if (scaledEffects.relationshipDelta) {
    scaledEffects.relationshipDelta = Math.round(scaledEffects.relationshipDelta * (0.5 + skillScore));
  }

  if (action.durationMinutes >= 90 || action.id === 'apply_university' || action.id === 'job_interview') {
    const timerType =
      action.id === 'apply_university'
        ? 'school_application'
        : action.id === 'job_interview'
          ? 'job_application'
          : action.id === 'recovery_plan'
            ? 'recovery'
            : 'generic';
    const timer: ActiveTimer = {
      id: nanoid(),
      type: timerType,
      label: action.title,
      startedAt: nowIso,
      completesAt: dayjs(nowIso).add(action.durationMinutes, 'minute').toISOString(),
      locationId: next.locationId,
      narrative: action.narrative,
      effects: scaledEffects,
    };
    next.timers.unshift(timer);

    next.phone.notifications.unshift({
      id: nanoid(),
      app: 'Timers',
      title: action.title,
      body: `This process will complete in about ${action.durationMinutes} minutes.`,
      createdAt: nowIso,
      read: false,
    });
  } else {
    applyEffectBundle(next, scaledEffects);
  }

  if (action.id === 'buy_vehicle') {
    next.vehicles.unshift({
      id: nanoid(),
      name: next.stats.reputation > 60 ? 'Aurelian Sable GT' : 'Metroline Coupe',
      speedBonus: 15,
      upkeep: 65,
      value: 1100,
    });
  }

  if (action.id === 'move_city') {
    next.background.hometown = 'Solstice Bay';
    next.stats.rent += 80;
  }

  if (action.id === 'work_shift' && next.career.currentJobId) {
    const currentJob = JOBS.find((entry) => entry.id === next.career.currentJobId);
    if (currentJob) {
      next.stats.cash += Math.round(currentJob.salary / 6);
      next.career.reputation = clamp(next.career.reputation + 3, 0, 100);
    }
  }

  maybeCreateChild(next, action.id);
  maybeUnlockSystems(next, getWorldSnapshot(next, nowIso));
  maybeTriggerEvent(next, getWorldSnapshot(next, nowIso));

  next.moments.unshift(createMoment(action.title, action.narrative, action.category === 'career' || action.category === 'finance' ? 'finance' : 'milestone'));
  next.updatedAt = nowIso;
  next.lastPlayedAt = nowIso;
  next.summary = buildSummary(next, getWorldSnapshot(next, nowIso), nowIso);

  return next;
}

export function chooseEvent(save: SaveState, choiceId: string, nowIso = new Date().toISOString()) {
  if (!save.pendingEvent) return save;
  const next = applyOfflineProgress(save, nowIso);
  if (!next.pendingEvent) return next;

  const choice = next.pendingEvent.choices.find((entry) => entry.id === choiceId);
  if (choice) {
    applyEffectBundle(next, choice.effects);
    next.moments.unshift(createMoment(next.pendingEvent.title, choice.summary, 'event'));
  }
  next.pendingEvent = undefined;
  next.summary = buildSummary(next, getWorldSnapshot(next, nowIso), nowIso);
  return next;
}

export function travelTo(save: SaveState, locationId: LocationId, nowIso = new Date().toISOString()) {
  const next = applyOfflineProgress(save, nowIso);
  if (next.status === 'dead') return next;
  if (!next.unlockedLocations.includes(locationId)) {
    throw new Error('Location is still locked.');
  }

  const destination = LOCATIONS.find((entry) => entry.id === locationId);
  if (!destination) {
    throw new Error('Unknown destination.');
  }

  next.locationId = locationId;
  next.stats.energy = clamp(next.stats.energy - 6, 0, 100);
  next.stats.stress = clamp(next.stats.stress + 2, 0, 100);
  next.updatedAt = nowIso;
  next.lastPlayedAt = nowIso;
  next.summary = buildSummary(next, getWorldSnapshot(next, nowIso), nowIso);
  next.moments.unshift(createMoment(`Arrived at ${destination.name}`, destination.mood, 'milestone'));

  return next;
}

export function applyCasino(save: SaveState, game: 'slots' | 'roulette' | 'blackjack', wager: number, seed: string, nowIso = new Date().toISOString()) {
  const next = applyOfflineProgress(save, nowIso);
  const roll = seededValue(seed, `${game}:${next.moments.length}:${wager}`);
  const payout =
    game === 'slots'
      ? roll > 0.91
        ? wager * 4
        : roll > 0.62
          ? wager * 1.4
          : -wager
      : game === 'roulette'
        ? roll > 0.86
          ? wager * 3
          : roll > 0.55
            ? wager * 1.15
            : -wager
        : roll > 0.66
          ? wager * 1.7
          : -wager;

  next.stats.cash = Math.round(next.stats.cash + payout);
  next.stats.happiness = clamp(next.stats.happiness + (payout > 0 ? 8 : -6), 0, 100);
  next.stats.stress = clamp(next.stats.stress + (payout > 0 ? -2 : 8), 0, 100);
  next.stats.addictionRisk = clamp(next.stats.addictionRisk + 6, 0, 100);
  next.stats.reputation = clamp(next.stats.reputation + (payout > 300 ? 4 : 0), 0, 100);
  next.stats.netWorth = Math.round(next.stats.cash + next.stats.bank - next.stats.debt + next.properties.reduce((total, property) => total + property.value, 0));
  next.moments.unshift(createMoment(`Casino ${payout >= 0 ? 'win' : 'loss'}`, `You ${payout >= 0 ? 'left with' : 'lost'} ${Math.abs(payout)} chips-worth of momentum.`, 'finance'));
  next.summary = buildSummary(next, getWorldSnapshot(next, nowIso), nowIso);
  return { save: next, payout };
}

export function applyJobApplication(save: SaveState, jobId: JobId, skillScore = 0.7, nowIso = new Date().toISOString()) {
  const next = applyOfflineProgress(save, nowIso);
  if (!canQualifyForJob(next, jobId)) {
    throw new Error('You are not ready for that route yet.');
  }

  const job = JOBS.find((entry) => entry.id === jobId);
  if (!job) {
    throw new Error('Unknown job.');
  }

  next.timers.unshift({
    id: nanoid(),
    type: 'job_application',
    label: `Application: ${job.name}`,
    startedAt: nowIso,
    completesAt: dayjs(nowIso).add(Math.round(90 - skillScore * 35), 'minute').toISOString(),
    locationId: job.locationId,
    narrative: `Your ${job.name} application is circulating through someone else’s decision tree.`,
    effects: {
      stats: { reputation: 2, stress: 4, experience: 3 },
    },
  });
  next.career.applicationsInFlight += 1;
  next.phone.notifications.unshift({
    id: nanoid(),
    app: 'Jobs',
    title: `Application sent: ${job.name}`,
    body: `${job.fantasyTag} route in motion.`,
    createdAt: nowIso,
    read: false,
  });
  next.summary = buildSummary(next, getWorldSnapshot(next, nowIso), nowIso);
  return next;
}

export function createNewLife(input: CreateSaveInput, user: SessionUser, nowIso = new Date().toISOString()): SaveState {
  const [firstName, ...rest] = input.characterName.trim().split(' ');
  const character = {
    firstName: firstName || sample(FIRST_NAMES, user.id, 'first'),
    lastName: rest.join(' ') || sample(LAST_NAMES, user.id, 'last'),
    pronouns: input.pronouns,
    appearanceHue: input.appearanceHue,
  };

  const baseCash =
    input.familyClass === 'elite'
      ? 900
      : input.familyClass === 'comfortable'
        ? 420
        : input.familyClass === 'working'
          ? 180
          : 70;

  const save: SaveState = {
    version: 1,
    userId: user.id,
    saveSlot: input.slot,
    saveName: input.saveName,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastPlayedAt: nowIso,
    lifeStartedAt: nowIso,
    status: 'alive',
    summary: {} as SaveSummary,
    character,
    background: {
      familyClass: input.familyClass,
      hometown: 'Velvet Vale',
      householdTone: sample(HOUSEHOLD_TONES, user.id, 'household'),
      genetics: [sample(GENETIC_BUNDLES, user.id, 'gene-a'), sample(GENETIC_BUNDLES, user.id, 'gene-b')],
      inheritedTrait: sample(GENETIC_BUNDLES, user.id, 'gene-trait'),
      startDistrict: sample(START_DISTRICTS, user.id, 'district'),
    },
    stats: {
      health: 82,
      happiness: 66,
      intelligence: 28,
      looks: 34,
      discipline: 24,
      stress: 18,
      energy: 78,
      karma: 52,
      familyHonor: 46,
      reputation: 14,
      cash: baseCash,
      bank: Math.round(baseCash * 0.65),
      debt: input.familyClass === 'fragile' ? 540 : 120,
      netWorth: baseCash,
      rent: input.familyClass === 'elite' ? 220 : input.familyClass === 'comfortable' ? 130 : 80,
      taxBurden: 18,
      addictionRisk: 8,
      addictionState: 0,
      criminalHeat: 0,
      experience: 4,
      focus: 44,
    },
    locationId: 'home',
    unlockedLocations: ['home', 'park', 'school', 'social_hangout', 'shopping_district', 'bank', 'workplace', 'hospital', 'therapy_office', 'gym', 'sanctuary'],
    education: {
      currentTier: 'nursery',
      gradeAverage: 20,
      credits: 0,
      prestige: 8,
    },
    career: {
      reputation: 0,
      fame: 0,
      businessTier: 0,
      applicationsInFlight: 0,
    },
    health: {
      mental: 74,
      physical: 78,
      conditions: [],
      addictions: [],
    },
    crime: {
      record: [],
    },
    relationships: [
      {
        id: nanoid(),
        kind: 'npc',
        name: `${sample(FIRST_NAMES, user.id, 'parent-a')} ${character.lastName}`,
        role: 'Parent',
        chemistry: 62,
        closeness: 68,
        tension: 18,
        loyalty: 80,
        attraction: 0,
        mood: 'protective',
        locationId: 'home',
        status: 'Complicated but loyal',
        memory: ['They carried your first chapter.'],
      },
      {
        id: nanoid(),
        kind: 'npc',
        name: `${sample(FIRST_NAMES, user.id, 'sibling-a')} ${character.lastName}`,
        role: 'Sibling',
        chemistry: 57,
        closeness: 48,
        tension: 22,
        loyalty: 62,
        attraction: 0,
        mood: 'watchful',
        locationId: 'home',
        status: 'Shared history',
        memory: ['Too close to ignore, too close to idealize.'],
      },
    ],
    children: [],
    properties: [
      {
        id: nanoid(),
        name: input.familyClass === 'elite' ? 'Laurel Penthouse Annex' : 'Ashdown Apartment',
        district: input.familyClass === 'elite' ? 'Laurel Heights' : 'Ashdown Flats',
        upkeep: input.familyClass === 'elite' ? 220 : 90,
        value: input.familyClass === 'elite' ? 1800 : 420,
        type: input.familyClass === 'elite' ? 'penthouse' : 'apartment',
      },
    ],
    vehicles: [],
    timers: [],
    phone: {
      notifications: [
        {
          id: nanoid(),
          app: 'QLife',
          title: 'A life begins',
          body: 'You were born into Velvet Vale. The city is already moving.',
          createdAt: nowIso,
          read: false,
        },
      ],
      messages: [
        {
          id: nanoid(),
          contactName: 'Family Group',
          role: 'Parent',
          unread: 1,
          snippets: ['Welcome to the city, little one.'],
        },
      ],
    },
    moments: [
      createMoment('Birth', 'You arrived in Velvet Vale under heavy lights and louder ambitions.', 'milestone'),
    ],
    progression: {
      lastWorldDayProcessed: 0,
      timeControlUnlocked: false,
    },
    lobby: {},
  };

  save.summary = buildSummary(save, getWorldSnapshot(save, nowIso), nowIso);
  return save;
}
