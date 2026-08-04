export type ModelVariant = 'phase0' | 'phase2' | 'phase4a' | 'phase4b';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  checks: Record<string, boolean>;
  // Batch 8.3 — composite image-quality score + label + raw blur metric
  quality_score?: number;
  quality_label?: 'poor' | 'suboptimal' | 'good' | 'excellent';
  blur_score?: number;
}

export interface InferResponse {
  finding_id: string;
  hc_mm: number | null;
  ga_str: string | null;
  ga_weeks: number | null;
  trimester: string;
  reliability: number;
  hc_std_mm: number;
  confidence_label: string;
  confidence_color: string;
  elapsed_ms: number;
  mode: string;
  validation: ValidationResult;
  ood_flag: boolean;
  ood_reasons: string[];
  mask_b64: string;
  overlay_b64: string;
  /**
   * Animated GIF (`data:image/gif;base64,...`) of the predicted segmentation
   * contour on every frame of the cine-loop, each frame labelled with its
   * index and its own HC, with the key frame marked. Present only when
   * `mode === 'cine_clip'` (temporal variants phase2 / phase4b), and null if
   * the backend could not build the animation.
   */
  cine_overlay_gif?: string | null;
  /** Raw synthesised cine-loop with no prediction drawn on it. Same nullability. */
  cine_loop_gif?: string | null;
  /** Per-frame HC in mm, aligned with frame index; null where unmeasurable. */
  cine_per_frame_hc?: (number | null)[] | null;
  /** Frames in the synthesised loop. */
  cine_frame_count?: number | null;
  /** Index of the frame `overlay_b64` is rendered from, marked in the GIF. */
  cine_key_frame_index?: number | null;
}

export interface OodReason {
  category: string;
  detail: string;
}

export interface OodReport {
  ood_flag: boolean;
  score: number;
  reasons: OodReason[];
  stats: Record<string, number>;
}

export interface Study {
  id: string;
  patientName: string;
  studyDate: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  findings?: InferResponse;
  imageDataUrl?: string;
  isDemo?: boolean;
  demoImagePath?: string;
  errorMessage?: string;
  analyzedAt?: string;
  isSynthetic?: boolean;
  /** Pixel spacing from HC18 CSV — auto-applied when this demo is selected. */
  demoPixelSpacingMm?: number;
  /** Ground-truth HC from HC18 CSV — shown alongside AI prediction for demo subjects. */
  hcReferenceMm?: number;
}

export interface CompareResult {
  variant: ModelVariant;
  label: string;
  status: 'analyzing' | 'done' | 'error';
  findings?: InferResponse;
  error?: string;
}

export interface SavedReport {
  id: string;
  patientName: string;
  studyDate: string;
  analyzedAt: string;
  hcMm: number;
  gaStr: string;
  gaWeeks: number;
  trimester: string;
  reliability: number;
  confidenceLabel: string;
  model: ModelVariant;
  // Extended clinical fields
  referringPhysician?: string;
  patientId?: string;
  patientDob?: string;
  lmp?: string;
  orderingFacility?: string;
  sonographerName?: string;
  clinicalIndication?: string;
  usApproach?: 'transabdominal' | 'transvaginal';
  imageQuality?: 'optimal' | 'suboptimal' | 'limited';
  reportMode?: 'template' | 'llm';
  fetalPresentation?: FetalPresentation;
  bpdMm?: number;
  priorBiometry?: string;
}

export type FetalPresentation = 'cephalic' | 'breech' | 'transverse' | 'not_assessed';

// ─── Batch 6: Reports API ─────────────────────────────────────────────────────

// Mirrors ReportResponse in app/api/schemas.py — keep field names in sync.
export interface ApiReport {
  id: string;
  study_id: string;
  finding_id: string | null;
  patient_name: string;
  study_date: string;
  model: ModelVariant;
  hc_mm: number | null;
  ga_str: string | null;
  ga_weeks: number | null;
  trimester: string | null;
  reliability: number | null;
  confidence_label: string | null;
  pixel_spacing_mm: number | null;
  elapsed_ms: number | null;
  narrative_p1: string | null;
  narrative_p2: string | null;
  narrative_p3: string | null;
  narrative_impression: string | null;
  used_llm: boolean;
  is_signed: boolean;
  signed_by: string | null;
  signed_at: string | null;
  signoff_note: string | null;
  created_at: string;
  // Extended clinical fields
  referring_physician: string | null;
  patient_id: string | null;
  patient_dob: string | null;
  lmp: string | null;
  ordering_facility: string | null;
  sonographer_name: string | null;
  clinical_indication: string | null;
  us_approach: string | null;
  image_quality: string | null;
  pixel_spacing_dicom_derived: boolean;
  pixel_spacing_source: 'DICOM' | 'CSV' | 'USER' | null;
  report_mode: 'template' | 'llm';
  accession_number: string | null;
  original_image_b64: string | null;
  overlay_image_b64: string | null;
  gradcam_image_b64: string | null;
  fetal_presentation: string | null;
  bpd_mm: number | null;
  prior_biometry: string | null;
  is_combined?: boolean;
  combined_models_json?: string | null;
}

// ─── Combined multi-model report (Batch 6.4) ─────────────────────────────────

export interface CombinedFinding {
  model: ModelVariant;
  finding_id?: string;
  hc_mm?: number;
  ga_str?: string;
  ga_weeks?: number;
  trimester?: string;
  reliability?: number;
  confidence_label?: string;
  elapsed_ms?: number;
}

export interface CreateCombinedReportPayload {
  findings: CombinedFinding[];   // 2–4 entries
  patient_name: string;
  study_date: string;
  pixel_spacing_mm?: number;
  pixel_spacing_dicom_derived?: boolean;
  pixel_spacing_source?: 'DICOM' | 'CSV' | 'USER';
  referring_physician?: string;
  patient_id?: string;
  patient_dob?: string;
  lmp?: string;
  ordering_facility?: string;
  sonographer_name?: string;
  clinical_indication?: string;
  us_approach?: 'transabdominal' | 'transvaginal';
  image_quality?: 'optimal' | 'suboptimal' | 'limited';
  report_mode?: 'template' | 'llm';
  fetal_presentation?: FetalPresentation;
  bpd_mm?: number;
  prior_biometry?: string;
}

export interface ApiAuditEntry {
  id: string;
  report_id: string;
  action: string;
  actor: string | null;
  ip: string | null;
  user_agent: string | null;
  details: string | null;
  timestamp: string;
}

export interface CreateReportPayload {
  finding_id?: string;
  patient_name: string;
  study_date: string;
  model: ModelVariant;
  pixel_spacing_mm?: number;
  pixel_spacing_dicom_derived?: boolean;
  pixel_spacing_source?: 'DICOM' | 'CSV' | 'USER';
  // Override / supply fields when no finding_id (synthetic mode)
  hc_mm?: number;
  ga_str?: string;
  ga_weeks?: number;
  trimester?: string;
  reliability?: number;
  confidence_label?: string;
  elapsed_ms?: number;
  // ACR/AIUM/ESR-compliant clinical fields
  referring_physician?: string;
  patient_id?: string;
  patient_dob?: string;
  lmp?: string;
  ordering_facility?: string;
  sonographer_name?: string;
  clinical_indication?: string;
  us_approach?: 'transabdominal' | 'transvaginal';
  image_quality?: 'optimal' | 'suboptimal' | 'limited';
  report_mode?: 'template' | 'llm';
  fetal_presentation?: FetalPresentation;
  bpd_mm?: number;
  prior_biometry?: string;
}

export interface SignReportPayload {
  signed_by: string;
  signoff_note?: string;
}

// ─── Retrieval-grounded Q&A ───────────────────────────────────────────────────

/** One reference chunk the answer was grounded in. */
export interface RetrievedChunk {
  citation: string;
  source_file: string;
  heading: string;
  /** The chunk text the model was given, verbatim — shown so the answer can be checked. */
  text: string;
  score: number;
  /** Reference text not yet verified against the primary source. */
  provisional: boolean;
  source_note?: string | null;
}

export interface AskResponse {
  finding_id: string;
  question: string;
  answer: string;
  /** Citations the answer actually used, not everything retrieved. */
  citations: string[];
  chunks: RetrievedChunk[];
  /** False when retrieval found nothing — the model is not called and the answer is a refusal. */
  grounded: boolean;
  /** False when the answer came from a fallback (no API key, or the call failed). */
  used_llm: boolean;
  /**
   * Why the model call failed, when it did. Null when it succeeded or was never
   * attempted (no key, nothing retrieved). Server-side redacted. Shown verbatim:
   * "generation failed" with no reason is not something anyone can act on.
   */
  llm_error?: string | null;
  any_provisional: boolean;
  disclaimer: string;
}

/** One tool the escalation agent chose to invoke, and what came back. */
export interface EscalationToolCall {
  tool: string;
  /** Why the agent decided this call was warranted. */
  reason: string;
  result: Record<string, unknown>;
  error?: string | null;
}

/** Verdict on whether a measurement can be trusted, from POST /findings/{id}/escalate. */
export interface EscalationResponse {
  finding_id: string;
  decision: 'ACCEPT' | 'RE_CHECK' | 'FLAG_FOR_REVIEW';
  badge_color: 'green' | 'amber' | 'red';
  /** Rule-based reasoning. Always present — it does not depend on the LLM. */
  rationale: string;
  /** Plain-language rewrite. Null when the model was unavailable. */
  justification?: string | null;
  justification_error?: string | null;
  used_llm: boolean;
  signals: {
    mode: string;
    hc_mm: number | null;
    reliability: number | null;
    hc_std_mm: number | null;
    hc_range_mm: number | null;
    measurable_frames: number;
    has_consistency_signal: boolean;
  };
  /** Empty when the agent decided without using a tool. */
  tool_calls: EscalationToolCall[];
  thresholds: Record<string, number>;
  disclaimer: string;
}

/** Measured description of a saliency map, from POST /findings/{id}/xai/ask. */
export interface AttributionSummary {
  method: string;
  concentration: number;
  concentration_label: string;
  focused_area_pct: number;
  peak_region: string;
  peak_xy_pct: [number, number];
  top_regions: { region: string; share: number; mean_intensity: number }[];
  /** Null when no segmentation mask was available to relate attribution to. */
  on_boundary_pct: number | null;
  inside_head_pct: number | null;
  outside_head_pct: number | null;
  mask_available: boolean;
}

export interface XaiAskResponse {
  finding_id: string;
  question: string;
  method: string;
  answer: string;
  /** The measurements the answer was grounded in — returned so it can be checked. */
  summary: Partial<AttributionSummary>;
  /** False when no attribution could be computed; the model is not called. */
  grounded: boolean;
  used_llm: boolean;
  llm_error?: string | null;
  disclaimer: string;
}
