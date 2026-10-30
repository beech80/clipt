import {defineConfig} from '@playwright/test';
// The built preview uses the development project selector, but all browser HTTP
// and websocket requests are intercepted before navigation. No hosted traffic.
export default defineConfig({
 testDir:'./tests',testMatch:'stream-pilot.spec.ts',workers:1,timeout:45000,
 use:{baseURL:'http://127.0.0.1:8082',serviceWorkers:'block',trace:'off',screenshot:'off'},
 webServer:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 8082 --strictPort',url:'http://127.0.0.1:8082',reuseExistingServer:false,timeout:60000},
});
