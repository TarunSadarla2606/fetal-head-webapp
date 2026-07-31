// Agentic reliability escalation E2E.
//
// This is an abstention mechanism, so the tests are about whether the system's
// doubt actually reaches the screen — a red verdict that renders as green, or
// not at all, is worse than no verdict.

import { test, expect } from '@playwright/test';
import { installApiMocks, DEFAULT_ESCALATION_RESPONSE } from './api-mocks';

async function runAnalysis(page: import('@playwright/test').Page) {
  await page.goto('/app');
  await expect(page.getByTestId('api-status-live')).toBeVisible();
  await page.getByRole('button', { name: /Run AI/i }).click();
  await expect(page.getByTestId('quality-badge')).toBeVisible();
}

test('an accepted measurement shows a green verdict with its explanation', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);

  const badge = page.getByTestId('escalation-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('data-decision', 'ACCEPT');
  await expect(badge).toContainText('ACCEPT');
  await expect(page.getByTestId('escalation-explanation')).toContainText('0.80 mm');
});

test('a flagged measurement is visibly distinct from an accepted one', async ({ page }) => {
  await installApiMocks(page, {
    escalationResponse: {
      ...DEFAULT_ESCALATION_RESPONSE,
      decision: 'FLAG_FOR_REVIEW',
      badge_color: 'red',
      justification:
        'Flagged for review because head circumference varied by 12.0 mm across the clip, ' +
        'above the 5 mm consistency threshold. Sonographer confirmation is recommended.',
    },
  });
  await runAnalysis(page);

  const badge = page.getByTestId('escalation-badge');
  await expect(badge).toHaveAttribute('data-decision', 'FLAG_FOR_REVIEW');
  await expect(badge).toContainText('FLAG FOR REVIEW');
  await expect(page.getByTestId('escalation-explanation')).toContainText('12.0 mm');
});

test('tool use is surfaced when the agent re-checked against the other checkpoint', async ({
  page,
}) => {
  await installApiMocks(page, {
    escalationResponse: {
      ...DEFAULT_ESCALATION_RESPONSE,
      tool_calls: [
        {
          tool: 'rerun_alternate_checkpoint',
          reason: 'Borderline reliability — a second opinion should settle it.',
          result: { variant: 'phase4b', hc_mm: 246.1 },
          error: null,
        },
        {
          tool: 'compare_measurements',
          reason: 'Quantify whether the two checkpoints agree.',
          result: { delta_mm: 0.8, agrees: true, threshold_mm: 3.0 },
          error: null,
        },
      ],
    },
  });
  await runAnalysis(page);

  const tools = page.getByTestId('escalation-tools');
  await expect(tools).toContainText('2 tools');
  await expect(tools).toContainText('rerun_alternate_checkpoint');
});

test('the evidence and thresholds behind the verdict can be inspected', async ({ page }) => {
  await installApiMocks(page);
  await runAnalysis(page);

  await expect(page.getByTestId('escalation-evidence')).toHaveCount(0);
  await page.getByTestId('escalation-evidence-toggle').click();

  const evidence = page.getByTestId('escalation-evidence');
  await expect(evidence).toBeVisible();
  // The thresholds must be visible, otherwise the verdict cannot be recomputed.
  await expect(evidence).toContainText('checkpoint_agreement_max_mm');
  await expect(evidence).toContainText('hc_std_flag_above_mm');
});

test('the verdict still shows when the plain-language summary is unavailable', async ({ page }) => {
  // The decision is rule-based; losing the model must not lose the verdict.
  await installApiMocks(page, {
    escalationResponse: {
      ...DEFAULT_ESCALATION_RESPONSE,
      decision: 'FLAG_FOR_REVIEW',
      badge_color: 'red',
      justification: null,
      justification_error: 'APIConnectionError: Connection error.',
      used_llm: false,
    },
  });
  await runAnalysis(page);

  await expect(page.getByTestId('escalation-badge')).toHaveAttribute(
    'data-decision',
    'FLAG_FOR_REVIEW',
  );
  // Falls back to the rule-based rationale rather than rendering empty.
  await expect(page.getByTestId('escalation-explanation')).toContainText('reliability 0.995');
  await expect(page.getByTestId('escalation-llm-note')).toContainText('Connection error');
});

test('a failed reliability check degrades to a note, not a blank space', async ({ page }) => {
  await installApiMocks(page, { escalationStatus: 404 });
  await runAnalysis(page);

  await expect(page.getByTestId('escalation-error')).toBeVisible();
  await expect(page.getByTestId('escalation-badge')).toHaveCount(0);
});
