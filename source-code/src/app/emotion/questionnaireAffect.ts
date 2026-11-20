import type { AffectSummary } from "./affect";

// Kept for the current tab only, alongside the questionnaire result passed in router state.
const KEY = "mindquest-questionnaire-affect";

export function saveQuestionnaireAffect(summary: AffectSummary) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(summary));
  } catch {
    /* storage blocked: the report simply won't show the expression card */
  }
}

export function loadQuestionnaireAffect(): AffectSummary | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AffectSummary) : null;
  } catch {
    return null;
  }
}

export function clearQuestionnaireAffect() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
