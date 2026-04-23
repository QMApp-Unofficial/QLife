import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';

import {
  applyForJob as applyForJobRequest,
  bootstrapSession,
  chooseEvent as chooseEventRequest,
  createLobby as createLobbyRequest,
  createSave as createSaveRequest,
  getLobbies,
  getSaveSlots,
  getSession,
  joinLobby as joinLobbyRequest,
  leaveLobby as leaveLobbyRequest,
  loadSave,
  playCasino as playCasinoRequest,
  runAction as runActionRequest,
  travel as travelRequest,
  type SaveSlotRecord,
} from '@/lib/api';
import { bootstrapDiscord } from '@/features/discord/sdk';
import type { CreateSaveInput, LobbyRecord, OverlayPanel, SaveState, SessionUser } from '@/types/game';

type StatusMessage = {
  title: string;
  body: string;
  tone?: 'gold' | 'crimson' | 'ash';
};

interface GameState {
  booting: boolean;
  bootError?: string;
  sessionToken?: string;
  session?: SessionUser;
  discordMode: 'local' | 'discord';
  discordError?: string;
  saveSlots: SaveSlotRecord[];
  activeSave?: SaveState;
  titlePanel: 'main' | 'new' | 'load' | 'lobbies' | 'settings';
  overlay: OverlayPanel;
  lobbies: LobbyRecord[];
  socket?: Socket;
  socketConnected: boolean;
  recentStatus?: StatusMessage;
  bootstrap: () => Promise<void>;
  setTitlePanel: (panel: GameState['titlePanel']) => void;
  openOverlay: (panel: OverlayPanel) => void;
  closeOverlay: () => void;
  createSave: (input: CreateSaveInput) => Promise<void>;
  loadSave: (slot: number) => Promise<void>;
  exitToTitle: () => void;
  refreshSaveSlots: () => Promise<void>;
  refreshLobbies: () => Promise<void>;
  performAction: (actionId: string, skillScore: number) => Promise<void>;
  resolveEvent: (choiceId: string) => Promise<void>;
  travelTo: (locationId: string) => Promise<void>;
  playCasino: (game: 'slots' | 'roulette' | 'blackjack', wager: number) => Promise<void>;
  applyForJob: (jobId: string, skillScore: number) => Promise<void>;
  createLobby: (name: string, privacy: 'public' | 'private') => Promise<void>;
  joinLobby: (code: string) => Promise<void>;
  leaveLobby: () => Promise<void>;
  setStatus: (status?: StatusMessage) => void;
}

function attachSocket(sessionToken: string, set: (next: Partial<GameState>) => void) {
  const socket = io({
    autoConnect: true,
    auth: {
      sessionToken,
    },
  });

  socket.on('connect', () => {
    set({ socketConnected: true });
  });

  socket.on('disconnect', () => {
    set({ socketConnected: false });
  });

  socket.on('lobby:update', (lobbies: LobbyRecord[]) => {
    set({ lobbies });
  });

  return socket;
}

export const useGameStore = create<GameState>((set, get) => ({
  booting: true,
  bootError: undefined,
  discordMode: 'local',
  saveSlots: Array.from({ length: 3 }, (_, slot) => ({ slot, summary: null })),
  titlePanel: 'main',
  overlay: null,
  lobbies: [],
  socketConnected: false,
  setTitlePanel: (panel) => set({ titlePanel: panel }),
  openOverlay: (panel) => set({ overlay: panel }),
  closeOverlay: () => set({ overlay: null }),
  setStatus: (recentStatus) => set({ recentStatus }),

  bootstrap: async () => {
    set({ booting: true, bootError: undefined });

    try {
      const discord = await bootstrapDiscord();
      const sessionBootstrap = await bootstrapSession(discord.mode === 'discord' ? discord.accessToken : undefined);
      const socket = attachSocket(sessionBootstrap.sessionToken, set);

      try {
        localStorage.setItem('qlife-session-token', sessionBootstrap.sessionToken);
      } catch {
        // Storage can fail in embedded contexts; the server session remains authoritative.
      }

      const [session, saveSlots, lobbies] = await Promise.all([
        getSession(sessionBootstrap.sessionToken),
        getSaveSlots(sessionBootstrap.sessionToken),
        getLobbies(sessionBootstrap.sessionToken),
      ]);

      set({
        booting: false,
        bootError: undefined,
        discordMode: discord.mode,
        discordError: discord.error,
        sessionToken: sessionBootstrap.sessionToken,
        session,
        saveSlots,
        lobbies,
        socket,
      });
    } catch (error) {
      set({
        booting: false,
        bootError: error instanceof Error ? error.message : 'QLife failed to boot.',
        socket: undefined,
      });
    }
  },

  refreshSaveSlots: async () => {
    const token = get().sessionToken;
    if (!token) return;
    const saveSlots = await getSaveSlots(token);
    set({ saveSlots });
  },

  refreshLobbies: async () => {
    const token = get().sessionToken;
    if (!token) return;
    const lobbies = await getLobbies(token);
    set({ lobbies });
  },

  createSave: async (input) => {
    const token = get().sessionToken;
    if (!token) return;
    const activeSave = await createSaveRequest(token, input);
    const saveSlots = await getSaveSlots(token);
    set({
      activeSave,
      saveSlots,
      titlePanel: 'main',
      recentStatus: {
        title: 'A new life started',
        body: `${activeSave.character.firstName} enters Velvet Vale from birth.`,
        tone: 'gold',
      },
    });
  },

  loadSave: async (slot) => {
    const token = get().sessionToken;
    if (!token) return;
    const activeSave = await loadSave(token, slot);
    set({
      activeSave,
      recentStatus: {
        title: 'Save resumed',
        body: `${activeSave.summary.characterName} is back in motion.`,
        tone: 'ash',
      },
    });
  },

  exitToTitle: () => {
    set({
      activeSave: undefined,
      overlay: null,
      recentStatus: undefined,
      titlePanel: 'main',
    });
  },

  performAction: async (actionId, skillScore) => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save) return;
    const activeSave = await runActionRequest(token, save.saveSlot, actionId, skillScore);
    const saveSlots = await getSaveSlots(token);
    set({
      activeSave,
      saveSlots,
      recentStatus: {
        title: activeSave.moments[0]?.title ?? 'Choice recorded',
        body: activeSave.moments[0]?.description ?? 'The city reacted.',
        tone: 'gold',
      },
    });
  },

  resolveEvent: async (choiceId) => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save) return;
    const activeSave = await chooseEventRequest(token, save.saveSlot, choiceId);
    const saveSlots = await getSaveSlots(token);
    set({ activeSave, saveSlots });
  },

  travelTo: async (locationId) => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save) return;
    const activeSave = await travelRequest(token, save.saveSlot, locationId);
    const saveSlots = await getSaveSlots(token);
    set({
      activeSave,
      saveSlots,
      recentStatus: {
        title: `Moved to ${activeSave.summary.locationName}`,
        body: activeSave.summary.statusPreview,
      },
    });
  },

  playCasino: async (game, wager) => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save) return;
    const result = await playCasinoRequest(token, save.saveSlot, game, wager);
    const saveSlots = await getSaveSlots(token);
    set({
      activeSave: result.save,
      saveSlots,
      recentStatus: {
        title: result.payout >= 0 ? 'The table paid you' : 'The house took it',
        body: `${result.payout >= 0 ? '+' : '-'}$${Math.abs(result.payout)} on ${game}.`,
        tone: result.payout >= 0 ? 'gold' : 'crimson',
      },
    });
  },

  applyForJob: async (jobId, skillScore) => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save) return;
    const activeSave = await applyForJobRequest(token, save.saveSlot, jobId, skillScore);
    const saveSlots = await getSaveSlots(token);
    set({
      activeSave,
      saveSlots,
      recentStatus: {
        title: 'Application sent',
        body: `The ${jobId.replaceAll('_', ' ')} route is now in motion.`,
      },
    });
  },

  createLobby: async (name, privacy) => {
    const token = get().sessionToken;
    if (!token) return;
    await createLobbyRequest(token, name, privacy);
    const lobbies = await getLobbies(token);
    set({
      lobbies,
      recentStatus: {
        title: 'Lobby created',
        body: `${name} is now open to ${privacy === 'public' ? 'everyone' : 'invited players'}.`,
      },
    });
  },

  joinLobby: async (code) => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save) return;
    const lobby = await joinLobbyRequest(token, code, save.saveSlot);
    const activeSave = {
      ...save,
      lobby: {
        lobbyId: lobby.id,
        code: lobby.code,
        name: lobby.name,
        privacy: lobby.privacy,
      },
    };
    const lobbies = await getLobbies(token);
    set({
      activeSave,
      lobbies,
      recentStatus: {
        title: 'Joined lobby',
        body: `${lobby.name} now shares your world state.`,
        tone: 'gold',
      },
    });
  },

  leaveLobby: async () => {
    const token = get().sessionToken;
    const save = get().activeSave;
    if (!token || !save?.lobby.code) return;
    await leaveLobbyRequest(token, save.lobby.code);
    const lobbies = await getLobbies(token);
    set({
      activeSave: {
        ...save,
        lobby: {},
      },
      lobbies,
      recentStatus: {
        title: 'Lobby left',
        body: 'You are back to your private run.',
      },
    });
  },
}));
