import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Footprints, Pause, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { GameHeader, GameOverlay, StatTile } from "../components/GameHeader";
import { updateMindQuestSession } from "../mindquest/session";
import { nextStepLabel, nextStepPath } from "../mindquest/quest";
import { useGameLoop } from "../mindquest/useGameLoop";
import { useCanvas, EMOJI_FONT } from "../mindquest/useCanvas";
import { useSwipe } from "../mindquest/useSwipe";
import { useTimedPhase } from "../mindquest/useTimedPhase";
import { cv, intervals, median, rate, type SwipeDirection } from "../mindquest/telemetry";

// ---- World, in units where the canvas width is 1 ----
const ASPECT = 1.35;
const LANES = 3;
const DURATION_MS = 60_000;
const HALF_MS = DURATION_MS / 2;
const PLAYER_Y = ASPECT - 0.2;
const PLAYER_R = 0.055;
const ROW_H = 0.07;
const LANE_SWITCH_S = 0.11; // time to cross one lane
const STUMBLE_MS = 600;
const RAPID_REVERSAL_MS = 250;

const laneCenter = (lane: number) => (lane + 0.5) / LANES;
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

type Row = {
  id: number;
  y: number;
  blocked: boolean[];
  /** When this row became the next one to pass the player, on screen. */
  activatedAt: number | null;
  needed: number;
  reacted: boolean;
  hit: boolean;
  passed: boolean;
};

function makeRow(id: number, t: number): Row {
  // One blocked lane early on, more often two later. Never all three — there is
  // always a way through.
  const two = Math.random() > lerp(0.75, 0.45, t / DURATION_MS);
  const blocked = [false, false, false];
  const first = Math.floor(Math.random() * LANES);
  blocked[first] = true;
  if (two) blocked[(first + 1 + Math.floor(Math.random() * 2)) % LANES] = true;
  return { id, y: -ROW_H, blocked, activatedAt: null, needed: 0, reacted: false, hit: false, passed: false };
}

function newGame() {
  return {
    elapsed: 0,
    distance: 0,
    sinceSpawn: Infinity, // spawn the first row immediately
    nextId: 1,
    rows: [] as Row[],
    lane: 1, // lane the player is heading to
    x: laneCenter(1), // rendered position, tweens toward the lane
    stumbleUntil: 0,
    swipeTimes: [] as number[],
    lastSwipe: null as { t: number; dir: SwipeDirection } | null,
    swipes: 0,
    necessary: 0,
    rapidReversals: 0,
    unthreatened: 0,
    collisions: 0,
    rowsPassed: 0,
    early: { rows: 0, hits: 0, reactions: [] as number[] },
    late: { rows: 0, hits: 0, reactions: [] as number[] },
    finished: false,
  };
}

export function Level4RunnerMode() {
  const navigate = useNavigate();
  const { phase, setPhase, count, start } = useTimedPhase();
  const { containerRef, canvasRef, size } = useCanvas(ASPECT);
  const game = useRef(newGame());
  const [hud, setHud] = useState({ secondsLeft: DURATION_MS / 1000, distance: 0, collisions: 0 });

  const speedAt = (t: number) =>
    lerp(0.42, 1.1, t / DURATION_MS) * (t < game.current.stumbleUntil ? 0.65 : 1);

  const finish = useCallback(() => {
    const g = game.current;
    if (g.finished) return;
    g.finished = true;
    const reactions = [...g.early.reactions, ...g.late.reactions];
    updateMindQuestSession({
      finishedAt: Date.now(),
      runner: {
        swipes: g.swipes,
        necessarySwipes: g.necessary,
        excessSwipes: Math.max(0, g.swipes - g.necessary),
        rapidReversals: g.rapidReversals,
        unthreatenedDodges: g.unthreatened,
        rowsPassed: g.rowsPassed,
        collisions: g.collisions,
        swipeIntervalCv: Number(cv(intervals(g.swipeTimes)).toFixed(3)),
        medianReactionMs: Math.round(median(reactions)),
        reactionCv: Number(cv(reactions).toFixed(3)),
        earlyCollisionRate: Number(rate(g.early.hits, g.early.rows).toFixed(3)),
        lateCollisionRate: Number(rate(g.late.hits, g.late.rows).toFixed(3)),
        earlyReactionMs: Math.round(median(g.early.reactions)),
        lateReactionMs: Math.round(median(g.late.reactions)),
        distance: Math.round(g.distance * 100),
        durationMs: Math.round(g.elapsed),
        completed: true,
      },
    });
    setPhase("done");
  }, [setPhase]);

  /** The nearest row that hasn't reached the player yet. */
  const nextRow = () => game.current.rows.find((r) => !r.passed);

  // ---------------------------------------------------------------- frame
  const frame = (dt: number) => {
    const g = game.current;
    if (g.finished) return;
    g.elapsed += dt;
    const now = g.elapsed;
    const s = dt / 1000;
    const v = speedAt(now);
    const dy = v * s;
    g.distance += dy;

    // Distance-based spawning, with the gap shrinking in *time* as speed rises.
    // The floor of 0.78s leaves room for two lane changes plus a reaction, so
    // every row is physically dodgeable.
    g.sinceSpawn += dy;
    const gapUnits = v * lerp(1.35, 0.78, now / DURATION_MS);
    if (g.sinceSpawn >= gapUnits) {
      g.rows.push(makeRow(g.nextId++, now));
      g.sinceSpawn = 0;
    }

    // Tween the player toward the target lane.
    const targetX = laneCenter(g.lane);
    const step = (1 / LANES / LANE_SWITCH_S) * s;
    g.x = Math.abs(targetX - g.x) <= step ? targetX : g.x + Math.sign(targetX - g.x) * step;

    for (const row of g.rows) {
      row.y += dy;

      // Collision: any lane the player's body overlaps that this row blocks.
      if (!row.hit && !row.passed && Math.abs(row.y - PLAYER_Y) < ROW_H / 2 + PLAYER_R * 0.7) {
        const left = g.x - PLAYER_R * 0.8;
        const right = g.x + PLAYER_R * 0.8;
        const hits = row.blocked.some(
          (b, i) => b && right > i / LANES + 0.03 && left < (i + 1) / LANES - 0.03
        );
        if (hits) {
          row.hit = true;
          g.collisions += 1;
          g.stumbleUntil = now + STUMBLE_MS;
        }
      }

      if (!row.passed && row.y - ROW_H / 2 > PLAYER_Y + PLAYER_R) {
        row.passed = true;
        g.rowsPassed += 1;
        const bucket = now < HALF_MS ? g.early : g.late;
        bucket.rows += 1;
        if (row.hit) bucket.hits += 1;
      }
    }

    // Activate the next row once it's on screen: that's when the player can
    // first see it and decide. Record how many lane changes it truly needs.
    const next = nextRow();
    if (next && next.activatedAt === null && next.y > 0) {
      next.activatedAt = now;
      let best = LANES;
      next.blocked.forEach((b, i) => {
        if (!b) best = Math.min(best, Math.abs(i - g.lane));
      });
      next.needed = best;
      next.reacted = best === 0;
      g.necessary += best;
    }

    g.rows = g.rows.filter((r) => r.y < ASPECT + ROW_H);
    draw();

    const secondsLeft = Math.max(0, Math.ceil((DURATION_MS - now) / 1000));
    const distance = Math.round(g.distance * 100);
    if (secondsLeft !== hud.secondsLeft || distance !== hud.distance || g.collisions !== hud.collisions) {
      setHud({ secondsLeft, distance, collisions: g.collisions });
    }

    if (now >= DURATION_MS) finish();
  };

  const paused = useGameLoop(frame, phase === "play");

  // ---------------------------------------------------------------- input
  const onSwipe = (dir: SwipeDirection) => {
    if (dir !== "left" && dir !== "right") return;
    const g = game.current;
    const now = g.elapsed;

    g.swipes += 1;
    g.swipeTimes.push(now);
    if (g.lastSwipe && g.lastSwipe.dir !== dir && now - g.lastSwipe.t < RAPID_REVERSAL_MS) {
      g.rapidReversals += 1;
    }
    g.lastSwipe = { t: now, dir };

    // Hyper-reactivity: dodging when nothing on screen blocks your lane.
    const threatened = g.rows.some((r) => !r.passed && r.y > -ROW_H && r.blocked[g.lane]);
    if (!threatened) g.unthreatened += 1;

    // First response to a row that actually required a dodge.
    const next = nextRow();
    if (next && next.activatedAt !== null && !next.reacted) {
      next.reacted = true;
      (now < HALF_MS ? g.early : g.late).reactions.push(now - next.activatedAt);
    }

    // A swipe into the edge is still an input (and still wasted) — just no move.
    g.lane = Math.max(0, Math.min(LANES - 1, g.lane + (dir === "left" ? -1 : 1)));
  };

  const handlers = useSwipe({ enabled: phase === "play" && !paused, onSwipe });

  // ---------------------------------------------------------------- draw
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = size.current;
    const g = game.current;
    const now = g.elapsed;
    const stumbling = now < g.stumbleUntil;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1e1b4b");
    bg.addColorStop(1, "#312e81");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Scrolling lane dividers sell the sense of speed.
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash([w * 0.05, w * 0.05]);
    ctx.lineDashOffset = -((g.distance * w) % (w * 0.1));
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo((i / LANES) * w, 0);
      ctx.lineTo((i / LANES) * w, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const row of g.rows) {
      row.blocked.forEach((b, i) => {
        if (!b) return;
        const x0 = (i / LANES + 0.03) * w;
        const x1 = ((i + 1) / LANES - 0.03) * w;
        const y0 = (row.y - ROW_H / 2) * w;
        ctx.fillStyle = row.hit ? "rgba(248,113,113,0.55)" : "#fb7185";
        ctx.beginPath();
        // roundRect is missing on iOS Safari < 16; a plain rect beats a crash.
        if (typeof ctx.roundRect === "function") ctx.roundRect(x0, y0, x1 - x0, ROW_H * w, 8);
        else ctx.rect(x0, y0, x1 - x0, ROW_H * w);
        ctx.fill();
        ctx.font = `${ROW_H * w * 0.75}px ${EMOJI_FONT}`;
        ctx.fillText("🚧", (x0 + x1) / 2, y0 + (ROW_H * w) / 2);
      });
    }

    // Player — blinks while stumbling.
    if (!stumbling || Math.floor(now / 80) % 2 === 0) {
      const px = g.x * w;
      const py = PLAYER_Y * w;
      const grad = ctx.createRadialGradient(px, py, 2, px, py, PLAYER_R * w);
      grad.addColorStop(0, "#5eead4");
      grad.addColorStop(1, "#0d9488");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_R * w, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = `${PLAYER_R * w * 1.1}px ${EMOJI_FONT}`;
      ctx.fillText("🏃", px, py + 1);
    }

    if (stumbling) {
      ctx.fillStyle = `rgba(239,68,68,${((g.stumbleUntil - now) / STUMBLE_MS) * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }
  };

  useEffect(() => {
    if (phase !== "play") draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const id = window.setTimeout(() => navigate(nextStepPath("runner")), 1800);
    return () => window.clearTimeout(id);
  }, [phase, navigate]);

  const progress = phase === "play" || phase === "done" ? (1 - hud.secondsLeft / (DURATION_MS / 1000)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-rose-50 p-6">
      <div className="max-w-lg mx-auto">
        <GameHeader
          stepId="runner"
          subtitle="Swipe left or right (or use the arrow keys) to change lanes and dodge the barriers."
          purpose="It keeps speeding up. Measures how steady your choices stay under pressure."
          progress={progress}
          gradient="from-indigo-500 to-rose-500"
        />

        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Time" value={`${hud.secondsLeft}s`} tone="text-indigo-700" />
          <StatTile label="Distance" value={`${hud.distance}m`} tone="text-emerald-600" />
          <StatTile label="Hits" value={hud.collisions} tone="text-rose-600" />
        </div>

        <div ref={containerRef} className="mt-6 relative rounded-3xl overflow-hidden shadow-lg bg-white">
          <canvas
            ref={canvasRef}
            {...handlers}
            className="block mx-auto select-none"
            style={{ touchAction: "none" }}
            aria-label="Infinite runner. Use left and right arrow keys or swipe to change lanes."
          />

          {phase === "intro" && (
            <GameOverlay>
              <Footprints className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-neutral-800">Keep running</h3>
              <p className="text-sm text-neutral-600 mt-2">
                Swipe left/right or press ← → to switch lanes. There's always a gap. Hitting a
                barrier slows you briefly — keep going. 60 seconds.
              </p>
              <button
                onClick={start}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 py-3 font-semibold text-white shadow-lg"
              >
                Start
              </button>
            </GameOverlay>
          )}

          {phase === "countdown" && (
            <GameOverlay>
              <motion.p
                key={count}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-bold text-indigo-700"
              >
                {count > 0 ? count : "Go"}
              </motion.p>
            </GameOverlay>
          )}

          {phase === "play" && paused && (
            <GameOverlay>
              <Pause className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
              <p className="text-neutral-700 font-medium">Paused while this tab was hidden.</p>
              <p className="text-sm text-neutral-500 mt-1">The clock stopped too.</p>
            </GameOverlay>
          )}

          {phase === "done" && (
            <GameOverlay>
              <Sparkles className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-neutral-800">Run complete</h3>
              <p className="text-sm text-neutral-600 mt-2">
                {hud.distance}m covered. Next: {nextStepLabel("runner")}.
              </p>
            </GameOverlay>
          )}
        </div>
      </div>
    </div>
  );
}
