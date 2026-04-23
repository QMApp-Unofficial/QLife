import { DiscordSDK } from '@discord/embedded-app-sdk';

import type { SaveState } from '@/types/game';

type DiscordBootstrap =
  | {
      mode: 'local';
      accessToken?: undefined;
      sdk?: undefined;
      error?: string;
    }
  | {
      mode: 'discord';
      accessToken?: string;
      sdk: DiscordSDK;
      error?: string;
    };

let discordSdk: DiscordSDK | null = null;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function bootstrapDiscord(): Promise<DiscordBootstrap> {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) {
    return { mode: 'local' };
  }

  try {
    discordSdk = new DiscordSDK(clientId);
    await Promise.race([discordSdk.ready(), wait(1800).then(() => Promise.reject(new Error('timeout')))]);

    let accessToken: string | undefined;
    try {
      const { code } = await discordSdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        state: 'qlife',
        prompt: 'none',
        scope: ['identify', 'rpc.activities.write'],
      });

      const response = await fetch('/api/discord/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json();
      accessToken = payload.data?.accessToken;

      if (accessToken) {
        await discordSdk.commands.authenticate({ access_token: accessToken });
      }
    } catch (error) {
      return {
        mode: 'discord',
        sdk: discordSdk,
        error: error instanceof Error ? error.message : 'Discord auth unavailable',
      };
    }

    try {
      await discordSdk.commands.setConfig({ use_interactive_pip: true });
    } catch {
      // Web-only enhancement; safe to ignore where unsupported.
    }

    return {
      mode: 'discord',
      sdk: discordSdk,
      accessToken,
    };
  } catch (error) {
    discordSdk = null;
    return {
      mode: 'local',
      error: error instanceof Error ? error.message : 'Discord bootstrap failed',
    };
  }
}

export async function syncRichPresence(save?: SaveState | null) {
  if (!discordSdk || !save || save.status === 'dead') return;

  try {
    await discordSdk.commands.setActivity({
      activity: {
        details: `${save.character.firstName} in ${save.summary.locationName}`,
        state: `${save.summary.lifeStage.replace('_', ' ')} · ${save.summary.statusPreview}`,
        timestamps: {
          start: Math.floor(new Date(save.lifeStartedAt).getTime() / 1000),
        },
        assets: {
          large_text: 'QLife',
          small_text: 'Discord Activity',
        },
      },
    });
  } catch {
    // Presence is additive polish, not boot-critical.
  }
}

export async function openDiscordInvite() {
  if (!discordSdk) return;
  try {
    await discordSdk.commands.openInviteDialog();
  } catch {
    // ignore
  }
}
