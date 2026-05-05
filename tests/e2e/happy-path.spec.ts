// 8.5 — Happy-path E2E
//
// Landing → Open Demo → Worklist loads → Run AI → AI Findings populates →
// Quality badge renders → Save to Reports modal → Generate → Report row
// appears with PDF / FHIR / DICOM links.

import { test, expect } from '@playwright/test';
import { installApiMocks } from './api-mocks';

test('happy path — landing → run → save → export links visible', async ({ page }) => {
  await installApiMocks(page);

  // 1. Landing
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('fetal head circumference');

  // 2. CTA → /app
  await page.getByTestId('cta-open-demo-hero').click();
  await expect(page).toHaveURL(/\/app$/);

  // 3. Worklist + API status badge
  await expect(page.getByTestId('api-status-live')).toBeVisible();

  // 4. Run AI (button is disabled while no image; we have demo image so canRun=true)
  await page.getByRole('button', { name: /Run AI/i }).click();

  // 5. AI Findings — quality badge + HC value visible
  await expect(page.getByTestId('quality-badge')).toBeVisible();
  await expect(page.getByTestId('quality-badge')).toHaveAttribute('data-quality-label', 'excellent');
  // HC mm rendered in the metric tile
  await expect(page.locator('text=245.3')).toBeVisible();

  // 6. Save to Reports
  await page.getByTestId('open-report-form').click();
  // The autofilled patient-name field carries the worklist patient name
  await expect(page.getByText('Generate Clinical Report')).toBeVisible();
  // Submit (the primary button is "Generate Report")
  await page.getByRole('button', { name: /Generate Report/i }).click();

  // 7. Reports tab opens automatically and the new row shows the export links
  await expect(page.getByTestId('reports-table')).toBeVisible();
  await expect(page.getByTestId('report-pdf-link').first()).toBeVisible();
  await expect(page.getByTestId('report-fhir-link').first()).toBeVisible();
  await expect(page.getByTestId('report-dicom-link').first()).toBeVisible();
});

test('keyboard shortcut — ? opens cheatsheet', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/app');
  await page.keyboard.press('?');
  await expect(page.getByTestId('shortcuts-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('shortcuts-overlay')).not.toBeVisible();
});
