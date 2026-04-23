import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { env } from './lib/env';
import { bootstrapUser, exchangeDiscordCode, getUserFromSession, requireSession } from './services/auth';
import { clearLobbyFromUserSaves, createSaveState, jobApplicationMutation, listSaveSlots, loadSaveState, chooseEventMutation, runActionMutation, travelMutation, casinoMutation, mutateSave } from './services/saveService';
import { createLobby, joinLobby, leaveLobby, listLobbiesForUser, syncLobbyPresence } from './services/lobbyService';
import './types/http';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function send<T>(response: express.Response, data: T) {
  response.json({ ok: true, data });
}

function broadcastLobbyUpdates() {
  for (const socket of io.sockets.sockets.values()) {
    const user = socket.data.user;
    if (!user) continue;
    socket.emit('lobby:update', listLobbiesForUser(user.id));
  }
}

app.get('/api/health', (_request, response) => {
  send(response, { status: 'ok' });
});

app.post('/api/discord/token', async (request, response) => {
  try {
    const accessToken = await exchangeDiscordCode(request.body.code);
    send(response, { accessToken });
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Token exchange failed.' } });
  }
});

app.post('/api/session/bootstrap', async (request, response) => {
  try {
    const session = await bootstrapUser(request.body.accessToken);
    send(response, session);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Unable to bootstrap session.' } });
  }
});

app.get('/api/session', requireSession, (request, response) => {
  send(response, request.user);
});

app.get('/api/saves', requireSession, (request, response) => {
  send(response, listSaveSlots(request.user!.id));
});

app.post('/api/saves', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const save = createSaveState(user, request.body);
    send(response, save);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Unable to create save.' } });
  }
});

app.post('/api/saves/:slot/load', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.params.slot);
    const save = loadSaveState(user.id, slot);
    syncLobbyPresence(user, save);
    broadcastLobbyUpdates();
    send(response, save);
  } catch (error) {
    response.status(404).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Unable to load save.' } });
  }
});

app.post('/api/saves/:slot/action', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.params.slot);
    const save = runActionMutation(user.id, slot, request.body.actionId, Number(request.body.skillScore ?? 0.7));
    syncLobbyPresence(user, save);
    broadcastLobbyUpdates();
    send(response, save);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Action failed.' } });
  }
});

app.post('/api/saves/:slot/event', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.params.slot);
    const save = chooseEventMutation(user.id, slot, request.body.choiceId);
    syncLobbyPresence(user, save);
    broadcastLobbyUpdates();
    send(response, save);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Event resolution failed.' } });
  }
});

app.post('/api/saves/:slot/travel', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.params.slot);
    const save = travelMutation(user.id, slot, request.body.locationId);
    syncLobbyPresence(user, save);
    broadcastLobbyUpdates();
    send(response, save);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Travel failed.' } });
  }
});

app.post('/api/saves/:slot/casino', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.params.slot);
    const result = casinoMutation(user.id, slot, request.body.game, Number(request.body.wager ?? 0));
    syncLobbyPresence(user, result.save);
    broadcastLobbyUpdates();
    send(response, result);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Casino play failed.' } });
  }
});

app.post('/api/saves/:slot/jobs', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.params.slot);
    const save = jobApplicationMutation(user.id, slot, request.body.jobId, Number(request.body.skillScore ?? 0.75));
    syncLobbyPresence(user, save);
    broadcastLobbyUpdates();
    send(response, save);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Job application failed.' } });
  }
});

app.get('/api/lobbies', requireSession, (request, response) => {
  const user = request.user!;
  send(response, listLobbiesForUser(user.id));
});

app.post('/api/lobbies', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const lobby = createLobby(user, request.body.name, request.body.privacy ?? 'public');
    broadcastLobbyUpdates();
    send(response, lobby);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Unable to create lobby.' } });
  }
});

app.post('/api/lobbies/:code/join', requireSession, (request, response) => {
  try {
    const user = request.user!;
    const slot = Number(request.body.slot);
    const save = mutateSave(user.id, slot, (state) => ({
      ...state,
      lobby: {
        code: String(request.params.code).toUpperCase(),
      },
    }));
    const lobby = joinLobby(user, String(request.params.code).toUpperCase(), save);
    const synced = mutateSave(user.id, slot, (state) => ({
      ...state,
      lobby: {
        lobbyId: lobby.id,
        code: lobby.code,
        name: lobby.name,
        privacy: lobby.privacy,
      },
    }));
    syncLobbyPresence(user, synced);
    broadcastLobbyUpdates();
    send(response, lobby);
  } catch (error) {
    response.status(400).json({ ok: false, data: { error: error instanceof Error ? error.message : 'Unable to join lobby.' } });
  }
});

app.post('/api/lobbies/:code/leave', requireSession, (request, response) => {
  const user = request.user!;
  const code = String(request.params.code).toUpperCase();
  const result = leaveLobby(user.id, code);
  clearLobbyFromUserSaves(user.id, code);
  broadcastLobbyUpdates();
  send(response, result);
});

io.use((socket, next) => {
  const sessionToken = socket.handshake.auth.sessionToken as string | undefined;
  if (!sessionToken) {
    next(new Error('Missing session token'));
    return;
  }

  const user = getUserFromSession(sessionToken);
  if (!user) {
    next(new Error('Session expired'));
    return;
  }

  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  socket.emit('lobby:update', listLobbiesForUser(user.id));
});

const clientDist = path.join(process.cwd(), 'dist/client');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*path}', (request, response, next) => {
    if (request.path.startsWith('/api')) {
      next();
      return;
    }
    response.sendFile(path.join(clientDist, 'index.html'));
  });
}

server.listen(env.port, () => {
  console.log(`QLife server listening on http://localhost:${env.port}`);
});
