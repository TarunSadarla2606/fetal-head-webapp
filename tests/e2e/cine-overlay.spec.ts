// Cine-clip animated overlay E2E.
//
// Covers both directions of the gate: a cine_clip response renders the
// animated overlay near the numeric results, and a single_frame response
// does not render it at all.

import { test, expect } from '@playwright/test';
import { installApiMocks } from './api-mocks';

// Smallest valid animated GIF — content does not matter, only that the
// component puts it in an <img src>.
const TINY_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const cineInferResponse = {
  finding_id: 'fnd_e2e_cine',
  hc_mm: 245.3,
  ga_str: '21w 0d',
  ga_weeks: 21.0,
  trimester: 'Second trimester (14–28w)',
  reliability: 0.94,
  hc_std_mm: 1.2,
  confidence_label: 'HIGH CONFIDENCE',
  confidence_color: '#10b981',
  elapsed_ms: 512.0,
  mode: 'cine_clip',
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
  cine_overlay_gif: TINY_GIF,
};

test('cine mode renders the animated segmentation overlay', async ({ page }) => {
  await installApiMocks(page, { inferResponse: cineInferResponse });
  await page.goto('/app');
  // Wait for the health check to settle — clicking Run AI before the demo
  // study has loaded runs against a half-initialised worklist.
  await expect(page.getByTestId('api-status-live')).toBeVisible();

  await page.getByRole('button', { name: /Run AI/i }).click();

  const overlay = page.getByTestId('cine-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.getByRole('img')).toHaveAttribute('src', TINY_GIF);
  await expect(overlay).toContainText('Segmentation overlay across the clip.');
});

test('single-frame mode does not render the cine overlay', async ({ page }) => {
  // Default mock is mode: 'single_frame' with no cine_overlay_gif field.
  await installApiMocks(page);
  await page.goto('/app');
  // Wait for the health check to settle — clicking Run AI before the demo
  // study has loaded runs against a half-initialised worklist.
  await expect(page.getByTestId('api-status-live')).toBeVisible();

  await page.getByRole('button', { name: /Run AI/i }).click();

  // Findings did populate — so absence below is the gate working, not a
  // run that never happened.
  await expect(page.getByTestId('quality-badge')).toBeVisible();
  await expect(page.getByTestId('cine-overlay')).toHaveCount(0);
});

test('cine mode with a null GIF renders no overlay', async ({ page }) => {
  await installApiMocks(page, {
    inferResponse: { ...cineInferResponse, cine_overlay_gif: null },
  });
  await page.goto('/app');
  // Wait for the health check to settle — clicking Run AI before the demo
  // study has loaded runs against a half-initialised worklist.
  await expect(page.getByTestId('api-status-live')).toBeVisible();

  await page.getByRole('button', { name: /Run AI/i }).click();

  await expect(page.getByTestId('quality-badge')).toBeVisible();
  await expect(page.getByTestId('cine-overlay')).toHaveCount(0);
});
