import { defineConfig, devices } from '@playwright/test';

// Playwright config — Batch 8.5 / 8.6.
//
// The webapp's API_BASE points at the public HF Spaces backend by default.
// For E2E we don't depend on the remote — every API call is intercepted
// with page.route() and replied to with a deterministic mock so the tests
// stay fast, hermetic, and independent of HF Spaces uptime.

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  webServer: {
    command: `next dev -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
