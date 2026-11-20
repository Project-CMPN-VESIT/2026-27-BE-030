# Facial emotion models for MindQuest

Optional camera sensing in MindQuest reads the player's facial expression during the games and the
questionnaire. This folder trains, evaluates and exports the models; the app runs them entirely in
the browser (`src/app/emotion/`). No video ever leaves the device.

## Result

On FER-2013's held-out **PrivateTest** split (3,589 faces never used for training or selection),
the shipped ensemble scores:

| | Accuracy |
|---|---|
| **App states (Stressed / Normal / Relaxed / Surprised)** | **81.9%** |
| 7 emotions | 69.9% |

For context, published models reach about 73–76% on FER-2013's 7 emotions, and human labellers
agree about 65% of the time. The app only needs the four states, so that is the target it is
measured against. Full tables, per-class recall and confusion matrices:
[results/metrics.md](results/metrics.md).

## What the app reports

The models predict FER-2013's 7 emotions. The app sums them into 4 states:

| State | Emotions |
|---|---|
| Stressed | angry, disgust, fear, sad |
| Normal | neutral |
| Relaxed | happy |
| Surprised | surprise |

In the Game Quest, the **"Facial stress under pressure"** component (0–15 points) compares the
average P(stressed) in the two timed games with the two untimed baseline games, so a naturally
serious resting face is not counted against the player. It needs at least 20 face frames in each
phase. With the camera off, the index is unchanged. On the questionnaire report, expressions are
shown for reflection only and never change the PHQ-9 or GAD-7 scores.

## Data

FER-2013 (ICML 2013 representation-learning challenge): 48×48 grayscale faces with 7 emotion
labels, research and educational use. It was downloaded from the Hugging Face mirror
`Aaryan333/fer2013_train_publicTest_privateTest`. That copy keeps the official splits, and
`prepare.py` checks its class counts against the published ones.

| Split | Faces | Used for |
|---|---|---|
| Training | 28,709 | training only |
| PublicTest | 3,589 | validation: best epoch, ensemble choice, ensemble weights |
| PrivateTest | 3,589 | final reported numbers only |

## Models

| Model | Input | Params | PrivateTest app states | Shipped |
|---|---|---|---|---|
| ResNet-18 (ImageNet-pretrained, fine-tuned) | 48→64 px | 11.2M | 80.3% | ✓ (weight 0.5) |
| Compact VGG-style CNN (from scratch) | 48 px | 1.2M | 80.9% | ✓ (weight 0.5) |
| MobileNetV3-Large (ImageNet-pretrained, fine-tuned) | 48→64 px | 4.2M | 76.9% | — |

**Inputs.** Every model takes the same input: a 48×48 grayscale face in [0, 1]. Resizing, channel
replication and normalisation live inside the exported graph.

**Training.**
- Augmentation: random zoom, shift, ±10° rotation, flip, brightness/contrast jitter, random
  erasing.
- Loss: label smoothing 0.1 with mild inverse-square-root class weights.
- Optimiser: AdamW with a cosine schedule.
- Run on CPU: 12–24 epochs, about 3.5 hours with the three models in parallel.

**Ensemble selection.**
- The rule: highest PublicTest app-state accuracy, preferring the smallest option within 0.1
  points.
- An earlier rule (the smallest option reaching 80% on PublicTest) chose ResNet-18 alone.
- It was replaced because ResNet-18 + CNN scored 1.06 points higher on PublicTest for 2.5 MB more
  download.
- Single-model PrivateTest scores were already known when the rule changed; the ensemble's was
  not. Both choices pass 80% on PrivateTest (80.3% and 81.9%).

## In the browser

`public/models/emotion/` holds:
- the two models, as ONNX with fp16-stored weights, 25 MB together;
- the UltraFace-slim-320 face detector (1.2 MB, MIT licence, see
  `assets/ULTRAFACE_LICENSE.txt`);
- `ensemble.json`, which describes how they fit together.

They run in a Web Worker with onnxruntime-web (single-threaded WASM, self-hosted) about three times
a second. Each frame:
1. The detector finds the face.
2. The face is cropped the way FER-2013 crops are framed: a square 1.04× the box's longer side,
   calibrated on FER faces.
3. The crop is converted to grayscale and resized to 48 px.
4. Each model runs on the crop and its mirror image, and the two models' outputs are averaged with
   equal weight.

Checks behind this setup:
- **Export:** the fp32 exports match PyTorch to about 2e-6, and fp16 storage changed no
  accuracy. The shipped files score 81.9% on PrivateTest.
- **End to end:** a full quest with a fake webcam showing FER test faces sampled about 3
  frames/s. Neutral faces read mostly Normal, negative faces mostly Stressed, and the games held
  60 fps.

## Limitations

- **An expression is not a feeling.** The model reads facial muscle patterns; it cannot know what
  someone feels, and people mask expressions.
- **Test images are not webcams.** 81.9% is on FER-2013's low-resolution web photos. Accuracy on
  a webcam in different lighting, angles or with glasses may be lower, and has not been measured
  on real users.
- **Weak spots.** Recall is weakest for Normal (65%), which is mostly confused with Stressed (sad),
  and for fear (43%) among the 7 emotions.
- **Label noise and bias.** FER-2013 labels are noisy, and its faces are not balanced across ages,
  skin tones or cultures. Accuracy may differ between groups; this was not measured.
- **Limited weight in the score.** For these reasons the facial component carries at most 15 of
  100 points, is baseline-relative, and is not clinically validated.

## Reproduce

```bash
cd ml/emotion
python -m venv --system-site-packages .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python prepare.py                              # download + verify FER-2013
.venv/Scripts/python train.py --model resnet18 --epochs 12   # likewise vggish (24), mobilenetv3 (14)
.venv/Scripts/python evaluate.py                             # select on PublicTest, report PrivateTest
.venv/Scripts/python export_onnx.py                          # write public/models/emotion/
```
