// Retrieval-grounded Q&A E2E.
//
// The product claim is that an answer is checkable, so these assert the
// evidence is actually surfaced — not just that some text appears.

import { test, expect } from '@playwright/test';
import { installApiMocks, DEFAULT_ASK_RESPONSE } from './api-mocks';

async function runAnalysis(page: import('@playwright/test').Page) {
  await page.goto('/app');
  await expect(page.getByTestId('api-status-live')).toBeVisible();
  await page.getByRole('button', { name: /Run AI/i }).click();
  await expect(page.getByTestId('quality-badge')).toBeVisible();
}

test('asking a question returns an answer with its supporting references', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);

  await page.getByTestId('ask-tab').click();
  await expect(page.getByTestId('ask-panel')).toBeVisible();

  await page.getByTestId('ask-input').fill('How reliable is this measurement?');
  await page.getByTestId('ask-submit').click();

  await expect(page.getByTestId('ask-answer')).toContainText('inter-frame agreement');

  // Every retrieved chunk is listed, so the answer can be checked against
  // what the model was actually given.
  await expect(page.getByTestId('ask-chunk')).toHaveCount(DEFAULT_ASK_RESPONSE.chunks.length);

  // The cited chunk is distinguished from merely-retrieved ones.
  await expect(page.locator('[data-testid="ask-chunk"][data-cited="true"]')).toHaveCount(1);

  await expect(page.getByTestId('ask-panel')).toContainText('not cleared for clinical diagnosis');
});

test('a retrieved chunk expands to show the text the model was given', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();
  await page.getByTestId('ask-input').fill('How reliable is this measurement?');
  await page.getByTestId('ask-submit').click();

  const first = page.getByTestId('ask-chunk').first();
  await expect(first).not.toContainText('per_frame_HC');
  await first.getByRole('button').click();
  await expect(first).toContainText('per_frame_HC');
});

test('a suggested question can be asked in one click', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();

  await expect(page.getByTestId('ask-suggestion').first()).toBeVisible();
  await page.getByTestId('ask-suggestion').first().click();
  await expect(page.getByTestId('ask-answer')).toBeVisible();
});

test('provisional reference material is flagged to the user', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();
  await page.getByTestId('ask-input').fill('Which plane should HC be measured in?');
  await page.getByTestId('ask-submit').click();

  await expect(page.getByTestId('ask-provisional-banner')).toBeVisible();
});

test('an ungrounded question is shown as declined, not answered', async ({ page }) => {
  await installApiMocks(page, {
    askResponse: {
      ...DEFAULT_ASK_RESPONSE,
      answer: "I don't have a reference covering that.",
      citations: [],
      chunks: [],
      grounded: false,
      used_llm: false,
      any_provisional: false,
    },
  });
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();
  await page.getByTestId('ask-input').fill('What is the capital of France?');
  await page.getByTestId('ask-submit').click();

  await expect(page.getByTestId('ask-ungrounded-banner')).toBeVisible();
  await expect(page.getByTestId('ask-chunk')).toHaveCount(0);
});

test('the excerpts-only fallback is labelled when no answer was generated', async ({ page }) => {
  await installApiMocks(page, {
    askResponse: { ...DEFAULT_ASK_RESPONSE, used_llm: false, citations: [] },
  });
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();
  await page.getByTestId('ask-input').fill('How reliable is this measurement?');
  await page.getByTestId('ask-submit').click();

  await expect(page.getByTestId('ask-fallback-note')).toBeVisible();
  await expect(page.getByTestId('ask-chunk')).toHaveCount(DEFAULT_ASK_RESPONSE.chunks.length);
});

test('a failed request surfaces an error instead of a blank panel', async ({ page }) => {
  await installApiMocks(page, { askStatus: 404 });
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();
  await page.getByTestId('ask-input').fill('How reliable is this measurement?');
  await page.getByTestId('ask-submit').click();

  await expect(page.getByTestId('ask-error')).toBeVisible();
  await expect(page.getByTestId('ask-error')).toContainText('expired');
});

test('the Ask tab is disabled until there is a live finding', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/app');
  await expect(page.getByTestId('api-status-live')).toBeVisible();

  await expect(page.getByTestId('ask-tab')).toBeDisabled();
  await page.getByRole('button', { name: /Run AI/i }).click();
  await expect(page.getByTestId('quality-badge')).toBeVisible();
  await expect(page.getByTestId('ask-tab')).toBeEnabled();
});

test('submit is blocked while the question is empty', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);
  await page.getByTestId('ask-tab').click();

  await expect(page.getByTestId('ask-submit')).toBeDisabled();
  await page.getByTestId('ask-input').fill('   ');
  await expect(page.getByTestId('ask-submit')).toBeDisabled();
  await page.getByTestId('ask-input').fill('How reliable is this?');
  await expect(page.getByTestId('ask-submit')).toBeEnabled();
});
