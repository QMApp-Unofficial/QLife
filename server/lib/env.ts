import path from 'node:path';

export const env = {
  port: Number(process.env.PORT ?? 3001),
  dataDir:
    process.env.RAILWAY_VOLUME_MOUNT_PATH ??
    process.env.DATA_DIR ??
    path.join(process.cwd(), 'data'),
  discordClientId: process.env.DISCORD_CLIENT_ID ?? process.env.VITE_DISCORD_CLIENT_ID ?? '',
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
  baseUrl: process.env.QLIFE_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`,
  fallbackUser: process.env.SESSION_FALLBACK_USER ?? 'local-dev-user',
};
