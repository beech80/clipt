import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'obs-beta.spec.ts',
  outputDir: 'test-results-streaming-8083',
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: 'http://127.0.0.1:8083',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    timeout: 180000,
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8083 --strictPort',
    url: 'http://127.0.0.1:8083',
    reuseExistingServer: false,
    env: {
      VITE_APP_ENV: 'production',
      VITE_STREAMING_ENABLED: 'true',
      VITE_SUPABASE_URL: 'https://slnjliheyiiummxhrgmk.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_local_test_fixture',
    },
  },
});
