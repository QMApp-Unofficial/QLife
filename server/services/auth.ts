import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';

import type { SessionUser } from '../../src/types/game';
import { db } from '../db';
import { env } from '../lib/env';
import '../types/http';

type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function upsertUser(user: SessionUser) {
  db.prepare(
    `
      INSERT INTO users (id, discord_id, username, display_name, avatar, source, created_at, updated_at)
      VALUES (@id, @discordId, @username, @displayName, @avatar, @source, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        discord_id = excluded.discord_id,
        username = excluded.username,
        display_name = excluded.display_name,
        avatar = excluded.avatar,
        source = excluded.source,
        updated_at = excluded.updated_at
    `,
  ).run({
    id: user.id,
    discordId: user.discordId ?? null,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ?? null,
    source: user.source,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}

async function fetchDiscordProfile(accessToken: string) {
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch Discord profile.');
  }

  return (await response.json()) as DiscordProfile;
}

export async function exchangeDiscordCode(code: string) {
  if (!env.discordClientId || !env.discordClientSecret) {
    throw new Error('Discord credentials are not configured.');
  }

  const body = new URLSearchParams({
    client_id: env.discordClientId,
    client_secret: env.discordClientSecret,
    grant_type: 'authorization_code',
    code,
  });

  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Discord token exchange failed.');
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

export async function bootstrapUser(accessToken?: string) {
  let user: SessionUser;

  if (accessToken) {
    const profile = await fetchDiscordProfile(accessToken);
    user = {
      id: `discord:${profile.id}`,
      discordId: profile.id,
      username: profile.username,
      displayName: profile.global_name ?? profile.username,
      avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : undefined,
      source: 'discord',
    };
  } else {
    user = {
      id: `local:${env.fallbackUser}`,
      username: env.fallbackUser,
      displayName: 'Local Dev',
      source: 'local',
    };
  }

  upsertUser(user);

  const sessionToken = crypto.createHash('sha256').update(nanoid() + user.id).digest('hex');
  db.prepare(
    `
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(sessionToken, user.id, nowIso(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString());

  return { sessionToken, user };
}

export function getUserFromSession(sessionToken: string) {
  const row = db
    .prepare(
      `
        SELECT
          users.id,
          users.discord_id as discordId,
          users.username,
          users.display_name as displayName,
          users.avatar,
          users.source
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ? AND sessions.expires_at > ?
      `,
    )
    .get(sessionToken, nowIso()) as SessionUser | undefined;

  return row;
}

export function requireSession(request: Request, response: Response, next: NextFunction) {
  const token = request.header('x-qlife-session');
  if (!token) {
    response.status(401).json({ ok: false, data: { error: 'Missing session token.' } });
    return;
  }

  const user = getUserFromSession(token);
  if (!user) {
    response.status(401).json({ ok: false, data: { error: 'Session expired.' } });
    return;
  }

  request.user = user;
  next();
}
