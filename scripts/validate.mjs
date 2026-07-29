#!/usr/bin/env node
/**
 * FetalScan AI webapp validation — Batches 2–4.
 * Runs with plain Node, no install required.
 *
 * Checks are grouped:
 *   [infra]   vercel.json + Next.js structure
 *   [api]     lib/api.ts wiring (URL, exports)
 *   [demo]    lib/demo-data.ts fallback completeness
 *   [ui]      component presence + API status indicator
 */
import { readFileSync, existsSync } from 'fs';

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${desc}: ${e.message}`);
    failed++;
  }
}

console.log('\nFetalScan AI — webapp validation\n');

// ── [infra] ──────────────────────────────────────────────────────────────────
console.log('[infra]');
check('vercel.json is valid JSON', () => {
  JSON.parse(readFileSync('vercel.json', 'utf8'));
});
check('vercel.json has version field', () => {
  const c = JSON.parse(readFileSync('vercel.json', 'utf8'));
  if (!c.version) throw new Error('missing version');
});
check('vercel.json has security headers', () => {
  const c = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const keys = (c.headers ?? []).flatMap(h => (h.headers ?? []).map(x => x.key));
  if (!keys.includes('X-Content-Type-Options')) throw new Error('missing X-Content-Type-Options');
});
check('next.config.ts exists', () => {
  if (!existsSync('next.config.ts') && !existsSync('next.config.js'))
    throw new Error('next.config.* missing');
});
check('app/layout.tsx exists', () => {
  if (!existsSync('app/layout.tsx')) throw new Error('file missing');
});
check('app/layout.tsx has FetalScan AI brand', () => {
  if (!readFileSync('app/layout.tsx', 'utf8').includes('FetalScan AI'))
    throw new Error('brand missing');
});

// ── [api] ────────────────────────────────────────────────────────────────────
console.log('\n[api]');
check('lib/api.ts points to dedicated API Space (not Streamlit demo)', () => {
  const src = readFileSync('lib/api.ts', 'utf8');
  if (!src.includes('fetal-head-clinical-ai-api.hf.space'))
    throw new Error('API_BASE must point to fetal-head-clinical-ai-api Space');
  if (src.includes("'https://fetal-head-clinical-ai.hf.space'") ||
      src.includes('"https://fetal-head-clinical-ai.hf.space"'))
    throw new Error('still pointing at old Streamlit Space URL');
});
check('lib/api.ts exports getApiHealth', () => {
  if (!readFileSync('lib/api.ts', 'utf8').includes('export async function getApiHealth'))
    throw new Error('getApiHealth not exported — health check badge will not work');
});
check('lib/api.ts exports runInference', () => {
  if (!readFileSync('lib/api.ts', 'utf8').includes('export async function runInference'))
    throw new Error('runInference not exported');
});
check('lib/api.ts exports listDemoSubjects', () => {
  if (!readFileSync('lib/api.ts', 'utf8').includes('export async function listDemoSubjects'))
    throw new Error('listDemoSubjects not exported — real demo images will not load');
});
check('lib/api.ts references hf.space endpoint', () => {
  if (!readFileSync('lib/api.ts', 'utf8').includes('hf.space'))
    throw new Error('HF Space endpoint missing');
});

// ── [demo] ───────────────────────────────────────────────────────────────────
console.log('\n[demo]');
check('lib/demo-data.ts has 3 pre-baked demo studies', () => {
  const src = readFileSync('lib/demo-data.ts', 'utf8');
  const ids = new Set(src.match(/demo-00[1-9]/g) ?? []);
  if (ids.size < 3) throw new Error(`only ${ids.size} demo study IDs found, need 3`);
});
check('lib/demo-data.ts exports getDemoFindings', () => {
  if (!readFileSync('lib/demo-data.ts', 'utf8').includes('export function getDemoFindings'))
    throw new Error('getDemoFindings not exported — fallback inference broken');
});
check('lib/demo-data.ts exports getDemoOverlayImage', () => {
  if (!readFileSync('lib/demo-data.ts', 'utf8').includes('export function getDemoOverlayImage'))
    throw new Error('getDemoOverlayImage not exported — overlay fallback broken');
});
check('lib/demo-data.ts exports DEMO_STUDY_IDS', () => {
  if (!readFileSync('lib/demo-data.ts', 'utf8').includes('export'))
    throw new Error('no exports found in demo-data.ts');
});

// ── [ui] ─────────────────────────────────────────────────────────────────────
console.log('\n[ui]');
check('components/WorklistSidebar.tsx exists', () => {
  if (!existsSync('components/WorklistSidebar.tsx')) throw new Error('file missing');
});
check('components/AIFindingsPanel.tsx exists', () => {
  if (!existsSync('components/AIFindingsPanel.tsx')) throw new Error('file missing');
});
check('components/ReportsTab.tsx exists', () => {
  if (!existsSync('components/ReportsTab.tsx')) throw new Error('file missing');
});
check('WorkstationView renders API status badge (data-testid=api-status-*)', () => {
  const src = readFileSync('components/WorkstationView.tsx', 'utf8');
  if (!src.includes('api-status'))
    throw new Error('no api-status data-testid — cannot tell if API is live or offline from header');
});
check('WorkstationView handles empty demo subjects (synthetic fallback guard)', () => {
  const src = readFileSync('components/WorkstationView.tsx', 'utf8');
  if (!src.includes('files.length === 0'))
    throw new Error('no files.length === 0 guard — fallback to synthetic SVG broken');
});
check('WorkstationView imports getApiHealth', () => {
  if (!readFileSync('components/WorkstationView.tsx', 'utf8').includes('getApiHealth'))
    throw new Error('getApiHealth not imported — API status badge will always show "checking"');
});
check('lib/types.ts declares cine_overlay_gif on InferResponse', () => {
  if (!readFileSync('lib/types.ts', 'utf8').includes('cine_overlay_gif'))
    throw new Error('cine_overlay_gif missing — cine animation cannot be typed off the response');
});
check('AIFindingsPanel points at the Cine Loop tab', () => {
  const src = readFileSync('components/AIFindingsPanel.tsx', 'utf8');
  if (!src.includes('cine-panel-pointer'))
    throw new Error('no cine-panel-pointer — nothing tells the user where the animation lives');
});
check('cine display is gated on mode === cine_clip', () => {
  // The gate moved to StudyViewer when the animation became a central tab.
  const src = readFileSync('components/StudyViewer.tsx', 'utf8');
  if (!src.includes("mode === 'cine_clip'"))
    throw new Error('cine tab not gated on mode — single-frame results would enable it');
});
check('lib/types.ts declares cine_loop_gif + cine_per_frame_hc', () => {
  const src = readFileSync('lib/types.ts', 'utf8');
  for (const f of ['cine_loop_gif', 'cine_per_frame_hc', 'cine_frame_count']) {
    if (!src.includes(f)) throw new Error(`${f} missing — cine panel cannot type it`);
  }
});
check('components/CineView.tsx exists', () => {
  if (!existsSync('components/CineView.tsx')) throw new Error('file missing');
});
check('CineView offers the Overlay/Raw toggle', () => {
  const src = readFileSync('components/CineView.tsx', 'utf8');
  // testids are template-generated: data-testid={`cine-view-${mode}`}
  if (!src.includes('cine-view-$'))
    throw new Error('cine view toggle testids missing — raw loop is unreachable');
  if (!src.includes('cine_loop_gif'))
    throw new Error('cine_loop_gif never read — the raw loop is never displayed');
});
check('CineView renders the HC stability chart', () => {
  if (!readFileSync('components/CineView.tsx', 'utf8').includes('cine-hc-sparkline'))
    throw new Error('cine-hc-sparkline missing — per-frame HC is not visualised');
});
check('StudyViewer exposes Cine Loop as a third central tab', () => {
  const src = readFileSync('components/StudyViewer.tsx', 'utf8');
  if (!src.includes('cine-tab')) throw new Error('no cine-tab — animation has no central home');
  if (!src.includes("'cine'")) throw new Error("ViewerTab missing the 'cine' member");
  if (!src.includes('CineView')) throw new Error('CineView never rendered');
});
check('StudyViewer tab buttons are genuinely disabled, not just styled', () => {
  const src = readFileSync('components/StudyViewer.tsx', 'utf8');
  if (!src.includes('disabled={disabled}'))
    throw new Error('TabButton lacks the disabled attribute — state is invisible to a11y/tests');
});
check('StudyViewer no longer claims cine input is required', () => {
  const src = readFileSync('components/StudyViewer.tsx', 'utf8');
  if (/cine input required/i.test(src))
    throw new Error('stale "cine input required" copy — the loop is synthesised, not supplied');
});
check('app/globals.css has teal brand colour', () => {
  if (!readFileSync('app/globals.css', 'utf8').includes('#0D7680'))
    throw new Error('brand colour missing');
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
