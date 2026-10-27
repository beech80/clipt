// Deployment tooling consumes stdout directly. Only validated browser-public
// values are exported; no server credentials or complete env object are read out.
import { loadEnv } from 'vite';
import { developmentPreviewEnvironment } from './preview-environment.mjs';
const config = developmentPreviewEnvironment(loadEnv('development', process.cwd(), 'VITE_'));
console.log(JSON.stringify({ url: config.supabaseUrl, key: config.supabaseAnonKey, stage: 'staging' }));
