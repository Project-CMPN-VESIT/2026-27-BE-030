/**
 * The quest's game order, defined once.
 *
 * Untimed games come first so they measure a calm personal baseline before any
 * stress is induced; the timed games then escalate (slicing before the runner)
 * so peak pressure doesn't contaminate the attention-decay measurement.
 */
export type QuestStepId = "flashRecall" | "puzzle" | "slicing" | "runner";

export type QuestStep = {
  id: QuestStepId;
  path: string;
  label: string;
  category: "Puzzle" | "Object Slicing" | "Infinite Runner";
  measures: string;
  timed: boolean;
};

export const QUEST_STEPS: readonly QuestStep[] = [
  {
    id: "flashRecall",
    path: "/mindquest/level1",
    label: "Flash Recall",
    category: "Puzzle",
    measures: "working memory span",
    timed: false,
  },
  {
    id: "puzzle",
    path: "/mindquest/level2",
    label: "Sliding Puzzle",
    category: "Puzzle",
    measures: "processing speed and decision latency",
    timed: false,
  },
  {
    id: "slicing",
    path: "/mindquest/level3",
    label: "Object Slicing",
    category: "Object Slicing",
    measures: "sustained attention and motor control",
    timed: true,
  },
  {
    id: "runner",
    path: "/mindquest/level4",
    label: "Infinite Runner",
    category: "Infinite Runner",
    measures: "impulsivity and swipe variance under pressure",
    timed: true,
  },
];

export const RESULT_PATH = "/mindquest/result";

export function stepIndex(id: QuestStepId): number {
  return QUEST_STEPS.findIndex((s) => s.id === id);
}

/** Where to go after finishing `id`: the next game, or the result screen. */
export function nextStepPath(id: QuestStepId): string {
  const i = stepIndex(id);
  return i >= 0 && i < QUEST_STEPS.length - 1 ? QUEST_STEPS[i + 1].path : RESULT_PATH;
}

/** Human label for what comes after `id`, for "Next: …" copy. */
export function nextStepLabel(id: QuestStepId): string {
  const i = stepIndex(id);
  return i >= 0 && i < QUEST_STEPS.length - 1 ? QUEST_STEPS[i + 1].label : "your results";
}
