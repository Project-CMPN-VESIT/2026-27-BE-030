/**
 * Runs entirely off the main thread: face detection, a FER-2013-style face crop, and the emotion
 * ensemble. Receives camera frames as transferred ImageBitmaps and replies with 7 emotion
 * probabilities (or null when no face is found). Frames are never kept or sent anywhere.
 */
import * as ort from "onnxruntime-web/wasm";

type Manifest = {
  emotions: string[];
  inputSize: number;
  detector: { file: string; width: number; height: number; scoreThreshold: number; cropScale: number };
  models: { name: string; file: string; weight: number }[];
};

type InMsg =
  | { type: "init"; modelBase: string; wasmBase: string }
  | { type: "frame"; bitmap: ImageBitmap };

let manifest: Manifest;
let detector: ort.InferenceSession;
let models: { session: ort.InferenceSession; weight: number }[] = [];
let detCtx: OffscreenCanvasRenderingContext2D;
let faceCtx: OffscreenCanvasRenderingContext2D;

const post = (msg: unknown) => (self as unknown as Worker).postMessage(msg);

async function init(modelBase: string, wasmBase: string) {
  ort.env.wasm.numThreads = 1; // no cross-origin isolation needed (Google sign-in uses popups)
  ort.env.wasm.wasmPaths = wasmBase;
  manifest = await (await fetch(modelBase + "ensemble.json")).json();
  const opts: ort.InferenceSession.SessionOptions = { executionProviders: ["wasm"], graphOptimizationLevel: "all" };
  detector = await ort.InferenceSession.create(modelBase + manifest.detector.file, opts);
  models = [];
  for (const m of manifest.models) {
    models.push({ session: await ort.InferenceSession.create(modelBase + m.file, opts), weight: m.weight });
  }
  const { width, height } = manifest.detector;
  detCtx = new OffscreenCanvas(width, height).getContext("2d", { willReadFrequently: true })!;
  const n = manifest.inputSize;
  faceCtx = new OffscreenCanvas(n, n).getContext("2d", { willReadFrequently: true })!;
  faceCtx.imageSmoothingEnabled = true;
  faceCtx.imageSmoothingQuality = "high";
}

/** Highest-scoring face box in source-image pixels, or null. */
async function detect(bmp: ImageBitmap): Promise<[number, number, number, number] | null> {
  const { width: w, height: h, scoreThreshold } = manifest.detector;
  detCtx.drawImage(bmp, 0, 0, w, h);
  const px = detCtx.getImageData(0, 0, w, h).data;
  const plane = w * h;
  const input = new Float32Array(3 * plane);
  for (let i = 0, p = 0; i < plane; i++, p += 4) {
    input[i] = (px[p] - 127) / 128;
    input[i + plane] = (px[p + 1] - 127) / 128;
    input[i + 2 * plane] = (px[p + 2] - 127) / 128;
  }
  const out = await detector.run({ input: new ort.Tensor("float32", input, [1, 3, h, w]) });
  const scores = out.scores.data as Float32Array;
  const boxes = out.boxes.data as Float32Array;
  let best = -1;
  let bestScore = scoreThreshold;
  for (let i = 0; i < scores.length / 2; i++) {
    if (scores[i * 2 + 1] > bestScore) {
      bestScore = scores[i * 2 + 1];
      best = i;
    }
  }
  if (best < 0) return null;
  const b = boxes.subarray(best * 4, best * 4 + 4);
  return [b[0] * bmp.width, b[1] * bmp.height, b[2] * bmp.width, b[3] * bmp.height];
}

/** Square crop around the box, framed like FER-2013 faces, as a grayscale [2,1,n,n] batch (+ mirror). */
function crop(bmp: ImageBitmap, [x1, y1, x2, y2]: [number, number, number, number]): ort.Tensor {
  const n = manifest.inputSize;
  const side = manifest.detector.cropScale * Math.max(x2 - x1, y2 - y1);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  faceCtx.fillStyle = "rgb(128,128,128)";
  faceCtx.fillRect(0, 0, n, n);
  faceCtx.drawImage(bmp, cx - side / 2, cy - side / 2, side, side, 0, 0, n, n);
  const px = faceCtx.getImageData(0, 0, n, n).data;
  const batch = new Float32Array(2 * n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const p = (y * n + x) * 4;
      const g = (0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2]) / 255; // ITU-R 601 luma, as PIL "L"
      batch[y * n + x] = g;
      batch[n * n + y * n + (n - 1 - x)] = g; // horizontal flip, as in evaluation
    }
  }
  return new ort.Tensor("float32", batch, [2, 1, n, n]);
}

async function classify(input: ort.Tensor): Promise<number[]> {
  const k = manifest.emotions.length;
  const total = new Float64Array(k);
  let weights = 0;
  for (const { session, weight } of models) {
    const out = await session.run({ input });
    const p = out.probs.data as Float32Array; // [2, k] softmax probabilities
    for (let j = 0; j < k; j++) total[j] += (weight * (p[j] + p[k + j])) / 2;
    weights += weight;
  }
  return Array.from(total, (v) => v / weights);
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  if (msg.type === "init") {
    try {
      await init(msg.modelBase, msg.wasmBase);
      post({ type: "ready", models: models.length });
    } catch (err) {
      post({ type: "error", message: err instanceof Error ? err.message : String(err) });
    }
    return;
  }
  const bmp = msg.bitmap;
  try {
    const box = await detect(bmp);
    post({ type: "result", probs: box ? await classify(crop(bmp, box)) : null });
  } catch (err) {
    post({ type: "result", probs: null, error: err instanceof Error ? err.message : String(err) });
  } finally {
    bmp.close();
  }
};
