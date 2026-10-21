import { motion } from "motion/react";

interface MoodButtonProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function MoodButton({ emoji, label, selected, onClick }: MoodButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
        selected
          ? "bg-[#14B8A6] shadow-lg shadow-[#14B8A6]/30"
          : "bg-white shadow-md hover:shadow-lg"
      }`}
    >
      <span className="text-4xl mb-2">{emoji}</span>
      <span
        className={`text-sm ${
          selected ? "text-white font-medium" : "text-[#4B5563]"
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}
