import { build, loadEnv } from 'vite';
import { developmentPreviewEnvironment, verifyPreviewPublicKey } from './preview-environment.mjs';

// Read existing development public configuration only; never pull or overwrite
// environment files or embed server credentials. No credential values are logged.
const config = developmentPreviewEnvironment(loadEnv('development', process.cwd(), 'VITE_'));
await verifyPreviewPublicKey(config);
process.env.VITE_SUPABASE_URL = config.supabaseUrl;
process.env.VITE_SUPABASE_ANON_KEY = config.supabaseAnonKey;
process.env.VITE_APP_ENV = 'staging';
console.log('Verified development-only public configuration. Building Preview.');
await build({ mode: 'staging', build: { outDir: 'dist-preview' } });
