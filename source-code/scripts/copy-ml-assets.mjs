// Copies the onnxruntime-web WASM runtime into public/ so the emotion worker loads it from this
// site rather than a CDN. Runs before `vite` and `vite build` (see package.json).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "onnxruntime-web", "dist");
const dest = join(root, "public", "vendor", "ort");
mkdirSync(dest, { recursive: true });
for (const f of ["ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.mjs"]) {
  copyFileSync(join(src, f), join(dest, f));
}
console.log("copied onnxruntime-web wasm to public/vendor/ort");
