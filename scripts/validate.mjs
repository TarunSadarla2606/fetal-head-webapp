#!/usr/bin/env node
/**
 * FetalScan AI webapp validation — Batch 2 (Next.js App Router).
 * Runs with plain Node, no install required.
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

// vercel.json
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

// Next.js app structure
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
check('components/WorklistSidebar.tsx exists', () => {
  if (!existsSync('components/WorklistSidebar.tsx')) throw new Error('file missing');
});
check('components/AIFindingsPanel.tsx exists', () => {
  if (!existsSync('components/AIFindingsPanel.tsx')) throw new Error('file missing');
});
check('components/ReportsTab.tsx exists', () => {
  if (!existsSync('components/ReportsTab.tsx')) throw new Error('file missing');
});
check('lib/api.ts references HF Space endpoint', () => {
  if (!readFileSync('lib/api.ts', 'utf8').includes('hf.space'))
    throw new Error('HF Space endpoint missing');
});
check('app/globals.css has RUO badge style', () => {
  if (!readFileSync('app/globals.css', 'utf8').includes('ruo-badge'))
    throw new Error('ruo-badge style missing');
});
check('app/globals.css has teal brand colour', () => {
  if (!readFileSync('app/globals.css', 'utf8').includes('#0D7680'))
    throw new Error('brand colour missing');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
