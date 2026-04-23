# QLife

QLife is a Discord-first cinematic life simulator built as a persistent multiplayer-capable Discord Activity with a Railway-friendly Node + SQLite architecture.

The v1 shipped in this repo is intentionally opinionated:

- fixed-shell Discord Activity layout instead of a scrolling website
- title screen, save slots, lobbies, phone, map, casino, health, finance, and end-of-life flow
- persistent saves backed by SQLite with checksum validation and rolling revisions
- real-time lifetime pacing across roughly 14 real-world days
- offline timer progression and session resume
- shared-world lobby architecture with Socket.IO presence
- animation-heavy UI using React, Tailwind, and Framer Motion

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand
- Express 5
- Socket.IO
- SQLite via `better-sqlite3`
- Discord Embedded App SDK
- Railway volume-backed persistence

## Project Structure

```text
src/
  components/           Title screen, shell, ambient presentation
  data/                 Locations, jobs, actions, events
  features/life/        Core simulation engine + minigames
  features/phone/       In-world phone UI
  features/map/         Node-map travel UI
  features/casino/      Casino presentation and play
  features/multiplayer/ Lobby UI
  store/                Zustand app state + API orchestration
  lib/                  Client helpers
  types/                Shared game and API types

server/
  db/                   SQLite bootstrapping and schema
  services/             Auth, saves, lobbies
  lib/                  Runtime env helpers
  index.ts              Express + Socket.IO server
```

## Core Systems Shipped

- 3 save slots per player
- birth/start flow with character naming and class background
- persistent life state with relationships, finances, education, health, crime, housing, vehicles, children, timers, and moments
- cinematic title screen and fixed gameplay shell
- major locations represented as a connected node map
- phone apps for jobs, finances, health, messages, and social
- casino games: slots, roulette-lite, blackjack-lite
- minigame overlay system for interviews, exams, tax, conversation, diagnosis, investment, driving, crime, and social posting
- real-time age progression with day/night and weather ambience
- death flow with life summary and old-age victory ending
- lobby creation, join, leave, and live member presence updates

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set values as needed:

```bash
VITE_DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
PORT=3001
DATA_DIR=./data
QLIFE_BASE_URL=http://localhost:3001
SESSION_FALLBACK_USER=local-dev-user
```

If Discord credentials are absent, QLife falls back to a local development identity so saves and the simulation still work outside Discord.

### 3. Run in development

```bash
npm run dev
```

This starts:

- Vite client on `http://localhost:5173`
- Express/Socket.IO API on `http://localhost:3001`

### 4. Production build

```bash
npm run typecheck
npm run build
npm run start
```

## Discord Activity Integration Notes

QLife is built around the Embedded App SDK and a server-side OAuth exchange flow.

### Discord app configuration

In the Discord Developer Portal:

1. Create or open your application.
2. Enable both installation contexts.
3. Add the OAuth redirect URI `https://127.0.0.1`.
4. Enable Activities for the app.
5. Add an Activity URL Mapping that points to your Railway service domain.

### Runtime behavior

- The client boots the Discord SDK when `VITE_DISCORD_CLIENT_ID` is present.
- It calls `authorize`, exchanges the code on the backend, and authenticates the embedded client.
- The backend links saves to the Discord user identity when an access token is available.
- The client updates Discord activity presence with current location and life-stage text.
- A local fallback session path remains available for browser-only development.

### Important practical note

Once the Embedded App SDK handshake is active, the app is meant to run inside Discord rather than a regular browser tab. Local browser mode is supported only as a development fallback.

## Railway Deployment

QLife is designed to run as one Railway service with one attached volume.

### Recommended Railway setup

1. Create a new service from this GitHub repo.
2. Attach a volume to the service.
3. Mount the volume at `/data`.
4. Set environment variables:

```bash
VITE_DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DATA_DIR=/data
QLIFE_BASE_URL=https://your-service.up.railway.app
SESSION_FALLBACK_USER=railway-fallback
```

5. In Railway service settings, confirm:

- Build Command: `npm run build`
- Start Command: `npm run start`
- Healthcheck Path: `/api/health`

### Why this deployment shape

- Railway handles the Node service cleanly with a standard `npm start` workflow.
- SQLite lives on the attached volume for persistent saves and lobby state.
- The Express server serves the built Vite client and the API from one deployment.

### Volume behavior

- QLife writes its SQLite database into `DATA_DIR/qlife.sqlite`.
- Railway volumes persist data at the configured mount path.
- The app assumes a single mounted volume per service and uses it as the authoritative save store.

## Persistence And Storage Notes

QLife uses SQLite with these production-oriented behaviors:

- save slot rows store the latest canonical snapshot
- every save write also creates a rolling revision entry
- snapshots are checksummed
- corrupted snapshots attempt restoration from the latest valid revision
- active timers are mirrored into a `timers` table for operational visibility
- lobby membership and member presence are persisted in SQLite, not memory only

### Current tables

- `users`
- `sessions`
- `saves`
- `save_revisions`
- `timers`
- `lobbies`
- `lobby_members`

## Architecture Summary

### Frontend

- `TitleScreen` handles new game, load, lobby, and settings entry points.
- `GameShell` is the fixed in-Discord HUD layout.
- `MiniGameOverlay` turns major decisions into playable interactions.
- `PhonePanel`, `MapPanel`, `CasinoPanel`, and `LobbyPanel` run as layered modal experiences.

### Simulation

- `src/features/life/engine.ts` is the heart of the game.
- Age derives from real elapsed time since `lifeStartedAt`.
- Actions apply direct effects or create timed processes.
- Offline progression resolves completed timers and recurring economy ticks.
- Randomized event injection adds drama and branching pressure.
- Old-age death is treated as a victory ending.

### Backend

- Express provides save, action, lobby, and session APIs.
- Socket.IO broadcasts lobby presence changes.
- The server serves the built client in production.
- Discord OAuth code exchange stays server-side.

## Viewport And Layout Notes

QLife targets Discord Activity constraints first.

### Minimized

- switches to an intentional idle scene
- keeps age, life stage, location, and cash visible
- uses ambient animation instead of static compression

### Compact

- collapses to a single main gameplay column
- keeps the top HUD and central scene readable
- shortens visible action lists to prevent fold loss

### Standard

- primary target layout
- left stats rail, central cinematic stage, right quick-systems column
- no page scrolling required for core play

### Expanded

- preserves the fixed shell while giving more room to stage and detail panels
- avoids giant empty hero-space by expanding contextual cards instead

## Manual Verification Checklist

These are the checks you should run before shipping a production Discord build:

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run start`
- [ ] Open `/` and verify the client HTML is served
- [ ] Create a new save and confirm the name persists
- [ ] Reload and confirm the save card renders correctly
- [ ] Resume a save and confirm location, money, and stats are preserved
- [ ] Run at least one action with a minigame and verify the result sticks
- [ ] Trigger a timed action and verify the timer persists after reload
- [ ] Create a lobby, join it, and verify member presence shows location/reputation
- [ ] Leave the lobby and confirm the save clears lobby state
- [ ] Open phone, map, casino, finance, and health overlays
- [ ] Verify the minimized state still looks alive
- [ ] Verify no core gameplay screen requires full-page scrolling
- [ ] Confirm `/api/health` returns success
- [ ] Confirm SQLite is writing under the mounted volume path in Railway
- [ ] Confirm Discord identity binding works with real OAuth credentials inside Discord

## Verification Already Completed In This Repo

I manually verified the following locally during implementation:

- `npm run typecheck`
- `npm run build`
- `/api/health` returns `200`
- session bootstrap works in local fallback mode
- save creation, loading, naming, and persistence work
- action execution works
- map travel updates persisted location
- timed actions persist in save state
- lobby create/join/leave flows work structurally
- old-age ending resolves through offline progression simulation

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run build:client
npm run build:server
npm run start
```

## Known v1 Tradeoffs

- Multiplayer is structurally persistent and lobby-aware, but not yet a fully synchronous shared simulation for every mechanic.
- The visual direction is production-styled and animation-heavy, but still asset-light and UI-driven rather than illustration-heavy.
- Discord auth is production-wired, but browser fallback remains enabled for easier local iteration.

## External References

- Discord Activities overview: https://docs.discord.com/developers/activities
- Building a Discord Activity: https://docs.discord.com/developers/activities/building-an-activity
- Embedded App SDK reference: https://docs.discord.com/developers/developer-tools/embedded-app-sdk
- Railway config as code: https://docs.railway.com/config-as-code/reference
- Railway build/start commands: https://docs.railway.com/reference/build-and-start-commands
- Railway volumes: https://docs.railway.com/volumes/reference
