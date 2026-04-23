import type { SaveState } from '@/types/game';

type DiscordSdkInstance = {
  commands: {
    authorize: (args: {
      client_id: string;
      response_type: 'code';
      state: string;
      prompt: 'none';
      scope: string[];
    }) => Promise<{ code: string }>;
    authenticate: (args: { access_token: string }) => Promise<unknown>;
    setConfig: (args: { use_interactive_pip: boolean }) => Promise<unknown>;
    setActivity: (args: {
      activity: {
        details: string;
        state: string;
        timestamps: { start: number };
        assets: {
          large_text: string;
          small_text: string;
        };
      };
    }) => Promise<unknown>;
    openInviteDialog: () => Promise<unknown>;
  };
  ready: () => Promise<void>;
};

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
      sdk: DiscordSdkInstance;
      error?: string;
    };

let discordSdk: DiscordSdkInstance | null = null;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function bootstrapDiscord(): Promise<DiscordBootstrap> {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) {
    return { mode: 'local' };
  }

  try {
    const { DiscordSDK } = await import('@discord/embedded-app-sdk');
    discordSdk = new DiscordSDK(clientId) as DiscordSdkInstance;
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
