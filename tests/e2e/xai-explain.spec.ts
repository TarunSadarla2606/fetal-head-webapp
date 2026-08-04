// Interactive XAI E2E.
//
// The claim is that the explanation is grounded in measured attribution rather
// than in the picture, so these assert the measurements reach the screen
// alongside the prose — an explanation you cannot check is just narration.

import { test, expect } from '@playwright/test';
import { installApiMocks, DEFAULT_XAI_ASK_RESPONSE } from './api-mocks';

async function openXai(page: import('@playwright/test').Page) {
  await page.goto('/app');
  await expect(page.getByTestId('api-status-live')).toBeVisible();
  await page.getByRole('button', { name: /Run AI/i }).click();
  await expect(page.getByTestId('quality-badge')).toBeVisible();
  await page.getByTestId('xai-tab').click();
  await expect(page.getByTestId('xai-explain-panel')).toBeVisible();
}

test('question 1: asking why the model focused there returns a grounded answer', async ({
  page,
}) => {
  await installApiMocks(page);
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Why did the model focus where it did?');
  await page.getByTestId('xai-ask-submit').click();

  await expect(page.getByTestId('xai-ask-answer')).toContainText('53.7%');
  // The measurements behind the prose must be on screen too.
  await expect(page.getByTestId('xai-attribution-summary')).toContainText('concentrated');
  await expect(page.getByTestId('xai-attribution-summary')).toContainText('upper-centre');
});

test('question 2: the artifact question shows where attribution actually falls', async ({
  page,
}) => {
  await installApiMocks(page);
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Does this look like an artifact?');
  await page.getByTestId('xai-ask-submit').click();

  const dist = page.getByTestId('xai-skull-distribution');
  await expect(dist).toBeVisible();
  // On-boundary vs outside-head is the number that answers this question.
  await expect(dist).toContainText('53.7%');
  await expect(dist).toContainText('27.3%');
});

test('a suggested question can be asked in one click', async ({ page }) => {
  await installApiMocks(page);
  await openXai(page);

  await page.getByTestId('xai-ask-suggestion').first().click();
  await expect(page.getByTestId('xai-ask-answer')).toBeVisible();
});

test('the correlation-not-causation caveat is always shown', async ({ page }) => {
  await installApiMocks(page);
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Why here?');
  await page.getByTestId('xai-ask-submit').click();

  await expect(page.getByTestId('xai-explain-panel')).toContainText('correlation');
  await expect(page.getByTestId('xai-explain-panel')).toContainText('not a clinical finding');
});

test('an uncomputable attribution map is shown as declined, not explained', async ({ page }) => {
  await installApiMocks(page, {
    xaiAskResponse: {
      ...DEFAULT_XAI_ASK_RESPONSE,
      answer: 'The attribution map for this finding could not be computed.',
      summary: {},
      grounded: false,
      used_llm: false,
      llm_error: "Model 'phase0' is no longer loaded on this server.",
    },
  });
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Why here?');
  await page.getByTestId('xai-ask-submit').click();

  await expect(page.getByTestId('xai-ungrounded-banner')).toBeVisible();
  await expect(page.getByTestId('xai-attribution-summary')).toHaveCount(0);
});

test('a missing mask omits the skull breakdown instead of faking it', async ({ page }) => {
  await installApiMocks(page, {
    xaiAskResponse: {
      ...DEFAULT_XAI_ASK_RESPONSE,
      summary: {
        ...DEFAULT_XAI_ASK_RESPONSE.summary,
        mask_available: false,
        on_boundary_pct: null,
        inside_head_pct: null,
        outside_head_pct: null,
      },
    },
  });
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Why here?');
  await page.getByTestId('xai-ask-submit').click();

  await expect(page.getByTestId('xai-attribution-summary')).toBeVisible();
  await expect(page.getByTestId('xai-skull-distribution')).toHaveCount(0);
  await expect(page.getByTestId('xai-attribution-summary')).toContainText(
    'could not be related to the predicted skull',
  );
});

test('a failed explanation surfaces the reason and keeps the measurements', async ({ page }) => {
  await installApiMocks(page, {
    xaiAskResponse: {
      ...DEFAULT_XAI_ASK_RESPONSE,
      answer: 'Explanation generation failed.',
      used_llm: false,
      llm_error: 'APIConnectionError: Connection error.',
    },
  });
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Why here?');
  await page.getByTestId('xai-ask-submit').click();

  await expect(page.getByTestId('xai-ask-llm-error')).toContainText('Connection error');
  await expect(page.getByTestId('xai-attribution-summary')).toBeVisible();
});

test('a failed request surfaces an error instead of a blank panel', async ({ page }) => {
  await installApiMocks(page, { xaiAskStatus: 404 });
  await openXai(page);

  await page.getByTestId('xai-ask-input').fill('Why here?');
  await page.getByTestId('xai-ask-submit').click();

  await expect(page.getByTestId('xai-ask-error')).toBeVisible();
});

test('submit is blocked while the question is empty', async ({ page }) => {
  await installApiMocks(page);
  await openXai(page);

  await expect(page.getByTestId('xai-ask-submit')).toBeDisabled();
  await page.getByTestId('xai-ask-input').fill('   ');
  await expect(page.getByTestId('xai-ask-submit')).toBeDisabled();
  await page.getByTestId('xai-ask-input').fill('Why here?');
  await expect(page.getByTestId('xai-ask-submit')).toBeEnabled();
});
