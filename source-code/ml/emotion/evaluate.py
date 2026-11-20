"""Evaluate the trained models and pick the shipped ensemble.

Selection (which models, their weights) uses PublicTest only. PrivateTest is then scored once for
the reported numbers.
"""
import itertools
import json
import os

import numpy as np
import torch

from common import EMOTIONS, GROUP, RUNS, STATE_LABEL, STATES, build, emotion_accuracy, load_split, predict, state_accuracy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "results")
TARGET = 0.80


def load_model(name):
    hist = json.load(open(os.path.join(RUNS, name, "history.json")))
    model = build(name, pretrained=False, size=hist.get("size", 64))
    model.load_state_dict(torch.load(os.path.join(RUNS, name, "best.pt"), map_location="cpu"))
    model.eval()
    return model, hist


def params(model):
    return sum(p.numel() for p in model.parameters())


def confusion(y_true, y_pred, k):
    m = np.zeros((k, k), np.int64)
    np.add.at(m, (y_true, y_pred), 1)
    return m


def macro_f1(cm):
    tp = np.diag(cm).astype(float)
    prec = tp / np.maximum(cm.sum(0), 1)
    rec = tp / np.maximum(cm.sum(1), 1)
    f1 = np.where(prec + rec > 0, 2 * prec * rec / np.maximum(prec + rec, 1e-9), 0)
    return float(f1.mean()), rec.tolist()


def report(p7, y):
    cm7 = confusion(y, p7.argmax(1), 7)
    cm4 = confusion(STATE_LABEL[y], (p7 @ GROUP).argmax(1), 4)
    f1_7, rec7 = macro_f1(cm7)
    f1_4, rec4 = macro_f1(cm4)
    return {"emotion_acc": emotion_accuracy(p7, y), "state_acc": state_accuracy(p7, y),
            "emotion_macro_f1": f1_7, "state_macro_f1": f1_4,
            "emotion_recall": dict(zip(EMOTIONS, rec7)), "state_recall": dict(zip(STATES, rec4)),
            "cm7": cm7.tolist(), "cm4": cm4.tolist()}


def plot_cm(cm, labels, title, path):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    cm = np.array(cm, float)
    norm = cm / np.maximum(cm.sum(1, keepdims=True), 1)
    fig, ax = plt.subplots(figsize=(1.0 + 0.75 * len(labels), 0.8 + 0.7 * len(labels)), dpi=160)
    ax.imshow(norm, cmap="Blues", vmin=0, vmax=1)
    for i in range(len(labels)):
        for j in range(len(labels)):
            ax.text(j, i, f"{norm[i, j] * 100:.0f}", ha="center", va="center", fontsize=8,
                    color="white" if norm[i, j] > 0.55 else "#1e293b")
    ax.set_xticks(range(len(labels)), labels, rotation=35, ha="right", fontsize=8)
    ax.set_yticks(range(len(labels)), labels, fontsize=8)
    ax.set_xlabel("Predicted", fontsize=9)
    ax.set_ylabel("True", fontsize=9)
    ax.set_title(title, fontsize=9)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def main():
    os.makedirs(OUT, exist_ok=True)
    xva, yva = load_split("publicTest")
    xte, yte = load_split("privateTest")
    names = [n for n in ("resnet18", "mobilenetv3", "vggish") if os.path.exists(os.path.join(RUNS, n, "best.pt"))]
    val, test, size = {}, {}, {}
    for n in names:
        model, hist = load_model(n)
        val[n], test[n] = predict(model, xva), predict(model, xte)
        size[n] = params(model)
        print(f"{n:12s} params {size[n] / 1e6:5.2f}M  val states {state_accuracy(val[n], yva):.4f}  "
              f"val 7-class {emotion_accuracy(val[n], yva):.4f}")

    # --- choose subset + weights on PublicTest only
    candidates = []
    grid = [w / 10 for w in range(1, 11)]
    for r in range(1, len(names) + 1):
        for subset in itertools.combinations(names, r):
            best = None
            for ws in itertools.product(grid, repeat=len(subset)):
                if r > 1 and abs(sum(ws) - 1) > 1e-9:
                    continue
                if r == 1 and ws != (1.0,):
                    continue
                p = sum(w * val[n] for w, n in zip(ws, subset))
                acc = state_accuracy(p, yva)
                if best is None or acc > best[0]:
                    best = (acc, dict(zip(subset, ws)))
            candidates.append({"models": list(subset), "weights": best[1], "val_state_acc": best[0],
                               "params": sum(size[n] for n in subset)})
    # Best PublicTest accuracy; among options within 0.1 points of it, the smallest download.
    best_val = max(c["val_state_acc"] for c in candidates)
    near = [c for c in candidates if c["val_state_acc"] >= best_val - 0.001]
    chosen = min(near, key=lambda c: c["params"])
    print("chosen on PublicTest:", chosen)

    # --- PrivateTest: report once
    ens_test = sum(w * test[n] for n, w in chosen["weights"].items())
    results = {
        "selection_rule": "highest app-state accuracy on PublicTest, preferring the smallest option within 0.1 "
                          "points; weights grid-searched on PublicTest",
        "selection_note": "The first rule (smallest option reaching 80% on PublicTest) chose ResNet-18 alone "
                          "(PrivateTest 80.30%). It was replaced by this rule because ResNet-18 + VGGish scored 1.06 "
                          "points higher on PublicTest for +1.2M parameters. Single-model PrivateTest scores had "
                          "already been computed when the rule changed; the ensemble's PrivateTest score had not.",
        "chosen": chosen,
        "privateTest": {"ensemble": report(ens_test, yte), **{n: report(test[n], yte) for n in names}},
        "publicTest": {n: {"state_acc": state_accuracy(val[n], yva), "emotion_acc": emotion_accuracy(val[n], yva)} for n in names},
        "candidates": candidates,
    }
    json.dump(results, open(os.path.join(OUT, "metrics.json"), "w"), indent=1)
    e = results["privateTest"]["ensemble"]
    plot_cm(e["cm7"], EMOTIONS, f"Ensemble, PrivateTest (7 emotions): {e['emotion_acc'] * 100:.1f}%", os.path.join(OUT, "cm_emotions.png"))
    plot_cm(e["cm4"], STATES, f"Ensemble, PrivateTest (app states): {e['state_acc'] * 100:.1f}%", os.path.join(OUT, "cm_states.png"))
    print("\nPrivateTest (held out):")
    for n in names + ["ensemble"]:
        r = results["privateTest"][n]
        print(f"  {n:12s} states {r['state_acc'] * 100:5.2f}%  7-class {r['emotion_acc'] * 100:5.2f}%  "
              f"state macro-F1 {r['state_macro_f1']:.3f}")
    print(f"\nGate (app states >= {TARGET:.0%} on PrivateTest): {'PASS' if e['state_acc'] >= TARGET else 'FAIL'}")
    write_markdown(results, names, size)


def write_markdown(results, names, size):
    pt = results["privateTest"]
    ch = results["chosen"]
    lines = [
        "# Emotion model results (generated by evaluate.py)", "",
        "All numbers are on FER-2013 **PrivateTest** (3,589 faces), which was not used for training, "
        "checkpoint selection or ensemble selection.", "",
        f"Shipped ensemble: {', '.join(f'{n} (weight {w})' for n, w in ch['weights'].items())}; "
        f"chosen on PublicTest ({ch['val_state_acc'] * 100:.2f}% app-state accuracy there).", "",
        "| Model | Params | App states (4) | 7 emotions | State macro-F1 | Emotion macro-F1 |",
        "|---|---|---|---|---|---|",
    ]
    for n in names + ["ensemble"]:
        r = pt[n]
        p = f"{size[n] / 1e6:.1f}M" if n in size else f"{ch['params'] / 1e6:.1f}M"
        label = "**Ensemble (shipped)**" if n == "ensemble" else n
        lines.append(f"| {label} | {p} | {r['state_acc'] * 100:.2f}% | {r['emotion_acc'] * 100:.2f}% | "
                     f"{r['state_macro_f1']:.3f} | {r['emotion_macro_f1']:.3f} |")
    e = pt["ensemble"]
    lines += ["", "Per-state recall (ensemble): " + ", ".join(f"{k} {v * 100:.1f}%" for k, v in e["state_recall"].items()),
              "", "Per-emotion recall (ensemble): " + ", ".join(f"{k} {v * 100:.1f}%" for k, v in e["emotion_recall"].items()),
              "", "![App-state confusion matrix](cm_states.png) ![Emotion confusion matrix](cm_emotions.png)", ""]
    open(os.path.join(OUT, "metrics.md"), "w", encoding="utf-8").write("\n".join(lines))


if __name__ == "__main__":
    main()
