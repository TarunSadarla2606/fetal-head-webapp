# FetalScan AI — Demo Guide

> Audience: BrightHeart, GE HealthCare Ultrasound, Philips Ultrasound,
> BioticsAI, and similar fetal-imaging / clinical-AI evaluators.
> Estimated walkthrough: **8–12 minutes** end-to-end.
>
> **Research use only.** Not cleared for clinical diagnosis.

---

## 1. What this is

A working clinical-AI workflow for fetal head circumference (HC)
biometry, end-to-end:

- **4 model variants** trained on the HC18 cohort (Radboud UMC) —
  static (single-frame) and cine (16-frame temporal), each with a
  baseline and a structurally-pruned compressed deployment variant.
- **AIUM/ACR-style structured PDF reports** with patient identifiers,
  technical parameters, biometric findings, growth-curve chart,
  clinical impression, plain-English interpretation, AI validation
  summary, sign-off block, and per-page footer with Page N of M.
- **Multi-reader consensus** — pick 2–4 model variants, run them in
  parallel on the same image, get a combined PDF with a Consensus
  column, an Inter-Model Agreement section, and a per-model performance
  profile.
- **Hospital interoperability** — every report exports as a FHIR R4
  Bundle (DiagnosticReport + LOINC-coded Observations) and as a DICOM
  Comprehensive SR (.dcm) for direct PACS / EHR ingestion. A mock
  C-STORE upload endpoint is provided for round-trip interop testing.
- **Sign-off + audit log** — DRAFT watermark on unsigned PDFs, removed
  on sign-off; verifying-observer block populated in the DICOM SR;
  append-only audit log captures actor IP / user-agent.
- **Longitudinal growth chart** — patient HC plotted on the Hadlock
  1984 reference curve with the population ±2 SD band; multi-visit
  trends across studies via patient-id matching.

Everything is RUO and demonstrates infrastructure / clinical-workflow
fluency — not a regulatory-cleared device.

---

## 2. The 8-minute walkthrough

### 2.1 Landing page (1 min)

Open the URL. You'll see a dark marketing page with:

- Headline metrics: 97.75% Dice on the HC18 199-image held-out cohort,
  1.65 mm MAE (well below the ISUOG ±3 mm clinical-acceptability
  threshold), 4 model variants, 43.7% parameter reduction in the
  compressed variants.
- Features grid: segmentation + HC, Grad-CAM++ explainability, multi-
  model consensus, AIUM/ACR PDF, longitudinal chart, sign-off + audit.
- Hospital interoperability section: FHIR R4 / DICOM SR / mock C-STORE.
- Compliance section listing the references each report cites:
  HC18, ISUOG 2010 Practice Guidelines, Hadlock 1984 (AJR 143:97-100),
  Naegele's rule, ACOG/ISUOG &gt;14 d discordance flag.

Click **Open Demo** in the hero.

### 2.2 Worklist + single-model inference (2 min)

The worklist sidebar pre-populates with curated patients (Sarah
Thompson, Maria Santos, Aisha Patel, Linda Chen, Jessica Brown, Emily
Davis, Olivia Johnson, Priya Kumar, Hannah Garcia, Grace Williams).

**Pick `demo-001` Sarah Thompson** for the normal walkthrough.

1. The pixel-spacing field auto-applies the HC18 CSV value (0.154 mm/px)
   with a teal "✓ CSV verified" badge — reviewers immediately see that
   the spacing isn't user-guessed.
2. Click **Run AI**. The model runs on the loaded HC18 image.
3. The AI Findings panel (right) populates with HC mm, GA (Hadlock
   1984), trimester, reliability, and a colour-tiered **image-quality
   badge** (excellent / good / suboptimal / poor) computed from
   Laplacian variance + contrast + brightness + resolution.
4. Open the Image View / XAI tabs in the centre viewer. The **Grad-CAM++
   overlay** shows which image regions drove the segmentation —
   compare against the predicted boundary.

### 2.3 Save to Reports + PDF (2 min)

1. Click **Save to Reports**. A modal opens with three sections:
   - **Report mode** toggle: Automated Template / AI-Authored
     (Claude Haiku for narrative paragraphs).
   - **Demo Mode** scenario tabs (A / B / C) — one click pre-fills
     realistic clinical context (patient name, MRN, LMP, indication,
     image quality, fetal lie). Useful for quick walkthroughs.
   - **AI Analysis Results** auto-filled, read-only: HC, GA, confidence,
     reliability — all from the inference response, no manual entry.
2. Submit. The Reports tab opens at the bottom with the new row.
3. Click **PDF** to download the structured report. Notice:
   - **DRAFT — UNSIGNED** watermark (large, 45° rotated, semi-
     transparent).
   - 5-page layout: Patient/Exam → Biometric Findings + growth chart →
     Images (orig / overlay / Grad-CAM) + Impression + Interpretation →
     AI System Validation + Interpretation for clinicians + Sign-off
     placeholder + Regulatory → Methods Appendix.
   - Per-page footer: `Patient: Sarah Thompson · Accession: FHC-… ·
     Page 3 of 5`.
4. Click **FHIR** — downloads `report-…fhir.json`. Open it; it's a
   FHIR R4 collection Bundle with a DiagnosticReport (LOINC 42148-7)
   referencing one Observation per measurement: HC (LOINC 11779-6),
   BPD (11820-2), GA (18185-9). `status: preliminary` until sign-off.
5. Click **DICOM** — downloads `report-…dcm`. SOP Class
   1.2.840.10008.5.1.4.1.1.88.33 (Comprehensive SR). Opens cleanly in
   DCMTK (`dcmdump`), Weasis, OHIF.

### 2.4 Sign-off (1 min)

1. Click **Sign** on the DRAFT row.
2. Enter `Dr. Smith` and a verification note.
3. Re-download the PDF — the DRAFT watermark is gone, replaced by a
   Clinical Sign-off block with `Dr. Smith` and an ISO timestamp.
4. Re-download the DICOM — `CompletionFlag` flips to `COMPLETE`,
   `VerificationFlag` to `VERIFIED`, `PreliminaryFlag` to `FINAL`,
   and `VerifyingObserverSequence` is populated with `Dr. Smith`.
5. The audit log captures the sign-off event with actor IP and
   user-agent (visible at `GET /reports/{id}/audit`).

### 2.5 Multi-model consensus (2 min)

1. From the toolbar, click **Compare Models · 4 ▾**. Pick 2–4 variants.
   Try **Phase 0 (Standard)** and **Phase 4a (Express)** to start.
2. Click **Run Comparison**. The Compare grid runs both models in
   parallel and renders one cell per model with **Overlay / Grad-CAM**
   toggles per cell.
3. Click **Save Combined Report**. The combined modal carries one
   read-only auto-fill card per selected model.
4. Generate. The combined PDF:
   - Multi-Model Biometric Comparison table with per-model columns +
     a tinted Consensus column (mean ± std).
   - Per-model image strips (orig / overlay / Grad-CAM, 38 mm height
     so 2–4 rows fit on one page).
   - Inter-Model Agreement section with HC range, std dev, outlier
     flag (any model >5 mm from consensus).
   - "Inter-model comparison summary" plain-English paragraph that
     reads agreement statistics, classifies as excellent / good /
     moderate against the ±3 mm ISUOG threshold, and recommends a
     model class for routine use given the trade-offs.
   - Per-model AI System Validation table with one "Interpretation
     for clinicians" paragraph per model.

### 2.6 Abnormal cases (1 min)

Three of the ten seeded patients exercise clinically-interesting
flagged paths:

| Study | Patient | Indication | Expected reading |
|---|---|---|---|
| `demo-002` | Maria Santos | MFM referral, suspected microcephaly | HC ~12 % below population mean for 22w4d → microcephaly impression |
| `demo-005` | Jessica Brown | HC > expected by fundal height | HC ~12 % above mean for 34w4d → macrocephaly impression |
| `demo-008` | Priya Kumar | Small for dates, R/O FGR | HC <10th percentile for 24w4d → IUGR impression |

Open `demo-008`. The growth chart in the PDF places the patient point
clearly below the lower ±2 SD band; the impression copy recommends
umbilical artery Doppler and weekly biophysical profile. Run the same
study with the cine variant (Phase 4b) — temporal aggregation reduces
frame-to-frame variance in the consensus measurement.

### 2.7 Longitudinal view (30 s)

Click the **Growth** button on any saved report row. A modal opens
showing the patient's HC plotted on the same Hadlock reference curve
across all their studies. Currently shows one point per saved report
(more once Batch 9 longitudinal seed is added).

### 2.8 Keyboard shortcuts (10 s)

Press `?`. The cheatsheet overlay shows:

| Key | Action |
|-----|--------|
| `j` | Next study in worklist |
| `k` | Previous study |
| `s` | Open Reports panel |
| `?` | Toggle cheatsheet |
| `Esc` | Dismiss overlay |

---

## 3. What to look for / discussion prompts

| Reviewer concern | Where it shows up |
|---|---|
| Regulatory-grade PDF layout | Per-page footer (Page N of M), AIUM/ACR sections, Regulatory disclaimer, DRAFT → Signed transition |
| Clinical-empathy language | "Interpretation for clinicians" paragraph below every AI System Validation table — static + temporal + baseline + compressed phrasing |
| Compression-as-deployment story | Phase 4a / 4b panels in the marketing landing + the per-model Methods Appendix |
| Hospital interoperability | FHIR / DICOM / C-STORE buttons next to every report row |
| Sign-off audit | DRAFT watermark, VerifyingObserverSequence, audit log with IP / UA |
| Growth-curve / population norms | Hadlock 1984 mean curve + ±2 SD band in PDF + on-screen modal |
| Multi-reader consensus pattern | Combined report's per-model + Consensus columns + Inter-Model Agreement + comparison summary paragraph |
| Demo-quality images | Quality badge tiers + 7-check input validation + OOD banner |

---

## 4. Architecture in one paragraph

Frontend: Next.js 15 (App Router), React 19, Tailwind, lucide-react.
Backend: FastAPI on Hugging Face Spaces, SQLite for reports + audit +
C-STORE log, ReportLab for PDFs (with a custom canvasmaker for the
Page N of M footer + watermark), pydicom for DICOM SR generation,
hand-rolled FHIR R4 JSON. Models: PyTorch ResidualUNetDS (static) and
TemporalFetaSegNet (cine, 8-head 256-dim self-attention over 16
frames). Compressed variants produced by Hybrid Crossover channel
merging + Knowledge-Distillation recovery. Tests: pytest 178/178
passing on the inference container, Playwright happy + OOD E2E specs
on the webapp.

---

## 5. Repo links

- **Webapp** (this repo) — `tarunsadarla2606/fetal-head-webapp`,
  branch `claude/batch6-reports`. Vercel-deployed.
- **Inference / API container** — `tarunsadarla2606/fetal-head-clinical-ai`,
  branch `claude/batch6-reports`. Deployed to a public Hugging Face
  Space.

Both repos: same branch, same versioning, same commit-message
convention. PRs are draft until reviewed.
