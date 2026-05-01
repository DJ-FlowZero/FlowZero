# FlowZero

A portable context-calibration tool for reducing explanation cost and increasing aligned execution across human and digital systems.

**One-liner:** Zero-resistance workflows. Structured context. Any AI. Any language.

---

## Onboarding — Read This First

This project uses the **MAP principle** (Munchhausen Architecture Principle): the system is reconstructable from its own documentation alone. All architecture decisions, data models, workflows, and terminology are documented in `public/fz_txt/`.

**Start here — read in order:**

| File | Purpose |
|------|---------|
| `FZ_01_AI_ServCon.txt` | AI session contract — how HUM/AI collaboration works in this project |
| `FZ_02_Appdocu.txt` | Full app documentation — start here for system understanding |
| `FZ_03_AppStructure.txt` | Directory layout, data model, key utilities, workflows |
| `FZ_04_CodePlan.txt` | Build history and next steps |
| `FZ_05_UseCases.txt` | Reference use cases (SeeingAI, BuildingMaintenance) |
| `FZ_06_CCML_Spec.txt` | CCML 1.0 specification — context markup language |
| `FZ_88_App_Glossary.txt` | All defined terms — read if a word is unfamiliar |
| `FZ_99_DailyBlog.txt` | Daily learnings log |

After reading FZ_02 and FZ_03 you have enough to build. The rest is context.

---

## Quick Start

```bash
npm install
npm run dev
```

Or: open a terminal and run `start meup` (runs `meup.bat`, which wraps `npm run dev`).

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

---

## Stack

- **Frontend:** React + Vite (src/)
- **Backend:** Node.js + Express (backend.cjs, port 3001)
- **Data:** Local JSON files in public/Gestalt/
- **Config:** public/config.json — `FZ_GPATH` controls the Gestalt directory path

---

## Key Concepts

- **Gestalt** — full context field for a subject (profile + tokens + stickies)
- **PUCK** — pruned, compiled, portable constraint surface exported for AI priming
- **BioLogic** — explicit behavioral operating system made machine-readable via Flow Calibration
- **CCML** — 7-primitive markup: `[token]` `{type}` `::` `<flag>` `//note` `@trigger` `#tag`

Full glossary: `public/fz_txt/FZ_88_App_Glossary.txt`
