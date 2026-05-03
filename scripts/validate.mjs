#!/usr/bin/env node
/**
 * Batch 0 validation suite — runs with plain Node, no install required.
 * Each check() call is a named test. Exit 1 if any fail.
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

// --- vercel.json ---
check('vercel.json is valid JSON', () => {
  JSON.parse(readFileSync('vercel.json', 'utf8'));
});
check('vercel.json has version field', () => {
  const c = JSON.parse(readFileSync('vercel.json', 'utf8'));
  if (!c.version) throw new Error('missing version');
});
check('vercel.json has security headers', () => {
  const c = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const headers = c.headers ?? [];
  const keys = headers.flatMap(h => (h.headers ?? []).map(x => x.key));
  if (!keys.includes('X-Content-Type-Options')) throw new Error('missing X-Content-Type-Options header');
});

// --- index.html ---
check('index.html exists', () => {
  if (!existsSync('index.html')) throw new Error('file missing');
});
check('index.html has DOCTYPE', () => {
  const h = readFileSync('index.html', 'utf8');
  if (!h.startsWith('<!DOCTYPE html>')) throw new Error('DOCTYPE must be first line');
});
check('index.html has FetalScan AI brand', () => {
  if (!readFileSync('index.html', 'utf8').includes('FetalScan AI')) throw new Error('brand missing');
});
check('index.html has all 4 tab panels', () => {
  const h = readFileSync('index.html', 'utf8');
  for (const id of ['panel-overview', 'panel-analysis', 'panel-reports', 'panel-documentation']) {
    if (!h.includes(id)) throw new Error(`missing #${id}`);
  }
});
check('index.html showTab() navigation function present', () => {
  if (!readFileSync('index.html', 'utf8').includes('function showTab')) throw new Error('missing showTab');
});
check('index.html Research Use Only disclaimer present', () => {
  if (!readFileSync('index.html', 'utf8').includes('Research Use Only')) throw new Error('missing RUO disclaimer');
});
check('index.html embeds HF Space iframe', () => {
  if (!readFileSync('index.html', 'utf8').includes('hf.space')) throw new Error('missing HF Space iframe src');
});
check('index.html teal brand colour present', () => {
  if (!readFileSync('index.html', 'utf8').includes('#0D7680')) throw new Error('brand colour missing');
});

// --- summary ---
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
