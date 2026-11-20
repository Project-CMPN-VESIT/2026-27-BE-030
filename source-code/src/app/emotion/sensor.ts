/**
 * Optional camera emotion sensing. One shared instance lives for the whole app so the camera keeps
 * running across the quest's level routes.
 *
 * The main thread only grabs a frame about three times a second and hands it to a worker; the
 * face detector and emotion ensemble run there so the canvas games don't stutter. Only the
 * resulting probabilities are kept, in memory, per game.
 */
import { summarise, type AffectSample, type AffectSummary } from "./affect";

export type SensorStatus = "off" | "starting" | "on" | "error";
export type SensorSnapshot = {
  status: SensorStatus;
  error: string | null;
  stream: MediaStream | null;
  /** Whether a face was found in the most recent analysed frame. */
  faceVisible: boolean;
};

const FRAME_MS = 330;
const MODEL_BASE = "/models/emotion/";
const WASM_BASE = "/vendor/ort/";

class EmotionSensor {
  private snap: SensorSnapshot = { status: "off", error: null, stream: null, faceVisible: false };
  private listeners = new Set<() => void>();
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private worker: Worker | null = null;
  private timer = 0;
  private pending: { step: string; t: number } | null = null;
  private step: string | null = null;
  private samples = new Map<string, AffectSample[]>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snap;

  private update(patch: Partial<SensorSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Ask for the camera and load the models. Resolves false (with an error message) on failure. */
  async start(): Promise<boolean> {
    if (this.snap.status === "on" || this.snap.status === "starting") return true;
    this.update({ status: "starting", error: null });
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot open the camera.");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      this.stream = stream;
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      this.video = video;
      this.update({ stream });

      const worker = new Worker(new URL("./emotion.worker.ts", import.meta.url), { type: "module" });
      this.worker = worker;
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("Loading the emotion models timed out.")), 60_000);
        worker.onmessage = (e) => {
          if (e.data?.type === "ready") {
            window.clearTimeout(timeout);
            resolve();
          } else if (e.data?.type === "error") {
            window.clearTimeout(timeout);
            reject(new Error(e.data.message));
          }
        };
        worker.onerror = (e) => {
          window.clearTimeout(timeout);
          reject(new Error(e.message || "The emotion worker failed to start."));
        };
        worker.postMessage({ type: "init", modelBase: MODEL_BASE, wasmBase: WASM_BASE });
      });
      worker.onmessage = this.onResult;
      this.timer = window.setInterval(this.tick, FRAME_MS);
      this.update({ status: "on" });
      return true;
    } catch (err) {
      this.teardown();
      const name = err instanceof DOMException ? err.name : "";
      const message =
        name === "NotAllowedError"
          ? "Camera permission was declined, so emotion sensing is off."
          : name === "NotFoundError"
            ? "No camera was found."
            : err instanceof Error
              ? err.message
              : String(err);
      this.update({ status: "error", error: message, stream: null });
      return false;
    }
  }

  /** Release the camera and drop any unsaved samples. */
  stop() {
    this.teardown();
    this.samples.clear();
    this.update({ status: "off", error: null, stream: null, faceVisible: false });
  }

  /** The game (or questionnaire) now on screen; null pauses sampling. */
  setStep(step: string | null) {
    this.step = step;
  }

  /** Summarise and forget the samples collected for a step. */
  take(step: string): AffectSummary {
    const summary = summarise(this.samples.get(step) ?? []);
    this.samples.delete(step);
    return summary;
  }

  private tick = async () => {
    const video = this.video;
    if (this.pending || !this.step || !this.worker || !video || document.hidden || video.readyState < 2) return;
    this.pending = { step: this.step, t: performance.now() };
    try {
      const bitmap = await createImageBitmap(video);
      this.worker.postMessage({ type: "frame", bitmap }, [bitmap]);
    } catch {
      this.pending = null;
    }
  };

  private onResult = (e: MessageEvent) => {
    if (e.data?.type !== "result" || !this.pending) return;
    const { step, t } = this.pending;
    this.pending = null;
    const probs: number[] | null = e.data.probs;
    const list = this.samples.get(step) ?? [];
    list.push({ t, probs });
    this.samples.set(step, list);
    if ((probs !== null) !== this.snap.faceVisible) this.update({ faceVisible: probs !== null });
  };

  private teardown() {
    window.clearInterval(this.timer);
    this.timer = 0;
    this.pending = null;
    this.worker?.terminate();
    this.worker = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
  }
}

export const emotionSensor = new EmotionSensor();
