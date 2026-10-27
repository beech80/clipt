import { defineConfig } from '@playwright/test';

// Local-only regression fixture. It cannot address the owner's hosted project.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  // Measured Windows page setup alone took ~14s; allow the complete fixture
  // scenario to run without changing assertion/action waits or CI's budget.
  timeout: process.platform === 'win32' ? 120000 : 30000,
  use: {
    baseURL: 'http://127.0.0.1:8081',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    // Slow Windows cold starts may exceed the default 60s. Assertion timeouts
    // remain unchanged; this does not turn a failed interaction into a pass.
    timeout: 180000,
    command: process.env.PLAYWRIGHT_PREVIEW === '1'
      ? 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 8081 --strictPort'
      : 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8081 --strictPort',
    url: 'http://127.0.0.1:8081',
    reuseExistingServer: false,
    env: {
      VITE_APP_ENV: 'development',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_local_test_fixture',
    },
  },
});
