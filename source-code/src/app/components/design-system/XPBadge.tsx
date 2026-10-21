import { motion } from "motion/react";

interface XPBadgeProps {
  points: number;
  animated?: boolean;
  size?: "default" | "large";
}

export function XPBadge({ points, animated = false, size = "default" }: XPBadgeProps) {
  const sizeClasses = size === "large" 
    ? "px-4 py-2 text-base" 
    : "px-3 py-1.5 text-sm";

  return (
    <motion.div
      initial={animated ? { scale: 0, rotate: -180 } : false}
      animate={animated ? { scale: 1, rotate: 0 } : false}
      transition={{ type: "spring", duration: 0.6 }}
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] rounded-full shadow-md ${sizeClasses}`}
    >
      <span className="text-white">{size === "large" ? "⭐" : "⭐"}</span>
      <span className="text-white font-medium">+{points} XP</span>
    </motion.div>
  );
}