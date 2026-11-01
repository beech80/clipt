import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'obs-beta.spec.ts',workers:1,timeout:45000,
 use:{baseURL:'http://127.0.0.1:8083',serviceWorkers:'block',trace:'off',screenshot:'only-on-failure'},
 webServer:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 8083 --strictPort',url:'http://127.0.0.1:8083',reuseExistingServer:false,timeout:60000}});
