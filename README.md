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

The AI Findings panel renders three things beneath the reliability bar:

| | |
|---|---|
| **Overlay / Raw toggle** | *Overlay* animates the predicted skull contour on every frame — each labelled with its position in the loop (`9/16`) and its **own HC**, with the frame the still view measures outlined in amber and tagged `KEY FRAME`. *Raw* is the same loop with nothing drawn on it, so the prediction can be judged against what the model actually saw. |
| **HC stability sparkline** | Per-frame HC against the consensus (dashed red), with the spread in mm. This is what `reliability` is derived from, so a flat trace is the visible form of a high reliability score. |
| **Caption** | Changes with the selected view. |

Fields consumed from `InferResponse` (`lib/types.ts`): `cine_overlay_gif`,
`cine_loop_gif`, `cine_per_frame_hc`, `cine_frame_count`,
`cine_key_frame_index`.

Rendering is gated on `mode === 'cine_clip'` **and** at least one GIF being
present, so:

- single-frame results are completely unaffected;
- a backend that predates these fields, or that could not build an animation
  (`null`), renders nothing rather than a broken image;
- if only one of the two GIFs arrives, the panel pins to it instead of offering
  a dead tab.

Covered by `tests/e2e/cine-overlay.spec.ts` (8 cases, including the
one-GIF-only and too-little-HC-data paths).

> **Requires a backend that returns these fields.** They ship from
> `fetal-head-clinical-ai`, which deploys to a Hugging Face Space via that
> repo's `deploy-hf.yml` workflow. Until the Space has that build, cine mode
> shows the numbers with no animation — which is the `null` path above, not a
> bug in this app.

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
