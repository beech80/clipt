import {defineConfig} from '@playwright/test';

// Ephemeral, self-signed TLS is accepted ONLY in this local fixture context.
// The application keeps its production HTTPS/origin/private-media checks.
export default defineConfig({
  testDir:'./tests',testMatch:'**/upload-playback.spec.ts',workers:1,
  timeout:process.platform==='win32'?120000:30000,
  use:{baseURL:'http://127.0.0.1:8082',ignoreHTTPSErrors:true,
    channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),
    screenshot:'only-on-failure',trace:'retain-on-failure',serviceWorkers:'block'},
  webServer:{command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8082 --strictPort',
    url:'http://127.0.0.1:8082',timeout:180000,reuseExistingServer:false,
    env:{VITE_APP_ENV:'development',VITE_SUPABASE_URL:'https://127.0.0.1:54322',VITE_SUPABASE_ANON_KEY:'sb_publishable_local_test_fixture'}},
});
