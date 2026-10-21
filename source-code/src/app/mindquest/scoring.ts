import type { MindQuestSession } from "./session";
import { clamp, mean, rate } from "./telemetry";

/**
 * Baseline-relative anxiety index.
 *
 * The untimed games (Flash Recall, Sliding Puzzle) establish how error-prone
 * this particular player is when nothing is rushing them. The timed games
 * (Object Slicing, Infinite Runner) then measure how far that drifts under
 * pressure. Scoring the *change* rather than the raw numbers means someone who
 * is simply slow or clumsy at games isn't read as anxious.
 *
 * All weights and thresholds are set by hand and have not been fitted to
 * clinical data (GAD-7 or otherwise). This is a screening heuristic, and the
 * result screen says so.
 */

export type AnxietyBand = "low" | "moderate" | "high";

export type ScoreComponent = {
  key: "impulsivity" | "variability" | "degradation" | "attention";
  label: string;
  points: number;
  max: number;
  /** Plain-language reading of what drove this component. */
  detail: string;
  /** False when a game this component depends on wasn't completed. */
  measured: boolean;
};

export type AnxietyIndex = {
  score: number;
  band: AnxietyBand;
  components: ScoreComponent[];
  /** Baseline error rate the pressure games were compared against. */
  baselineErrorRate: number;
  /** True when no untimed game produced a usable baseline. */
  baselineFallback: boolean;
};

/** Used only if neither untimed game produced data (e.g. both skipped). */
const DEFAULT_BASELINE_ERROR_RATE = 0.12;

export const bandFor = (score: number): AnxietyBand =>
  score <= 33 ? "low" : score >= 67 ? "high" : "moderate";

/**
 * The player's own error rate with no time pressure.
 * Flash Recall misses, plus sliding-puzzle inputs that were either illegal or
 * immediately undone.
 */
export function baselineErrorRate(s: MindQuestSession): { value: number; fallback: boolean } {
  const parts: number[] = [];

  const fr = s.flashRecall;
  if (fr.completed && fr.focusHits + fr.focusMisses > 0) {
    parts.push(rate(fr.focusMisses, fr.focusHits + fr.focusMisses));
  }

  const pz = s.puzzle;
  // A skipped puzzle with only a handful of moves says nothing about baseline.
  if (pz.completed && pz.moves >= 5) {
    parts.push(rate(pz.invalidInputs + pz.reversals, pz.moves + pz.invalidInputs));
  }

  return parts.length > 0
    ? { value: mean(parts), fallback: false }
    : { value: DEFAULT_BASELINE_ERROR_RATE, fallback: true };
}

export function computeAnxietyIndex(s: MindQuestSession): AnxietyIndex {
  const base = baselineErrorRate(s);
  const sl = s.slicing;
  const rn = s.runner;
  const hasSlicing = sl.completed && sl.swipes > 0;
  const hasRunner = rn.completed && rn.rowsPassed > 0;

  // ---- Impulsivity (0–30): erroneous input under pressure, minus baseline ----
  const pressureErrors: number[] = [];
  if (hasRunner) pressureErrors.push(rate(rn.excessSwipes, rn.swipes));
  if (hasSlicing) pressureErrors.push(rate(sl.hazardsSliced + sl.emptySwipes, sl.swipes));
  const pressureErr = mean(pressureErrors);
  // Baseline is discounted slightly: some extra error under time pressure is
  // normal for everyone, and shouldn't by itself register as impulsivity.
  const impulsivityRaw = clamp((pressureErr - base.value * 0.8 - 0.05) / 0.35, 0, 1);
  const impulsivity: ScoreComponent = {
    key: "impulsivity",
    label: "Impulsive inputs under pressure",
    max: 30,
    points: pressureErrors.length ? impulsivityRaw * 30 : 0,
    measured: pressureErrors.length > 0,
    detail: pressureErrors.length
      ? `${Math.round(pressureErr * 100)}% of fast-game inputs were wasted or wrong, vs ${Math.round(
          base.value * 100
        )}% when untimed.`
      : "Timed games not completed.",
  };

  // ---- Variability (0–25): how inconsistent reaction times were ----
  const cvs: number[] = [];
  if (hasRunner && rn.reactionCv > 0) cvs.push(rn.reactionCv);
  if (hasSlicing && sl.reactionCv > 0) cvs.push(sl.reactionCv);
  const meanCv = mean(cvs);
  const variability: ScoreComponent = {
    key: "variability",
    label: "Reaction-time variability",
    max: 25,
    points: cvs.length ? clamp((meanCv - 0.22) / 0.45, 0, 1) * 25 : 0,
    measured: cvs.length > 0,
    detail: cvs.length
      ? `Reaction times varied by ${Math.round(meanCv * 100)}% around your average.`
      : "Not enough reactions recorded.",
  };

  // ---- Degradation (0–25): how much the runner fell apart as speed rose ----
  const collisionRise = rn.lateCollisionRate - rn.earlyCollisionRate;
  const degradation: ScoreComponent = {
    key: "degradation",
    label: "Performance drop as speed rose",
    max: 25,
    points: hasRunner
      ? clamp(collisionRise / 0.3, 0, 1) * 15 + clamp((rn.lateCollisionRate - 0.05) / 0.35, 0, 1) * 10
      : 0,
    measured: hasRunner,
    detail: hasRunner
      ? `Collisions went from ${Math.round(rn.earlyCollisionRate * 100)}% of obstacles at the slow start to ${Math.round(
          rn.lateCollisionRate * 100
        )}% at top speed.`
      : "Runner not completed.",
  };

  // ---- Attention / agitation (0–20): slicing decay, jitter, lapses ----
  const [first, , last] = sl.accuracyByThird;
  const decay = first - last;
  const missRate = rate(sl.targetsMissed, sl.targetsSpawned);
  const attention: ScoreComponent = {
    key: "attention",
    label: "Attention drift and motor agitation",
    max: 20,
    points: hasSlicing
      ? clamp((decay - 0.08) / 0.35, 0, 1) * 12 +
        clamp((sl.meanJitter - 1.12) / 0.5, 0, 1) * 5 +
        clamp((missRate - 0.15) / 0.5, 0, 1) * 3
      : 0,
    measured: hasSlicing,
    detail: hasSlicing
      ? `Slicing accuracy went from ${Math.round(first * 100)}% in the first 15s to ${Math.round(
          last * 100
        )}% in the last 15s.`
      : "Slicing not completed.",
  };

  const components = [impulsivity, variability, degradation, attention];
  const score = clamp(Math.round(components.reduce((sum, c) => sum + c.points, 0)), 0, 100);

  return {
    score,
    band: bandFor(score),
    components,
    baselineErrorRate: base.value,
    baselineFallback: base.fallback,
  };
}

/** Game-y reward number for the result screen. Not part of the assessment. */
export function computeXp(s: MindQuestSession): number {
  const fr = s.flashRecall;
  const pz = s.puzzle;
  const sl = s.slicing;
  const rn = s.runner;

  const flash = fr.focusHits * 5 + Math.max(0, 60 - fr.focusMisses * 3);
  const puzzle = pz.solved ? 100 + Math.max(0, 60 - Math.max(0, pz.moves - pz.optimalMoves) * 3) : pz.completed ? 30 : 0;
  const slicing = Math.max(0, sl.targetsSliced * 4 - sl.hazardsSliced * 10);
  const runner = rn.rowsPassed * 2 + (rn.completed ? Math.max(0, 80 - rn.collisions * 8) : 0);

  return Math.round(flash + puzzle + slicing + runner);
}
