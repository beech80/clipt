import { defineConfig } from '@playwright/test';

// The private-media suite owns a local TLS receiver and intentionally runs on
// a separate app port from the faster interaction suite.
export default defineConfig({
  testDir: './tests',
  testMatch: 'upload-playback.spec.ts',
  outputDir: 'test-results-upload',
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  use: {
    baseURL: 'http://127.0.0.1:8082',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    serviceWorkers: 'block',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    timeout: 180000,
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8082 --strictPort',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: false,
    env: {
      VITE_APP_ENV: 'development',
      VITE_STREAMING_ENABLED: 'false',
      VITE_SUPABASE_URL: 'https://127.0.0.1:54322',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_local_test_fixture',
    },
  },
});
