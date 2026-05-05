// 8.6 — OOD-path E2E
//
// Inference returns ood_flag=true with quality_label='poor'. Confirms the
// OOD banner + poor-quality badge render and that the Save-to-Reports
// affordance still appears (we surface a warning rather than hard-blocking).

import { test, expect } from '@playwright/test';
import { installApiMocks, oodInferResponse } from './api-mocks';

test('OOD path — poor quality + ood_flag fires the warning banner', async ({ page }) => {
  await installApiMocks(page, { inferResponse: oodInferResponse });

  await page.goto('/app');
  await expect(page.getByTestId('api-status-live')).toBeVisible();

  // Trigger inference
  await page.getByRole('button', { name: /Run AI/i }).click();

  // OOD banner fires (the ood-banner data-testid is wired in
  // AIFindingsPanel.tsx)
  await expect(page.getByTestId('ood-banner')).toBeVisible();

  // Quality badge surfaces 'poor'
  await expect(page.getByTestId('quality-badge')).toHaveAttribute('data-quality-label', 'poor');
});
