import { useEffect, useRef } from "react";

/**
 * Keeps a canvas sized to its container at the device pixel ratio.
 *
 * Games draw in CSS pixels (the context is pre-scaled by the DPR) and keep
 * their world state in normalised units, so a rotation or window resize
 * mid-game only changes the scale factor — nothing in flight is displaced.
 *
 * `aspect` is height ÷ width.
 */
export function useCanvas(aspect: number, maxWidth = 520) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const apply = () => {
      // Fit the viewport's remaining height as well as the container's width.
      // Sizing by width alone made the canvas 691px tall on a 768px laptop,
      // pushing the runner's avatar (and slicing's launch line) below the fold
      // — the player would have had to scroll mid-game to see themselves.
      const top = Math.max(0, container.getBoundingClientRect().top);
      const roomBelow = window.innerHeight - top - 16;
      const widthForHeight = roomBelow > 0 ? roomBelow / aspect : Infinity;
      const w = Math.round(
        Math.max(200, Math.min(maxWidth, container.clientWidth || maxWidth, widthForHeight))
      );
      const h = Math.round(w * aspect);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      size.current = { w, h, dpr };
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    apply();
    // The container only changes width; a taller or shorter window (rotation,
    // devtools, browser chrome) needs the window listener too.
    const observer = new ResizeObserver(apply);
    observer.observe(container);
    window.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [aspect, maxWidth]);

  return { containerRef, canvasRef, size };
}

export const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif';
