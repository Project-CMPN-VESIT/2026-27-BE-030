import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { MoodButton } from "../components/design-system/MoodButton";
import { StreakCounter } from "../components/design-system/StreakCounter";
import { XPBadge } from "../components/design-system/XPBadge";
import { PrimaryButton } from "../components/design-system/PrimaryButton";
import { Slider } from "../components/ui/slider";

const moods = [
  { emoji: "😊", label: "Great", value: 5 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Low", value: 2 },
  { emoji: "😢", label: "Very Low", value: 1 },
];

export function MoodCheckInScreen() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState([50]);
  const [showXP, setShowXP] = useState(false);

  const handleContinue = () => {
    setShowXP(true);
    setTimeout(() => {
      navigate("/ai-chat");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB] p-4">
      <div className="max-w-md mx-auto pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-[#1F2937]">
              Daily Check-In
            </h1>
            <StreakCounter days={7} />
          </div>
          <p className="text-[#6B7280]">How are you feeling today?</p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6B7280]">Progress</span>
            <span className="text-sm font-medium text-[#14B8A6]">Step 1 of 3</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "33%" }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#14B8A6] to-[#3B82F6]"
            />
          </div>
        </motion.div>

        {/* Mood Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-6"
        >
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">
            Select Your Mood
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {moods.map((mood) => (
              <MoodButton
                key={mood.value}
                emoji={mood.emoji}
                label={mood.label}
                selected={selectedMood === mood.value}
                onClick={() => setSelectedMood(mood.value)}
              />
            ))}
          </div>
        </motion.div>

        {/* Stress Level Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1F2937]">
              Stress Level
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#F3F4F6] rounded-full">
              <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
              <span className="text-sm font-medium text-[#1F2937]">
                {stressLevel[0]}%
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Slider
              value={stressLevel}
              onValueChange={setStressLevel}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-[#6B7280]">
              <span>😌 Low</span>
              <span>😰 High</span>
            </div>
          </div>
        </motion.div>

        {/* Gamification Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] rounded-3xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Complete Your Check-In
              </h3>
              <p className="text-white/80 text-sm">
                Earn +10 XP and maintain your streak!
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <PrimaryButton
            onClick={handleContinue}
            disabled={selectedMood === null}
            size="lg"
            fullWidth
          >
            <span className="flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-5 h-5" />
            </span>
          </PrimaryButton>

          {/* XP Badge Animation */}
          {showXP && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2"
            >
              <XPBadge points={10} animated />
            </motion.div>
          )}
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-[#6B7280] mt-4"
        >
          Your responses help us provide better support
        </motion.p>
      </div>
    </div>
  );
}
