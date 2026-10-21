/**
 * Per-run gameplay telemetry for the four-game quest.
 *
 * Slices are keyed by game, not by level number, so the quest order (see
 * quest.ts) can change without the stored data changing meaning.
 */

/** Flash Recall — working-memory span. Untimed; part of the personal baseline. */
export type FlashRecallStats = {
  roundsCompleted: number;
  focusHits: number;
  focusMisses: number;
  completed: boolean;
};

/** Sliding puzzle — processing speed and decision latency. Untimed baseline. */
export type PuzzleStats = {
  moves: number;
  optimalMoves: number;
  /** Time before the first move: planning time. */
  firstMoveMs: number;
  /** Median gap between consecutive moves. */
  medianDecisionMs: number;
  /** Moves that immediately undo the previous move. */
  reversals: number;
  /** Swipes/keys/taps that had no legal move. */
  invalidInputs: number;
  solved: boolean;
  skipped: boolean;
  durationMs: number;
  completed: boolean;
};

/** Object slicing — sustained attention and psychomotor agitation. Timed. */
export type SlicingStats = {
  targetsSpawned: number;
  targetsSliced: number;
  targetsMissed: number;
  hazardsSpawned: number;
  hazardsSliced: number;
  swipes: number;
  /** Swipes that cut nothing at all. */
  emptySwipes: number;
  medianReactionMs: number;
  reactionCv: number;
  /** Mean of (path length ÷ straight-line distance) per swipe; 1 = perfectly straight. */
  meanJitter: number;
  /** Fraction of targets sliced in each 15s third of the round. */
  accuracyByThird: [number, number, number];
  pointerType: string;
  durationMs: number;
  completed: boolean;
};

/** Infinite runner — impulsivity and swipe variance under rising speed. Timed. */
export type RunnerStats = {
  swipes: number;
  /** Fewest lane changes that would have dodged every row. */
  necessarySwipes: number;
  excessSwipes: number;
  /** Left-then-right (or reverse) inside 250ms. */
  rapidReversals: number;
  /** Lane changes made while nothing threatened the current lane. */
  unthreatenedDodges: number;
  rowsPassed: number;
  collisions: number;
  /**
   * Descriptive only. Gaps between swipes are largely set by when obstacles
   * arrive, so this mostly measures the spawner — reactionCv is the
   * player-driven variance signal the index uses.
   */
  swipeIntervalCv: number;
  medianReactionMs: number;
  /** CV of the time from "row threatens your lane" to the dodge. */
  reactionCv: number;
  /** Collisions per row in the slow first half vs the fast second half. */
  earlyCollisionRate: number;
  lateCollisionRate: number;
  earlyReactionMs: number;
  lateReactionMs: number;
  distance: number;
  durationMs: number;
  completed: boolean;
};

export type MindQuestSession = {
  startedAt: number;
  /** Set when the last game finishes; null while a run is in progress. */
  finishedAt: number | null;
  flashRecall: FlashRecallStats;
  puzzle: PuzzleStats;
  slicing: SlicingStats;
  runner: RunnerStats;
};

// v2: the quest was rebuilt around the puzzle / slicing / runner categories.
// A new key means a stored v1 run can never be merged into the new shape.
const SESSION_KEY = "mindquest-session-v2";

const defaultSession = (): MindQuestSession => ({
  startedAt: Date.now(),
  finishedAt: null,
  flashRecall: {
    roundsCompleted: 0,
    focusHits: 0,
    focusMisses: 0,
    completed: false,
  },
  puzzle: {
    moves: 0,
    optimalMoves: 0,
    firstMoveMs: 0,
    medianDecisionMs: 0,
    reversals: 0,
    invalidInputs: 0,
    solved: false,
    skipped: false,
    durationMs: 0,
    completed: false,
  },
  slicing: {
    targetsSpawned: 0,
    targetsSliced: 0,
    targetsMissed: 0,
    hazardsSpawned: 0,
    hazardsSliced: 0,
    swipes: 0,
    emptySwipes: 0,
    medianReactionMs: 0,
    reactionCv: 0,
    meanJitter: 1,
    accuracyByThird: [0, 0, 0],
    pointerType: "",
    durationMs: 0,
    completed: false,
  },
  runner: {
    swipes: 0,
    necessarySwipes: 0,
    excessSwipes: 0,
    rapidReversals: 0,
    unthreatenedDodges: 0,
    rowsPassed: 0,
    collisions: 0,
    swipeIntervalCv: 0,
    medianReactionMs: 0,
    reactionCv: 0,
    earlyCollisionRate: 0,
    lateCollisionRate: 0,
    earlyReactionMs: 0,
    lateReactionMs: 0,
    distance: 0,
    durationMs: 0,
    completed: false,
  },
});

type SessionPatch = {
  startedAt?: number;
  finishedAt?: number | null;
  flashRecall?: Partial<FlashRecallStats>;
  puzzle?: Partial<PuzzleStats>;
  slicing?: Partial<SlicingStats>;
  runner?: Partial<RunnerStats>;
};

function merge(base: MindQuestSession, patch: SessionPatch): MindQuestSession {
  return {
    startedAt: patch.startedAt ?? base.startedAt,
    finishedAt: patch.finishedAt !== undefined ? patch.finishedAt : base.finishedAt,
    flashRecall: { ...base.flashRecall, ...(patch.flashRecall ?? {}) },
    puzzle: { ...base.puzzle, ...(patch.puzzle ?? {}) },
    slicing: { ...base.slicing, ...(patch.slicing ?? {}) },
    runner: { ...base.runner, ...(patch.runner ?? {}) },
  };
}

export function getMindQuestSession(): MindQuestSession {
  if (typeof window === "undefined") return defaultSession();

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return defaultSession();
    const parsed = JSON.parse(raw) as SessionPatch;
    return merge(defaultSession(), parsed && typeof parsed === "object" ? parsed : {});
  } catch {
    return defaultSession();
  }
}

export function startMindQuestSession() {
  const next = defaultSession();
  write(next);
  return next;
}

export function updateMindQuestSession(patch: SessionPatch) {
  const next = merge(getMindQuestSession(), patch);
  write(next);
  return next;
}

function write(session: MindQuestSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage full or blocked (private mode). The run still plays; the result
    // screen will route back to the start because nothing was recorded.
  }
}
