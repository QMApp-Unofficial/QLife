import { nanoid } from 'nanoid';

import type { LobbyRecord, SaveState, SessionUser } from '../../src/types/game';
import { db } from '../db';

const MAX_PLAYERS = 7;

function nowIso() {
  return new Date().toISOString();
}

function toCode() {
  return nanoid(6).toUpperCase();
}

function memberStatusFromSave(user: SessionUser, save: SaveState) {
  const partner = save.relationships.find((entry) => entry.role === 'Partner');
  return {
    userId: user.id,
    displayName: user.displayName,
    locationId: save.locationId,
    reputation: save.stats.reputation,
    relationshipStatus: partner ? partner.status : 'Single',
  };
}

function hydrateLobbyMembers(lobbyId: string) {
  return db
    .prepare(
      `
        SELECT status_json
        FROM lobby_members
        WHERE lobby_id = ?
        ORDER BY created_at ASC
      `,
    )
    .all(lobbyId)
    .map((row) => JSON.parse((row as { status_json: string }).status_json)) as LobbyRecord['members'];
}

function hydrateLobbies() {
  const rows = db
    .prepare(`SELECT id, code, name, privacy, host_user_id as hostUserId, max_players as maxPlayers, created_at as createdAt FROM lobbies ORDER BY updated_at DESC`)
    .all() as Array<Omit<LobbyRecord, 'members'>>;

  return rows.map((row) => ({
    ...row,
    members: hydrateLobbyMembers(row.id),
  }));
}

export function listLobbiesForUser(userId: string) {
  return hydrateLobbies().filter(
    (lobby) => lobby.privacy === 'public' || lobby.hostUserId === userId || lobby.members.some((member) => member.userId === userId),
  );
}

export function createLobby(user: SessionUser, name: string, privacy: 'public' | 'private') {
  const lobby: Omit<LobbyRecord, 'members'> = {
    id: nanoid(),
    code: toCode(),
    name,
    privacy,
    maxPlayers: MAX_PLAYERS,
    hostUserId: user.id,
    createdAt: nowIso(),
  };

  db.prepare(
    `
      INSERT INTO lobbies (id, code, name, privacy, host_user_id, max_players, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(lobby.id, lobby.code, lobby.name, lobby.privacy, lobby.hostUserId, lobby.maxPlayers, lobby.createdAt, lobby.createdAt);

  return {
    ...lobby,
    members: [],
  } satisfies LobbyRecord;
}

export function joinLobby(user: SessionUser, code: string, save: SaveState) {
  const lobby = db
    .prepare(`SELECT id, code, name, privacy, host_user_id as hostUserId, max_players as maxPlayers, created_at as createdAt FROM lobbies WHERE code = ?`)
    .get(code) as Omit<LobbyRecord, 'members'> | undefined;

  if (!lobby) {
    throw new Error('Lobby not found.');
  }

  const memberCount = db.prepare(`SELECT COUNT(*) as count FROM lobby_members WHERE lobby_id = ?`).get(lobby.id) as { count: number };
  if (memberCount.count >= MAX_PLAYERS) {
    throw new Error('Lobby is full.');
  }

  db.prepare(
    `
      INSERT INTO lobby_members (id, lobby_id, user_id, status_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(lobby_id, user_id) DO UPDATE SET
        status_json = excluded.status_json,
        updated_at = excluded.updated_at
    `,
  ).run(nanoid(), lobby.id, user.id, JSON.stringify(memberStatusFromSave(user, save)), nowIso(), nowIso());

  db.prepare(`UPDATE lobbies SET updated_at = ? WHERE id = ?`).run(nowIso(), lobby.id);

  return {
    ...lobby,
    members: hydrateLobbyMembers(lobby.id),
  } satisfies LobbyRecord;
}

export function leaveLobby(userId: string, code: string) {
  const lobby = db.prepare(`SELECT id, host_user_id as hostUserId FROM lobbies WHERE code = ?`).get(code) as { id: string; hostUserId: string } | undefined;
  if (!lobby) {
    return { left: true as const };
  }

  db.prepare(`DELETE FROM lobby_members WHERE lobby_id = ? AND user_id = ?`).run(lobby.id, userId);
  const remaining = db.prepare(`SELECT user_id as userId FROM lobby_members WHERE lobby_id = ? ORDER BY created_at ASC`).all(lobby.id) as Array<{ userId: string }>;

  if (remaining.length === 0) {
    db.prepare(`DELETE FROM lobbies WHERE id = ?`).run(lobby.id);
  } else if (lobby.hostUserId === userId) {
    db.prepare(`UPDATE lobbies SET host_user_id = ?, updated_at = ? WHERE id = ?`).run(remaining[0]?.userId, nowIso(), lobby.id);
  }

  return { left: true as const };
}

export function syncLobbyPresence(user: SessionUser, save: SaveState) {
  if (!save.lobby.code) return;

  const lobby = db.prepare(`SELECT id FROM lobbies WHERE code = ?`).get(save.lobby.code) as { id: string } | undefined;
  if (!lobby) return;

  db.prepare(
    `
      UPDATE lobby_members
      SET status_json = ?, updated_at = ?
      WHERE lobby_id = ? AND user_id = ?
    `,
  ).run(JSON.stringify(memberStatusFromSave(user, save)), nowIso(), lobby.id, user.id);
  db.prepare(`UPDATE lobbies SET updated_at = ? WHERE id = ?`).run(nowIso(), lobby.id);
}
