import { useEffect, useRef, useState } from 'react';

/** Counts from 0 → target with an ease-out cubic curve. */
export function useCounter(target: number, duration = 700, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const start = performance.now();
      function step(now: number) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setCount(Math.round(eased * target));
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      }
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return count;
}
