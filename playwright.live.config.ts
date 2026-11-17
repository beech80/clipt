import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'live-public-routes.spec.ts',
  outputDir: 'test-results-live',
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: process.env.LIVE_BASE_URL,
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
