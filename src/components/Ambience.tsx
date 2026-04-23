import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { usePerformanceMode } from '@/lib/usePerformanceMode';
import type { SaveState, WeatherType } from '@/types/game';

type AmbienceProps = {
  save?: SaveState;
  weather?: WeatherType;
  className?: string;
  stageMode?: 'title' | 'game' | 'idle';
};

const WEATHER_TONES: Record<WeatherType, string> = {
  sunrise: 'from-[#ab5a34]/60 via-[#53262a]/40 to-transparent',
  clear: 'from-[#d6a85f]/45 via-[#63292d]/25 to-transparent',
  overcast: 'from-white/10 via-[#563940]/25 to-transparent',
  rain: 'from-[#6e5d70]/25 via-[#361c28]/45 to-transparent',
  storm: 'from-[#7a3640]/25 via-black/60 to-transparent',
  'neon-night': 'from-[#8b3148]/30 via-[#1f1015]/65 to-transparent',
  fog: 'from-white/10 via-[#2f2726]/55 to-transparent',
};

export function Ambience({ save, weather = 'clear', className, stageMode = 'game' }: AmbienceProps) {
  const hue = save?.character.appearanceHue ?? 24;
  const tone = WEATHER_TONES[weather];
  const { lowPower } = usePerformanceMode();
  const particleCount = lowPower ? (stageMode === 'idle' ? 4 : 6) : stageMode === 'idle' ? 12 : 18;

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-95', tone)} />
      {lowPower ? (
        <>
          <div className="absolute -left-[8%] top-[10%] h-[28vw] w-[28vw] rounded-full bg-[rgba(220,180,108,0.12)] blur-[44px]" />
          <div className="absolute right-[-5%] top-[12%] h-[22vw] w-[22vw] rounded-full bg-[rgba(139,49,72,0.12)] blur-[52px]" />
          <div className="absolute bottom-[-10%] left-[24%] h-[18vw] w-[18vw] rounded-full bg-[rgba(255,238,208,0.06)] blur-[38px]" />
        </>
      ) : (
        <>
          <motion.div
            className="absolute -left-[12%] top-[8%] h-[36vw] w-[36vw] rounded-full bg-[rgba(220,180,108,0.16)] blur-[80px]"
            animate={{ x: [0, 30, -10, 0], y: [0, -18, 12, 0], scale: [1, 1.06, 0.98, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-8%] top-[10%] h-[28vw] w-[28vw] rounded-full bg-[rgba(139,49,72,0.18)] blur-[90px]"
            animate={{ x: [0, -24, 8, 0], y: [0, 20, -12, 0], scale: [1, 0.97, 1.08, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-14%] left-[20%] h-[24vw] w-[24vw] rounded-full bg-[rgba(255,238,208,0.08)] blur-[70px]"
            animate={{ x: [0, 12, -18, 0], y: [0, -16, 8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.14) 0 1px, transparent 1px),
            radial-gradient(circle at 70% 40%, rgba(255,255,255,0.08) 0 1px, transparent 1px),
            linear-gradient(180deg, transparent, rgba(0,0,0,0.35))
          `,
          backgroundSize: '180px 180px, 240px 240px, 100% 100%',
        }}
      />
      {lowPower ? (
        <div
          className={cn(
            'absolute inset-x-[10%] bottom-0 h-[48%] rounded-t-[46%] blur-[1px]',
            stageMode === 'title'
              ? 'bg-[linear-gradient(180deg,rgba(42,28,26,0),rgba(42,28,26,0.22)_24%,rgba(8,8,10,0.82)_100%)]'
              : 'bg-[linear-gradient(180deg,rgba(42,28,26,0),rgba(42,28,26,0.28)_22%,rgba(8,8,10,0.92)_100%)]',
          )}
          style={{
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px hsla(${hue} 80% 50% / 0.08)`,
          }}
        />
      ) : (
        <motion.div
          className={cn(
            'absolute inset-x-[10%] bottom-0 h-[48%] rounded-t-[46%] blur-[2px]',
            stageMode === 'title'
              ? 'bg-[linear-gradient(180deg,rgba(42,28,26,0),rgba(42,28,26,0.22)_24%,rgba(8,8,10,0.82)_100%)]'
              : 'bg-[linear-gradient(180deg,rgba(42,28,26,0),rgba(42,28,26,0.28)_22%,rgba(8,8,10,0.92)_100%)]',
          )}
          style={{
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 120px hsla(${hue} 80% 50% / 0.12)`,
          }}
          animate={{ opacity: [0.78, 1, 0.84, 0.92] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {Array.from({ length: particleCount }, (_, index) =>
        lowPower ? (
          <span
            key={index}
            className="absolute rounded-full bg-[rgba(255,246,224,0.08)]"
            style={{
              left: `${(index * 13) % 100}%`,
              top: `${(index * 19) % 100}%`,
              width: `${5 + (index % 3) * 2}px`,
              height: `${5 + (index % 3) * 2}px`,
              boxShadow: '0 0 12px rgba(255, 232, 189, 0.12)',
            }}
          />
        ) : (
          <motion.span
            key={index}
            className="absolute rounded-full bg-[rgba(255,246,224,0.12)]"
            style={{
              left: `${(index * 11) % 100}%`,
              top: `${(index * 17) % 100}%`,
              width: `${6 + (index % 4) * 3}px`,
              height: `${6 + (index % 4) * 3}px`,
              boxShadow: '0 0 26px rgba(255, 232, 189, 0.25)',
            }}
            animate={{ y: [-8, 10, -6], opacity: [0.12, 0.55, 0.16] }}
            transition={{ duration: 6 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }}
          />
        ),
      )}
    </div>
  );
}
