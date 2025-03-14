import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    componentTagger(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // More granular chunking strategy
          if (id.includes('node_modules')) {
            if (id.includes('react') && !id.includes('react-dom') && !id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('react-dom')) {
              return 'vendor-react-dom';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('@radix-ui') || id.includes('@tanstack')) {
              return 'vendor-ui';
            }
            if (id.includes('framer-motion') || id.includes('motion')) {
              return 'vendor-animation';
            }
            return 'vendor-other'; // All other node_modules
          }
          
          // Split app code by directory
          if (id.includes('/src/pages/')) {
            return 'app-pages';
          }
          if (id.includes('/src/components/')) {
            return 'app-components';
          }
          if (id.includes('/src/services/')) {
            return 'app-services';
          }
        }
      }
    }
  }
});
