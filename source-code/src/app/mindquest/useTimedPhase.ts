import { useCallback, useEffect, useState } from "react";

export type TimedPhase = "intro" | "countdown" | "play" | "done";

/**
 * intro → 3·2·1 countdown → play → done, for the timed games.
 *
 * The clock must not start until the player has read the instructions and
 * chosen to begin; otherwise the first seconds of a pressure measurement are
 * really measuring reading speed.
 */
export function useTimedPhase(countFrom = 3, stepMs = 700) {
  const [phase, setPhase] = useState<TimedPhase>("intro");
  const [count, setCount] = useState(countFrom);

  const start = useCallback(() => {
    setCount(countFrom);
    setPhase("countdown");
  }, [countFrom]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      setPhase("play");
      return;
    }
    const id = window.setTimeout(() => setCount((c) => c - 1), stepMs);
    return () => window.clearTimeout(id);
  }, [phase, count, stepMs]);

  return { phase, setPhase, count, start };
}
