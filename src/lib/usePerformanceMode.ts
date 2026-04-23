import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

function getInitialLowPower(prefersReducedMotion: boolean) {
  if (typeof window === 'undefined') return prefersReducedMotion;

  const params = new URLSearchParams(window.location.search);
  const forced = params.get('performance');
  if (forced === 'full') return false;
  if (forced === 'lite') return true;

  const embeddedDiscord = window.location.hostname.endsWith('discordsays.com');
  const lowerCoreDevice = (navigator.hardwareConcurrency ?? 8) <= 10;
  const compactViewport = window.innerWidth < 1400 || window.innerHeight < 820;

  return Boolean(prefersReducedMotion || embeddedDiscord || lowerCoreDevice || compactViewport);
}

export function usePerformanceMode() {
  const prefersReducedMotion = useReducedMotion();
  const [lowPower, setLowPower] = useState(() => getInitialLowPower(Boolean(prefersReducedMotion)));

  useEffect(() => {
    const next = getInitialLowPower(Boolean(prefersReducedMotion));
    setLowPower(next);
    document.documentElement.classList.toggle('performance-lite', next);
    return () => {
      document.documentElement.classList.remove('performance-lite');
    };
  }, [prefersReducedMotion]);

  return {
    lowPower,
    prefersReducedMotion,
  };
}
