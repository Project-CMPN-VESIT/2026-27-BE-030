import { motion } from "motion/react";

interface RiskCardProps {
  level: "low" | "moderate" | "high";
  title: string;
  description: string;
}

export function RiskCard({ level, title, description }: RiskCardProps) {
  const config = {
    low: {
      bg: "bg-[#D1FAE5]",
      icon: "✓",
      iconBg: "bg-[#10B981]",
      border: "border-[#10B981]",
      text: "text-[#065F46]",
    },
    moderate: {
      bg: "bg-[#FEF3C7]",
      icon: "⚠",
      iconBg: "bg-[#F59E0B]",
      border: "border-[#F59E0B]",
      text: "text-[#92400E]",
    },
    high: {
      bg: "bg-[#FEE2E2]",
      icon: "!",
      iconBg: "bg-[#EF4444]",
      border: "border-[#EF4444]",
      text: "text-[#991B1B]",
    },
  };

  const style = config[level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-3xl ${style.bg} border-2 ${style.border} shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-white text-xl font-bold">{style.icon}</span>
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-semibold mb-2 ${style.text}`}>
            {title}
          </h3>
          <p className={`${style.text} opacity-90`}>{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
