import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function usePerformanceMode() {
  const prefersReducedMotion = useReducedMotion();
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const embeddedDiscord = window.location.hostname.endsWith('discordsays.com');
    const lowerCoreDevice = (navigator.hardwareConcurrency ?? 8) <= 8;
    const compactViewport = window.innerWidth < 1280 || window.innerHeight < 760;

    setLowPower(Boolean(prefersReducedMotion || (embeddedDiscord && (lowerCoreDevice || compactViewport))));
  }, [prefersReducedMotion]);

  return {
    lowPower,
    prefersReducedMotion,
  };
}
