import type { ApiEnvelope, CreateSaveInput, LobbyRecord, SaveState, SaveSummary, SessionUser } from '@/types/game';

export interface SaveSlotRecord {
  slot: number;
  summary: SaveSummary | null;
}

export interface SessionBootstrap {
  sessionToken: string;
  user: SessionUser;
}

function buildHeaders(sessionToken?: string) {
  return {
    'Content-Type': 'application/json',
    ...(sessionToken ? { 'x-qlife-session': sessionToken } : {}),
  };
}

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export async function bootstrapSession(accessToken?: string) {
  return unwrap<SessionBootstrap>(
    await fetch('/api/session/bootstrap', {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ accessToken }),
    }),
  );
}

export async function getSession(sessionToken: string) {
  return unwrap<SessionUser>(
    await fetch('/api/session', {
      headers: buildHeaders(sessionToken),
    }),
  );
}

export async function getSaveSlots(sessionToken: string) {
  return unwrap<SaveSlotRecord[]>(
    await fetch('/api/saves', {
      headers: buildHeaders(sessionToken),
    }),
  );
}

export async function createSave(sessionToken: string, input: CreateSaveInput) {
  return unwrap<SaveState>(
    await fetch('/api/saves', {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify(input),
    }),
  );
}

export async function loadSave(sessionToken: string, slot: number) {
  return unwrap<SaveState>(
    await fetch(`/api/saves/${slot}/load`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
    }),
  );
}

export async function runAction(sessionToken: string, slot: number, actionId: string, skillScore: number) {
  return unwrap<SaveState>(
    await fetch(`/api/saves/${slot}/action`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ actionId, skillScore }),
    }),
  );
}

export async function chooseEvent(sessionToken: string, slot: number, choiceId: string) {
  return unwrap<SaveState>(
    await fetch(`/api/saves/${slot}/event`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ choiceId }),
    }),
  );
}

export async function travel(sessionToken: string, slot: number, locationId: string) {
  return unwrap<SaveState>(
    await fetch(`/api/saves/${slot}/travel`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ locationId }),
    }),
  );
}

export async function playCasino(sessionToken: string, slot: number, game: string, wager: number) {
  return unwrap<{ save: SaveState; payout: number }>(
    await fetch(`/api/saves/${slot}/casino`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ game, wager }),
    }),
  );
}

export async function applyForJob(sessionToken: string, slot: number, jobId: string, skillScore: number) {
  return unwrap<SaveState>(
    await fetch(`/api/saves/${slot}/jobs`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ jobId, skillScore }),
    }),
  );
}

export async function getLobbies(sessionToken: string) {
  return unwrap<LobbyRecord[]>(
    await fetch('/api/lobbies', {
      headers: buildHeaders(sessionToken),
    }),
  );
}

export async function createLobby(sessionToken: string, name: string, privacy: 'public' | 'private') {
  return unwrap<LobbyRecord>(
    await fetch('/api/lobbies', {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ name, privacy }),
    }),
  );
}

export async function joinLobby(sessionToken: string, code: string, slot: number) {
  return unwrap<LobbyRecord>(
    await fetch(`/api/lobbies/${code}/join`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
      body: JSON.stringify({ slot }),
    }),
  );
}

export async function leaveLobby(sessionToken: string, code: string) {
  return unwrap<{ left: true }>(
    await fetch(`/api/lobbies/${code}/leave`, {
      method: 'POST',
      headers: buildHeaders(sessionToken),
    }),
  );
}
