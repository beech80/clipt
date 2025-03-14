import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// Temporarily comment out PWA to fix build
// import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    componentTagger(),
    // Temporarily disable PWA to fix build issues
    /* VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Clipt - Gaming Platform',
        short_name: 'Clipt',
        description: 'Share your gaming moments',
        theme_color: '#1A1F2C',
        background_color: '#1A1F2C',
        display: 'standalone',
        icons: [
          {
            src: '/logo192.png',
            type: 'image/png',
            sizes: '192x192'
          },
          {
            src: '/logo512.png',
            type: 'image/png',
            sizes: '512x512'
          }
        ]
      }
    }), */
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    // Increase the chunk size warning limit to avoid warnings
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
