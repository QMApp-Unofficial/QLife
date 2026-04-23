import { motion } from 'framer-motion';
import { MapPinned, Route } from 'lucide-react';

import { LOCATIONS } from '@/data/world';
import { cn } from '@/lib/utils';
import type { SaveState } from '@/types/game';

type MapPanelProps = {
  save: SaveState;
  onTravel: (locationId: string) => void;
};

const lineKey = (left: string, right: string) => [left, right].sort().join(':');
const edges = Array.from(
  new Map(
    LOCATIONS.flatMap((location) =>
      location.connectedTo.map((connected) => [lineKey(location.id, connected), [location.id, connected] as const]),
    ),
  ).values(),
);

export function MapPanel({ save, onTravel }: MapPanelProps) {
  const visibleLocations = LOCATIONS.filter((location) => save.unlockedLocations.includes(location.id));
  const connected = new Set(save.unlockedLocations);

  return (
    <div className="panel-shell relative h-full min-h-[420px] overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="hud-chip inline-flex">Node map</div>
          <h3 className="mt-2 font-display text-3xl text-[#fff3e0]">Velvet Vale Transit</h3>
        </div>
        <MapPinned className="h-5 w-5 text-[#dcb577]" />
      </div>
      <div className="relative h-[320px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(36,24,24,0.92),rgba(15,13,14,0.92))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <svg className="absolute inset-0 h-full w-full">
          {edges.map(([left, right]) => {
            const from = LOCATIONS.find((entry) => entry.id === left);
            const to = LOCATIONS.find((entry) => entry.id === right);
            if (!from || !to) return null;
            return (
              <line
                key={`${left}:${right}`}
                x1={`${from.coordinates.x}%`}
                x2={`${to.coordinates.x}%`}
                y1={`${from.coordinates.y}%`}
                y2={`${to.coordinates.y}%`}
                stroke={connected.has(from.id) && connected.has(to.id) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}
                strokeWidth="2"
              />
            );
          })}
        </svg>
        {visibleLocations.map((location, index) => {
          const active = save.locationId === location.id;
          return (
            <motion.button
              key={location.id}
              className={cn(
                'absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-left shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition',
                active ? 'border-[#d6a85f]/60 bg-[rgba(214,168,95,0.22)]' : 'border-white/10 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)]',
              )}
              onClick={() => onTravel(location.id)}
              style={{ left: `${location.coordinates.x}%`, top: `${location.coordinates.y}%` }}
              type="button"
              whileHover={{ scale: 1.04 }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <span className={cn('h-2.5 w-2.5 rounded-full', active ? 'bg-[#f5d28d]' : 'bg-white/60')} />
              <span>
                <span className="block text-[11px] uppercase tracking-[0.26em] text-[#e5d6be]/55">{location.district}</span>
                <span className="block text-sm font-semibold text-[#fff0dc]">{location.name}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleLocations.slice(0, 4).map((location) => (
          <div
            key={location.id}
            className={cn(
              'rounded-[24px] border p-4',
              save.locationId === location.id ? 'border-[#d6a85f]/45 bg-[rgba(214,168,95,0.08)]' : 'border-white/10 bg-white/5',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#fff2de]">{location.name}</div>
              <Route className="h-4 w-4 text-[#d8b176]" />
            </div>
            <p className="mt-2 text-xs leading-5 text-[#e5d5bc]/65">{location.mood}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
