import { Camera, Loader2 } from "lucide-react";
import { emotionSensor } from "./sensor";
import { useEmotionSensor } from "./useEmotionSensor";

/** Opt-in switch for camera emotion sensing. `tone` matches the screen it sits on. */
export function EmotionConsent({ tone = "glass", purpose }: { tone?: "glass" | "light"; purpose: string }) {
  const { status, error } = useEmotionSensor();
  const on = status === "on";
  const busy = status === "starting";
  const glass = tone === "glass";

  return (
    <div
      className={`rounded-2xl p-4 border ${
        glass ? "bg-white/10 backdrop-blur-md border-white/20 text-white" : "bg-white border-neutral-200 text-neutral-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            glass ? "bg-white/20" : "bg-teal-50 text-teal-600"
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-sm">Emotion sensing (optional)</p>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label="Emotion sensing"
              disabled={busy}
              onClick={() => (on ? emotionSensor.stop() : void emotionSensor.start())}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
                on ? "bg-emerald-400" : glass ? "bg-white/30" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  on ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <p className={`text-xs mt-1 ${glass ? "text-white/75" : "text-neutral-600"}`}>
            {busy
              ? "Starting the camera and loading the emotion models…"
              : `Your camera reads facial expressions ${purpose}. Everything is analysed on this device — no video is recorded or uploaded. You can switch it off at any time.`}
          </p>
          {status === "error" && error && (
            <p className={`text-xs mt-1 ${glass ? "text-amber-200" : "text-amber-700"}`}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
