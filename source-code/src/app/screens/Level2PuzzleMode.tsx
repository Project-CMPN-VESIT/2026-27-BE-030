import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Puzzle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { GameHeader, StatTile } from "../components/GameHeader";
import { updateMindQuestSession } from "../mindquest/session";
import { nextStepLabel, nextStepPath } from "../mindquest/quest";
import { useSwipe } from "../mindquest/useSwipe";
import { intervals, median, type SwipeDirection } from "../mindquest/telemetry";

const SIZE = 3;
const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const SHUFFLE_DEPTH = 14;
const MIN_OPTIMAL = 8;
// Escape hatch: nobody should be trapped in a puzzle with the rest of the
// quest locked behind it.
const SKIP_AFTER_MOVES = 150;
const SKIP_AFTER_MS = 5 * 60 * 1000;

const isAdjacent = (a: number, b: number) =>
  Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) +
    Math.abs((a % SIZE) - (b % SIZE)) ===
  1;

const neighboursOf = (i: number) => {
  const out: number[] = [];
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  if (r > 0) out.push(i - SIZE);
  if (r < SIZE - 1) out.push(i + SIZE);
  if (c > 0) out.push(i - 1);
  if (c < SIZE - 1) out.push(i + 1);
  return out;
};

const isSolved = (board: readonly number[]) => board.every((v, i) => v === GOAL[i]);

/** Fewest moves to solve, by breadth-first search. Fine at 3×3 (≤181,440 states). */
function optimalMoves(start: readonly number[]): number {
  const goalKey = GOAL.join("");
  const startKey = start.join("");
  if (startKey === goalKey) return 0;
  const seen = new Set([startKey]);
  let frontier = [startKey];
  for (let depth = 1; frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const key of frontier) {
      const b = key.split("").map(Number);
      const blank = b.indexOf(0);
      for (const n of neighboursOf(blank)) {
        const c = [...b];
        [c[blank], c[n]] = [c[n], c[blank]];
        const k = c.join("");
        if (k === goalKey) return depth;
        if (!seen.has(k)) {
          seen.add(k);
          next.push(k);
        }
      }
    }
    frontier = next;
  }
  return -1;
}

/**
 * Shuffle by walking backwards from the solved board. Every state reached this
 * way is solvable — unlike a random permutation, half of which are not.
 */
function makePuzzle(): { board: number[]; optimal: number } {
  for (let attempt = 0; attempt < 30; attempt++) {
    const board = [...GOAL];
    let blank = board.indexOf(0);
    let lastTile = -1;
    for (let m = 0; m < SHUFFLE_DEPTH; m++) {
      // Never move the same tile twice in a row: that just undoes the shuffle.
      const options = neighboursOf(blank).filter((n) => board[n] !== lastTile);
      const pick = options[Math.floor(Math.random() * options.length)];
      lastTile = board[pick];
      [board[blank], board[pick]] = [board[pick], board[blank]];
      blank = pick;
    }
    const optimal = optimalMoves(board);
    if (optimal >= MIN_OPTIMAL) return { board, optimal };
  }
  // Practically unreachable; a fixed solvable fallback rather than a hang.
  const board = [4, 1, 3, 7, 2, 6, 0, 5, 8];
  return { board, optimal: optimalMoves(board) };
}

/** Which board index holds the tile that a swipe in `dir` would slide into the gap. */
function tileForSwipe(blank: number, dir: SwipeDirection): number | null {
  const r = Math.floor(blank / SIZE);
  const c = blank % SIZE;
  // Swiping left slides the tile on the gap's right leftwards into it, etc.
  if (dir === "left") return c < SIZE - 1 ? blank + 1 : null;
  if (dir === "right") return c > 0 ? blank - 1 : null;
  if (dir === "up") return r < SIZE - 1 ? blank + SIZE : null;
  return r > 0 ? blank - SIZE : null;
}

export function Level2PuzzleMode() {
  const navigate = useNavigate();
  const initial = useMemo(makePuzzle, []);
  const [board, setBoard] = useState<number[]>(initial.board);
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<"play" | "done">("play");
  const [skipped, setSkipped] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Telemetry lives in refs: it must not cause re-renders, and it must be
  // read synchronously at the moment the puzzle finishes.
  const t = useRef({
    startedAt: performance.now(),
    moveTimes: [] as number[],
    lastTile: null as number | null,
    reversals: 0,
    invalid: 0,
  });

  const inPlace = board.filter((v, i) => v !== 0 && v === GOAL[i]).length;

  const finish = useCallback(
    (solved: boolean, finalMoves: number) => {
      const tel = t.current;
      const now = performance.now();
      updateMindQuestSession({
        puzzle: {
          moves: finalMoves,
          optimalMoves: initial.optimal,
          firstMoveMs: tel.moveTimes.length ? Math.round(tel.moveTimes[0] - tel.startedAt) : 0,
          medianDecisionMs: Math.round(median(intervals(tel.moveTimes))),
          reversals: tel.reversals,
          invalidInputs: tel.invalid,
          solved,
          skipped: !solved,
          durationMs: Math.round(now - tel.startedAt),
          completed: true,
        },
      });
      setSkipped(!solved);
      setPhase("done");
    },
    [initial.optimal]
  );

  const moveTile = useCallback(
    (tileIndex: number | null) => {
      if (phase !== "play") return;
      const blank = board.indexOf(0);
      if (tileIndex === null || !isAdjacent(tileIndex, blank)) {
        t.current.invalid += 1;
        return;
      }
      const tile = board[tileIndex];
      // In a sliding puzzle, moving the same tile twice in a row can only undo it.
      if (t.current.lastTile === tile) t.current.reversals += 1;
      t.current.lastTile = tile;
      t.current.moveTimes.push(performance.now());

      const next = [...board];
      [next[blank], next[tileIndex]] = [next[tileIndex], next[blank]];
      const nextMoves = moves + 1;
      setBoard(next);
      setMoves(nextMoves);
      if (isSolved(next)) finish(true, nextMoves);
    },
    [board, moves, phase, finish]
  );

  const handlers = useSwipe({
    enabled: phase === "play",
    onSwipe: (dir) => moveTile(tileForSwipe(board.indexOf(0), dir)),
    onTap: (x, y) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const col = Math.floor(((x - rect.left) / rect.width) * SIZE);
      const row = Math.floor(((y - rect.top) / rect.height) * SIZE);
      if (col < 0 || col >= SIZE || row < 0 || row >= SIZE) return;
      const index = row * SIZE + col;
      if (board[index] === 0) return; // tapping the gap is not a decision
      moveTile(index);
    },
  });

  // Offer the skip escape hatch. Polled rather than shown as a countdown: this
  // game is defined by having no time pressure, so no timer is ever displayed.
  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      if (performance.now() - t.current.startedAt >= SKIP_AFTER_MS) setCanSkip(true);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (moves >= SKIP_AFTER_MOVES) setCanSkip(true);
  }, [moves]);

  useEffect(() => {
    if (phase !== "done") return;
    const id = window.setTimeout(() => navigate(nextStepPath("puzzle")), 1600);
    return () => window.clearTimeout(id);
  }, [phase, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-lg mx-auto">
        <GameHeader
          stepId="puzzle"
          subtitle="Slide the tiles into order, 1 to 8. Swipe on the board, tap a tile next to the gap, or use the arrow keys."
          purpose="There is no timer. Take as long as you like — think before each move."
          progress={(inPlace / 8) * 100}
          gradient="from-indigo-500 to-pink-500"
        />

        <div className="grid grid-cols-2 gap-3 mt-5">
          <StatTile label="Moves" value={moves} tone="text-indigo-700" />
          <StatTile label="Tiles in place" value={`${inPlace}/8`} tone="text-emerald-700" />
        </div>

        <div className="mt-6 bg-white rounded-3xl p-4 shadow-lg relative">
          <div
            ref={boardRef}
            {...handlers}
            className="grid grid-cols-3 gap-2 aspect-square select-none"
            style={{ touchAction: "none" }}
            role="application"
            aria-label="Sliding puzzle. Use arrow keys to slide a tile into the gap."
          >
            {board.map((v) =>
              v === 0 ? (
                <motion.div key="gap" layout className="rounded-2xl bg-neutral-100" />
              ) : (
                <motion.div
                  key={v}
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  className={`rounded-2xl flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer ${
                    v === GOAL[board.indexOf(v)]
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                      : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                  }`}
                >
                  {v}
                </motion.div>
              )
            )}
          </div>
        </div>

        {phase === "play" && canSkip && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-center justify-between gap-3">
            <span>Stuck? You can move on — the rest of the quest still counts.</span>
            <button
              onClick={() => finish(false, moves)}
              className="shrink-0 rounded-full bg-amber-600 px-4 py-1.5 font-semibold text-white"
            >
              Skip puzzle
            </button>
          </div>
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-white border border-indigo-200 rounded-2xl p-4 text-center"
          >
            {skipped ? (
              <Puzzle className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            ) : (
              <Sparkles className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            )}
            <p className="text-sm text-neutral-700">
              {skipped ? "Puzzle skipped." : `Solved in ${moves} moves.`} Next:{" "}
              {nextStepLabel("puzzle")}.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
