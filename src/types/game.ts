export type ViewportMode = 'minimized' | 'compact' | 'standard' | 'expanded';

export type LifeStage =
  | 'birth'
  | 'infancy'
  | 'childhood'
  | 'adolescence'
  | 'young_adult'
  | 'adulthood'
  | 'maturity'
  | 'elder';

export type WeatherType = 'sunrise' | 'clear' | 'overcast' | 'rain' | 'storm' | 'neon-night' | 'fog';

export type LocationId =
  | 'home'
  | 'school'
  | 'university'
  | 'workplace'
  | 'hospital'
  | 'police_station'
  | 'prison'
  | 'bank'
  | 'shopping_district'
  | 'gym'
  | 'casino'
  | 'nightclub'
  | 'airport'
  | 'courthouse'
  | 'dealership'
  | 'social_hangout'
  | 'park'
  | 'sanctuary'
  | 'therapy_office'
  | 'harbor';

export type JobId =
  | 'retail_cashier'
  | 'barista'
  | 'delivery_driver'
  | 'warehouse_worker'
  | 'construction_laborer'
  | 'mechanic'
  | 'chef'
  | 'bartender'
  | 'nurse'
  | 'doctor'
  | 'paramedic'
  | 'teacher'
  | 'software_developer'
  | 'cybersecurity_analyst'
  | 'lawyer'
  | 'police_officer'
  | 'detective'
  | 'soldier'
  | 'real_estate_agent'
  | 'accountant'
  | 'banker'
  | 'entrepreneur'
  | 'casino_dealer'
  | 'nightclub_promoter'
  | 'influencer'
  | 'actor'
  | 'musician'
  | 'professional_athlete'
  | 'politician'
  | 'organized_crime_operator';

export type MiniGameId =
  | 'interview'
  | 'exam'
  | 'tax'
  | 'conversation'
  | 'crime'
  | 'diagnosis'
  | 'investment'
  | 'driving'
  | 'social_post';

export type OverlayPanel =
  | 'phone'
  | 'map'
  | 'relationships'
  | 'finance'
  | 'health'
  | 'casino'
  | 'lobby'
  | 'settings'
  | 'summary'
  | null;

export type EventTone = 'gold' | 'crimson' | 'ash';
export type TimerType =
  | 'job_application'
  | 'school_application'
  | 'travel'
  | 'recovery'
  | 'pregnancy'
  | 'training'
  | 'property_upgrade'
  | 'legal_process'
  | 'prison_sentence'
  | 'business_upgrade'
  | 'generic';

export interface SessionUser {
  id: string;
  discordId?: string;
  username: string;
  displayName: string;
  avatar?: string;
  source: 'discord' | 'local';
}

export interface CharacterIdentity {
  firstName: string;
  lastName: string;
  pronouns: string;
  appearanceHue: number;
}

export interface BackgroundProfile {
  familyClass: 'fragile' | 'working' | 'comfortable' | 'elite';
  hometown: string;
  householdTone: string;
  genetics: string[];
  inheritedTrait: string;
  startDistrict: string;
}

export interface PlayerStats {
  health: number;
  happiness: number;
  intelligence: number;
  looks: number;
  discipline: number;
  stress: number;
  energy: number;
  karma: number;
  familyHonor: number;
  reputation: number;
  cash: number;
  bank: number;
  debt: number;
  netWorth: number;
  rent: number;
  taxBurden: number;
  addictionRisk: number;
  addictionState: number;
  criminalHeat: number;
  experience: number;
  focus: number;
}

export interface Relationship {
  id: string;
  kind: 'npc' | 'player';
  name: string;
  role: string;
  chemistry: number;
  closeness: number;
  tension: number;
  loyalty: number;
  attraction: number;
  mood: string;
  locationId: LocationId;
  status: string;
  memory: string[];
  linkedUserId?: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  traits: string[];
  bond: number;
  futurePotential: number;
}

export interface CareerState {
  currentJobId?: JobId;
  reputation: number;
  fame: number;
  businessTier: number;
  applicationsInFlight: number;
}

export interface EducationState {
  currentTier: 'nursery' | 'school' | 'university' | 'trade' | 'none';
  gradeAverage: number;
  credits: number;
  prestige: number;
  major?: string;
}

export interface HealthState {
  mental: number;
  physical: number;
  conditions: string[];
  addictions: string[];
}

export interface CrimeState {
  record: string[];
  gangAffiliation?: string;
  prisonUntil?: string;
  probationUntil?: string;
}

export interface PropertyAsset {
  id: string;
  name: string;
  district: string;
  upkeep: number;
  value: number;
  type: 'apartment' | 'house' | 'penthouse';
}

export interface VehicleAsset {
  id: string;
  name: string;
  speedBonus: number;
  upkeep: number;
  value: number;
}

export interface EffectBundle {
  stats?: Partial<PlayerStats>;
  educationCredits?: number;
  careerReputation?: number;
  relationshipDelta?: number;
  relationshipRole?: string;
  healthMental?: number;
  healthPhysical?: number;
  addCondition?: string;
  addictionLabel?: string;
  addCrimeRecord?: string;
  unlockLocation?: string;
  notification?: {
    app: string;
    title: string;
    body: string;
  };
  moment?: {
    title: string;
    description: string;
    kind?: string;
  };
}

export interface ActiveTimer {
  id: string;
  type: TimerType;
  label: string;
  startedAt: string;
  completesAt: string;
  locationId: LocationId;
  narrative: string;
  effects: EffectBundle;
}

export interface PhoneNotification {
  id: string;
  app: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface MessageThread {
  id: string;
  contactName: string;
  role: string;
  unread: number;
  snippets: string[];
}

export interface LifeMoment {
  id: string;
  title: string;
  description: string;
  at: string;
  kind: 'milestone' | 'event' | 'relationship' | 'finance' | 'death' | 'ending';
}

export interface PendingEventChoice {
  id: string;
  label: string;
  summary: string;
  effects: EffectBundle;
}

export interface PendingEvent {
  id: string;
  title: string;
  description: string;
  tone: EventTone;
  createdAt: string;
  choices: PendingEventChoice[];
}

export interface SaveSummary {
  saveName: string;
  characterName: string;
  age: number;
  lifeStage: LifeStage;
  money: number;
  locationName: string;
  statusPreview: string;
  thumbnailTone: string;
  legacyScore: number;
  updatedAt: string;
}

export interface LobbyPresence {
  lobbyId?: string;
  code?: string;
  name?: string;
  privacy?: 'public' | 'private';
}

export interface SaveState {
  version: number;
  userId: string;
  saveSlot: number;
  saveName: string;
  createdAt: string;
  updatedAt: string;
  lastPlayedAt: string;
  lifeStartedAt: string;
  status: 'alive' | 'dead';
  deathCause?: string;
  endingType?: 'collapse' | 'crime' | 'old_age' | 'victory';
  summary: SaveSummary;
  character: CharacterIdentity;
  background: BackgroundProfile;
  stats: PlayerStats;
  locationId: LocationId;
  unlockedLocations: LocationId[];
  education: EducationState;
  career: CareerState;
  health: HealthState;
  crime: CrimeState;
  relationships: Relationship[];
  children: ChildProfile[];
  properties: PropertyAsset[];
  vehicles: VehicleAsset[];
  timers: ActiveTimer[];
  phone: {
    notifications: PhoneNotification[];
    messages: MessageThread[];
  };
  moments: LifeMoment[];
  pendingEvent?: PendingEvent;
  progression: {
    lastWorldDayProcessed: number;
    timeControlUnlocked: boolean;
    lastPassiveEventAt?: string;
  };
  lobby: LobbyPresence;
}

export interface LocationDefinition {
  id: LocationId;
  name: string;
  district: string;
  city: string;
  mood: string;
  description: string;
  coordinates: { x: number; y: number };
  connectedTo: LocationId[];
  actions: string[];
  minAge?: number;
}

export interface JobDefinition {
  id: JobId;
  name: string;
  track: string;
  salary: number;
  prestige: number;
  locationId: LocationId;
  minAge: number;
  minEducation: number;
  minIntelligence: number;
  minDiscipline: number;
  risk: number;
  fantasyTag: string;
}

export interface ActionDefinition {
  id: string;
  title: string;
  description: string;
  locationId: string;
  category: string;
  durationMinutes: number;
  minigame?: string;
  icon: string;
  requirements?: {
    minAge?: number;
    maxAge?: number;
    minCash?: number;
    minExperience?: number;
    minRelationshipRole?: string;
    needsJob?: boolean;
    needsPrison?: boolean;
    forbidPrison?: boolean;
  };
  cost?: Partial<PlayerStats>;
  effects?: EffectBundle;
  narrative: string;
}

export interface EventDefinition {
  id: string;
  title: string;
  description: string;
  tone: EventTone;
  minAge: number;
  maxAge: number;
  locations?: LocationId[];
  requiredStage?: LifeStage[];
  choices: PendingEventChoice[];
}

export interface WorldSnapshot {
  age: number;
  stage: LifeStage;
  weather: WeatherType;
  timeOfDay: 'dawn' | 'day' | 'golden' | 'night';
  dayIndex: number;
  skylineLabel: string;
}

export interface CreateSaveInput {
  slot: number;
  saveName: string;
  characterName: string;
  pronouns: string;
  appearanceHue: number;
  familyClass: BackgroundProfile['familyClass'];
}

export interface LobbyRecord {
  id: string;
  code: string;
  name: string;
  privacy: 'public' | 'private';
  maxPlayers: number;
  hostUserId: string;
  createdAt: string;
  members: Array<{
    userId: string;
    displayName: string;
    locationId?: LocationId;
    reputation?: number;
    relationshipStatus?: string;
  }>;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
}
