import { motion } from "motion/react";
import { Sparkles, Brain, Heart } from "lucide-react";
import { useNavigate } from "react-router";
import { QUEST_STEPS } from "../mindquest/quest";

// Untimed (baseline) games get cool dots, timed (pressure) games warm ones.
const DOT = ["bg-teal-300", "bg-blue-300", "bg-amber-300", "bg-rose-300"];

export function GameStartScreen() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/mindquest/breathing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#14B8A6] via-[#3B82F6] to-[#A78BFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Floating Background Elements */}
        <motion.div
          className="absolute top-20 left-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-16 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-32 left-20 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Logo/Icon */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255, 255, 255, 0.3)",
                    "0 0 40px rgba(255, 255, 255, 0.5)",
                    "0 0 20px rgba(255, 255, 255, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mb-4"
          >
            <h1 className="text-4xl font-bold text-white mb-2">MindQuest</h1>
            <p className="text-white/80 text-lg">
              Discover Your Mental Wellness
            </p>
          </motion.div>

          {/* Description Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/20"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">
                  A Journey Through {QUEST_STEPS.length} Game Levels
                </h3>
                <p className="text-white/70 text-sm">
                  Pure gameplay, no questionnaires. Two calm puzzles set your baseline, then two
                  fast games show how your focus holds up under pressure.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {QUEST_STEPS.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2 text-white/80 text-sm">
                  <div className={`w-2 h-2 mt-1.5 shrink-0 rounded-full ${DOT[i % DOT.length]}`} />
                  <span>
                    Level {i + 1}: {step.label}{" "}
                    <span className="text-white/60">
                      — {step.category !== step.label && `${step.category}, `}
                      {step.measures}
                      {step.timed ? " (timed)" : " (no timer)"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="w-full bg-white text-teal-600 rounded-full py-4 px-8 font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            Start Your Mind Journey
          </motion.button>

          {/* Info Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="text-center text-white/60 text-sm mt-4"
          >
            Takes ~7 minutes • Fresh puzzle and obstacle layout every run
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
