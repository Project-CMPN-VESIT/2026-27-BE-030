import type { ReactNode } from "react";
import { motion } from "motion/react";
import { QUEST_STEPS, stepIndex, type QuestStepId } from "../mindquest/quest";

/** Header used by the quest games, matching Flash Recall's existing styling. */
export function GameHeader({
  stepId,
  subtitle,
  purpose,
  progress,
  gradient,
}: {
  stepId: QuestStepId;
  subtitle: string;
  purpose?: string;
  /** 0–100 */
  progress: number;
  /** Tailwind gradient stops for the progress bar, e.g. "from-teal-500 to-blue-500". */
  gradient: string;
}) {
  const step = QUEST_STEPS[stepIndex(stepId)];
  return (
    <>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-neutral-500">
          Level {stepIndex(stepId) + 1} of {QUEST_STEPS.length} • {step.category}
        </p>
        <h2 className="text-2xl font-semibold text-neutral-800">{step.label}</h2>
        <p className="text-sm text-neutral-600 mt-2">{subtitle}</p>
        {purpose && <p className="text-sm text-neutral-700 mt-2 font-medium">{purpose}</p>}
      </motion.div>

      <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${gradient}`}
          // Without an initial width the block mounts at 100% and visibly
          // shrinks to 0, so every level briefly looked almost finished.
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </>
  );
}

export function StatTile({
  label,
  value,
  tone = "text-neutral-800",
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/** Full-cover overlay for the start screen, pause state, and level complete. */
export function GameOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/85 backdrop-blur-sm p-6 text-center">
      <div className="max-w-xs">{children}</div>
    </div>
  );
}
