import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { classifySwipe, type SwipeDirection } from "./telemetry";

export type SwipeSource = "pointer" | "key";

type Options = {
  enabled: boolean;
  /** Called once per gesture, as soon as the drag crosses the threshold. */
  onSwipe: (direction: SwipeDirection, source: SwipeSource) => void;
  /** Called when a pointer gesture ends without becoming a swipe. */
  onTap?: (clientX: number, clientY: number) => void;
  threshold?: number;
};

const KEY_DIRECTIONS: Record<string, SwipeDirection> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

/**
 * One swipe abstraction for touch, mouse and keyboard.
 *
 * Pointer Events cover touch and mouse with a single code path. The swipe
 * fires as soon as the drag passes the threshold rather than on release, which
 * keeps the runner responsive; each gesture can fire at most once, so a long
 * drag isn't counted as several swipes. Keyboard auto-repeat is ignored —
 * holding an arrow key would otherwise register as a burst of "impulsive"
 * inputs the player never made.
 *
 * Spread the returned handlers onto the play area, and give that element
 * `touch-action: none` so the browser doesn't scroll instead.
 */
export function useSwipe({ enabled, onSwipe, onTap, threshold = 30 }: Options) {
  const swipeRef = useRef(onSwipe);
  const tapRef = useRef(onTap);
  swipeRef.current = onSwipe;
  tapRef.current = onTap;

  const gesture = useRef<{ id: number; x: number; y: number; fired: boolean } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const dir = KEY_DIRECTIONS[e.key] ?? KEY_DIRECTIONS[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault(); // arrow keys would otherwise scroll the page
      swipeRef.current(dir, "key");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
      gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture can fail if the pointer already ended; harmless */
      }
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!enabled || !g || g.id !== e.pointerId || g.fired) return;
      const dir = classifySwipe(e.clientX - g.x, e.clientY - g.y, threshold);
      if (dir) {
        g.fired = true;
        swipeRef.current(dir, "pointer");
      }
    },
    [enabled, threshold]
  );

  const end = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
      const g = gesture.current;
      if (!g || g.id !== e.pointerId) return;
      gesture.current = null;
      if (enabled && !cancelled && !g.fired) tapRef.current?.(e.clientX, e.clientY);
    },
    [enabled]
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => end(e, false),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => end(e, true),
  };
}
