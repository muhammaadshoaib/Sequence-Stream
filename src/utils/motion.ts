import { useState, useEffect } from 'react';

/**
 * Detects if the user prefers reduced motion (accessibility compliance)
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Smoothly animates numbers from 0 to the target calculated biological value.
 * Uses performance-friendly requestAnimationFrame with an ease-out cubic curve.
 * 
 * IMPORTANT: Animates ONLY to the real calculated value passed in, never to fake data.
 */
export function useCountUp(
  targetValue: number,
  durationMs: number = 900,
  decimals: number = 0,
  startTrigger: boolean = true
): number {
  const [currentValue, setCurrentValue] = useState<number>(() => (startTrigger ? 0 : targetValue));
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || !startTrigger) {
      setCurrentValue(targetValue);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      
      // easeOutCubic curve: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextVal = easeProgress * targetValue;

      if (decimals === 0) {
        setCurrentValue(Math.round(nextVal));
      } else {
        const factor = Math.pow(10, decimals);
        setCurrentValue(Math.round(nextVal * factor) / factor);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, durationMs, decimals, startTrigger, prefersReduced]);

  return currentValue;
}
