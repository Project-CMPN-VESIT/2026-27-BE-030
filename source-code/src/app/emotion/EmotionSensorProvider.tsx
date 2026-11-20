import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { router } from "../routes";
import { QUEST_STEPS } from "../mindquest/quest";
import { updateMindQuestSession } from "../mindquest/session";
import { emotionSensor } from "./sensor";
import { saveQuestionnaireAffect } from "./questionnaireAffect";
import { useEmotionSensor } from "./useEmotionSensor";

export const QUESTIONNAIRE_STEP = "questionnaire";
const QUESTIONNAIRE_PATH = "/manual-assessment";

/** Routes where the camera may stay on. Anything else (results, home, AI Buddy…) switches it off. */
const KEEP_ON = new Set(["/mindquest", "/mindquest/breathing", QUESTIONNAIRE_PATH, ...QUEST_STEPS.map((s) => s.path)]);

function stepFor(path: string): string | null {
  if (path === QUESTIONNAIRE_PATH) return QUESTIONNAIRE_STEP;
  return QUEST_STEPS.find((s) => s.path === path)?.id ?? null;
}

/** Store what was seen during a step that just ended. */
function flush(step: string) {
  const summary = emotionSensor.take(step);
  if (summary.frames === 0) return;
  if (step === QUESTIONNAIRE_STEP) saveQuestionnaireAffect(summary);
  else updateMindQuestSession({ affect: { enabled: true, byGame: { [step]: summary } } });
}

/**
 * Lives above the router so the camera survives navigation between levels. It follows the route
 * to know which game is on screen, and saves each game's summary as soon as the player leaves it
 * — synchronously, before the next screen (e.g. the result) reads the session.
 */
export function EmotionSensorProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let current: string | null = null;
    const onPath = (path: string) => {
      const step = stepFor(path);
      if (current && current !== step) flush(current);
      current = step;
      emotionSensor.setStep(step);
      if (!KEEP_ON.has(path) && emotionSensor.getSnapshot().status !== "off") emotionSensor.stop();
    };
    onPath(router.state.location.pathname);
    return router.subscribe((state) => onPath(state.location.pathname));
  }, []);

  return (
    <>
      {children}
      <CameraBubble />
    </>
  );
}

/** Small live preview so players know the camera is on and can keep their face in view. */
function CameraBubble() {
  const { status, stream, faceVisible } = useEmotionSensor();
  if (status !== "on" || !stream) return null;
  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 pointer-events-none" aria-live="polite">
      <div
        className={`relative w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ${
          faceVisible ? "ring-emerald-400" : "ring-amber-400"
        }`}
        title={faceVisible ? "Emotion sensing on — analysed on this device only" : "Face not in view"}
      >
        <video
          className="w-full h-full object-cover -scale-x-100"
          autoPlay
          muted
          playsInline
          ref={(el) => {
            if (el && el.srcObject !== stream) el.srcObject = stream;
          }}
        />
        <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      </div>
      <button
        onClick={() => emotionSensor.stop()}
        className="pointer-events-auto w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center text-neutral-600 hover:text-neutral-900"
        aria-label="Turn off emotion sensing"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
