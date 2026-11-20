# PsychTriage / MindQuest

Capstone project (BE, 2026–27), Group 30 — Big Data Analytics and Machine Learning.
Project mentor: Mrs. Sujata Khandaskar.

A mobile-first mental-health triage app that combines a game-based anxiety assessment
(with optional on-device facial emotion recognition), PHQ-9 / GAD-7 screening, and a
real-time AI voice companion with cross-session memory.

Live app: https://mind-quest-project.vercel.app

## Repository contents

| Folder | Contents |
| --- | --- |
| [`source-code/`](source-code/) | Complete application source — React + Vite frontend, FastAPI backend and emotion-model training, with full commit history |
| [`reports/sem-7/`](reports/sem-7/) | Capstone Project Report, Semester VII (black book) — PDF and DOCX |
| [`logbook/sem-7/`](logbook/sem-7/) | Capstone Project Logbook, Semester VII — PDF and DOCX |
| [`research-paper/`](research-paper/) | Research paper — PDF and DOCX |
| [`research-paper/submission/`](research-paper/submission/) | Submission confirmation — E2A 2027 (6th International Conference on Emerging Electronics & Automation), Paper ID 383 |
| [`research-paper/plagiarism-report/`](research-paper/plagiarism-report/) | Turnitin similarity report for the paper |
| [`research-paper/ai-detection-report/`](research-paper/ai-detection-report/) | Turnitin AI-detection report for the paper |
| [`presentations/`](presentations/) | Review presentation (PPT) |
| [`video/`](video/) | Video presentation — 3-minute demo with voiceover |

## Running the project

Setup instructions are in [`source-code/README.md`](source-code/README.md), and
free-tier deployment steps are in [`source-code/DEPLOYMENT.md`](source-code/DEPLOYMENT.md).
The facial emotion models (FER-2013 ensemble, 81.9% on the held-out test set for the
app's four expression states) are documented in
[`source-code/ml/emotion/README.md`](source-code/ml/emotion/README.md).
