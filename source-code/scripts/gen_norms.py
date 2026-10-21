"""Generate src/app/data/assessmentNorms.ts from the response spreadsheet.

Only PHQ-9 norms are emitted. The sheet's GAD block lost item 1 (column 11 holds a
duplicate of the PHQ difficulty answers), so its GAD totals are 6-item sums and are
NOT comparable to the app's true 7-item GAD-7 score.
"""
import openpyxl, re, statistics as st, json, datetime
from collections import defaultdict

PATH = r'C:\Users\sidha\Downloads\PHQ-9 and GAD-7 Responses.xlsx'
OUT = r'C:\Users\sidha\OneDrive\Desktop\MindQuest\src\app\data\assessmentNorms.ts'

wb = openpyxl.load_workbook(PATH, data_only=True)
rows = [r for r in wb['Form Responses 1'].iter_rows(min_row=2, values_only=True)
        if r and any(c is not None for c in r)]

code = lambda c: int(re.match(r'^\s*(\d)', str(c)).group(1))
recs = []
for r in rows:
    recs.append({
        'phq': sum(code(r[i]) for i in range(1, 10)),
        'age': str(r[19]) if r[19] else None,
        'ts': r[0],
    })

n = len(recs)
totals = sorted(x['phq'] for x in recs)
stamps = [x['ts'] for x in recs if isinstance(x['ts'], datetime.datetime)]

# percentileBelow[s] = % of the sample that scored strictly below s
percentile_below = [round(100 * sum(1 for t in totals if t < s) / n, 1) for s in range(28)]

AGE_ORDER = ['Under 30', '30-44', '45-60', '60 and above']
by_age = defaultdict(list)
for x in recs:
    if x['age'] in AGE_ORDER:
        by_age[x['age']].append(x['phq'])

age_rows = []
for a in AGE_ORDER:
    v = by_age[a]
    age_rows.append({
        'group': a,
        'n': len(v),
        'mean': round(st.mean(v), 1),
        'median': st.median(v),
        'atOrAbove10': sum(1 for s in v if s >= 10),
    })

meta = {
    'sampleSize': n,
    'collectedFrom': min(stamps).strftime('%b %Y'),
    'collectedTo': max(stamps).strftime('%b %Y'),
    'mean': round(st.mean(totals), 2),
    'median': st.median(totals),
    'sd': round(st.pstdev(totals), 2),
    'withAgeGroup': sum(len(v) for v in by_age.values()),
}

ts = f'''// GENERATED FILE — do not edit by hand.
// Source: "PHQ-9 and GAD-7 Responses.xlsx" ({n} responses, {meta['collectedFrom']}–{meta['collectedTo']}).
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

export type AgeNorm = {{
  group: string;
  n: number;
  mean: number;
  median: number;
  atOrAbove10: number;
}};

export const PHQ_NORM_META = {json.dumps(meta, indent=2)} as const;

/**
 * percentileBelow[score] = percentage of the reference sample that scored
 * strictly below `score`. Index directly by a PHQ-9 total of 0–27.
 */
export const PHQ_PERCENTILE_BELOW: readonly number[] = {json.dumps(percentile_below)};

export const PHQ_AGE_NORMS: readonly AgeNorm[] = {json.dumps(age_rows, indent=2)};

/** Percentage of the reference sample scoring below this PHQ-9 total. */
export function phqPercentileBelow(total: number): number {{
  const i = Math.min(27, Math.max(0, Math.round(total)));
  return PHQ_PERCENTILE_BELOW[i];
}}
'''

import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(ts)

print('wrote', OUT)
print('n =', n, '| meta =', meta)
print('sample percentiles: score 5 ->', percentile_below[5], '| 10 ->', percentile_below[10],
      '| 13 ->', percentile_below[13], '| 16 ->', percentile_below[16], '| 20 ->', percentile_below[20])
for a in age_rows: print(' ', a)
