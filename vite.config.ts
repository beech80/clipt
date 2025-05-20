import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Detect if running on Vercel
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // Only use componentTagger when not on Vercel to avoid build errors
    ...(!isVercel ? [componentTagger()] : []),
    VitePWA({
      registerType: 'autoUpdate',
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
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@supabase/supabase-js'
          ]
        }
      }
    }
  }
});
