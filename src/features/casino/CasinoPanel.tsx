import { motion } from 'framer-motion';
import { Coins, Diamond, Landmark, Spade } from 'lucide-react';
import { useState } from 'react';

import { currency } from '@/lib/utils';

type CasinoPanelProps = {
  cash: number;
  onPlay: (game: 'slots' | 'roulette' | 'blackjack', wager: number) => void;
};

const GAMES = [
  { id: 'slots' as const, name: 'Velvet Slots', subtitle: 'Fast, loud, beautiful.', icon: Diamond },
  { id: 'roulette' as const, name: 'Roulette Lite', subtitle: 'Safer odds, cleaner highs.', icon: Coins },
  { id: 'blackjack' as const, name: 'Blackjack Flash', subtitle: 'Quick reads, sharp swings.', icon: Spade },
];

export function CasinoPanel({ cash, onPlay }: CasinoPanelProps) {
  const [wager, setWager] = useState(100);

  return (
    <div className="panel-shell relative h-full overflow-hidden p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,168,95,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(139,49,72,0.18),transparent_35%)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="hud-chip inline-flex">Casino</div>
            <h3 className="mt-2 font-display text-3xl text-[#fff5e4]">The Gilded Mirage</h3>
          </div>
          <Landmark className="h-5 w-5 text-[#e2bd7f]" />
        </div>
        <div className="mb-4 rounded-[28px] border border-white/10 bg-black/20 px-5 py-4">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[#e8d8be]/55">Chips ready</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-3xl font-semibold text-[#fff4e2]">{currency(cash)}</div>
            <div className="text-sm text-[#d6c4a7]/70">Choose a fast table and let variance decide.</div>
          </div>
          <div className="mt-4 flex gap-2">
            {[50, 100, 250, 500].map((amount) => (
              <button
                key={amount}
                className={`rounded-full border px-3 py-2 text-xs tracking-[0.22em] ${
                  wager === amount ? 'border-[#d6a85f]/55 bg-[rgba(214,168,95,0.16)] text-[#fff1dc]' : 'border-white/10 bg-white/5 text-[#e8d9bf]/70'
                }`}
                onClick={() => setWager(amount)}
                type="button"
              >
                {currency(amount)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {GAMES.map((game, index) => {
            const Icon = game.icon;
            return (
              <motion.button
                key={game.id}
                className="group rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition hover:bg-[rgba(255,255,255,0.08)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onPlay(game.id, wager)}
                type="button"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(214,168,95,0.14)] text-[#ffd48d] transition group-hover:bg-[rgba(214,168,95,0.24)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 font-display text-2xl text-[#fff3df]">{game.name}</h4>
                <p className="mt-2 text-sm leading-6 text-[#e5d4b9]/72">{game.subtitle}</p>
                <div className="mt-4 text-xs uppercase tracking-[0.26em] text-[#f1d38d]">Play for {currency(wager)}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
