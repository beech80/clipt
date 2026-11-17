import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['native-broadcast.spec.ts', 'stream-pilot.spec.ts'],
  outputDir: 'test-results-streaming-8082',
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: 'http://127.0.0.1:8082',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    serviceWorkers: 'block',
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
      VITE_STREAMING_ENABLED: 'true',
      VITE_SUPABASE_URL: 'https://akiksrlzdqvipqbbjxpw.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_local_test_fixture',
    },
  },
});
