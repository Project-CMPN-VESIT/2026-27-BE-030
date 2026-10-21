import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion } from "motion/react";
import { Pause, Sparkles, Swords } from "lucide-react";
import { useNavigate } from "react-router";
import { GameHeader, GameOverlay, StatTile } from "../components/GameHeader";
import { updateMindQuestSession } from "../mindquest/session";
import { nextStepLabel, nextStepPath } from "../mindquest/quest";
import { useGameLoop } from "../mindquest/useGameLoop";
import { useCanvas, EMOJI_FONT } from "../mindquest/useCanvas";
import { useTimedPhase } from "../mindquest/useTimedPhase";
import {
  cv,
  mean,
  median,
  pathJitter,
  rate,
  segmentHitsCircle,
  type Point,
} from "../mindquest/telemetry";

// ---- World, in units where the canvas width is 1 ----
const ASPECT = 1.2; // world height
const RADIUS = 0.065;
const GRAVITY = 1.25; // units / s²
const DURATION_MS = 45_000;
const SPAWN_STOP_MS = 42_500; // leave the last objects time to land
const THIRD_MS = DURATION_MS / 3;
const HAZARD_CHANCE = 0.14;
const MIN_SWIPE_UNITS = 0.03; // shorter than this is a tap, not a swipe

const TARGETS = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🥝", "🍑"];
const HAZARD = "💣";

type Obj = {
  id: number;
  kind: "target" | "hazard";
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spawnAt: number;
  /** Game time the object first poked above the bottom edge. */
  visibleAt: number | null;
  third: 0 | 1 | 2;
  state: "live" | "sliced";
  slicedAt: number;
};

type Stroke = {
  pointerId: number;
  points: Point[]; // world units
  pixels: Point[]; // CSS px, for the jitter ratio
  length: number;
  hit: boolean;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

function newGame() {
  return {
    elapsed: 0,
    nextSpawnAt: 700,
    nextId: 1,
    objs: [] as Obj[],
    stroke: null as Stroke | null,
    trail: [] as { x: number; y: number; t: number }[],
    flashUntil: 0,
    targetsSpawned: 0,
    targetsSliced: 0,
    targetsMissed: 0,
    hazardsSpawned: 0,
    hazardsSliced: 0,
    swipes: 0,
    emptySwipes: 0,
    reactions: [] as number[],
    jitters: [] as number[],
    slicedByThird: [0, 0, 0],
    resolvedByThird: [0, 0, 0],
    pointerTypes: new Set<string>(),
    // The loop can run another frame or two after time is up, before React
    // re-renders and stops it. This makes finishing idempotent.
    finished: false,
  };
}

export function Level3SlicingMode() {
  const navigate = useNavigate();
  const { phase, setPhase, count, start } = useTimedPhase();
  const { containerRef, canvasRef, size } = useCanvas(ASPECT);
  const game = useRef(newGame());
  const [hud, setHud] = useState({ secondsLeft: DURATION_MS / 1000, sliced: 0, missed: 0, hazards: 0 });

  const spawn = (now: number) => {
    const g = game.current;
    const hazard = now > 3000 && Math.random() < HAZARD_CHANCE;
    const x = lerp(0.15, 0.85, Math.random());
    const obj: Obj = {
      id: g.nextId++,
      kind: hazard ? "hazard" : "target",
      emoji: hazard ? HAZARD : TARGETS[Math.floor(Math.random() * TARGETS.length)],
      x,
      y: ASPECT + RADIUS,
      // Drift toward the middle so objects don't hug the walls.
      vx: (0.5 - x) * lerp(0.3, 0.8, Math.random()) + (Math.random() - 0.5) * 0.12,
      vy: -lerp(1.35, 1.6, Math.random()),
      spawnAt: now,
      visibleAt: null,
      third: Math.min(2, Math.floor(now / THIRD_MS)) as 0 | 1 | 2,
      state: "live",
      slicedAt: 0,
    };
    g.objs.push(obj);
    if (hazard) g.hazardsSpawned += 1;
    else g.targetsSpawned += 1;
  };

  const finish = useCallback(() => {
    const g = game.current;
    if (g.finished) return;
    g.finished = true;
    const accuracyByThird = [0, 1, 2].map((i) =>
      g.resolvedByThird[i] > 0 ? g.slicedByThird[i] / g.resolvedByThird[i] : rate(g.targetsSliced, g.targetsSliced + g.targetsMissed)
    ) as [number, number, number];

    updateMindQuestSession({
      slicing: {
        targetsSpawned: g.targetsSpawned,
        targetsSliced: g.targetsSliced,
        targetsMissed: g.targetsMissed,
        hazardsSpawned: g.hazardsSpawned,
        hazardsSliced: g.hazardsSliced,
        swipes: g.swipes,
        emptySwipes: g.emptySwipes,
        medianReactionMs: Math.round(median(g.reactions)),
        reactionCv: Number(cv(g.reactions).toFixed(3)),
        meanJitter: g.jitters.length ? Number(mean(g.jitters).toFixed(3)) : 1,
        accuracyByThird,
        pointerType: g.pointerTypes.size > 1 ? "mixed" : [...g.pointerTypes][0] ?? "",
        durationMs: Math.round(g.elapsed),
        completed: true,
      },
    });
    setPhase("done");
  }, [setPhase]);

  // ---------------------------------------------------------------- frame
  const frame = (dt: number) => {
    const g = game.current;
    if (g.finished) return;
    g.elapsed += dt;
    const now = g.elapsed;
    const s = dt / 1000;

    // Spawning: faster as the round goes on, with paired launches late on.
    while (now >= g.nextSpawnAt && g.nextSpawnAt < SPAWN_STOP_MS) {
      spawn(g.nextSpawnAt);
      if (Math.random() < lerp(0, 0.45, g.nextSpawnAt / DURATION_MS)) spawn(g.nextSpawnAt);
      g.nextSpawnAt += lerp(1050, 500, g.nextSpawnAt / DURATION_MS);
    }

    for (const o of g.objs) {
      o.vy += GRAVITY * s;
      o.x += o.vx * s;
      o.y += o.vy * s;
      if (o.x < RADIUS) (o.x = RADIUS), (o.vx = Math.abs(o.vx));
      if (o.x > 1 - RADIUS) (o.x = 1 - RADIUS), (o.vx = -Math.abs(o.vx));
      if (o.visibleAt === null && o.y - RADIUS < ASPECT) o.visibleAt = now;
    }

    // Falling off the bottom unsliced is a miss (targets only).
    g.objs = g.objs.filter((o) => {
      if (o.state === "sliced") return now - o.slicedAt < 500;
      const gone = o.vy > 0 && o.y - RADIUS > ASPECT;
      if (gone && o.kind === "target") {
        g.targetsMissed += 1;
        g.resolvedByThird[o.third] += 1;
      }
      return !gone;
    });

    g.trail = g.trail.filter((p) => now - p.t < 140);
    draw();

    const secondsLeft = Math.max(0, Math.ceil((DURATION_MS - now) / 1000));
    if (
      secondsLeft !== hud.secondsLeft ||
      g.targetsSliced !== hud.sliced ||
      g.targetsMissed !== hud.missed ||
      g.hazardsSliced !== hud.hazards
    ) {
      setHud({ secondsLeft, sliced: g.targetsSliced, missed: g.targetsMissed, hazards: g.hazardsSliced });
    }

    if (now >= DURATION_MS) finish();
  };

  const paused = useGameLoop(frame, phase === "play");

  // ---------------------------------------------------------------- draw
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = size.current;
    const g = game.current;
    const now = g.elapsed;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#134e4a");
    bg.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const fontPx = RADIUS * 2 * w * 0.95;
    ctx.font = `${fontPx}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const o of g.objs) {
      const px = o.x * w;
      const py = o.y * w;
      if (o.state === "live") {
        if (o.kind === "hazard") {
          ctx.beginPath();
          ctx.arc(px, py, RADIUS * w * 1.12, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(248, 113, 113, 0.9)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.fillText(o.emoji, px, py);
      } else {
        // Two halves drifting apart and fading.
        const age = (now - o.slicedAt) / 500;
        const spread = age * RADIUS * w * 1.2;
        ctx.globalAlpha = Math.max(0, 1 - age);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(side < 0 ? px - fontPx : px, py - fontPx, fontPx, fontPx * 2);
          ctx.clip();
          ctx.fillText(o.emoji, px + side * spread, py + age * 10);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    }

    // Blade trail.
    if (g.trail.length > 1) {
      ctx.lineCap = "round";
      ctx.shadowColor = "#a5f3fc";
      ctx.shadowBlur = 12;
      for (let i = 1; i < g.trail.length; i++) {
        const a = g.trail[i - 1];
        const b = g.trail[i];
        const life = 1 - (now - b.t) / 140;
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, life)})`;
        ctx.lineWidth = 1 + 5 * Math.max(0, life);
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * w);
        ctx.lineTo(b.x * w, b.y * w);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    if (now < g.flashUntil) {
      ctx.fillStyle = `rgba(239, 68, 68, ${((g.flashUntil - now) / 250) * 0.35})`;
      ctx.fillRect(0, 0, w, h);
    }
  };

  // Paint one frame when not running, so the intro overlay sits on the scene.
  useEffect(() => {
    if (phase !== "play") draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---------------------------------------------------------------- input
  const toWorld = (e: ReactPointerEvent<HTMLCanvasElement>): { world: Point; px: Point } => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const w = size.current.w || rect.width;
    return { world: { x: px.x / w, y: px.y / w }, px };
  };

  const sliceAlong = (a: Point, b: Point) => {
    const g = game.current;
    for (const o of g.objs) {
      if (o.state !== "live") continue;
      // Segment test, not point test: a fast swipe can jump right over a
      // target between two pointer samples.
      if (!segmentHitsCircle(a, b, o, RADIUS)) continue;
      o.state = "sliced";
      o.slicedAt = g.elapsed;
      if (g.stroke) g.stroke.hit = true;
      if (o.kind === "hazard") {
        g.hazardsSliced += 1;
        g.flashUntil = g.elapsed + 250;
      } else {
        g.targetsSliced += 1;
        g.slicedByThird[o.third] += 1;
        g.resolvedByThird[o.third] += 1;
        g.reactions.push(g.elapsed - (o.visibleAt ?? o.spawnAt));
      }
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phase !== "play" || paused) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    const { world, px } = toWorld(e);
    game.current.pointerTypes.add(e.pointerType);
    game.current.stroke = { pointerId: e.pointerId, points: [world], pixels: [px], length: 0, hit: false };
    game.current.trail.push({ ...world, t: game.current.elapsed });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const g = game.current;
    const stroke = g.stroke;
    if (phase !== "play" || !stroke || stroke.pointerId !== e.pointerId) return;
    // Coalesced events recover the samples the browser merged between frames,
    // which keeps fast strokes from cutting corners.
    const native = e.nativeEvent as PointerEvent;
    const samples = native.getCoalescedEvents?.().length ? native.getCoalescedEvents() : [native];
    const rect = e.currentTarget.getBoundingClientRect();
    const w = size.current.w || rect.width;
    for (const sample of samples) {
      const px = { x: sample.clientX - rect.left, y: sample.clientY - rect.top };
      const world = { x: px.x / w, y: px.y / w };
      const prev = stroke.points[stroke.points.length - 1];
      stroke.length += Math.hypot(world.x - prev.x, world.y - prev.y);
      sliceAlong(prev, world);
      stroke.points.push(world);
      stroke.pixels.push(px);
      g.trail.push({ ...world, t: g.elapsed });
    }
  };

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const g = game.current;
    const stroke = g.stroke;
    if (!stroke || stroke.pointerId !== e.pointerId) return;
    g.stroke = null;
    if (phase !== "play") return;
    // A short press that cut nothing is a tap, not a swipe — don't count it.
    if (!stroke.hit && stroke.length < MIN_SWIPE_UNITS) return;
    g.swipes += 1;
    if (!stroke.hit) g.emptySwipes += 1;
    const j = pathJitter(stroke.pixels);
    if (stroke.pixels.length >= 3) g.jitters.push(j);
  };

  useEffect(() => {
    if (phase !== "done") return;
    const id = window.setTimeout(() => navigate(nextStepPath("slicing")), 1800);
    return () => window.clearTimeout(id);
  }, [phase, navigate]);

  const progress = phase === "play" || phase === "done" ? (1 - hud.secondsLeft / (DURATION_MS / 1000)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-indigo-100 p-6">
      <div className="max-w-lg mx-auto">
        <GameHeader
          stepId="slicing"
          subtitle="Drag across the fruit to slice it before it falls. Don't slice the bombs."
          purpose="Measures how steady your focus and hand stay as the pace picks up."
          progress={progress}
          gradient="from-teal-500 to-indigo-500"
        />

        <div className="grid grid-cols-4 gap-3 mt-5">
          <StatTile label="Time" value={`${hud.secondsLeft}s`} tone="text-indigo-700" />
          <StatTile label="Sliced" value={hud.sliced} tone="text-emerald-600" />
          <StatTile label="Missed" value={hud.missed} tone="text-amber-600" />
          <StatTile label="Bombs" value={hud.hazards} tone="text-rose-600" />
        </div>

        <div ref={containerRef} className="mt-6 relative rounded-3xl overflow-hidden shadow-lg bg-white">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            className="block mx-auto select-none"
            style={{ touchAction: "none", cursor: phase === "play" ? "crosshair" : "default" }}
            aria-label="Object slicing game. Drag across fruit to slice it."
          />

          {phase === "intro" && (
            <GameOverlay>
              <Swords className="w-10 h-10 text-teal-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-neutral-800">Slice the fruit</h3>
              <p className="text-sm text-neutral-600 mt-2">
                Press and drag across falling fruit. Avoid 💣 bombs. 45 seconds — it speeds up
                as you go.
              </p>
              <button
                onClick={start}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 py-3 font-semibold text-white shadow-lg"
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
                className="text-7xl font-bold text-teal-700"
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
              <Sparkles className="w-10 h-10 text-teal-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-neutral-800">Round complete</h3>
              <p className="text-sm text-neutral-600 mt-2">
                {hud.sliced} sliced. Next: {nextStepLabel("slicing")}.
              </p>
            </GameOverlay>
          )}
        </div>
      </div>
    </div>
  );
}
