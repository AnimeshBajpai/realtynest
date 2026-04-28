import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: '/runningCoach/',
      manifest: {
        name: 'Running Coach',
        short_name: 'RunCoach',
        description: 'Your AI-powered gamified running coach',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        start_url: '/runningCoach/dashboard',
        scope: '/runningCoach/',
        icons: [
          {
            src: '/running-coach-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/running-coach\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'running-coach-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@running-coach': path.resolve(__dirname, '../running-coach/client'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
