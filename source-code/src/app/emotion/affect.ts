/**
 * Facial-expression bookkeeping. Pure functions only, so scoring can use them without loading any
 * model code.
 *
 * The models predict the 7 FER-2013 emotions; the app groups them into 4 states. "Stressed" is
 * every negative expression, because the game index cares about a shift towards negative affect
 * under pressure rather than which negative emotion it was.
 */
export const EMOTIONS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const STATES = ["stressed", "normal", "relaxed", "surprised"] as const;
export type AffectState = (typeof STATES)[number];

export const STATE_OF: Record<Emotion, AffectState> = {
  angry: "stressed",
  disgust: "stressed",
  fear: "stressed",
  sad: "stressed",
  neutral: "normal",
  happy: "relaxed",
  surprise: "surprised",
};

export const STATE_LABEL: Record<AffectState, string> = {
  stressed: "Stressed",
  normal: "Normal",
  relaxed: "Relaxed",
  surprised: "Surprised",
};

/** One analysed camera frame. `probs` is absent when no face was found. */
export type AffectSample = { t: number; probs: number[] | null };

export type AffectSummary = {
  /** Frames analysed while this game was on screen. */
  frames: number;
  /** Frames in which a face was found and classified. */
  faceFrames: number;
  /** Mean probability of the "stressed" state over face frames. */
  meanStress: number;
  /** Share of face frames whose most likely state was each state. */
  shares: Record<AffectState, number>;
  /** Mean of the 7 emotion probabilities over face frames. */
  meanProbs: number[];
};

const zeroShares = (): Record<AffectState, number> => ({ stressed: 0, normal: 0, relaxed: 0, surprised: 0 });

export const emptyAffect = (): AffectSummary => ({
  frames: 0,
  faceFrames: 0,
  meanStress: 0,
  shares: zeroShares(),
  meanProbs: EMOTIONS.map(() => 0),
});

export function toStates(probs: readonly number[]): Record<AffectState, number> {
  const s = zeroShares();
  EMOTIONS.forEach((e, i) => {
    s[STATE_OF[e]] += probs[i] ?? 0;
  });
  return s;
}

export function dominantState(probs: readonly number[]): AffectState {
  const s = toStates(probs);
  return STATES.reduce((best, k) => (s[k] > s[best] ? k : best), STATES[0]);
}

export function summarise(samples: readonly AffectSample[]): AffectSummary {
  const out = emptyAffect();
  out.frames = samples.length;
  for (const { probs } of samples) {
    if (!probs) continue;
    out.faceFrames += 1;
    out.meanStress += toStates(probs).stressed;
    out.shares[dominantState(probs)] += 1;
    probs.forEach((p, i) => (out.meanProbs[i] += p));
  }
  if (out.faceFrames > 0) {
    out.meanStress /= out.faceFrames;
    for (const k of STATES) out.shares[k] /= out.faceFrames;
    out.meanProbs = out.meanProbs.map((p) => p / out.faceFrames);
  }
  return out;
}

/** Face-frame-weighted mean stress across several games. */
export function pooledStress(parts: readonly AffectSummary[]): { faceFrames: number; meanStress: number } {
  const faceFrames = parts.reduce((n, p) => n + p.faceFrames, 0);
  const total = parts.reduce((n, p) => n + p.meanStress * p.faceFrames, 0);
  return { faceFrames, meanStress: faceFrames > 0 ? total / faceFrames : 0 };
}
