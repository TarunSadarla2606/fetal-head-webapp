export type ModelVariant = 'phase0' | 'phase2' | 'phase4a' | 'phase4b';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  checks: Record<string, boolean>;
}

export interface InferResponse {
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

export interface Study {
  id: string;
  patientName: string;
  studyDate: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  findings?: InferResponse;
  imageDataUrl?: string;
  isDemo?: boolean;
  demoImagePath?: string;
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
