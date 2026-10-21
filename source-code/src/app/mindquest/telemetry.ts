/** Small, dependency-free statistics and geometry helpers shared by the games. */

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Population standard deviation. */
export function sd(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - m) ** 2;
  return Math.sqrt(acc / values.length);
}

/**
 * Coefficient of variation (sd ÷ mean). Unitless, so it compares "how erratic"
 * across people with different average speeds — a slow but steady player is not
 * scored as erratic. Returns 0 when there are too few samples to mean anything.
 */
export function cv(values: readonly number[]): number {
  if (values.length < 3) return 0;
  const m = mean(values);
  return m > 0 ? sd(values) / m : 0;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Safe ratio: 0 when the denominator is 0 instead of NaN/Infinity. */
export const rate = (num: number, den: number) => (den > 0 ? num / den : 0);

/** Unbiased in-place-free shuffle. `sort(() => Math.random() - 0.5)` is not uniform. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Point = { x: number; y: number };

/**
 * Does the segment a→b pass within `r` of centre `c`?
 *
 * Slicing has to test the segment between consecutive pointer samples, not the
 * samples themselves: a fast swipe can move 80px between two pointermove events
 * and would otherwise jump straight over a target.
 */
export function segmentHitsCircle(a: Point, b: Point, c: Point, r: number): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  // Projection of c onto the segment, clamped to its endpoints.
  const t = lenSq > 0 ? clamp(((c.x - a.x) * dx + (c.y - a.y) * dy) / lenSq, 0, 1) : 0;
  const px = a.x + t * dx - c.x;
  const py = a.y + t * dy - c.y;
  return px * px + py * py <= r * r;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Path length ÷ straight-line distance for one gesture. 1.0 is a perfectly
 * straight stroke; wobble and direction changes push it up. Used as a coarse
 * psychomotor-agitation proxy. Returns 1 for gestures too short to judge.
 */
export function pathJitter(points: readonly Point[]): number {
  if (points.length < 3) return 1;
  let path = 0;
  for (let i = 1; i < points.length; i++) path += distance(points[i - 1], points[i]);
  const chord = distance(points[0], points[points.length - 1]);
  if (chord < 20) return 1; // a near-tap: the ratio would be meaningless noise
  return path / chord;
}

/** Gaps between successive timestamps. */
export function intervals(timestamps: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < timestamps.length; i++) out.push(timestamps[i] - timestamps[i - 1]);
  return out;
}

export type SwipeDirection = "left" | "right" | "up" | "down";

/** Dominant direction of a drag, or null when it's below the swipe threshold. */
export function classifySwipe(dx: number, dy: number, threshold = 30): SwipeDirection | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}
