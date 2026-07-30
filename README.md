# FetalScan AI — Webapp

Next.js 15 (App Router) clinical decision-support frontend for automated fetal
head circumference measurement. Deployed on Vercel; talks to the FastAPI
inference backend at
[`fetal-head-clinical-ai`](https://github.com/TarunSadarla2606/fetal-head-clinical-ai),
hosted on a Hugging Face Space.

⚠️ **Research prototype. Not FDA-cleared. Not CE-marked. Not for clinical use.**

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Tests | `scripts/validate.mjs` (static checks) + Playwright E2E |
| Host | Vercel |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run type-check` | `tsc --noEmit` |
| `npm run validate` | Static structural checks (no install needed) |
| `npm run test:e2e` | Playwright E2E specs |

The backend URL lives in `lib/api.ts` (`API_BASE`). Set `NEXT_PUBLIC_API_KEY`
if the backend has API-key auth enabled.

## Model variants

The model selector offers four backend variants. Two are **static**
(single-frame) and two are **temporal** (cine-loop):

| Variant | Label | Mode returned |
|---|---|---|
| `phase0` | Standard | `single_frame` |
| `phase4a` | Express | `single_frame` |
| `phase2` | Standard · Cine Loop | `cine_clip` |
| `phase4b` | Express · Cine Loop | `cine_clip` |

### Cine mode shows the animated loop

There is only ever **one kind of input — a static frame.** When a temporal
variant is selected the backend synthesises a 16-frame cine-loop from it
(Pseudo-LDDM v2: probe motion + speckle + depth attenuation) and runs the
temporal model across the whole sequence. Nothing extra needs to be uploaded.

The animation lives in its own **central viewer tab**, alongside Image View and
XAI Explanations, so it gets the middle of the screen rather than a 288 px
sidebar (`components/CineView.tsx`):

| | |
|---|---|
| **Overlay / Raw toggle** | *Overlay* animates the predicted skull contour on every frame — each labelled with its position in the loop (`9/16`) and its **own HC**, with the frame Image View measures outlined in amber and tagged `KEY FRAME`. *Raw* is the same loop with nothing drawn on it, so the prediction can be judged against what the model actually saw. |
| **HC stability chart** | Per-frame HC against the consensus (dashed red), with the spread and σ in mm, plus axis labels. `reliability` is derived from exactly this spread, so a flat trace is the visible form of a high reliability score. |

The AI Findings sidebar keeps a one-line pointer to the tab rather than a
miniature copy.

Fields consumed from `InferResponse` (`lib/types.ts`): `cine_overlay_gif`,
`cine_loop_gif`, `cine_per_frame_hc`, `cine_frame_count`,
`cine_key_frame_index`.

The tab is enabled only when `mode === 'cine_clip'` **and** at least one GIF is
present, so:

- single-frame results leave it disabled with an explanatory tooltip;
- a backend predating these fields, or one that could not build an animation
  (`null`), disables it rather than showing an empty panel;
- if only one of the two GIFs arrives, the view pins to it instead of offering a
  dead toggle;
- re-running with a static variant while the tab is open falls back to Image
  View instead of stranding you on a blank panel.

Covered by `tests/e2e/cine-overlay.spec.ts` (9 cases).

> **Requires a backend that returns these fields.** They ship from
> `fetal-head-clinical-ai`, which deploys to a Hugging Face Space via that
> repo's `deploy-hf.yml` workflow.

### RAG Q&A — "Ask about this result"

An **Ask** viewer tab (fourth, beside Image View / XAI / Cine Loop) lets you ask
free-text questions about the current measurement. Answers come from
`POST /findings/{id}/ask` and are grounded in the backend's curated reference
material plus that measurement's numbers.

What the panel shows, and why:

| | |
|---|---|
| **Answer** | Prose with inline `[file.md § Heading]` citations. |
| **Reference material supplied to the model** | Every retrieved chunk, expandable to its **full verbatim text**, with its similarity score. A citation label alone is only a claim about sourcing — showing the text is what makes the answer checkable. |
| **Cited highlighting** | Chunks the answer actually used are outlined; the rest were retrieved but unused. |
| **Ungrounded banner** | When retrieval found nothing, the question was *declined* — the model was never called. |
| **Provisional banner** | A cited reference section is not yet verbatim-sourced. |
| **Disclaimer** | Rendered from the API response, not hardcoded. |

The tab is disabled until a real (non-synthetic) `finding_id` exists, the same
gate the XAI tab uses. Since findings are held in memory server-side, a
container restart invalidates them — re-run the analysis to ask again.

Covered by `tests/e2e/rag-qa.spec.ts` (9 cases, including the declined,
fallback and request-failure paths).

## Layout

```
app/            App Router entry points + global CSS
components/     Workstation UI (viewer, worklist, findings, reports, XAI)
lib/            API client, shared types, demo data + scenarios
scripts/        validate.mjs structural checks
tests/e2e/      Playwright specs + shared API mocks
```

---

*Independent research · MS Artificial Intelligence (Biomedical Concentration) · University of North Texas · 2026*
*Tarun Sadarla · tarunsadarla26@gmail.com*
