import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'offline.html'],
      manifest: {
        name: 'Clip - Social Gaming Platform',
        short_name: 'Clip',
        description: 'Share your gaming moments',
        theme_color: '#1A1F2C',
        background_color: '#1A1F2C',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64',
            type: 'image/x-icon'
          },
          {
            src: 'logo192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any maskable'
          },
          {
            src: 'logo512.png',
            type: 'image/png',
            sizes: '512x512'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit instead of the default 2 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/slnjliheyiiummxhrgmk\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1600,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router')) {
              return 'vendor-react';
            }
            
            if (id.includes('@radix-ui') || 
                id.includes('lucide-react') || 
                id.includes('class-variance-authority')) {
              return 'vendor-ui';
            }
            
            if (id.includes('@tanstack') || 
                id.includes('zustand') || 
                id.includes('dayjs')) {
              return 'vendor-utils';
            }
            
            return 'vendor-other';
          }
          
          if (id.includes('/src/pages/')) {
            if (id.includes('Streaming') || 
                id.includes('StreamSetup') ||
                id.includes('GameStreamers')) {
              return 'page-streaming';
            }
            
            if (id.includes('Profile') || 
                id.includes('EditProfile') || 
                id.includes('UserProfile')) {
              return 'page-profile';
            }
            
            if (id.includes('Discovery') || 
                id.includes('RetroSearchPage') ||
                id.includes('Search')) {
              return 'page-discovery';
            }
          }
          
          if (id.includes('/src/components/')) {
            if (id.includes('/components/ui/')) {
              return 'comp-ui';
            }
            if (id.includes('/components/streaming/')) {
              return 'comp-streaming';
            }
            if (id.includes('/components/profile/')) {
              return 'comp-profile';
            }
          }
        }
      }
    }
  },
}));
