import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

import { GameShell } from '@/components/GameShell';
import { TitleScreen } from '@/components/TitleScreen';
import { syncRichPresence } from '@/features/discord/sdk';
import { useGameStore } from '@/store/useGameStore';

function App() {
  const { booting, bootstrap, activeSave } = useGameStore((state) => ({
    booting: state.booting,
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

  return activeSave ? <GameShell /> : <TitleScreen />;
}

export default App;
