import { motion } from 'framer-motion';
import { Crown, DoorOpen, Plus, Users } from 'lucide-react';
import { useState } from 'react';

import { openDiscordInvite } from '@/features/discord/sdk';
import { cn } from '@/lib/utils';
import type { LobbyRecord, SaveState } from '@/types/game';

type LobbyPanelProps = {
  activeSave?: SaveState;
  lobbies: LobbyRecord[];
  onCreate: (name: string, privacy: 'public' | 'private') => void;
  onJoin: (code: string) => void;
  onLeave: () => void;
};

export function LobbyPanel({ activeSave, lobbies, onCreate, onJoin, onLeave }: LobbyPanelProps) {
  const [name, setName] = useState('Midnight Heirs');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

  return (
    <div className="panel-shell h-full overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="hud-chip inline-flex">Multiplayer</div>
          <h3 className="mt-2 font-display text-3xl text-[#fff2e1]">Shared World Lobbies</h3>
        </div>
        <Users className="h-5 w-5 text-[#dfb777]" />
      </div>

      {activeSave?.lobby.code ? (
        <div className="mb-4 rounded-[26px] border border-[#d6a85f]/30 bg-[rgba(214,168,95,0.1)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#fff0dc]">{activeSave.lobby.name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#e8cf9c]/70">{activeSave.lobby.code}</div>
            </div>
            <button
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs tracking-[0.24em] text-[#fff0dc]"
              onClick={() => void openDiscordInvite()}
              type="button"
            >
              INVITE
            </button>
          </div>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-[#f5e4ca]"
            onClick={onLeave}
            type="button"
          >
            <DoorOpen className="h-4 w-4" />
            Leave lobby
          </button>
        </div>
      ) : null}

      <div className="mb-4 rounded-[26px] border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[#e6d5bc]/55">Create lobby</div>
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#fff2de] outline-none ring-0 placeholder:text-[#b9a990]"
          onChange={(event) => setName(event.target.value)}
          placeholder="Lobby name"
          value={name}
        />
        <div className="mt-3 flex gap-2">
          {(['public', 'private'] as const).map((value) => (
            <button
              key={value}
              className={cn(
                'rounded-full border px-3 py-2 text-xs tracking-[0.22em]',
                privacy === value ? 'border-[#d6a85f]/55 bg-[rgba(214,168,95,0.16)] text-[#fff0dc]' : 'border-white/10 bg-white/5 text-[#e7d5bb]/70',
              )}
              onClick={() => setPrivacy(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(90deg,rgba(139,49,72,0.9),rgba(214,168,95,0.82))] px-4 py-3 text-sm font-semibold tracking-[0.18em] text-[#140d0c]"
          onClick={() => onCreate(name, privacy)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          CREATE
        </button>
      </div>

      <div className="space-y-3">
        {lobbies.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-[#e4d4bb]/72">
            The city is quiet right now. Spin up the first shared run.
          </div>
        ) : (
          lobbies.map((lobby, index) => (
            <motion.div
              key={lobby.id}
              className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#fff1df]">
                    {lobby.hostUserId === activeSave?.userId ? <Crown className="h-4 w-4 text-[#f0c87f]" /> : null}
                    {lobby.name}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#e6d5bc]/55">
                    {lobby.code} · {lobby.privacy} · {lobby.members.length}/{lobby.maxPlayers}
                  </div>
                </div>
                {activeSave ? (
                  <button
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs tracking-[0.24em] text-[#fff0dd]"
                    onClick={() => onJoin(lobby.code)}
                    type="button"
                  >
                    JOIN
                  </button>
                ) : null}
              </div>
              <div className="mt-3 grid gap-2">
                {lobby.members.slice(0, 3).map((member) => (
                  <div key={member.userId} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2 text-sm">
                    <span className="text-[#fff0de]">{member.displayName}</span>
                    <span className="text-[#d9c8ad]/65">{member.locationId?.replaceAll('_', ' ')} · {member.relationshipStatus}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
