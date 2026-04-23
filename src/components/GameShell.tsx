import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BrainCircuit,
  Compass,
  Heart,
  Map,
  MoonStar,
  PhoneCall,
  PiggyBank,
  Skull,
  TimerReset,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Ambience } from '@/components/Ambience';
import { ACTIONS, LOCATIONS, getLocation } from '@/data/world';
import { CasinoPanel } from '@/features/casino/CasinoPanel';
import { getVisibleActions, getWorldSnapshot } from '@/features/life/engine';
import { MiniGameOverlay } from '@/features/life/MiniGameOverlay';
import { MapPanel } from '@/features/map/MapPanel';
import { LobbyPanel } from '@/features/multiplayer/LobbyPanel';
import { PhonePanel } from '@/features/phone/PhonePanel';
import { cn, currency } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import type { MiniGameId, OverlayPanel, SaveState, ViewportMode } from '@/types/game';

function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>('standard');
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 760 || height < 480) setMode('minimized');
      else if (width < 1080 || height < 700) setMode('compact');
      else if (width > 1540 && height > 860) setMode('expanded');
      else setMode('standard');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return mode;
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#d9c7aa]/55">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#fff1dd]">{value}</div>
    </div>
  );
}

function OverlayFrame({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(7,6,7,0.7)] p-3 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="relative flex h-[92%] w-full max-w-[1200px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[rgba(8,8,10,0.92)] p-4 shadow-panel" initial={{ scale: 0.98, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.985, y: 10 }} transition={{ duration: 0.2 }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="hud-chip inline-flex">{subtitle}</div>
            <h3 className="mt-2 font-display text-3xl text-[#fff2de]">{title}</h3>
          </div>
          <button className="rounded-full border border-white/10 bg-white/5 p-2 text-[#ecd9ba]/80 transition hover:bg-white/10 hover:text-[#fff2e0]" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function MinimizedIdle({ save }: { save: SaveState }) {
  const world = getWorldSnapshot(save);
  const location = getLocation(save.locationId);
  return (
    <div className="relative h-screen overflow-hidden bg-midnight-900 p-3">
      <Ambience save={save} weather={world.weather} stageMode="idle" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.18),rgba(8,8,10,0.8))]" />
      <div className="relative flex h-full flex-col justify-end">
        <motion.div className="panel-shell max-w-[360px] p-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="hud-chip inline-flex">{world.timeOfDay}</div>
              <div className="mt-2 font-display text-3xl text-[#fff2df]">{location.name}</div>
            </div>
            <MoonStar className="h-5 w-5 text-[#f3d08c]" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MetricPill label="Age" value={save.summary.age} />
            <MetricPill label="Stage" value={save.summary.lifeStage.replace('_', ' ')} />
            <MetricPill label="Cash" value={currency(save.stats.cash)} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function GameShell() {
  const {
    activeSave,
    overlay,
    openOverlay,
    closeOverlay,
    performAction,
    travelTo,
    playCasino,
    applyForJob,
    resolveEvent,
    createLobby,
    joinLobby,
    leaveLobby,
    lobbies,
    exitToTitle,
    recentStatus,
  } = useGameStore(
    useShallow((state) => ({
      activeSave: state.activeSave,
      overlay: state.overlay,
      openOverlay: state.openOverlay,
      closeOverlay: state.closeOverlay,
      performAction: state.performAction,
      travelTo: state.travelTo,
      playCasino: state.playCasino,
      applyForJob: state.applyForJob,
      resolveEvent: state.resolveEvent,
      createLobby: state.createLobby,
      joinLobby: state.joinLobby,
      leaveLobby: state.leaveLobby,
      lobbies: state.lobbies,
      exitToTitle: state.exitToTitle,
      recentStatus: state.recentStatus,
    })),
  );

  const viewport = useViewportMode();
  const [miniGame, setMiniGame] = useState<{ kind: MiniGameId; title: string; description: string; onComplete: (score: number) => void } | null>(null);
  if (!activeSave) return null;

  const save = activeSave;
  const world = getWorldSnapshot(save);
  const visibleActions = getVisibleActions(save).slice(0, viewport === 'compact' ? 4 : 6);
  const location = LOCATIONS.find((entry) => entry.id === save.locationId) ?? LOCATIONS[0];

  const openAction = (actionId: string) => {
    const action = ACTIONS.find((entry) => entry.id === actionId);
    if (!action) return;
    if (action.id === 'high_roller_table') {
      void performAction(action.id, 0.78);
      openOverlay('casino');
      return;
    }
    if (action.minigame) {
      setMiniGame({
        kind: action.minigame as MiniGameId,
        title: action.title,
        description: action.description,
        onComplete: async (score) => {
          setMiniGame(null);
          await performAction(action.id, score);
        },
      });
      return;
    }
    void performAction(action.id, 0.74);
  };

  const relationshipLead = save.relationships[0];

  if (viewport === 'minimized') {
    return (
      <>
        <MinimizedIdle save={save} />
        <MiniGameOverlay game={miniGame} onClose={() => setMiniGame(null)} />
      </>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-midnight-900 text-[#f5e8d2]">
      <Ambience save={save} weather={world.weather} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.14),rgba(8,8,10,0.66))]" />
      <div className="relative flex h-full flex-col p-3 md:p-4">
        <header className="panel-shell mb-3 flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(214,168,95,0.14)] px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#e3c586]/72">QLife</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#decaa5]/56">{world.timeOfDay} · {world.weather.replace('-', ' ')}</div>
              <div className="text-sm font-semibold text-[#fff2de]">{save.summary.locationName}</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <MetricPill label="Age" value={save.summary.age} />
            <MetricPill label="Stage" value={save.summary.lifeStage.replace('_', ' ')} />
            <MetricPill label="Cash" value={currency(save.stats.cash)} />
            <MetricPill label="Bank" value={currency(save.stats.bank)} />
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={() => openOverlay('phone')} type="button"><PhoneCall className="h-4 w-4" /></button>
            <button className="icon-button" onClick={() => openOverlay('map')} type="button"><Map className="h-4 w-4" /></button>
            <button className="icon-button" onClick={exitToTitle} type="button"><Skull className="h-4 w-4" /></button>
          </div>
        </header>

        <main className={cn('grid min-h-0 flex-1 gap-3', viewport === 'compact' ? 'grid-cols-1' : 'grid-cols-[260px_1fr_330px]')}>
          {viewport !== 'compact' ? (
            <aside className="panel-shell flex min-h-0 flex-col overflow-hidden p-4">
              <div className="hud-chip inline-flex">Vitals</div>
              <div className="mt-4 grid gap-3">
                {[
                  ['Health', save.stats.health], ['Happiness', save.stats.happiness], ['Intelligence', save.stats.intelligence], ['Looks', save.stats.looks],
                  ['Discipline', save.stats.discipline], ['Stress', save.stats.stress], ['Energy', save.stats.energy], ['Karma', save.stats.karma],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between text-sm text-[#f4e7d1]"><span>{label}</span><span>{value}</span></div>
                    <div className="mt-3 h-2 rounded-full bg-black/20">
                      <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(139,49,72,0.95),rgba(214,168,95,0.88))]" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}

          <section className="panel-shell relative min-h-0 overflow-hidden p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,168,95,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-[52ch]">
                  <div className="hud-chip inline-flex">{location.district}</div>
                  <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,4rem)] leading-[0.9] text-[#fff4e1]">{location.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#e8d8be]/74">{location.mood}</p>
                </div>
                <div className="hidden w-[280px] gap-2 xl:grid">
                  <MetricPill label="Reputation" value={save.stats.reputation} />
                  <MetricPill label="Honor" value={save.stats.familyHonor} />
                  <MetricPill label="Heat" value={save.stats.criminalHeat} />
                </div>
              </div>
              <div className="mt-4 grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.2fr_0.9fr]">
                <div className="flex min-h-0 flex-col gap-3">
                  <div className="relative flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4">
                    <div className="absolute inset-x-8 bottom-0 h-[48%] rounded-t-[55%] bg-[radial-gradient(circle_at_center,rgba(214,168,95,0.12),transparent_55%),linear-gradient(180deg,rgba(19,15,15,0),rgba(10,10,12,0.9))]" />
                    <motion.div className="absolute left-[16%] top-[18%] h-36 w-36 rounded-full bg-[rgba(214,168,95,0.12)] blur-[50px]" animate={{ y: [-10, 8, -6], x: [0, 8, -4] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
                    <motion.div className="absolute right-[12%] top-[16%] h-28 w-28 rounded-full bg-[rgba(139,49,72,0.16)] blur-[46px]" animate={{ y: [8, -10, 6], x: [0, -8, 3] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
                    <div className="relative">
                      <div className="max-w-[40ch] text-sm leading-7 text-[#efe1c7]/84">{world.skylineLabel}</div>
                      <div className="mt-6 grid gap-2 md:grid-cols-3">
                        <MetricPill label="Career" value={save.career.currentJobId?.replaceAll('_', ' ') ?? 'Unclaimed'} />
                        <MetricPill label="Education" value={save.education.currentTier} />
                        <MetricPill label="Legacy" value={save.summary.legacyScore} />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between"><div className="hud-chip inline-flex">Relationship lead</div><Heart className="h-4 w-4 text-[#f1c486]" /></div>
                      {relationshipLead ? (
                        <>
                          <div className="mt-3 text-lg font-semibold text-[#fff2de]">{relationshipLead.name}</div>
                          <div className="mt-1 text-sm text-[#e3d1b6]/72">{relationshipLead.role} · {relationshipLead.status}</div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <MetricPill label="Close" value={relationshipLead.closeness} />
                            <MetricPill label="Chem" value={relationshipLead.chemistry} />
                            <MetricPill label="Tension" value={relationshipLead.tension} />
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between"><div className="hud-chip inline-flex">Live feed</div><Bell className="h-4 w-4 text-[#f1c486]" /></div>
                      <div className="mt-3 space-y-2">
                        {save.phone.notifications.slice(0, 3).map((note) => (
                          <div key={note.id} className="rounded-2xl bg-black/20 px-3 py-3 text-sm text-[#e8d6ba]/72">
                            <div className="font-semibold text-[#fff0de]">{note.title}</div>
                            <div className="mt-1">{note.body}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex min-h-0 flex-col gap-3">
                  <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between"><div className="hud-chip inline-flex">Quick actions</div><TimerReset className="h-4 w-4 text-[#f2c989]" /></div>
                    <div className="mt-4 grid gap-2">
                      {visibleActions.map((action) => (
                        <button key={action.id} className="action-card" onClick={() => openAction(action.id)} type="button">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-[#fff2de]">{action.title}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-[#d8c6a8]/55">{action.category}</div>
                            </div>
                            <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] tracking-[0.22em] text-[#f2cf8e]">{action.durationMinutes}m</div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#e4d4bb]/70">{action.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between"><div className="hud-chip inline-flex">Active timers</div><TimerReset className="h-4 w-4 text-[#f2c989]" /></div>
                    <div className="mt-4 space-y-2">
                      {save.timers.length === 0 ? (
                        <div className="rounded-2xl bg-black/20 px-3 py-3 text-sm text-[#e7d5bb]/68">No major timed processes running. The city is waiting for your next move.</div>
                      ) : (
                        save.timers.slice(0, 4).map((timer) => (
                          <div key={timer.id} className="rounded-2xl bg-black/20 px-3 py-3 text-sm">
                            <div className="font-semibold text-[#fff1de]">{timer.label}</div>
                            <div className="mt-1 text-[#e4d2b7]/70">{timer.narrative}</div>
                            <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-[#f1d18d]">completes {new Date(timer.completesAt).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="panel-shell flex min-h-0 flex-col overflow-hidden p-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'phone' as OverlayPanel, icon: PhoneCall, label: 'Phone' },
                { id: 'map' as OverlayPanel, icon: Compass, label: 'Map' },
                { id: 'finance' as OverlayPanel, icon: PiggyBank, label: 'Finance' },
                { id: 'health' as OverlayPanel, icon: BrainCircuit, label: 'Health' },
                { id: 'lobby' as OverlayPanel, icon: Users, label: 'Lobby' },
                { id: 'casino' as OverlayPanel, icon: Wallet, label: 'Casino' },
              ].map((entry) => {
                const Icon = entry.icon;
                return (
                  <button key={entry.id ?? entry.label} className="dock-button" onClick={() => openOverlay(entry.id)} type="button">
                    <Icon className="h-4 w-4" />
                    <span>{entry.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="hud-chip inline-flex">Family & assets</div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-[#f2e5ce]"><span>Children</span><span>{save.children.length}</span></div>
                <div className="flex justify-between text-[#f2e5ce]"><span>Properties</span><span>{save.properties.length}</span></div>
                <div className="flex justify-between text-[#f2e5ce]"><span>Vehicles</span><span>{save.vehicles.length}</span></div>
                <div className="flex justify-between text-[#f2e5ce]"><span>Debt</span><span>{currency(save.stats.debt)}</span></div>
              </div>
            </div>
            <div className="mt-4 flex-1 rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="hud-chip inline-flex">Life log</div>
              <div className="mt-4 space-y-2">
                {save.moments.slice(0, 5).map((moment) => (
                  <div key={moment.id} className="rounded-2xl bg-black/20 px-3 py-3 text-sm">
                    <div className="font-semibold text-[#fff1dd]">{moment.title}</div>
                    <div className="mt-1 text-[#e5d4bb]/70">{moment.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        {recentStatus ? (
          <motion.div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-[rgba(10,10,12,0.84)] px-4 py-3 text-sm text-[#f3e6d0] shadow-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="font-semibold">{recentStatus.title}</span>
            <span className="mx-2 text-[#d6c2a5]/60">·</span>
            <span className="text-[#e1d0b4]/74">{recentStatus.body}</span>
          </motion.div>
        ) : null}

        <AnimatePresence>
          {overlay === 'phone' ? (
            <OverlayFrame onClose={closeOverlay} subtitle="In-world device" title="QPhone">
              <PhonePanel
                onAction={openAction}
                onApplyForJob={(jobId) =>
                  setMiniGame({
                    kind: 'interview',
                    title: 'Application interview',
                    description: 'Dial in your tone before the recruiter decides whether you feel expensive enough.',
                    onComplete: async (score) => {
                      setMiniGame(null);
                      await applyForJob(jobId, score);
                    },
                  })
                }
                onOpenMap={() => {
                  closeOverlay();
                  openOverlay('map');
                }}
                save={save}
              />
            </OverlayFrame>
          ) : null}

          {overlay === 'map' ? (
            <OverlayFrame onClose={closeOverlay} subtitle="Travel" title="City Map">
              <MapPanel onTravel={(locationId) => void travelTo(locationId)} save={save} />
            </OverlayFrame>
          ) : null}

          {overlay === 'casino' ? (
            <OverlayFrame onClose={closeOverlay} subtitle="High stakes" title="Casino Floor">
              <CasinoPanel cash={save.stats.cash} onPlay={(game, wager) => void playCasino(game, wager)} />
            </OverlayFrame>
          ) : null}

          {overlay === 'lobby' ? (
            <OverlayFrame onClose={closeOverlay} subtitle="Shared world" title="Lobby Network">
              <LobbyPanel activeSave={save} lobbies={lobbies} onCreate={(name, privacy) => void createLobby(name, privacy)} onJoin={(code) => void joinLobby(code)} onLeave={() => void leaveLobby()} />
            </OverlayFrame>
          ) : null}

          {overlay === 'finance' ? (
            <OverlayFrame onClose={closeOverlay} subtitle="Economy" title="Finances">
              <div className="grid h-full gap-4 lg:grid-cols-2">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="hud-chip inline-flex">Balances</div>
                  <div className="mt-4 grid gap-3">
                    <MetricPill label="Cash" value={currency(save.stats.cash)} />
                    <MetricPill label="Bank" value={currency(save.stats.bank)} />
                    <MetricPill label="Debt" value={currency(save.stats.debt)} />
                    <MetricPill label="Net worth" value={currency(save.stats.netWorth)} />
                  </div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="hud-chip inline-flex">Fast actions</div>
                  <div className="mt-4 grid gap-3">
                    {['file_taxes', 'invest_capital', 'loan_consult'].map((actionId) => {
                      const action = ACTIONS.find((entry) => entry.id === actionId);
                      if (!action) return null;
                      return (
                        <button key={action.id} className="action-card" onClick={() => openAction(action.id)} type="button">
                          <div className="text-sm font-semibold text-[#fff1dd]">{action.title}</div>
                          <div className="mt-1 text-sm text-[#e5d4bb]/70">{action.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </OverlayFrame>
          ) : null}

          {overlay === 'health' ? (
            <OverlayFrame onClose={closeOverlay} subtitle="Recovery" title="Health">
              <div className="grid h-full gap-4 lg:grid-cols-[0.8fr_1fr]">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="hud-chip inline-flex">Body & mind</div>
                  <div className="mt-4 grid gap-3">
                    <MetricPill label="Mental" value={save.health.mental} />
                    <MetricPill label="Physical" value={save.health.physical} />
                    <MetricPill label="Conditions" value={save.health.conditions.length || 'None'} />
                    <MetricPill label="Addictions" value={save.health.addictions.length || 'None'} />
                  </div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="hud-chip inline-flex">Treatment options</div>
                  <div className="mt-4 grid gap-3">
                    {['therapy_session', 'recovery_plan', 'med_check', 'emergency_care'].map((actionId) => {
                      const action = ACTIONS.find((entry) => entry.id === actionId);
                      if (!action) return null;
                      return (
                        <button key={action.id} className="action-card" onClick={() => openAction(action.id)} type="button">
                          <div className="text-sm font-semibold text-[#fff2de]">{action.title}</div>
                          <div className="mt-1 text-sm text-[#e5d4bb]/70">{action.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </OverlayFrame>
          ) : null}
        </AnimatePresence>

        <MiniGameOverlay game={miniGame} onClose={() => setMiniGame(null)} />

        <AnimatePresence>
          {save.pendingEvent ? (
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(8,7,8,0.72)] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="panel-shell max-w-[620px] overflow-hidden p-6" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
                <div className="hud-chip inline-flex">{save.pendingEvent.tone} event</div>
                <h3 className="mt-3 font-display text-4xl text-[#fff2de]">{save.pendingEvent.title}</h3>
                <p className="mt-4 max-w-[48ch] text-sm leading-7 text-[#e5d4bb]/76">{save.pendingEvent.description}</p>
                <div className="mt-6 grid gap-3">
                  {save.pendingEvent.choices.map((choice) => (
                    <button key={choice.id} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10" onClick={() => void resolveEvent(choice.id)} type="button">
                      <div className="text-sm font-semibold text-[#fff2de]">{choice.label}</div>
                      <div className="mt-2 text-sm text-[#e6d4b8]/72">{choice.summary}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {save.status === 'dead' ? (
            <motion.div className="absolute inset-0 z-[60] flex items-center justify-center bg-[rgba(8,7,8,0.84)] p-4 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="panel-shell max-w-[720px] p-6" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                <div className="hud-chip inline-flex">{save.endingType === 'victory' ? 'You beat the game' : 'Life ended'}</div>
                <h2 className="mt-4 font-display text-5xl text-[#fff2df]">{save.endingType === 'victory' ? 'A complete life.' : save.deathCause ?? 'A final chapter.'}</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <MetricPill label="Age reached" value={save.summary.age} />
                  <MetricPill label="Legacy score" value={save.summary.legacyScore} />
                  <MetricPill label="Children" value={save.children.length} />
                  <MetricPill label="Net worth" value={currency(save.stats.netWorth)} />
                </div>
                <div className="mt-6 grid gap-2">
                  {save.moments.slice(0, 5).map((moment) => (
                    <div key={moment.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e7d5bb]/72">
                      <span className="font-semibold text-[#fff1de]">{moment.title}</span>
                      <span className="mx-2 text-[#d6c2a5]/55">·</span>
                      <span>{moment.description}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-6 w-full rounded-full border border-white/10 bg-[linear-gradient(90deg,rgba(139,49,72,0.92),rgba(214,168,95,0.84))] px-4 py-4 text-sm font-semibold tracking-[0.18em] text-[#140d0c]" onClick={exitToTitle} type="button">
                  RETURN TO TITLE
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
