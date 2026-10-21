

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Heart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
} from "lucide-react";

type BreathPhase = "inhale" | "hold" | "exhale" | "holdOut" | "idle";

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  emoji: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdOut: number;
  cycles: number;
  color: string;
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: "box",
    name: "Box Breathing",
    description: "Equal timing for calm focus. Used by Navy SEALs.",
    emoji: "📦",
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdOut: 4,
    cycles: 4,
    color: "from-[#14B8A6] to-[#0F766E]",
  },
  {
    id: "relaxing",
    name: "4-7-8 Relaxing Breath",
    description: "Dr. Weil's technique to reduce anxiety and fall asleep.",
    emoji: "🌙",
    inhale: 4,
    hold: 7,
    exhale: 8,
    holdOut: 0,
    cycles: 4,
    color: "from-[#6366F1] to-[#4F46E5]",
  },
  {
    id: "energizing",
    name: "Energizing Breath",
    description: "Quick breaths to boost alertness and energy.",
    emoji: "⚡",
    inhale: 2,
    hold: 0,
    exhale: 2,
    holdOut: 0,
    cycles: 8,
    color: "from-[#F59E0B] to-[#D97706]",
  },
  {
    id: "calming",
    name: "Deep Calm Breath",
    description: "Long exhale activates your parasympathetic system.",
    emoji: "🧘",
    inhale: 4,
    hold: 2,
    exhale: 6,
    holdOut: 0,
    cycles: 6,
    color: "from-[#8B5CF6] to-[#7C3AED]",
  },
];

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: "Breathe In",
  hold: "Hold",
  exhale: "Breathe Out",
  holdOut: "Hold",
  idle: "Ready",
};

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "#5EEAD4",
  hold: "#93C5FD",
  exhale: "#C4B5FD",
  holdOut: "#FDE68A",
  idle: "#E5E7EB",
};

export function BreathingExerciseScreen() {
  const navigate = useNavigate();
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(
    BREATHING_PATTERNS[0]
  );
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const phaseDuration = useCallback(
    (p: BreathPhase): number => {
      switch (p) {
        case "inhale":
          return selectedPattern.inhale;
        case "hold":
          return selectedPattern.hold;
        case "exhale":
          return selectedPattern.exhale;
        case "holdOut":
          return selectedPattern.holdOut;
        default:
          return 0;
      }
    },
    [selectedPattern]
  );

  const nextPhase = useCallback(
    (current: BreathPhase, cycle: number): { phase: BreathPhase; cycle: number } => {
      const sequence: BreathPhase[] = ["inhale", "hold", "exhale", "holdOut"];
      const currentIndex = sequence.indexOf(current);

      for (let i = currentIndex + 1; i < sequence.length; i++) {
        if (phaseDuration(sequence[i]) > 0) {
          return { phase: sequence[i], cycle };
        }
      }

      const nextCycle = cycle + 1;
      if (nextCycle >= selectedPattern.cycles) {
        return { phase: "idle", cycle: nextCycle };
      }

      return { phase: "inhale", cycle: nextCycle };
    },
    [selectedPattern, phaseDuration]
  );

  useEffect(() => {
    if (!isRunning || isComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTotalSecondsElapsed((prev) => prev + 1);

      setPhaseTimeLeft((prev) => {
        if (prev <= 1) {
          const result = nextPhase(phase, currentCycle);

          if (result.phase === "idle") {
            setIsRunning(false);
            setIsComplete(true);
            setPhase("idle");
            return 0;
          }

          setPhase(result.phase);
          setCurrentCycle(result.cycle);
          return phaseDuration(result.phase);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isComplete, phase, currentCycle, nextPhase, phaseDuration]);

  const startExercise = () => {
    setPhase("inhale");
    setPhaseTimeLeft(selectedPattern.inhale);
    setCurrentCycle(0);
    setTotalSecondsElapsed(0);
    setIsComplete(false);
    setIsRunning(true);
  };

  const togglePause = () => {
    setIsRunning((prev) => !prev);
  };

  const resetExercise = () => {
    setIsRunning(false);
    setPhase("idle");
    setPhaseTimeLeft(0);
    setCurrentCycle(0);
    setTotalSecondsElapsed(0);
    setIsComplete(false);
  };

  const circleScale =
    phase === "inhale"
      ? 1.4
      : phase === "exhale"
        ? 0.8
        : phase === "hold" || phase === "holdOut"
          ? 1.2
          : 1;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalCycleDuration =
    selectedPattern.inhale +
    selectedPattern.hold +
    selectedPattern.exhale +
    selectedPattern.holdOut;
  const totalExerciseDuration = totalCycleDuration * selectedPattern.cycles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-4 relative overflow-hidden">
      {/* Ambient Background Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            background: PHASE_COLORS[phase] || "#5EEAD4",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate("/")}
            className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-[#5EEAD4]" />
            <span className="text-white/80 text-sm font-medium">
              Breathing Exercise
            </span>
          </div>
        </motion.div>

        {/* Pattern Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowPatternPicker(!showPatternPicker)}
            disabled={isRunning}
            className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedPattern.emoji}</span>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {selectedPattern.name}
                </h3>
                <p className="text-white/60 text-xs mt-0.5">
                  {selectedPattern.inhale}s in · {selectedPattern.hold > 0 && `${selectedPattern.hold}s hold · `}
                  {selectedPattern.exhale}s out
                  {selectedPattern.holdOut > 0 && ` · ${selectedPattern.holdOut}s hold`}
                  · {selectedPattern.cycles} cycles
                </p>
              </div>
            </div>
            {showPatternPicker ? (
              <ChevronUp className="w-5 h-5 text-white/50" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/50" />
            )}
          </button>

          <AnimatePresence>
            {showPatternPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {BREATHING_PATTERNS.map((pattern) => (
                    <motion.button
                      key={pattern.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedPattern(pattern);
                        setShowPatternPicker(false);
                        resetExercise();
                      }}
                      className={`w-full text-left rounded-xl p-3 border transition-all ${selectedPattern.id === pattern.id
                          ? "bg-white/15 border-white/30"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{pattern.emoji}</span>
                        <div>
                          <h4 className="text-white text-sm font-medium">
                            {pattern.name}
                          </h4>
                          <p className="text-white/50 text-xs">
                            {pattern.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Breathing Animation Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Glow Ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                scale: circleScale * 1.15,
                opacity: phase === "idle" ? 0.1 : 0.15,
              }}
              transition={{
                duration:
                  phase === "inhale"
                    ? selectedPattern.inhale
                    : phase === "exhale"
                      ? selectedPattern.exhale
                      : 0.5,
                ease: "easeInOut",
              }}
              style={{
                background: `radial-gradient(circle, ${PHASE_COLORS[phase]}30, transparent 70%)`,
              }}
            />

            {/* Middle Ring */}
            <motion.div
              className="absolute w-52 h-52 rounded-full border-2"
              animate={{
                scale: circleScale * 1.05,
                borderColor: `${PHASE_COLORS[phase]}40`,
              }}
              transition={{
                duration:
                  phase === "inhale"
                    ? selectedPattern.inhale
                    : phase === "exhale"
                      ? selectedPattern.exhale
                      : 0.5,
                ease: "easeInOut",
              }}
            />

            {/* Main Breathing Circle */}
            <motion.div
              className="w-44 h-44 rounded-full flex flex-col items-center justify-center"
              animate={{
                scale: circleScale,
                boxShadow: `0 0 ${phase === "idle" ? 20 : 60}px ${PHASE_COLORS[phase]}50`,
              }}
              transition={{
                duration:
                  phase === "inhale"
                    ? selectedPattern.inhale
                    : phase === "exhale"
                      ? selectedPattern.exhale
                      : 0.5,
                ease: "easeInOut",
              }}
              style={{
                background: `linear-gradient(135deg, ${PHASE_COLORS[phase]}25, ${PHASE_COLORS[phase]}10)`,
                border: `2px solid ${PHASE_COLORS[phase]}40`,
              }}
            >
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-bold text-xl"
              >
                {PHASE_LABELS[phase]}
              </motion.p>
              {phase !== "idle" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/70 text-4xl font-light mt-1"
                >
                  {phaseTimeLeft}
                </motion.p>
              )}
              {phase === "idle" && !isComplete && (
                <Wind className="w-8 h-8 text-white/40 mt-2" />
              )}
              {isComplete && (
                <Sparkles className="w-8 h-8 text-[#FCD34D] mt-2" />
              )}
            </motion.div>

            {/* Cycle Progress Dots */}
            <div className="absolute -bottom-2 flex gap-2">
              {Array.from({ length: selectedPattern.cycles }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  animate={{
                    backgroundColor:
                      i < currentCycle
                        ? "#5EEAD4"
                        : i === currentCycle && isRunning
                          ? PHASE_COLORS[phase]
                          : "rgba(255,255,255,0.2)",
                    scale: i === currentCycle && isRunning ? 1.3 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          {phase === "idle" && !isComplete ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startExercise}
              className={`bg-gradient-to-r ${selectedPattern.color} text-white rounded-full py-4 px-10 font-semibold text-lg shadow-lg flex items-center gap-3`}
            >
              <Play className="w-5 h-5" fill="white" />
              Start Breathing
            </motion.button>
          ) : isComplete ? (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startExercise}
                className="bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white rounded-full py-3 px-6 font-semibold flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="bg-white/10 border border-white/20 text-white rounded-full py-3 px-6 font-semibold flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Dashboard
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePause}
                className="bg-white/15 border border-white/20 text-white rounded-full py-3 px-6 font-semibold flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" fill="white" />
                    Resume
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetExercise}
                className="bg-white/10 border border-white/15 text-white/70 rounded-full py-3 px-5 font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
            <Timer className="w-4 h-4 text-[#5EEAD4] mx-auto mb-1" />
            <p className="text-white/50 text-xs">Elapsed</p>
            <p className="text-white font-semibold">
              {formatTime(totalSecondsElapsed)}
            </p>
          </div>
          <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
            <Wind className="w-4 h-4 text-[#93C5FD] mx-auto mb-1" />
            <p className="text-white/50 text-xs">Cycle</p>
            <p className="text-white font-semibold">
              {Math.min(currentCycle + 1, selectedPattern.cycles)}/
              {selectedPattern.cycles}
            </p>
          </div>
          <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
            <Sparkles className="w-4 h-4 text-[#FCD34D] mx-auto mb-1" />
            <p className="text-white/50 text-xs">Duration</p>
            <p className="text-white font-semibold">
              {formatTime(totalExerciseDuration)}
            </p>
          </div>
        </motion.div>

        {/* Completion Card */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-[#14B8A6]/20 to-[#6366F1]/20 backdrop-blur-md border border-white/15 rounded-3xl p-6 mb-6 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-4xl mb-3"
              >
                🎉
              </motion.div>
              <h3 className="text-white font-bold text-lg mb-1">
                Exercise Complete!
              </h3>
              <p className="text-white/70 text-sm">
                You completed {selectedPattern.cycles} cycles of{" "}
                {selectedPattern.name}. Well done — your mind and body thank
                you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guided Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="w-full bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm">
                  Guided Breathing Video
                </h3>
                <p className="text-white/50 text-xs">
                  Watch a calming guided breathing session
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-white/40" />
              {showVideo ? (
                <ChevronUp className="w-5 h-5 text-white/50" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/50" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showVideo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/tEmt1Znux58?rel=0&modestbranding=1"
                      title="Guided Breathing Exercise"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
                <p className="text-white/40 text-xs text-center mt-2">
                  5 Minute Breathing Exercise — Inhale & Exhale
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Breathing Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-3xl overflow-hidden border border-white/10 mb-6 shadow-2xl"
        >
          <img
            src="/breathing-hero.png"
            alt="Person meditating and practicing breathing exercises in nature"
            className="w-full h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/6 backdrop-blur-sm border border-white/10 rounded-3xl p-5 mb-6"
        >
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#EF4444]" />
            Breathing Tips
          </h3>
          <ul className="space-y-2">
            {[
              "Breathe through your nose for better air filtration",
              "Place one hand on your chest, one on your belly",
              "Let your belly rise naturally on each inhale",
              "Practice in a quiet, comfortable space",
              "Regular practice improves stress resilience",
            ].map((tip, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08 }}
                className="flex items-start gap-2 text-white/70 text-sm"
              >
                <span className="text-[#5EEAD4] mt-0.5 flex-shrink-0">•</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/40 text-xs text-center pb-6"
        >
          Breathing exercises are a tool for relaxation, not a replacement for
          professional medical advice.
        </motion.p>
      </div>
    </div>
  );
}
