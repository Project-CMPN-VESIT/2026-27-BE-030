import { Flame } from "lucide-react";

interface StreakCounterProps {
  days: number;
}

export function StreakCounter({ days }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F97316] to-[#F59E0B] rounded-full shadow-md">
      <Flame className="w-5 h-5 text-white" />
      <span className="text-white font-medium">{days} Day Streak! 🔥</span>
    </div>
  );
}
