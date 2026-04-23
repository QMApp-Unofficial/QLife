import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

import { env } from '../lib/env';

fs.mkdirSync(env.dataDir, { recursive: true });

export const db = new Database(path.join(env.dataDir, 'qlife.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    discord_id TEXT UNIQUE,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar TEXT,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS saves (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    slot_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    state_json TEXT NOT NULL,
    summary_json TEXT NOT NULL,
    checksum TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_played_at TEXT NOT NULL,
    UNIQUE (user_id, slot_index),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS save_revisions (
    id TEXT PRIMARY KEY,
    save_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    checksum TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timers (
    id TEXT PRIMARY KEY,
    save_id TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    completes_at TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lobbies (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    privacy TEXT NOT NULL,
    host_user_id TEXT NOT NULL,
    max_players INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lobby_members (
    id TEXT PRIMARY KEY,
    lobby_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (lobby_id, user_id),
    FOREIGN KEY (lobby_id) REFERENCES lobbies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
