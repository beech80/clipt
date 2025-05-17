import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    componentTagger(),
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
    chunkSizeWarningLimit: 600, // Increase warning limit to reduce noise
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler')) {
            return 'react-core';
          }
          
          // Routing
          if (id.includes('node_modules/react-router') || 
              id.includes('node_modules/history')) {
            return 'routing';
          }
          
          // Backend services
          if (id.includes('node_modules/@supabase') || 
              id.includes('node_modules/@tanstack/react-query')) {
            return 'backend';
          }

          // UI libraries
          if (id.includes('node_modules/framer-motion') || 
              id.includes('node_modules/@radix-ui') || 
              id.includes('node_modules/sonner')) {
            return 'ui-libs';
          }

          // Animation libraries
          if (id.includes('node_modules/three') || 
              id.includes('node_modules/gsap')) {
            return 'animations';
          }

          // Gaming components
          if (id.includes('/src/gaming/')) {
            return 'gaming';
          }

          // Use default chunking for other node_modules
          if (id.includes('node_modules')) {
            return 'vendors';
          }
        }
      }
    },
    target: 'esnext', // Modern browsers for better performance
    minify: 'terser', // Use terser for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true // Remove debugger statements
      }
    }
  }
});
