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

### Cine mode shows an animated segmentation overlay

When a temporal variant is selected, the backend expands the uploaded frame
into a 16-frame cine-loop, runs the temporal model across the sequence, and
returns an animated GIF of the predicted skull contour drawn on every frame.

The AI Findings panel renders it beneath the reliability bar, captioned
*"Segmentation overlay across the clip."* — so the boundary can be watched
tracking the head through probe motion, instead of being judged from a single
still.

The GIF arrives as a `data:` URI in the `cine_overlay_gif` field of
`InferResponse` (`lib/types.ts`). Rendering is gated on **both**
`mode === 'cine_clip'` **and** the field being present, so:

- single-frame results are completely unaffected;
- an older backend, or one that could not build the animation (`null`), simply
  renders nothing rather than breaking the panel.

Covered by `tests/e2e/cine-overlay.spec.ts` in all three directions.

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
