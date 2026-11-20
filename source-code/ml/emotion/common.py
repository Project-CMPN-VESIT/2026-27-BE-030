"""Shared pieces for the FER-2013 emotion models: labels, app-state grouping, data, models, augmentation."""
import math
import os

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
RUNS = os.path.join(HERE, "runs")

# FER-2013 label order (as in the dataset).
EMOTIONS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
# The four states the app reports and scores. Each emotion belongs to exactly one state.
STATES = ["stressed", "normal", "relaxed", "surprised"]
STATE_OF = {"angry": "stressed", "disgust": "stressed", "fear": "stressed", "sad": "stressed",
            "neutral": "normal", "happy": "relaxed", "surprise": "surprised"}
# 7 -> 4 matrix: state probabilities = emotion probabilities @ GROUP
GROUP = np.zeros((7, 4), np.float32)
for i, e in enumerate(EMOTIONS):
    GROUP[i, STATES.index(STATE_OF[e])] = 1.0
STATE_LABEL = GROUP.argmax(1)            # emotion index -> state index


def load_split(name):
    d = np.load(os.path.join(DATA, f"{name}.npz"))
    return d["x"], d["y"]                # uint8 [N,48,48], int64 [N]


# ------------------------------------------------------------------ models
class VGGish(nn.Module):
    """Compact VGG-style CNN trained from scratch on 48x48 grayscale faces."""

    def __init__(self, width=(32, 64, 128, 256), n=7):
        super().__init__()
        layers, cin = [], 1
        for w in width:
            layers += [nn.Conv2d(cin, w, 3, padding=1, bias=False), nn.BatchNorm2d(w), nn.ReLU(inplace=True),
                       nn.Conv2d(w, w, 3, padding=1, bias=False), nn.BatchNorm2d(w), nn.ReLU(inplace=True),
                       nn.MaxPool2d(2), nn.Dropout(0.1)]
            cin = w
        self.features = nn.Sequential(*layers)
        self.head = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Dropout(0.4),
                                  nn.Linear(cin, 256), nn.ReLU(inplace=True), nn.Dropout(0.3), nn.Linear(256, n))

    def forward(self, x):
        return self.head(self.features(x))


class Wrapped(nn.Module):
    """Every model takes the same input: [N,1,48,48] grayscale in [0,1].

    Resizing, channel replication and normalisation live inside the model, so the browser only has
    to produce one 48x48 grayscale face crop for the whole ensemble.
    """

    def __init__(self, net, size, imagenet):
        super().__init__()
        self.net, self.size, self.imagenet = net, size, imagenet
        if imagenet:
            self.register_buffer("mean", torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1))
            self.register_buffer("std", torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1))

    def forward(self, x):
        if self.size != 48:
            x = F.interpolate(x, size=(self.size, self.size), mode="bilinear", align_corners=False)
        if self.imagenet:
            x = (x.expand(-1, 3, -1, -1) - self.mean) / self.std
        else:
            x = (x - 0.5) / 0.5
        return self.net(x)


def build(name, pretrained=True, size=64):
    import torchvision.models as tvm
    if name == "resnet18":
        net = tvm.resnet18(weights=tvm.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None)
        net.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(512, 7))
        return Wrapped(net, size, True)
    if name == "mobilenetv3":
        net = tvm.mobilenet_v3_large(weights=tvm.MobileNet_V3_Large_Weights.IMAGENET1K_V2 if pretrained else None)
        net.classifier[3] = nn.Linear(net.classifier[3].in_features, 7)
        return Wrapped(net, size, True)
    if name == "vggish":
        return Wrapped(VGGish(), 48, False)
    raise ValueError(name)


# ------------------------------------------------------------------ augmentation (batched, CPU-cheap)
def augment(x):
    """x: float [B,1,48,48] in [0,1]. Random zoom/shift/rotation/flip, photometric jitter, erasing."""
    b = x.shape[0]
    ang = (torch.rand(b) * 2 - 1) * math.radians(10)
    scale = 1 / torch.sqrt(torch.empty(b).uniform_(0.80, 1.0))      # random-resized-crop style zoom
    flip = torch.where(torch.rand(b) < 0.5, -1.0, 1.0)
    tx, ty = (torch.rand(b) * 2 - 1) * 0.08, (torch.rand(b) * 2 - 1) * 0.08
    cos, sin = torch.cos(ang) / scale, torch.sin(ang) / scale
    theta = torch.stack([torch.stack([cos * flip, -sin, tx], 1), torch.stack([sin * flip, cos, ty], 1)], 1)
    grid = F.affine_grid(theta, x.shape, align_corners=False)
    x = F.grid_sample(x, grid, mode="bilinear", padding_mode="reflection", align_corners=False)
    # brightness / contrast
    m = x.mean((2, 3), keepdim=True)
    x = (x - m) * torch.empty(b, 1, 1, 1).uniform_(0.7, 1.3) + m + torch.empty(b, 1, 1, 1).uniform_(-0.12, 0.12)
    x = x.clamp(0, 1)
    # random erasing on half the batch
    for i in torch.nonzero(torch.rand(b) < 0.5).flatten().tolist():
        h, w = np.random.randint(8, 20), np.random.randint(8, 20)
        y0, x0 = np.random.randint(0, 48 - h), np.random.randint(0, 48 - w)
        x[i, :, y0:y0 + h, x0:x0 + w] = torch.rand(1)
    return x


def to_tensor(x_uint8):
    return torch.from_numpy(x_uint8).float().div_(255).unsqueeze(1)


@torch.no_grad()
def predict(model, x_uint8, tta=True, bs=512):
    """7-class probabilities, averaged with a horizontal flip."""
    model.eval()
    out = []
    for i in range(0, len(x_uint8), bs):
        xb = to_tensor(x_uint8[i:i + bs])
        p = F.softmax(model(xb), 1)
        if tta:
            p = (p + F.softmax(model(torch.flip(xb, dims=[3])), 1)) / 2
        out.append(p)
    return torch.cat(out).numpy()


def state_accuracy(probs7, y):
    return float(((probs7 @ GROUP).argmax(1) == STATE_LABEL[y]).mean())


def emotion_accuracy(probs7, y):
    return float((probs7.argmax(1) == y).mean())
