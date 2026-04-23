import { useEffect } from 'react';
import { AlertTriangle, LoaderCircle, RefreshCcw } from 'lucide-react';

import { GameShell } from '@/components/GameShell';
import { TitleScreen } from '@/components/TitleScreen';
import { syncRichPresence } from '@/features/discord/sdk';
import { useGameStore } from '@/store/useGameStore';

function App() {
  const { booting, bootError, bootstrap, activeSave } = useGameStore((state) => ({
    booting: state.booting,
    bootError: state.bootError,
    bootstrap: state.bootstrap,
    activeSave: state.activeSave,
  }));

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void syncRichPresence(activeSave);
  }, [activeSave]);

  if (booting) {
    return (
      <div className="flex h-screen items-center justify-center bg-midnight-900 text-[#f6ecda]">
        <div className="panel-shell flex items-center gap-3 px-5 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#f1cd8a]" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#dcc8a3]/58">QLife</div>
            <div className="mt-1 font-display text-2xl">Booting the city</div>
          </div>
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="flex h-screen items-center justify-center bg-midnight-900 px-4 text-[#f6ecda]">
        <div className="panel-shell max-w-[680px] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[rgba(139,49,72,0.18)] p-3 text-[#f1c98e]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#dcc8a3]/58">QLife boot error</div>
              <h1 className="mt-2 font-display text-4xl text-[#fff2df]">The city failed to load</h1>
              <p className="mt-3 text-sm leading-7 text-[#e4d3b8]/78">
                QLife hit a startup error instead of showing the title screen. The message below should make the next step clearer.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-xs leading-6 text-[#f0dfc2]/88">
                {bootError}
              </pre>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(90deg,rgba(139,49,72,0.92),rgba(214,168,95,0.84))] px-4 py-3 text-sm font-semibold tracking-[0.18em] text-[#140d0c]"
                onClick={() => void bootstrap()}
                type="button"
              >
                <RefreshCcw className="h-4 w-4" />
                RETRY BOOT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return activeSave ? <GameShell /> : <TitleScreen />;
}

export default App;
