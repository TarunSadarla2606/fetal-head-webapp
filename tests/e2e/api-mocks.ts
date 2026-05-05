// Shared API-route mocks used by both E2E specs (8.5 + 8.6).
//
// We intercept everything that the live webapp would normally fire at the
// HF Spaces backend, so the tests stay deterministic and fast.

import type { Page, Route } from '@playwright/test';

const API_HOST = 'tarunsadarla2606-fetal-head-clinical-ai-api.hf.space';

// 1×1 transparent PNG for image responses (worklist demo subjects, gradcam, etc.)
const PIXEL_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export interface MockOptions {
  // /infer payload for the happy path; OOD path overrides this with a
  // poor-quality / ood_flag=true response.
  inferResponse?: Record<string, unknown>;
}

const baseInfer = {
  finding_id: 'fnd_e2e_test',
  hc_mm: 245.3,
  ga_str: '21w 0d',
  ga_weeks: 21.0,
  trimester: 'Second trimester (14–28w)',
  reliability: 0.92,
  hc_std_mm: 0.0,
  confidence_label: 'HIGH CONFIDENCE',
  confidence_color: '#10b981',
  elapsed_ms: 460.0,
  mode: 'single_frame',
  validation: {
    valid: true,
    warnings: [],
    checks: { shape: true, resolution: true },
    quality_score: 0.88,
    quality_label: 'excellent',
    blur_score: 280.0,
  },
  ood_flag: false,
  ood_reasons: [],
  mask_b64: '',
  overlay_b64: '',
};

const baseReport = {
  id: 'rep_e2e_test',
  study_id: 'demo-001',
  finding_id: 'fnd_e2e_test',
  patient_name: 'E2E Test Patient',
  study_date: '2026-05-05',
  model: 'phase4a',
  hc_mm: 245.3,
  ga_str: '21w 0d',
  ga_weeks: 21.0,
  trimester: 'Second trimester (14–28w)',
  reliability: 0.92,
  confidence_label: 'HIGH CONFIDENCE',
  pixel_spacing_mm: 0.154,
  elapsed_ms: 460.0,
  narrative_p1: 'Mock narrative.',
  narrative_p2: '',
  narrative_p3: null,
  narrative_impression: 'Mock impression.',
  used_llm: false,
  is_signed: false,
  signed_by: null as string | null,
  signed_at: null as string | null,
  signoff_note: null as string | null,
  created_at: '2026-05-05T12:00:00Z',
  referring_physician: 'Dr. E2E',
  patient_id: 'MRN-E2E',
  patient_dob: '1996-01-01',
  lmp: null,
  ordering_facility: null,
  sonographer_name: null,
  clinical_indication: null,
  us_approach: null,
  image_quality: null,
  pixel_spacing_dicom_derived: false,
  pixel_spacing_source: 'CSV' as const,
  report_mode: 'template' as const,
  accession_number: 'FHC-20260505-120000',
  original_image_b64: null,
  overlay_image_b64: null,
  gradcam_image_b64: null,
  fetal_presentation: 'cephalic',
  bpd_mm: null,
  prior_biometry: null,
  is_combined: false,
  combined_models_json: null,
};

export async function installApiMocks(page: Page, opts: MockOptions = {}): Promise<void> {
  const inferResponse = opts.inferResponse ?? baseInfer;
  let createdReport: typeof baseReport | null = null;

  await page.route(`https://${API_HOST}/**`, async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    const path = new URL(url).pathname;

    // Health check — drives the API status badge in the header
    if (path === '/health') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          version: '2.5.0',
          models_available: ['phase0', 'phase4a', 'phase2', 'phase4b'],
          device: 'cpu',
        }),
      });
    }

    // Worklist — minimal three-subject seed
    if (path === '/demo/list') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ files: ['000_HC.png', '001_HC.png', '002_HC.png'] }),
      });
    }

    if (path.startsWith('/demo/') && path.endsWith('/metadata')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pixel_spacing_mm: 0.154, hc_reference_mm: 245.0 }),
      });
    }

    // Demo subject image
    if (path.startsWith('/demo/')) {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: PIXEL_PNG_BYTES,
      });
    }

    // /infer — returns the configured payload (happy or OOD)
    if (path === '/infer' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(inferResponse),
      });
    }

    // Reports list (per-study) — returns the created report after creation
    if (/^\/studies\/[^/]+\/reports$/.test(path)) {
      if (method === 'POST') {
        createdReport = { ...baseReport, study_id: path.split('/')[2] };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdReport),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdReport ? [createdReport] : []),
      });
    }

    // Sign-off
    if (path.match(/^\/reports\/[^/]+\/sign$/) && method === 'POST') {
      if (createdReport) {
        createdReport = {
          ...createdReport,
          is_signed: true,
          signed_by: 'Dr. Tester',
          signed_at: '2026-05-05T12:30:00Z',
        };
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdReport),
      });
    }

    // PDF / FHIR / DICOM — just resolve so download links are clickable
    if (path.match(/^\/reports\/[^/]+\/(pdf|fhir|dicom|audit)$/)) {
      const ct = path.endsWith('/pdf')
        ? 'application/pdf'
        : path.endsWith('/fhir')
          ? 'application/fhir+json'
          : path.endsWith('/dicom')
            ? 'application/dicom'
            : 'application/json';
      return route.fulfill({ status: 200, contentType: ct, body: '' });
    }

    // Patient-level reports (longitudinal)
    if (path.match(/^\/patients\/[^/]+\/reports$/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdReport ? [createdReport] : []),
      });
    }

    // Default — empty 200 so nothing else hangs
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

export const oodInferResponse = {
  ...baseInfer,
  finding_id: 'fnd_e2e_ood',
  hc_mm: 60.0,
  ga_str: '10w 0d',
  ga_weeks: 10.0,
  trimester: 'First trimester (<14w)',
  reliability: 0.42,
  confidence_label: 'LOW CONFIDENCE',
  confidence_color: '#dc2626',
  ood_flag: true,
  ood_reasons: [
    'Image has very low spatial texture. Synthetic or heavily processed images may produce poor results.',
    'Image quality poor (score 0.18). Re-acquire at the standard biometric plane.',
  ],
  validation: {
    valid: false,
    warnings: [
      'Image quality poor (score 0.18). Re-acquire at the standard biometric plane.',
    ],
    checks: { shape: true, resolution: true, has_texture: false },
    quality_score: 0.18,
    quality_label: 'poor' as const,
    blur_score: 8.0,
  },
};
