import type { Study, InferResponse } from './types';

function makeFetalHeadSvg(rx: number, ry: number, withOverlay: boolean): string {
  const cx = 250;
  const cy = 200;
  const tRx = Math.round(rx * 0.19);
  const tRy = Math.round(ry * 0.17);
  const tOff = Math.round(rx * 0.18);
  const cRx = Math.round(rx * 0.15);
  const cRy = Math.round(ry * 0.09);

  const base = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400">`,
    `<rect width="500" height="400" fill="#080c14"/>`,
    `<defs><radialGradient id="g" cx="48%" cy="38%" r="65%">`,
    `<stop offset="0%" stop-color="#adadad"/>`,
    `<stop offset="100%" stop-color="#2e2e2e"/>`,
    `</radialGradient></defs>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 15}" ry="${ry + 12}" fill="#1e1e1e"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${Math.round(rx * 0.57)}" ry="${Math.round(ry * 0.51)}" fill="#8c8c8c" opacity="0.5"/>`,
    `<line x1="${cx}" y1="${cy - ry - 9}" x2="${cx}" y2="${cy + ry + 9}" stroke="#e0e0e0" stroke-width="1.5" opacity="0.85"/>`,
    `<ellipse cx="${cx}" cy="${cy - Math.round(ry * 0.07)}" rx="${cRx}" ry="${cRy}" fill="#f0f0f0" opacity="0.9"/>`,
    `<ellipse cx="${cx - tOff}" cy="${cy + Math.round(ry * 0.13)}" rx="${tRx}" ry="${tRy}" fill="#c4c4c4" opacity="0.7"/>`,
    `<ellipse cx="${cx + tOff}" cy="${cy + Math.round(ry * 0.13)}" rx="${tRx}" ry="${tRy}" fill="#c4c4c4" opacity="0.7"/>`,
  ];

  if (withOverlay) {
    base.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="#0D7680" stroke-width="2.5" fill="none"/>`,
      `<line x1="${cx - rx - 5}" y1="${cy - 5}" x2="${cx - rx - 5}" y2="${cy + 5}" stroke="#0D7680" stroke-width="2"/>`,
      `<line x1="${cx - rx - 9}" y1="${cy}" x2="${cx - rx - 1}" y2="${cy}" stroke="#0D7680" stroke-width="2"/>`,
      `<line x1="${cx + rx + 5}" y1="${cy - 5}" x2="${cx + rx + 5}" y2="${cy + 5}" stroke="#0D7680" stroke-width="2"/>`,
      `<line x1="${cx + rx + 1}" y1="${cy}" x2="${cx + rx + 9}" y2="${cy}" stroke="#0D7680" stroke-width="2"/>`,
    );
  }

  base.push(`</svg>`);
  return base.join('');
}

function svgUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const DEMO_STUDY_IDS = new Set<string>(['demo-001', 'demo-002', 'demo-003']);

const RAW_IMAGES: Record<string, string> = {
  'demo-001': svgUrl(makeFetalHeadSvg(104, 87, false)),
  'demo-002': svgUrl(makeFetalHeadSvg(127, 107, false)),
  'demo-003': svgUrl(makeFetalHeadSvg(148, 124, false)),
};

const OVERLAY_IMAGES: Record<string, string> = {
  'demo-001': svgUrl(makeFetalHeadSvg(104, 87, true)),
  'demo-002': svgUrl(makeFetalHeadSvg(127, 107, true)),
  'demo-003': svgUrl(makeFetalHeadSvg(148, 124, true)),
};

const DEMO_FINDINGS: Record<string, InferResponse> = {
  'demo-001': {
    hc_mm: 193.4,
    ga_str: '22w 2d',
    ga_weeks: 22.3,
    trimester: 'Second',
    reliability: 0.94,
    hc_std_mm: 1.8,
    confidence_label: 'High',
    confidence_color: '#22c55e',
    elapsed_ms: 712,
    mode: 'phase0',
    validation: { valid: true, warnings: [], checks: { intensity: true, shape: true, size: true } },
    ood_flag: false,
    ood_reasons: [],
    mask_b64: '',
    overlay_b64: '',
  },
  'demo-002': {
    hc_mm: 258.7,
    ga_str: '28w 3d',
    ga_weeks: 28.4,
    trimester: 'Third',
    reliability: 0.89,
    hc_std_mm: 2.4,
    confidence_label: 'High',
    confidence_color: '#22c55e',
    elapsed_ms: 834,
    mode: 'phase0',
    validation: { valid: true, warnings: [], checks: { intensity: true, shape: true, size: true } },
    ood_flag: false,
    ood_reasons: [],
    mask_b64: '',
    overlay_b64: '',
  },
  'demo-003': {
    hc_mm: 306.2,
    ga_str: '33w 0d',
    ga_weeks: 33.0,
    trimester: 'Third',
    reliability: 0.77,
    hc_std_mm: 3.2,
    confidence_label: 'Moderate',
    confidence_color: '#eab308',
    elapsed_ms: 921,
    mode: 'phase0',
    validation: {
      valid: true,
      warnings: ['Image contrast suboptimal'],
      checks: { intensity: false, shape: true, size: true },
    },
    ood_flag: false,
    ood_reasons: [],
    mask_b64: '',
    overlay_b64: '',
  },
};

export function getDemoFindings(studyId: string): InferResponse | undefined {
  return DEMO_FINDINGS[studyId];
}

export function getDemoOverlayImage(studyId: string): string | undefined {
  return OVERLAY_IMAGES[studyId];
}

export const INITIAL_STUDIES: Study[] = [
  {
    id: 'demo-001',
    patientName: 'Study A — 22 wks',
    studyDate: '2026-05-03',
    status: 'pending',
    imageDataUrl: RAW_IMAGES['demo-001'],
    isDemo: true,
  },
  {
    id: 'demo-002',
    patientName: 'Study B — 28 wks',
    studyDate: '2026-05-02',
    status: 'pending',
    imageDataUrl: RAW_IMAGES['demo-002'],
    isDemo: true,
  },
  {
    id: 'demo-003',
    patientName: 'Study C — 33 wks',
    studyDate: '2026-05-01',
    status: 'pending',
    imageDataUrl: RAW_IMAGES['demo-003'],
    isDemo: true,
  },
];
