import { STATES, STATE_LABEL, type AffectState, type AffectSummary } from "./affect";

const COLOR: Record<AffectState, string> = {
  stressed: "bg-rose-400",
  normal: "bg-slate-300",
  relaxed: "bg-emerald-400",
  surprised: "bg-amber-300",
};

/** Accuracy of the shipped ensemble on FER-2013's held-out test split, for the app's 4 states. */
export const MODEL_STATE_ACCURACY = "about 82%";

/** Stacked bars of how often each expression state was seen, one row per game or step. */
export function AffectBreakdown({ rows }: { rows: { label: string; summary: AffectSummary }[] }) {
  return (
    <div>
      <div className="space-y-3">
        {rows.map(({ label, summary }) => {
          const seen = summary.frames > 0 ? summary.faceFrames / summary.frames : 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-neutral-800">{label}</p>
                <p className="text-xs tabular-nums text-neutral-500">
                  {summary.faceFrames > 0 ? `face in view ${Math.round(seen * 100)}%` : "face not detected"}
                </p>
              </div>
              <div className="mt-1.5 h-3 rounded-full bg-neutral-100 overflow-hidden flex">
                {summary.faceFrames > 0 &&
                  STATES.map((s) => (
                    <div
                      key={s}
                      className={COLOR[s]}
                      style={{ width: `${summary.shares[s] * 100}%` }}
                      title={`${STATE_LABEL[s]} ${Math.round(summary.shares[s] * 100)}%`}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {STATES.map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className={`w-2.5 h-2.5 rounded-full ${COLOR[s]}`} />
            {STATE_LABEL[s]}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        An expression is not the same as a feeling. The on-device models identify these four expression
        states correctly {MODEL_STATE_ACCURACY} of the time on a public test set of face photos
        (FER-2013); accuracy on a webcam in your lighting may be lower. No video was stored.
      </p>
    </div>
  );
}
