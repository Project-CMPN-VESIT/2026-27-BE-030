"""Train one FER-2013 model.  python train.py --model {vggish,mobilenetv3,resnet18} --epochs N

Uses only the Training split for learning and PublicTest for checkpoint selection (by app-state
accuracy). PrivateTest is never read here.
"""
import argparse
import json
import math
import os
import time

import numpy as np
import torch
import torch.nn as nn

from common import RUNS, augment, build, emotion_accuracy, load_split, predict, state_accuracy, to_tensor


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--lr", type=float, default=None)
    ap.add_argument("--bs", type=int, default=128)
    ap.add_argument("--threads", type=int, default=5)
    ap.add_argument("--size", type=int, default=64, help="input size for the ImageNet backbones")
    ap.add_argument("--bench", action="store_true", help="time a few batches and exit")
    a = ap.parse_args()
    torch.set_num_threads(a.threads)
    torch.manual_seed(0)
    np.random.seed(0)

    xtr, ytr = load_split("train")
    xva, yva = load_split("publicTest")
    model = build(a.model, size=a.size).to(memory_format=torch.channels_last)
    lr = a.lr or (1e-3 if a.model == "vggish" else 4e-4)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.05 if a.model == "vggish" else 1e-4)
    # Mild inverse-sqrt class weights: disgust is ~16x rarer than happy.
    counts = np.bincount(ytr, minlength=7)
    weights = torch.tensor((counts.max() / counts) ** 0.5, dtype=torch.float32)
    loss_fn = nn.CrossEntropyLoss(weight=weights / weights.mean(), label_smoothing=0.1)

    steps_per_epoch = math.ceil(len(xtr) / a.bs)
    total = steps_per_epoch * a.epochs
    warm = steps_per_epoch
    sched = torch.optim.lr_scheduler.LambdaLR(
        opt, lambda s: (s + 1) / warm if s < warm else 0.5 * (1 + math.cos(math.pi * (s - warm) / max(1, total - warm))))

    out = os.path.join(RUNS, a.model)
    os.makedirs(out, exist_ok=True)
    best, history = -1.0, []
    for ep in range(a.epochs):
        model.train()
        perm = np.random.permutation(len(xtr))
        t0, seen, run_loss = time.time(), 0, 0.0
        for i in range(0, len(perm), a.bs):
            idx = perm[i:i + a.bs]
            xb = augment(to_tensor(xtr[idx])).contiguous(memory_format=torch.channels_last)
            yb = torch.from_numpy(ytr[idx])
            loss = loss_fn(model(xb), yb)
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
            sched.step()
            seen += len(idx)
            run_loss += loss.item() * len(idx)
            if a.bench and seen >= a.bs * 6:
                print(f"{a.model}: {seen / (time.time() - t0):.0f} img/s -> ~{len(xtr) / (seen / (time.time() - t0)) / 60:.1f} min/epoch")
                return
        pva = predict(model, xva)
        s_acc, e_acc = state_accuracy(pva, yva), emotion_accuracy(pva, yva)
        history.append({"epoch": ep + 1, "loss": run_loss / seen, "val_state_acc": s_acc, "val_emotion_acc": e_acc,
                         "minutes": (time.time() - t0) / 60})
        flag = ""
        if s_acc > best:
            best = s_acc
            torch.save(model.state_dict(), os.path.join(out, "best.pt"))
            flag = "  *saved*"
        print(f"[{a.model}] epoch {ep + 1}/{a.epochs} loss {run_loss / seen:.3f}  val states {s_acc:.4f}  "
              f"val 7-class {e_acc:.4f}  ({(time.time() - t0) / 60:.1f} min){flag}", flush=True)
        json.dump({"model": a.model, "size": model.size, "best_val_state_acc": best, "history": history}, open(os.path.join(out, "history.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
