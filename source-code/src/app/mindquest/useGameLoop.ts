import { useEffect, useRef, useState } from "react";

/**
 * requestAnimationFrame loop that hands the callback a frame delta in ms.
 *
 * Two things matter for a game that is also a measurement:
 *  - When the tab is hidden the loop stops advancing game time, and resumes
 *    without a catch-up jump. Otherwise switching tabs for 10s would either
 *    teleport every object or silently eat 10s of a 45s round.
 *  - A single long frame (GC pause, slow device) is clamped, so physics never
 *    integrates over a huge step and lets an object tunnel past the player.
 *
 * Returns whether the loop is currently paused by visibility.
 */
export function useGameLoop(onFrame: (dtMs: number) => void, running: boolean): boolean {
  const callbackRef = useRef(onFrame);
  callbackRef.current = onFrame;
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!running) return;

    let raf = 0;
    let last: number | null = null;
    let hidden = typeof document !== "undefined" && document.hidden;
    setPaused(hidden);

    const tick = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min(now - last, 50);
      last = now;
      if (!hidden && dt > 0) callbackRef.current(dt);
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      hidden = document.hidden;
      setPaused(hidden);
      // Restart the delta clock so the first frame back isn't one giant step.
      last = null;
    };

    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [running]);

  return paused;
}
