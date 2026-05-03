# FetalScan AI — Build Status

## Architecture target

| Layer | Stack | Host |
|---|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui | Vercel |
| Backend | FastAPI + PyTorch models | HF Space (Docker SDK) |
| Database | SQLite (dev) → Postgres/Supabase (prod) | — |
| Auth | Mock single-user for demo | — |
| Reports | Claude Haiku LLM + reportlab PDF | — |
| Integration | FHIR R4 Observation + DICOM SR + HL7 v2 fallback | — |

## Batch progress

| Batch | Description | Repo | Status |
|---|---|---|---|
| 0 | CI scaffolding | both | ✅ Done |
| 1 | FastAPI alongside Streamlit (health, /infer, CORS, auth) | clinical-ai | 🔜 Next |
| 2 | Next.js scaffold replaces `index.html` | webapp | ⏳ Pending |
| 3 | Worklist + Study lifecycle (SQLite CRUD, seed data) | both | ⏳ Pending |
| 4 | Image upload → inference → canvas viewer | both | ⏳ Pending |
| 5 | XAI: GradCAM, MC-Dropout uncertainty, OOD surfaces | both | ⏳ Pending |
| 6 | Reports: real LLM generation, persisted, signed, PDF | both | ⏳ Pending |
| 7 | FHIR R4 + DICOM SR + comparison view | both | ⏳ Pending |
| 8 | Polish, demo seed (10 patients), E2E Playwright | both | ⏳ Pending |

## Current batch: 0

CI workflows added to both repos. All future batch PRs are gated by these test suites.

### webapp tests (Batch 0 baseline — 9 checks)
- `scripts/validate.mjs`: vercel.json validity, security headers, HTML structure,
  tab panels, JS navigation function, RUO disclaimer, HF Space embed, brand colour

### clinical-ai tests (Batch 0 baseline — 12 tests)
- `tests/test_ci_smoke.py`: pyproject parse, requirements format, app structure,
  Streamlit config, init file, secret scan, .gitignore model weight coverage
- `tests/test_shapes.py`: existing tensor/array shape tests
- `tests/conftest.py`: shared fixtures (ultrasound image, batch tensor, binary mask)

## Live links

- Vercel preview: https://fetal-head-webapp.vercel.app
- HF Space (Streamlit): https://tarunsadarla2606-fetal-head-clinical-ai.hf.space
