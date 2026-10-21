import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Brain, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { updateMindQuestSession } from "../mindquest/session";
import { QUEST_STEPS, nextStepLabel, nextStepPath } from "../mindquest/quest";

const SYMBOLS = ["🌙", "⭐", "🌿", "💧", "🔥", "⚡", "🍀", "🧠"];

const randomSequence = (length: number) => {
  const pool = [...SYMBOLS].sort(() => Math.random() - 0.5);
  return pool.slice(0, length);
};

export function Level1CalmMode() {
  const navigate = useNavigate();
  const roundGoal = 3;

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<string[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState<"show" | "input" | "complete">("show");
  const [focusHits, setFocusHits] = useState(0);
  const [focusMisses, setFocusMisses] = useState(0);
  const [notice, setNotice] = useState("");
  const [roundJustCleared, setRoundJustCleared] = useState(false);
  const revealTimeoutsRef = useRef<number[]>([]);
  const playTokenRef = useRef(0);
  // Kept out of revealTimeoutsRef: playSequence() clears that array, so parking
  // the round-advance timer there let "Replay sequence" cancel the next round
  // and freeze the game with every button disabled.
  const roundTimerRef = useRef<number | null>(null);
  // Hit total at the start of the current round, so a replay after a miss
  // re-scores from that baseline instead of stacking hits for the same symbols.
  const roundStartHitsRef = useRef(0);

  const currentLength = useMemo(() => Math.min(2 + round, 6), [round]);
  const progress = (Math.min(round - 1, roundGoal) / roundGoal) * 100;

  const clearPlaybackTimers = useCallback(() => {
    revealTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    revealTimeoutsRef.current = [];
  }, []);

  const playSequence = useCallback(
    (activeSequence: string[]) => {
      clearPlaybackTimers();
      playTokenRef.current += 1;
      const token = playTokenRef.current;

      setPhase("show");
      setRevealIndex(-1);
      setInputIndex(0);

      activeSequence.forEach((_, index) => {
        const revealTimeoutId = window.setTimeout(() => {
          if (token !== playTokenRef.current) return;
          setRevealIndex(index);
        }, 650 * (index + 1));
        revealTimeoutsRef.current.push(revealTimeoutId);
      });

      const finishTimeoutId = window.setTimeout(() => {
        if (token !== playTokenRef.current) return;
        setRevealIndex(-1);
        setPhase("input");
      }, 650 * activeSequence.length + 420);
      revealTimeoutsRef.current.push(finishTimeoutId);
    },
    [clearPlaybackTimers]
  );

  useEffect(() => {
    const nextSequence = randomSequence(currentLength);
    setSequence(nextSequence);
    setNotice("");
    setFocusHits((current) => {
      roundStartHitsRef.current = current;
      return current;
    });
    playSequence(nextSequence);
  }, [round, currentLength, playSequence]);

  useEffect(
    () => () => {
      clearPlaybackTimers();
      if (roundTimerRef.current !== null) {
        window.clearTimeout(roundTimerRef.current);
        roundTimerRef.current = null;
      }
    },
    [clearPlaybackTimers]
  );

  useEffect(() => {
    if (phase !== "complete") return;

    updateMindQuestSession({
      flashRecall: {
        roundsCompleted: roundGoal,
        focusHits,
        focusMisses,
        completed: true,
      },
    });

    const timer = setTimeout(() => {
      navigate(nextStepPath("flashRecall"));
    }, 1800);

    return () => clearTimeout(timer);
  }, [phase, focusHits, focusMisses, navigate]);

  const handleSymbolClick = (value: string) => {
    if (phase !== "input") return;

    const expected = sequence[inputIndex];
    if (value === expected) {
      setNotice("");
      const nextHits = focusHits + 1;
      const nextIndex = inputIndex + 1;
      setFocusHits(nextHits);
      setInputIndex(nextIndex);

      if (nextIndex >= sequence.length) {
        if (round >= roundGoal) {
          setPhase("complete");
          return;
        }
        setRoundJustCleared(true);
        setNotice(`Round ${round} complete. Loading next round...`);
        roundTimerRef.current = window.setTimeout(() => {
          roundTimerRef.current = null;
          setRound((prev) => prev + 1);
          setRoundJustCleared(false);
          setNotice("");
        }, 450);
      }
      return;
    }

    setFocusMisses((prev) => prev + 1);
    // The replay restarts the round from step 1, so roll hits back to where the
    // round began. Otherwise repeated misses inflate the hit count without limit.
    setFocusHits(roundStartHitsRef.current);
    setNotice("Missed. Replaying sequence...");
    playSequence(sequence);
  };

  const titleText =
    phase === "show"
      ? "Watch the sequence"
      : phase === "input"
      ? "Repeat the sequence"
      : phase === "complete"
      ? "Level complete"
      : "Get ready";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100 p-6">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-neutral-500">Level 1 of {QUEST_STEPS.length} • Puzzle (working memory)</p>
          <h2 className="text-2xl font-semibold text-neutral-800">Flash Recall</h2>
          <p className="text-sm text-neutral-600 mt-2">
            No breathing or Q&A. Just pure game focus.
          </p>
        </motion.div>

        <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs text-neutral-500">Round</p>
            <p className="text-lg font-semibold text-neutral-800">{round}/{roundGoal}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs text-neutral-500">Hits</p>
            <p className="text-lg font-semibold text-emerald-600">{focusHits}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs text-neutral-500">Misses</p>
            <p className="text-lg font-semibold text-rose-600">{focusMisses}</p>
          </div>
        </div>

        <motion.div
          className="mt-6 bg-white rounded-3xl p-6 shadow-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-teal-100 mx-auto mb-3 flex items-center justify-center">
            <Brain className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-800">{titleText}</h3>
          <p className="text-sm text-neutral-600 mt-1">
            {phase === "show" && "Memorize the symbols as they appear."}
            {phase === "input" && !roundJustCleared && `Step ${inputIndex + 1} of ${sequence.length}`}
            {phase === "input" && roundJustCleared && "Nice. Preparing a new sequence."}
            {phase === "complete" && `Great concentration. Next: ${nextStepLabel("flashRecall")}.`}
          </p>
          {notice && <p className="text-sm text-rose-600 mt-2">{notice}</p>}

          <div className="mt-6 h-24 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-5xl">
            {revealIndex >= 0 ? sequence[revealIndex] : phase === "input" ? "?" : "-"}
          </div>
        </motion.div>

        <div className="mt-3 text-center">
          <button
            onClick={() => playSequence(sequence)}
            disabled={phase === "complete" || roundJustCleared || sequence.length === 0}
            className="text-sm text-blue-700 underline disabled:text-neutral-400"
          >
            Replay sequence
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-6">
          {SYMBOLS.map((symbol) => (
            <motion.button
              key={symbol}
              onClick={() => handleSymbolClick(symbol)}
                disabled={phase !== "input" || roundJustCleared}
                whileHover={{ scale: phase === "input" && !roundJustCleared ? 1.04 : 1 }}
                whileTap={{ scale: phase === "input" && !roundJustCleared ? 0.96 : 1 }}
              className={`h-16 rounded-2xl text-2xl shadow-sm border ${
                  phase === "input" && !roundJustCleared
                  ? "bg-white border-neutral-200"
                  : "bg-neutral-100 border-neutral-100 text-neutral-400"
              }`}
            >
              {symbol}
            </motion.button>
          ))}
        </div>

        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-white border border-teal-200 rounded-2xl p-4 text-center"
          >
            <Sparkles className="w-6 h-6 text-teal-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-700">Level 1 cleared. Loading next game.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
