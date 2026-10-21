import { motion } from "motion/react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  type: "silver" | "gold" | "platinum";
  unlocked: boolean;
}

export function AchievementBadge({
  title,
  description,
  icon,
  type,
  unlocked,
}: AchievementBadgeProps) {
  const colors = {
    silver: "from-[#E5E7EB] to-[#D1D5DB]",
    gold: "from-[#FCD34D] to-[#F59E0B]",
    platinum: "from-[#C4B5FD] to-[#A78BFA]",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-4 rounded-2xl bg-white shadow-md ${
        unlocked ? "" : "opacity-50 grayscale"
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[type]} flex items-center justify-center mb-3 mx-auto shadow-lg`}
      >
        <span className="text-3xl">{icon}</span>
      </div>
      <h4 className="text-center font-semibold text-[#1F2937] mb-1">
        {title}
      </h4>
      <p className="text-center text-sm text-[#6B7280]">{description}</p>
      {!unlocked && (
        <div className="mt-2 text-center">
          <span className="text-xs text-[#9CA3AF]">🔒 Locked</span>
        </div>
      )}
    </motion.div>
  );
}
