import type {
  ApiAuditEntry,
  ApiReport,
  CreateCombinedReportPayload,
  CreateReportPayload,
  InferResponse,
  ModelVariant,
  OodReport,
  SignReportPayload,
} from './types';

export const API_BASE = 'https://tarunsadarla2606-fetal-head-clinical-ai-api.hf.space';

export interface HealthResponse {
  status: string;
  version: string;
  models_available: string[];
  device: string;
}

export async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return res.json() as Promise<HealthResponse>;
  } catch {
    return null;
  }
}

export async function runInference(params: {
  image: File;
  pixelSpacingMm: number;
  threshold?: number;
  modelVariant?: ModelVariant;
  apiKey?: string;
}): Promise<InferResponse> {
  const form = new FormData();
  form.append('image', params.image);
  form.append('pixel_spacing_mm', String(params.pixelSpacingMm));
  if (params.threshold !== undefined) form.append('threshold', String(params.threshold));
  if (params.modelVariant) form.append('model_variant', params.modelVariant);

  const headers: HeadersInit = {};
  const key = params.apiKey ?? (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_KEY : '') ?? '';
  if (key) headers['X-API-Key'] = key;

  const res = await fetch(`${API_BASE}/infer`, {
    method: 'POST',
    body: form,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Inference failed' }));
    throw new Error((err as { detail?: string }).detail ?? 'Inference failed');
  }

  return res.json() as Promise<InferResponse>;
}

export async function listDemoSubjects(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/demo/list`);
    if (!res.ok) return [];
    const data = await res.json() as { files: string[] };
    return data.files;
  } catch {
    return [];
  }
}

export interface DemoMetadata {
  pixel_spacing_mm: number;
  hc_reference_mm: number | null;
}

/** Fetch pixel spacing + HC reference from the HC18 CSV for one demo subject. */
export async function getDemoMetadata(filename: string): Promise<DemoMetadata | null> {
  try {
    const res = await fetch(`${API_BASE}/demo/${encodeURIComponent(filename)}/metadata`);
    if (!res.ok) return null;
    return res.json() as Promise<DemoMetadata>;
  } catch {
    return null;
  }
}

// XAI endpoint helpers (Batch 5)

/** URL of the GradCAM++ overlay PNG for a finding. Suitable for `<img src>`. */
export function gradcamUrl(findingId: string): string {
  return `${API_BASE}/findings/${findingId}/gradcam`;
}

/** URL of the MC uncertainty heatmap PNG for a finding. */
export function uncertaintyUrl(findingId: string): string {
  return `${API_BASE}/findings/${findingId}/uncertainty`;
}

/** Fetch the structured OOD report for a finding. Returns null on error. */
export async function getOodReport(findingId: string, apiKey?: string): Promise<OodReport | null> {
  try {
    const headers: HeadersInit = {};
    const key = apiKey ?? (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_KEY : '') ?? '';
    if (key) headers['X-API-Key'] = key;
    const res = await fetch(`${API_BASE}/findings/${findingId}/ood`, { headers });
    if (!res.ok) return null;
    return await res.json() as OodReport;
  } catch {
    return null;
  }
}

// ─── Reports endpoints (Batch 6) ──────────────────────────────────────────────

function authHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {};
  const key =
    apiKey ?? (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_KEY : '') ?? '';
  if (key) headers['X-API-Key'] = key;
  return headers;
}

async function jsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: fallback }));
    throw new Error((err as { detail?: string }).detail ?? fallback);
  }
  return res.json() as Promise<T>;
}

/** Generate a clinical report for a study. Calls Claude Haiku server-side
 *  for the narrative paragraphs and persists the row in SQLite. */
export async function createReport(
  studyId: string,
  payload: CreateReportPayload,
  apiKey?: string,
): Promise<ApiReport> {
  const res = await fetch(`${API_BASE}/studies/${encodeURIComponent(studyId)}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(apiKey) },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<ApiReport>(res, 'Failed to create report');
}

/** Generate a combined multi-model clinical report (2–4 selected models).
 *  Server computes per-model consensus and renders a single PDF per the
 *  AIUM/ACR/RSNA structured-reporting layout with a Consensus column,
 *  per-model image strips, and Inter-Model Agreement section. */
export async function createCombinedReport(
  studyId: string,
  payload: CreateCombinedReportPayload,
  apiKey?: string,
): Promise<ApiReport> {
  const res = await fetch(
    `${API_BASE}/studies/${encodeURIComponent(studyId)}/reports/combined`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(apiKey) },
      body: JSON.stringify(payload),
    },
  );
  return jsonOrThrow<ApiReport>(res, 'Failed to create combined report');
}

/** List all reports for a study, newest first. */
export async function listReportsForStudy(
  studyId: string,
  apiKey?: string,
): Promise<ApiReport[]> {
  const res = await fetch(`${API_BASE}/studies/${encodeURIComponent(studyId)}/reports`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) return [];
  return (await res.json()) as ApiReport[];
}

/** Fetch a single report by id. */
export async function getReport(reportId: string, apiKey?: string): Promise<ApiReport | null> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiReport;
}

/** URL of the report PDF. Unsigned reports carry a DRAFT watermark; the
 *  X-Report-Signed response header reflects sign-off state. */
export function reportPdfUrl(reportId: string): string {
  return `${API_BASE}/reports/${encodeURIComponent(reportId)}/pdf`;
}

/** URL of the report's FHIR R4 Bundle (DiagnosticReport + Observations).
 *  Status flips preliminary → final on sign-off. */
export function reportFhirUrl(reportId: string): string {
  return `${API_BASE}/reports/${encodeURIComponent(reportId)}/fhir`;
}

/** URL of the report's DICOM Comprehensive SR (.dcm). PreliminaryFlag /
 *  CompletionFlag / VerificationFlag track sign-off state. */
export function reportDicomUrl(reportId: string): string {
  return `${API_BASE}/reports/${encodeURIComponent(reportId)}/dicom`;
}

/** Mark a report as signed-off. The server records IP / user-agent into the
 *  audit log and re-renders the PDF without the DRAFT watermark on next fetch. */
export async function signReport(
  reportId: string,
  payload: SignReportPayload,
  apiKey?: string,
): Promise<ApiReport> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(apiKey) },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<ApiReport>(res, 'Failed to sign report');
}

/** Audit log entries for the report (created / signed / …). */
export async function getReportAudit(
  reportId: string,
  apiKey?: string,
): Promise<ApiAuditEntry[]> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}/audit`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) return [];
  return (await res.json()) as ApiAuditEntry[];
}
