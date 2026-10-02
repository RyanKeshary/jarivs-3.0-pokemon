import { useEffect, useState } from 'react';

/**
 * A clock that ticks once a second, aligned to the wall-clock second boundary.
 *
 * Two details that matter:
 *
 *  - Aligned to the boundary. A naive `setInterval(tick, 1000)` drifts and
 *    eventually fires twice a second or skips a second, which makes the
 *    countdown visibly stutter. Scheduling the next tick relative to
 *    `1000 - (now % 1000)` keeps it honest.
 *  - Whole seconds only. The state is a second counter rather than
 *    `Date.now()`, so a re-render is skipped entirely unless something the user
 *    can actually see has changed.
 */
export function useNow(intervalMs = 1000): number {
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const now = Date.now();
      setNowSeconds(Math.floor(now / 1000));
      // Re-align to the next whole second; guard against intervalMs > 1000.
      const delay = Math.max(50, intervalMs - (now % intervalMs));
      timeout = setTimeout(tick, delay);
    };

    timeout = setTimeout(tick, Math.max(50, intervalMs - (Date.now() % intervalMs)));

    return () => clearTimeout(timeout);
  }, [intervalMs]);

  return nowSeconds * 1000;
}
