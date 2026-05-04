import type { InferResponse, ModelVariant, OodReport } from './types';

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
