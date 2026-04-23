import crypto from 'node:crypto';

import { nanoid } from 'nanoid';

import { applyCasino, applyJobApplication, applyOfflineProgress, chooseEvent, createNewLife, performAction, travelTo } from '../../src/features/life/engine';
import type { CreateSaveInput, LocationId, SaveState, SessionUser } from '../../src/types/game';
import { db } from '../db';

function checksum(json: string) {
  return crypto.createHash('sha256').update(json).digest('hex');
}

function saveId(userId: string, slot: number) {
  return `${userId}:${slot}`;
}

function parseState(row: { state_json: string; checksum: string; id: string }): SaveState {
  try {
    if (checksum(row.state_json) !== row.checksum) {
      throw new Error('Checksum mismatch');
    }
    return JSON.parse(row.state_json) as SaveState;
  } catch {
    const fallback = db
      .prepare(
        `
          SELECT snapshot_json, checksum
          FROM save_revisions
          WHERE save_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
      )
      .get(row.id) as { snapshot_json: string; checksum: string } | undefined;

    if (!fallback || checksum(fallback.snapshot_json) !== fallback.checksum) {
      throw new Error('Save is corrupted and no valid revision exists.');
    }

    return JSON.parse(fallback.snapshot_json) as SaveState;
  }
}

function syncTimers(id: string, state: SaveState) {
  const deleteStmt = db.prepare(`DELETE FROM timers WHERE save_id = ?`);
  deleteStmt.run(id);

  const insertStmt = db.prepare(
    `
      INSERT INTO timers (id, save_id, type, label, completes_at, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  );

  for (const timer of state.timers) {
    insertStmt.run(timer.id, id, timer.type, timer.label, timer.completesAt, JSON.stringify(timer), timer.startedAt);
  }
}

function persistState(state: SaveState) {
  const id = saveId(state.userId, state.saveSlot);
  const stateJson = JSON.stringify(state);
  const stateChecksum = checksum(stateJson);
  const summaryJson = JSON.stringify(state.summary);

  db.prepare(
    `
      INSERT INTO saves (id, user_id, slot_index, name, state_json, summary_json, checksum, version, created_at, updated_at, last_played_at)
      VALUES (@id, @userId, @slotIndex, @name, @stateJson, @summaryJson, @checksum, @version, @createdAt, @updatedAt, @lastPlayedAt)
      ON CONFLICT(user_id, slot_index) DO UPDATE SET
        name = excluded.name,
        state_json = excluded.state_json,
        summary_json = excluded.summary_json,
        checksum = excluded.checksum,
        version = excluded.version,
        updated_at = excluded.updated_at,
        last_played_at = excluded.last_played_at
    `,
  ).run({
    id,
    userId: state.userId,
    slotIndex: state.saveSlot,
    name: state.saveName,
    stateJson,
    summaryJson,
    checksum: stateChecksum,
    version: state.version,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    lastPlayedAt: state.lastPlayedAt,
  });

  db.prepare(
    `
      INSERT INTO save_revisions (id, save_id, snapshot_json, checksum, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(nanoid(), id, stateJson, stateChecksum, state.updatedAt);

  db.prepare(
    `
      DELETE FROM save_revisions
      WHERE save_id = ?
        AND id NOT IN (
          SELECT id
          FROM save_revisions
          WHERE save_id = ?
          ORDER BY created_at DESC
          LIMIT 24
        )
    `,
  ).run(id, id);

  syncTimers(id, state);
}

export function listSaveSlots(userId: string) {
  const rows = db
    .prepare(`SELECT slot_index as slot, summary_json as summary FROM saves WHERE user_id = ? ORDER BY slot_index ASC`)
    .all(userId) as Array<{ slot: number; summary: string }>;

  return Array.from({ length: 3 }, (_, slot) => {
    const existing = rows.find((row) => row.slot === slot);
    return {
      slot,
      summary: existing ? JSON.parse(existing.summary) : null,
    };
  });
}

export function loadSaveState(userId: string, slot: number) {
  const row = db
    .prepare(`SELECT id, state_json, checksum FROM saves WHERE user_id = ? AND slot_index = ?`)
    .get(userId, slot) as { id: string; state_json: string; checksum: string } | undefined;

  if (!row) {
    throw new Error('No save exists in that slot.');
  }

  const hydrated = applyOfflineProgress(parseState(row));
  persistState(hydrated);
  return hydrated;
}

export function clearLobbyFromUserSaves(userId: string, code: string) {
  const rows = db
    .prepare(`SELECT id, state_json, checksum FROM saves WHERE user_id = ?`)
    .all(userId) as Array<{ id: string; state_json: string; checksum: string }>;

  for (const row of rows) {
    const save = parseState(row);
    if (save.lobby.code === code) {
      save.lobby = {};
      save.updatedAt = new Date().toISOString();
      persistState(save);
    }
  }
}

export function createSaveState(user: SessionUser, input: CreateSaveInput) {
  const state = createNewLife(input, user);
  persistState(state);
  return state;
}

export function mutateSave(userId: string, slot: number, mutator: (save: SaveState) => SaveState) {
  const state = loadSaveState(userId, slot);
  const next = mutator(state);
  persistState(next);
  return next;
}

export function runActionMutation(userId: string, slot: number, actionId: string, skillScore: number) {
  return mutateSave(userId, slot, (save) => performAction(save, actionId, skillScore));
}

export function chooseEventMutation(userId: string, slot: number, choiceId: string) {
  return mutateSave(userId, slot, (save) => chooseEvent(save, choiceId));
}

export function travelMutation(userId: string, slot: number, locationId: LocationId) {
  return mutateSave(userId, slot, (save) => travelTo(save, locationId));
}

export function casinoMutation(userId: string, slot: number, game: 'slots' | 'roulette' | 'blackjack', wager: number) {
  let payout = 0;
  const save = mutateSave(userId, slot, (state) => {
    const result = applyCasino(state, game, wager, `${userId}:${slot}`);
    payout = result.payout;
    return result.save;
  });
  return { save, payout };
}

export function jobApplicationMutation(userId: string, slot: number, jobId: string, skillScore: number) {
  return mutateSave(userId, slot, (save) => applyJobApplication(save, jobId as never, skillScore));
}
