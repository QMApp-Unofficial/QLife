import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, Globe2, LoaderCircle, Play, Settings2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Ambience } from '@/components/Ambience';
import { LobbyPanel } from '@/features/multiplayer/LobbyPanel';
import { currency } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import type { CreateSaveInput } from '@/types/game';

const familyClassOptions = [
  { id: 'fragile', label: 'Fragile', detail: 'Hard mode. More drama, less cushion.' },
  { id: 'working', label: 'Working', detail: 'Balanced pressure and grit.' },
  { id: 'comfortable', label: 'Comfortable', detail: 'Stable start with decent runway.' },
  { id: 'elite', label: 'Elite', detail: 'High expectations, real resources.' },
] as const;

export function TitleScreen() {
  const {
    saveSlots,
    titlePanel,
    setTitlePanel,
    createSave,
    loadSave,
    lobbies,
    createLobby,
    joinLobby,
    recentStatus,
  } = useGameStore((state) => ({
    saveSlots: state.saveSlots,
    titlePanel: state.titlePanel,
    setTitlePanel: state.setTitlePanel,
    createSave: state.createSave,
    loadSave: state.loadSave,
    lobbies: state.lobbies,
    createLobby: state.createLobby,
    joinLobby: state.joinLobby,
    recentStatus: state.recentStatus,
  }));

  const defaultSlot = useMemo(() => saveSlots.find((slot) => slot.summary === null)?.slot ?? 0, [saveSlots]);
  const [draft, setDraft] = useState<CreateSaveInput>({
    slot: defaultSlot,
    saveName: 'Velvet Run',
    characterName: 'Ari Vale',
    pronouns: 'they/them',
    appearanceHue: 28,
    familyClass: 'working',
  });
  const [joiningSlot, setJoiningSlot] = useState<number>(saveSlots.find((slot) => slot.summary)?.slot ?? 0);
  const [working, setWorking] = useState(false);

  return (
    <div className="relative h-screen overflow-hidden bg-midnight-900 text-[#f4e8d2]">
      <Ambience weather="neon-night" stageMode="title" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.1),rgba(8,8,10,0.68))]" />
      <div className="relative flex h-full flex-col p-4 md:p-6">
        <header className="mb-4 flex items-center justify-between">
          <div className="hud-chip inline-flex">Discord Activity · Shared Life Sim</div>
          {recentStatus ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.22em] text-[#e3d4bb]/72">
              {recentStatus.title}
            </div>
          ) : null}
        </header>
        <main className="grid flex-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <section className="panel-shell relative overflow-hidden p-6 md:p-8">
            <div className="relative max-w-[620px]">
              <motion.div className="hud-chip inline-flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                QLife
              </motion.div>
              <motion.h1
                className="mt-6 font-display text-[clamp(4.4rem,11vw,7.6rem)] leading-[0.88] tracking-[-0.05em] text-[#fff2df]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                A lifetime
                <br />
                inside Discord
              </motion.h1>
              <motion.p
                className="mt-6 max-w-[55ch] text-[15px] leading-7 text-[#e4d3b8]/76"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
              >
                Begin at birth, survive the pace of Velvet Vale, build wealth or wreck yourself, fall in love,
                enter lobbies mid-life, disappear into the casino, and push a save all the way to a real ending.
              </motion.p>
              <div className="mt-8 grid gap-3 md:max-w-[520px] md:grid-cols-2">
                {[
                  { id: 'new', label: 'New Game', icon: Play, blurb: 'Start from birth with a new identity.' },
                  { id: 'load', label: 'Load Game', icon: Gamepad2, blurb: 'Resume any of your three lives.' },
                  { id: 'lobbies', label: 'Multiplayer Lobbies', icon: Users, blurb: 'Create or join a shared world.' },
                  { id: 'settings', label: 'Settings', icon: Settings2, blurb: 'Tune motion, ambience, and controls.' },
                ].map((entry, index) => {
                  const Icon = entry.icon;
                  const active = titlePanel === entry.id;
                  return (
                    <motion.button
                      key={entry.id}
                      className={`rounded-[28px] border p-4 text-left transition ${
                        active ? 'border-[#d6a85f]/45 bg-[rgba(214,168,95,0.14)]' : 'border-white/10 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]'
                      }`}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14 + index * 0.05, duration: 0.5 }}
                      onClick={() => setTitlePanel(entry.id as typeof titlePanel)}
                      type="button"
                      whileHover={{ y: -3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 text-[#f5d28d]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.28em] text-[#d9c5a2]/54">enter</div>
                      </div>
                      <h3 className="mt-4 font-display text-3xl text-[#fff1de]">{entry.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#e4d3b8]/70">{entry.blurb}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="absolute bottom-6 right-6 hidden max-w-[320px] rounded-[26px] border border-white/10 bg-[rgba(8,8,9,0.34)] p-5 backdrop-blur-lg xl:block">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.28em] text-[#decba7]/58">Shared world status</div>
                <Globe2 className="h-4 w-4 text-[#e4be7f]" />
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm font-semibold text-[#fff0db]">{lobbies.length} live lobbies</div>
                  <p className="mt-2 text-sm leading-6 text-[#e4d2b7]/70">
                    Public and private runs update in real time with persistent saves and reconnectable lives.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm font-semibold text-[#fff0db]">14-day lifetime cadence</div>
                  <p className="mt-2 text-sm leading-6 text-[#e4d2b7]/70">
                    Age, timers, school applications, recovery arcs, and job offers keep moving while you’re offline.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-shell relative overflow-hidden p-5">
            <AnimatePresence mode="wait">
              {titlePanel === 'new' ? (
                <motion.div key="new" className="h-full" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
                  <div className="hud-chip inline-flex">New life</div>
                  <h2 className="mt-3 font-display text-4xl text-[#fff1de]">Birth dossier</h2>
                  <div className="mt-5 grid gap-4">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.26em] text-[#ddc9a5]/54">Save slot</span>
                      <div className="grid grid-cols-3 gap-2">
                        {saveSlots.map((slot) => (
                          <button
                            key={slot.slot}
                            className={`rounded-2xl border px-3 py-3 text-left ${draft.slot === slot.slot ? 'border-[#d6a85f]/45 bg-[rgba(214,168,95,0.14)]' : 'border-white/10 bg-white/5'}`}
                            onClick={() => setDraft((current) => ({ ...current, slot: slot.slot }))}
                            type="button"
                          >
                            <div className="text-xs uppercase tracking-[0.22em] text-[#d8c3a0]/55">Slot {slot.slot + 1}</div>
                            <div className="mt-1 text-sm font-semibold text-[#fff0db]">{slot.summary ? slot.summary.saveName : 'Empty'}</div>
                          </button>
                        ))}
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.26em] text-[#ddc9a5]/54">Save name</span>
                      <input className="title-input" onChange={(event) => setDraft((current) => ({ ...current, saveName: event.target.value }))} value={draft.saveName} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.26em] text-[#ddc9a5]/54">Character name</span>
                      <input className="title-input" onChange={(event) => setDraft((current) => ({ ...current, characterName: event.target.value }))} value={draft.characterName} />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.26em] text-[#ddc9a5]/54">Pronouns</span>
                        <input className="title-input" onChange={(event) => setDraft((current) => ({ ...current, pronouns: event.target.value }))} value={draft.pronouns} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.26em] text-[#ddc9a5]/54">Appearance tone</span>
                        <input className="w-full accent-[#d6a85f]" max={360} min={0} onChange={(event) => setDraft((current) => ({ ...current, appearanceHue: Number(event.target.value) }))} type="range" value={draft.appearanceHue} />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.26em] text-[#ddc9a5]/54">Family class</span>
                      <div className="grid gap-2">
                        {familyClassOptions.map((option) => (
                          <button
                            key={option.id}
                            className={`rounded-[22px] border px-4 py-3 text-left ${draft.familyClass === option.id ? 'border-[#d6a85f]/45 bg-[rgba(214,168,95,0.14)]' : 'border-white/10 bg-white/5'}`}
                            onClick={() => setDraft((current) => ({ ...current, familyClass: option.id }))}
                            type="button"
                          >
                            <div className="font-semibold text-[#fff0dc]">{option.label}</div>
                            <div className="mt-1 text-sm text-[#e4d2b7]/70">{option.detail}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="mt-2 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(90deg,rgba(139,49,72,0.92),rgba(214,168,95,0.84))] px-4 py-4 text-sm font-semibold tracking-[0.2em] text-[#140d0c] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={working}
                      onClick={async () => {
                        setWorking(true);
                        await createSave(draft);
                        setWorking(false);
                      }}
                      type="button"
                    >
                      {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      BEGIN LIFE
                    </button>
                  </div>
                </motion.div>
              ) : null}

              {titlePanel === 'load' ? (
                <motion.div key="load" className="h-full" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
                  <div className="hud-chip inline-flex">Save slots</div>
                  <h2 className="mt-3 font-display text-4xl text-[#fff1de]">Resume a life</h2>
                  <div className="mt-5 space-y-3">
                    {saveSlots.map((slot) => (
                      <button
                        key={slot.slot}
                        className="w-full rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-left transition hover:bg-[rgba(255,255,255,0.08)]"
                        disabled={!slot.summary}
                        onClick={() => void loadSave(slot.slot)}
                        type="button"
                      >
                        {slot.summary ? (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-[0.24em] text-[#dcc9a5]/58">Slot {slot.slot + 1}</div>
                                <div className="mt-1 text-lg font-semibold text-[#fff2de]">{slot.summary.saveName}</div>
                                <div className="mt-1 text-sm text-[#e5d4bb]/72">{slot.summary.characterName}</div>
                              </div>
                              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.24em] text-[#f1cf8d]">{slot.summary.lifeStage.replace('_', ' ')}</div>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-[#e7d6bd]/72 md:grid-cols-2">
                              <div>Age {slot.summary.age}</div>
                              <div>{currency(slot.summary.money)}</div>
                              <div>{slot.summary.locationName}</div>
                              <div>{slot.summary.statusPreview}</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-[#d9c8ad]/62">Empty slot</div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {titlePanel === 'lobbies' ? (
                <motion.div key="lobbies" className="h-full" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
                  <LobbyPanel
                    lobbies={lobbies}
                    onCreate={(name, privacy) => void createLobby(name, privacy)}
                    onJoin={(code) => {
                      const targetSlot = saveSlots.find((slot) => slot.slot === joiningSlot && slot.summary);
                      if (!targetSlot) return;
                      void (async () => {
                        await loadSave(joiningSlot);
                        await joinLobby(code);
                      })();
                    }}
                    onLeave={() => undefined}
                  />
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#dbc8a6]/58">Join with save slot</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {saveSlots.map((slot) => (
                        <button
                          key={slot.slot}
                          className={`rounded-2xl border px-3 py-2 text-sm ${joiningSlot === slot.slot ? 'border-[#d6a85f]/45 bg-[rgba(214,168,95,0.14)] text-[#fff1dd]' : 'border-white/10 bg-white/5 text-[#e6d5bb]/70'}`}
                          onClick={() => setJoiningSlot(slot.slot)}
                          type="button"
                        >
                          {slot.summary ? slot.summary.saveName : `Slot ${slot.slot + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {titlePanel === 'settings' ? (
                <motion.div key="settings" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
                  <div className="hud-chip inline-flex">Settings</div>
                  <h2 className="mt-3 font-display text-4xl text-[#fff1de]">Presentation tuning</h2>
                  <div className="mt-5 grid gap-3">
                    {[
                      ['Motion density', 'Cinematic'],
                      ['Ambient glow', 'High'],
                      ['Idle presentation', 'Animated'],
                      ['Discord focus', 'Embedded-first'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold text-[#fff0dc]">{label}</div>
                        <div className="mt-1 text-sm text-[#e2d1b6]/72">{value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        </main>
      </div>
    </div>
  );
}
