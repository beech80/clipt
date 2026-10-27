import { defineConfig, loadEnv } from 'vite';
import { readPublicEnvironment } from './src/lib/environment';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode, command }) => {
  // A successful build must not silently ship the inert configuration-error UI.
  if (command === 'build') readPublicEnvironment(loadEnv(mode, process.cwd(), 'VITE_'));
  return ({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    // Let Rollup follow dependency boundaries. Splitting React, ReactDOM and
    // every library containing "react" into separate forced chunks created
    // an initialization cycle that crashed the production bundle.
    chunkSizeWarningLimit: 1000,
  },
});
});
