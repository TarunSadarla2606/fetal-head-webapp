import type { InferResponse, ModelVariant } from './types';

export const API_BASE = 'https://fetal-head-clinical-ai.hf.space';

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
