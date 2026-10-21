import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Wind, Sparkles, SkipForward, Volume2, VolumeX } from "lucide-react";
import { startMindQuestSession } from "../mindquest/session";

type BreathPhase = "inhale" | "hold" | "exhale" | "idle" | "countdown";

const INHALE_SECS = 4;
const HOLD_SECS = 4;
const EXHALE_SECS = 4;
const TOTAL_CYCLES = 3;
const COUNTDOWN_FROM = 3;

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: "Breathe In",
  hold: "Hold",
  exhale: "Breathe Out",
  idle: "Get Ready",
  countdown: "",
};

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "#5EEAD4",
  hold: "#93C5FD",
  exhale: "#C4B5FD",
  idle: "#94A3B8",
  countdown: "#FCD34D",
};

const PHASE_IMAGES: Record<string, string> = {
  inhale: "/breathing-inhale.png",
  hold: "/breathing-hold.png",
  exhale: "/breathing-exhale.png",
};

/** Speak a phrase using the Web Speech API */
function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 0.95;
  utterance.volume = 0.8;

  // Prefer a calm, female English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("google") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira"))
  );
  if (preferred) utterance.voice = preferred;
  else {
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function PreGameBreathingScreen() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_FROM);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<BreathPhase>("idle");

  // Ensure voices are loaded
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  // Leaving mid-session (nav menu, back button, refresh) used to leave the
  // narrator talking over whatever screen came next.
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    []
  );

  // Auto-start the countdown after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("countdown");
      setStarted(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Countdown before breathing starts
  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdownValue <= 0) {
      setPhase("inhale");
      setPhaseTimeLeft(INHALE_SECS);
      return;
    }

    if (voiceEnabled && countdownValue === COUNTDOWN_FROM) {
      speak("Get ready. Let's begin.", 0.9);
    }

    const timer = setTimeout(() => {
      setCountdownValue((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdownValue, voiceEnabled]);

  // Voice guidance on phase changes
  useEffect(() => {
    if (!voiceEnabled) return;
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    switch (phase) {
      case "inhale":
        speak("Breathe in", 0.8);
        break;
      case "hold":
        speak("Hold", 0.8);
        break;
      case "exhale":
        speak("Breathe out", 0.75);
        break;
    }
  }, [phase, voiceEnabled]);

  const phaseDuration = useCallback((p: BreathPhase): number => {
    switch (p) {
      case "inhale":
        return INHALE_SECS;
      case "hold":
        return HOLD_SECS;
      case "exhale":
        return EXHALE_SECS;
      default:
        return 0;
    }
  }, []);

  const getNextPhase = useCallback(
    (current: BreathPhase, cycle: number): { phase: BreathPhase; cycle: number } => {
      if (current === "inhale") return { phase: "hold", cycle };
      if (current === "hold") return { phase: "exhale", cycle };

      const nextCycle = cycle + 1;
      if (nextCycle >= TOTAL_CYCLES) {
        return { phase: "idle", cycle: nextCycle };
      }
      return { phase: "inhale", cycle: nextCycle };
    },
    []
  );

  // Main breathing timer
  useEffect(() => {
    if (phase === "idle" || phase === "countdown" || completed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setPhaseTimeLeft((prev) => {
        if (prev <= 1) {
          const result = getNextPhase(phase, currentCycle);

          if (result.phase === "idle") {
            setCompleted(true);
            setPhase("idle");
            if (voiceEnabled) {
              setTimeout(() => speak("Well done. You're ready.", 0.85), 300);
            }
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
  }, [phase, currentCycle, completed, getNextPhase, phaseDuration, voiceEnabled]);

  // Auto-navigate to Level 1 after completion
  useEffect(() => {
    if (!completed) return;

    const timer = setTimeout(() => {
      window.speechSynthesis?.cancel();
      startMindQuestSession();
      navigate("/mindquest/level1");
    }, 2800);

    return () => clearTimeout(timer);
  }, [completed, navigate]);

  const handleSkip = () => {
    window.speechSynthesis?.cancel();
    startMindQuestSession();
    navigate("/mindquest/level1");
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
    }
    setVoiceEnabled((prev) => !prev);
  };

  // Animation values
  const circleScale =
    phase === "inhale"
      ? 1.5
      : phase === "exhale"
      ? 0.7
      : phase === "hold"
      ? 1.3
      : 1;

  const characterScale =
    phase === "inhale"
      ? 1.08
      : phase === "exhale"
      ? 0.94
      : phase === "hold"
      ? 1.04
      : 1;

  const activeColor = PHASE_COLORS[phase];
  const isBreathing = phase === "inhale" || phase === "hold" || phase === "exhale";
  const currentImage = isBreathing ? PHASE_IMAGES[phase] : PHASE_IMAGES["exhale"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Particles */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 6,
            height: 3 + Math.random() * 6,
            background: activeColor,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.12,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.04, 0.18, 0.04],
            scale: [1, 1.8, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wind className="w-5 h-5 text-[#5EEAD4]" />
          <span className="text-white/60 text-sm font-medium uppercase tracking-wider">
            Pre-Game Warm-Up
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Center Your Mind
        </h1>
        <p className="text-white/50 text-sm max-w-sm">
          Follow along and breathe with the guide.
        </p>
      </motion.div>

      {/* Main Content Area: Character + Breathing Circle */}
      <div className="relative flex flex-col items-center my-2">
        {/* Animated Character */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative w-64 h-64 mb-[-20px] z-10"
        >
          {/* Character Image with Breathing Animation */}
          <AnimatePresence mode="wait">
            {(isBreathing || completed) && (
              <motion.div
                key={phase}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <motion.img
                  src={currentImage}
                  alt={`Person ${phase === "inhale" ? "breathing in" : phase === "exhale" ? "breathing out" : "holding breath"}`}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  animate={{
                    scale: characterScale,
                    y: phase === "inhale" ? -8 : phase === "exhale" ? 6 : 0,
                  }}
                  transition={{
                    duration:
                      phase === "inhale"
                        ? INHALE_SECS
                        : phase === "exhale"
                        ? EXHALE_SECS
                        : 0.6,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Countdown / Idle Overlay */}
          {!isBreathing && !completed && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {phase === "countdown" ? (
                <motion.div
                  key={countdownValue}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="flex flex-col items-center"
                >
                  <motion.span
                    className="text-8xl font-extralight text-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8 }}
                  >
                    {countdownValue > 0 ? countdownValue : "Go"}
                  </motion.span>
                  <span className="text-white/40 text-sm mt-2">
                    {countdownValue > 0 ? "Get ready..." : ""}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex flex-col items-center"
                >
                  <img
                    src="/breathing-exhale.png"
                    alt="Meditation guide"
                    className="w-48 h-48 object-contain opacity-30"
                  />
                  <span className="text-white/40 text-sm mt-2">
                    Preparing...
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Completion Overlay */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div
                className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
              >
                <Sparkles className="w-10 h-10 text-[#FCD34D] mb-2" />
                <p className="text-white font-bold text-lg">You're Ready!</p>
                <p className="text-white/50 text-xs mt-1">
                  Launching Level 1...
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Glow behind character based on phase */}
          <motion.div
            className="absolute inset-0 rounded-full -z-10"
            animate={{
              scale: circleScale * 0.9,
              opacity: isBreathing ? 0.25 : 0.05,
            }}
            transition={{
              duration:
                phase === "inhale"
                  ? INHALE_SECS
                  : phase === "exhale"
                  ? EXHALE_SECS
                  : 0.6,
              ease: "easeInOut",
            }}
            style={{
              background: `radial-gradient(circle, ${activeColor}40, transparent 65%)`,
            }}
          />
        </motion.div>

        {/* Breathing Phase Label & Timer */}
        {isBreathing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center z-10 mt-2"
          >
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold"
              style={{ color: activeColor }}
            >
              {PHASE_LABELS[phase]}
            </motion.p>
            <motion.p
              className="text-white/50 text-5xl font-extralight mt-1"
              key={`timer-${phaseTimeLeft}`}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {phaseTimeLeft}
            </motion.p>
          </motion.div>
        )}

        {/* Mini Breathing Ring */}
        {isBreathing && (
          <motion.div
            className="absolute top-6 right-[-40px] w-16 h-16 rounded-full border-2 flex items-center justify-center"
            animate={{
              scale: circleScale * 0.7,
              borderColor: `${activeColor}50`,
              boxShadow: `0 0 20px ${activeColor}30`,
            }}
            transition={{
              duration:
                phase === "inhale"
                  ? INHALE_SECS
                  : phase === "exhale"
                  ? EXHALE_SECS
                  : 0.6,
              ease: "easeInOut",
            }}
            style={{
              background: `${activeColor}10`,
            }}
          >
            <Wind className="w-5 h-5" style={{ color: activeColor }} />
          </motion.div>
        )}

        {/* Cycle Progress Dots */}
        <div className="flex gap-3 mt-4">
          {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              animate={{
                backgroundColor:
                  i < currentCycle
                    ? "#5EEAD4"
                    : i === currentCycle && started && !completed
                    ? activeColor
                    : "rgba(255,255,255,0.15)",
                scale: i === currentCycle && started && !completed ? 1.4 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Info & Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-3 mt-4 relative z-10"
      >
        <p className="text-white/40 text-sm text-center">
          {!completed
            ? `${TOTAL_CYCLES} cycles of box breathing · ${TOTAL_CYCLES * (INHALE_SECS + HOLD_SECS + EXHALE_SECS)}s total`
            : "Great job! Starting Level 1..."}
        </p>

        <div className="flex items-center gap-4">
          {/* Voice Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              voiceEnabled
                ? "text-[#5EEAD4] border-[#5EEAD4]/30 bg-[#5EEAD4]/10"
                : "text-white/30 border-white/10 bg-white/5"
            }`}
          >
            {voiceEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </motion.button>

          {/* Skip Button */}
          {!completed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={handleSkip}
              className="text-white/30 hover:text-white/60 text-sm flex items-center gap-1.5 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Skip to game
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
