"""Export the chosen ensemble to ONNX for the browser, verify it, and write ensemble.json.

    python export_onnx.py              use results/metrics.json (after evaluate.py)
    python export_onnx.py --interim    export whatever checkpoints exist now (integration testing only)

Every exported model takes [N,1,48,48] grayscale in [0,1] (input "input") and returns softmax
probabilities over the 7 FER-2013 emotions (output "probs").
"""
import argparse
import json
import os
import shutil

import numpy as np
import onnx
import onnxruntime as ort
import torch
import torch.nn as nn
from onnx import helper, numpy_helper

from common import EMOTIONS, RUNS, STATE_OF, load_split, state_accuracy, to_tensor
from evaluate import load_model

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DEST = os.path.join(REPO, "public", "models", "emotion")
DETECTOR = os.path.join(HERE, "assets", "ultraface-slim-320.onnx")


class WithSoftmax(nn.Module):
    def __init__(self, m):
        super().__init__()
        self.m = m

    def forward(self, x):
        return torch.softmax(self.m(x), dim=1)


def fp16_weights(src, dst):
    """Store large float32 initializers as float16 plus a Cast back to float32.

    Compute stays float32 (the browser's WASM backend has no fp16 kernels); ONNX Runtime folds the
    casts when the session loads. Halves the download with negligible accuracy change.
    """
    m = onnx.load(src)
    g = m.graph
    new_inits, casts = [], []
    for init in g.initializer:
        arr = numpy_helper.to_array(init)
        if arr.dtype == np.float32 and arr.size >= 1024:
            half = numpy_helper.from_array(arr.astype(np.float16), init.name + "_fp16")
            new_inits.append(half)
            casts.append(helper.make_node("Cast", [half.name], [init.name], to=onnx.TensorProto.FLOAT))
        else:
            new_inits.append(init)
    del g.initializer[:]
    g.initializer.extend(new_inits)
    nodes = list(g.node)
    del g.node[:]
    g.node.extend(casts + nodes)
    onnx.checker.check_model(m)
    onnx.save(m, dst)


def ort_probs(path, x_uint8, bs=256):
    so = ort.SessionOptions()
    so.log_severity_level = 3
    s = ort.InferenceSession(path, so)
    out = []
    for i in range(0, len(x_uint8), bs):
        xb = to_tensor(x_uint8[i:i + bs]).numpy()
        p = s.run(["probs"], {"input": xb})[0]
        p2 = s.run(["probs"], {"input": xb[..., ::-1].copy()})[0]
        out.append((p + p2) / 2)
    return np.concatenate(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--interim", action="store_true")
    a = ap.parse_args()
    if a.interim:
        names = [n for n in ("resnet18", "mobilenetv3", "vggish") if os.path.exists(os.path.join(RUNS, n, "best.pt"))]
        weights = {n: round(1 / len(names), 4) for n in names}
        accuracy = None
    else:
        metrics = json.load(open(os.path.join(HERE, "results", "metrics.json")))
        weights = metrics["chosen"]["weights"]
        names = list(weights)
        accuracy = metrics["privateTest"]["ensemble"]["state_acc"]

    os.makedirs(DEST, exist_ok=True)
    xva, yva = load_split("publicTest")
    entries, ens_ref, ens_onnx = [], 0, 0
    for n in names:
        model, _ = load_model(n)
        wrapped = WithSoftmax(model).eval()
        raw = os.path.join(RUNS, n, f"{n}.fp32.onnx")
        torch.onnx.export(wrapped, torch.zeros(1, 1, 48, 48), raw, input_names=["input"], output_names=["probs"],
                          dynamic_axes={"input": {0: "n"}, "probs": {0: "n"}}, opset_version=17, dynamo=False)
        # parity: PyTorch vs the fp32 export on real faces
        with torch.no_grad():
            ref = wrapped(to_tensor(xva[:128])).numpy()
        so = ort.SessionOptions()
        so.log_severity_level = 3
        got = ort.InferenceSession(raw, so).run(["probs"], {"input": to_tensor(xva[:128]).numpy()})[0]
        diff = float(np.abs(ref - got).max())
        assert diff < 1e-4, f"{n}: fp32 export disagrees with PyTorch ({diff:.2e})"
        # fp16 weight storage: keep it only if PublicTest accuracy holds
        final = os.path.join(DEST, f"{n}.onnx")
        fp16_weights(raw, final)
        p32, p16 = ort_probs(raw, xva), ort_probs(final, xva)
        acc32, acc16 = state_accuracy(p32, yva), state_accuracy(p16, yva)
        if acc32 - acc16 > 0.003:
            shutil.copy(raw, final)
            p16, acc16 = p32, acc32
        print(f"{n:12s} {os.path.getsize(final) / 1e6:5.1f} MB  max|torch-onnx(fp32)| {diff:.1e}  "
              f"val states fp32 {acc32:.4f} / shipped {acc16:.4f}")
        p_onnx = p16
        ens_onnx = ens_onnx + weights[n] * p_onnx
        entries.append({"name": n, "file": f"{n}.onnx", "weight": weights[n]})

    print(f"ensemble via ONNX, PublicTest app-state accuracy: {state_accuracy(ens_onnx, yva):.4f}")
    shutil.copy(DETECTOR, os.path.join(DEST, "ultraface-slim-320.onnx"))
    manifest = {
        "emotions": EMOTIONS,
        "states": {e: STATE_OF[e] for e in EMOTIONS},
        "inputSize": 48,
        "detector": {"file": "ultraface-slim-320.onnx", "width": 320, "height": 240, "scoreThreshold": 0.7,
                     "cropScale": 1.04},
        "models": entries,
        "privateTestStateAccuracy": accuracy,
        "interim": a.interim,
    }
    json.dump(manifest, open(os.path.join(DEST, "ensemble.json"), "w"), indent=1)
    print("wrote", DEST)


if __name__ == "__main__":
    main()
