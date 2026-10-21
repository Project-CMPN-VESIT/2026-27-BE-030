// GENERATED FILE — do not edit by hand.
// Source: "PHQ-9 and GAD-7 Responses.xlsx" (244 responses, Jul 2026–Sep 2026).
// Regenerate with scripts/gen_norms.py if the dataset changes.
//
// These norms describe how this particular sample scored. They are a *reference
// group*, not a diagnostic threshold — the clinical PHQ-9 cutoffs in
// ManualAssessmentResultScreen are unchanged and remain the basis for severity.
//
// GAD-7 norms are deliberately absent. In the source spreadsheet the column for
// GAD item 1 ("Feeling nervous, anxious, or on edge") holds a duplicate of the
// PHQ difficulty answers, so every stored GAD total is a 6-item sum. Comparing
// the app's true 7-item GAD-7 against 6-item norms would understate the
// reference group and make every user look worse than it. Once the form is
// fixed and fresh responses are collected, GAD norms can be added here.

export type AgeNorm = {
  group: string;
  n: number;
  mean: number;
  median: number;
  atOrAbove10: number;
};

export const PHQ_NORM_META = {
  "sampleSize": 244,
  "collectedFrom": "Jul 2026",
  "collectedTo": "Sep 2026",
  "mean": 6.14,
  "median": 5.0,
  "sd": 5.23,
  "withAgeGroup": 243
} as const;

/**
 * percentileBelow[score] = percentage of the reference sample that scored
 * strictly below `score`. Index directly by a PHQ-9 total of 0–27.
 */
export const PHQ_PERCENTILE_BELOW: readonly number[] = [0.0, 13.5, 24.2, 33.2, 38.5, 46.3, 50.8, 58.2, 66.0, 70.1, 74.2, 79.1, 82.4, 86.9, 90.2, 91.8, 93.9, 95.5, 96.3, 98.0, 98.4, 98.8, 99.6, 100.0, 100.0, 100.0, 100.0, 100.0];

export const PHQ_AGE_NORMS: readonly AgeNorm[] = [
  {
    "group": "Under 30",
    "n": 73,
    "mean": 6.5,
    "median": 6,
    "atOrAbove10": 18
  },
  {
    "group": "30-44",
    "n": 73,
    "mean": 6.4,
    "median": 6,
    "atOrAbove10": 22
  },
  {
    "group": "45-60",
    "n": 73,
    "mean": 5.7,
    "median": 4,
    "atOrAbove10": 16
  },
  {
    "group": "60 and above",
    "n": 24,
    "mean": 5.3,
    "median": 4.0,
    "atOrAbove10": 6
  }
];

/** Percentage of the reference sample scoring below this PHQ-9 total. */
export function phqPercentileBelow(total: number): number {
  const i = Math.min(27, Math.max(0, Math.round(total)));
  return PHQ_PERCENTILE_BELOW[i];
}
