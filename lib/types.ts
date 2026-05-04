export type ModelVariant = 'phase0' | 'phase2' | 'phase4a' | 'phase4b';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  checks: Record<string, boolean>;
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
}

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
  used_llm: boolean;
  is_signed: boolean;
  signed_by: string | null;
  signed_at: string | null;
  signoff_note: string | null;
  created_at: string;
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
  // Override / supply fields when no finding_id (synthetic mode)
  hc_mm?: number;
  ga_str?: string;
  ga_weeks?: number;
  trimester?: string;
  reliability?: number;
  confidence_label?: string;
  elapsed_ms?: number;
}

export interface SignReportPayload {
  signed_by: string;
  signoff_note?: string;
}
