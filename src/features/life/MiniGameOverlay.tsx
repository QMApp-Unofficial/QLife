import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MiniGameId } from '@/types/game';

type MiniGameOverlayProps = {
  game?: {
    kind: MiniGameId;
    title: string;
    description: string;
    onComplete: (score: number) => void;
  } | null;
  onClose: () => void;
};

const CHOICE_VARIANTS: Record<
  Exclude<MiniGameId, 'crime' | 'driving'>,
  { prompt: string; options: Array<{ label: string; detail: string; score: number }> }
> = {
  interview: {
    prompt: 'The room asks why you belong here. Choose your tone.',
    options: [
      { label: 'Lead with calm confidence', detail: 'Sharp, self-assured, expensive.', score: 0.94 },
      { label: 'Stay humble and safe', detail: 'Reliable, but maybe forgettable.', score: 0.72 },
      { label: 'Oversell everything', detail: 'Big energy, risky follow-through.', score: 0.56 },
    ],
  },
  exam: {
    prompt: 'What kind of answer are you writing under pressure?',
    options: [
      { label: 'Structured and exact', detail: 'High precision, high payoff.', score: 0.92 },
      { label: 'Intuitive and fast', detail: 'Good when your instincts are hot.', score: 0.74 },
      { label: 'Panic and improvise', detail: 'Sometimes chaos lands, usually not.', score: 0.48 },
    ],
  },
  tax: {
    prompt: 'The filing desk wants order. What do you prioritize?',
    options: [
      { label: 'Clean paper trail', detail: 'Safe and efficient.', score: 0.9 },
      { label: 'Aggressive deductions', detail: 'More upside, more suspicion.', score: 0.67 },
      { label: 'Hide the messy part', detail: 'Fast relief, sharp risk.', score: 0.44 },
    ],
  },
  conversation: {
    prompt: 'The mood is alive. What energy do you bring into the exchange?',
    options: [
      { label: 'Warm and present', detail: 'Earn trust before sparks.', score: 0.91 },
      { label: 'Playfully bold', detail: 'High chemistry, medium volatility.', score: 0.78 },
      { label: 'Cool and unreadable', detail: 'Stylish, but easier to miss.', score: 0.54 },
    ],
  },
  diagnosis: {
    prompt: 'You have minutes to read the situation correctly.',
    options: [
      { label: 'Stabilize first', detail: 'Good instincts under pressure.', score: 0.88 },
      { label: 'Run more checks', detail: 'Safer, slower, still solid.', score: 0.72 },
      { label: 'Guess and commit', detail: 'Looks decisive. Can go badly.', score: 0.45 },
    ],
  },
  investment: {
    prompt: 'Capital wants a philosophy. Which one do you choose?',
    options: [
      { label: 'Measured growth', detail: 'Resilient and disciplined.', score: 0.85 },
      { label: 'Barbell risk', detail: 'A sharp hedge with some swing.', score: 0.74 },
      { label: 'All-in momentum', detail: 'If it hits, it sings. If not, it burns.', score: 0.5 },
    ],
  },
  social_post: {
    prompt: 'Your post is almost live. Which angle do you publish?',
    options: [
      { label: 'Curated and cinematic', detail: 'Strong reach, premium feel.', score: 0.9 },
      { label: 'Messy and honest', detail: 'Human, uneven, often sticky.', score: 0.76 },
      { label: 'Bait the timeline', detail: 'Explosive if you can absorb the fallout.', score: 0.57 },
    ],
  },
};

function MeterGame({ kind, onComplete }: { kind: 'crime' | 'driving'; onComplete: (score: number) => void }) {
  const [progress, setProgress] = useState(18);
  const [direction, setDirection] = useState(1);
  const target = kind === 'crime' ? 74 : 52;
  const targetWidth = kind === 'crime' ? 10 : 16;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = current + direction * 3.5;
        if (next >= 96 || next <= 6) {
          setDirection((value) => value * -1);
        }
        return Math.max(0, Math.min(100, next));
      });
    }, 32);
    return () => window.clearInterval(interval);
  }, [direction]);

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
        <div className="mb-3 text-sm text-[#f0e5d2]/80">
          {kind === 'crime'
            ? 'Hold your nerve and stop inside the narrow calm zone.'
            : 'Time the run cleanly and land on the smooth line.'}
        </div>
        <div className="relative h-5 rounded-full bg-black/40">
          <div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-300/20 via-emerald-400/45 to-emerald-300/20"
            style={{ left: `${target - targetWidth / 2}%`, width: `${targetWidth}%` }}
          />
          <motion.div
            className={cn(
              'absolute top-[-8px] h-9 w-4 rounded-full shadow-[0_0_22px_rgba(241,225,196,0.35)]',
              kind === 'crime' ? 'bg-[#8b3148]' : 'bg-[#d6a85f]',
            )}
            animate={{ left: `${progress}%` }}
            transition={{ duration: 0.03, ease: 'linear' }}
          />
        </div>
      </div>
      <button
        className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-[#faf1df] transition hover:bg-white/15"
        onClick={() => {
          const distance = Math.abs(progress - target);
          const score = Math.max(0.42, 1 - distance / 34);
          onComplete(score);
        }}
        type="button"
      >
        STOP NOW
      </button>
    </div>
  );
}

export function MiniGameOverlay({ game, onClose }: MiniGameOverlayProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  useEffect(() => {
    setSelectedScore(null);
  }, [game?.kind, game?.title]);

  const variant = useMemo(() => {
    if (!game || game.kind === 'crime' || game.kind === 'driving') return null;
    return CHOICE_VARIANTS[game.kind];
  }, [game]);

  return (
    <AnimatePresence>
      {game ? (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(7,6,7,0.68)] p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="panel-shell relative w-full max-w-[560px] overflow-hidden border-[rgba(255,255,255,0.12)] p-6"
            initial={{ y: 22, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <button
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-[#ecdcc3]/80 transition hover:bg-white/10 hover:text-[#fff6e3]"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(214,168,95,0.16)] text-[#f8d48f]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="hud-chip inline-flex">{game.kind.replace('_', ' ')}</div>
                <h3 className="mt-2 font-display text-3xl text-[#fff4e2]">{game.title}</h3>
              </div>
            </div>
            <p className="mb-6 max-w-[46ch] text-sm leading-6 text-[#e7d8bf]/76">{game.description}</p>
            {game.kind === 'crime' || game.kind === 'driving' ? (
              <MeterGame kind={game.kind} onComplete={game.onComplete} />
            ) : variant ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-sm text-[#f0e3cb]/80">{variant.prompt}</div>
                <div className="grid gap-3">
                  {variant.options.map((option) => (
                    <button
                      key={option.label}
                      className={cn(
                        'rounded-[24px] border px-4 py-4 text-left transition',
                        selectedScore === option.score
                          ? 'border-[#d6a85f]/50 bg-[rgba(214,168,95,0.14)]'
                          : 'border-white/10 bg-white/5 hover:bg-white/10',
                      )}
                      onClick={() => setSelectedScore(option.score)}
                      type="button"
                    >
                      <div className="font-semibold text-[#fff2df]">{option.label}</div>
                      <div className="mt-1 text-sm text-[#e7d7bd]/70">{option.detail}</div>
                    </button>
                  ))}
                </div>
                <button
                  className="w-full rounded-full border border-white/10 bg-[linear-gradient(90deg,rgba(139,49,72,0.92),rgba(214,168,95,0.84))] px-4 py-3 text-sm font-semibold tracking-[0.18em] text-[#140d0c] transition disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedScore === null}
                  onClick={() => {
                    if (selectedScore !== null) {
                      game.onComplete(selectedScore);
                    }
                  }}
                  type="button"
                >
                  LOCK IT IN
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
