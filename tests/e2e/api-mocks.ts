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

export const DEFAULT_ASK_RESPONSE = {
  finding_id: 'fnd_e2e_test',
  question: 'How reliable is this measurement?',
  answer:
    'Reliability is the inter-frame agreement of HC across the loop ' +
    '[project_metrics.md § Temporal reliability score — definition]. It is a precision ' +
    'statistic, not an accuracy one.',
  citations: ['project_metrics.md § Temporal reliability score — definition'],
  chunks: [
    {
      citation: 'project_metrics.md § Temporal reliability score — definition',
      source_file: 'project_metrics.md',
      heading: 'Temporal reliability score — definition',
      text: 'reliability = max(0, 1 - std(per_frame_HC) / mean(per_frame_HC))',
      score: 0.175,
      provisional: false,
      source_note: 'Source: app/inference.py::predict_cine_clip',
    },
    {
      citation: 'isuog_hc_measurement.md § Interobserver variability in fetal biometry',
      source_file: 'isuog_hc_measurement.md',
      heading: 'Interobserver variability in fetal biometry',
      text: 'Fetal biometric measurements carry measurement error.',
      score: 0.09,
      provisional: true,
      source_note: null,
    },
  ],
  grounded: true,
  used_llm: true,
  llm_error: null,
  any_provisional: true,
  disclaimer:
    'For demonstration purposes only — not cleared for clinical diagnosis.',
};

export const DEFAULT_ESCALATION_RESPONSE = {
  finding_id: 'fnd_e2e_test',
  decision: 'ACCEPT',
  badge_color: 'green',
  rationale:
    'The frames agree closely (reliability 0.995, HC spread 0.80 mm, both within the ' +
    'accept thresholds).',
  justification:
    'This measurement was accepted because head circumference varied by only 0.80 mm ' +
    'across the clip, well inside the consistency threshold.',
  justification_error: null,
  used_llm: true,
  signals: {
    mode: 'cine_clip',
    hc_mm: 245.3,
    reliability: 0.995,
    hc_std_mm: 0.8,
    hc_range_mm: 2.1,
    measurable_frames: 16,
    has_consistency_signal: true,
  },
  tool_calls: [],
  thresholds: {
    reliability_accept_min: 0.97,
    reliability_flag_below: 0.92,
    hc_std_accept_max_mm: 2.0,
    hc_std_flag_above_mm: 5.0,
    checkpoint_agreement_max_mm: 3.0,
  },
  disclaimer: 'For demonstration purposes only — not cleared for clinical diagnosis.',
};

export const DEFAULT_XAI_ASK_RESPONSE = {
  finding_id: 'fnd_e2e_test',
  question: 'Why did the model focus where it did?',
  method: 'gradcam',
  answer:
    'The attribution is concentrated, with 53.7% of it falling within 6 pixels of the ' +
    'predicted skull outline. That is consistent with the model keying on the boundary ' +
    'it is being asked to trace rather than on background texture.',
  summary: {
    method: 'GradCAM++',
    concentration: 0.67,
    concentration_label: 'concentrated',
    focused_area_pct: 12.2,
    peak_region: 'upper-centre',
    peak_xy_pct: [50.0, 19.0],
    top_regions: [{ region: 'upper-centre', share: 0.22, mean_intensity: 0.31 }],
    on_boundary_pct: 53.7,
    inside_head_pct: 19.0,
    outside_head_pct: 27.3,
    mask_available: true,
  },
  grounded: true,
  used_llm: true,
  llm_error: null,
  disclaimer:
    "Saliency shows where the model's output was most sensitive, which is a correlation " +
    'with its own prediction — not proof that the highlighted tissue caused the ' +
    'measurement, and not a clinical finding.',
};

export interface MockOptions {
  // /infer payload for the happy path; OOD path overrides this with a
  // poor-quality / ood_flag=true response.
  inferResponse?: Record<string, unknown>;
  // Q&A answer for POST /findings/{id}/ask.
  askResponse?: Record<string, unknown>;
  // Force the ask endpoint to fail, to exercise the error path.
  askStatus?: number;
  // Reliability verdict for POST /findings/{id}/escalate.
  escalationResponse?: Record<string, unknown>;
  // Force the escalation endpoint to fail, to exercise the error path.
  escalationStatus?: number;
  // Explanation for POST /findings/{id}/xai/ask.
  xaiAskResponse?: Record<string, unknown>;
  // Force the XAI Q&A endpoint to fail, to exercise the error path.
  xaiAskStatus?: number;
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
  const askResponse = opts.askResponse ?? DEFAULT_ASK_RESPONSE;
  const escalationResponse = opts.escalationResponse ?? DEFAULT_ESCALATION_RESPONSE;
  const xaiAskResponse = opts.xaiAskResponse ?? DEFAULT_XAI_ASK_RESPONSE;
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
    // Retrieval-grounded Q&A
    if (/^\/findings\/[^/]+\/ask$/.test(path) && method === 'POST') {
      if (opts.askStatus && opts.askStatus >= 400) {
        return route.fulfill({
          status: opts.askStatus,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Finding not found or expired' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(askResponse),
      });
    }

    // OOD reasoning (XAI panel's third column)
    if (/^\/findings\/[^/]+\/ood$/.test(path)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ood_flag: false,
          score: 0.12,
          reasons: [],
          stats: { mean_intensity: 0.41, texture_score: 0.63 },
        }),
      });
    }

    // GradCAM / uncertainty overlays — 1x1 PNG so <img> resolves
    if (/^\/findings\/[^/]+\/(gradcam|uncertainty)$/.test(path)) {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64',
        ),
      });
    }

    // Interactive XAI explanation
    if (/^\/findings\/[^/]+\/xai\/ask$/.test(path) && method === 'POST') {
      if (opts.xaiAskStatus && opts.xaiAskStatus >= 400) {
        return route.fulfill({
          status: opts.xaiAskStatus,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Finding not found or expired' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(xaiAskResponse),
      });
    }

    // Agentic reliability escalation
    if (/^\/findings\/[^/]+\/escalate$/.test(path) && method === 'POST') {
      if (opts.escalationStatus && opts.escalationStatus >= 400) {
        return route.fulfill({
          status: opts.escalationStatus,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Finding not found or expired' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(escalationResponse),
      });
    }

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
