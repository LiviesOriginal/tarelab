import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const appDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/climb/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'The Climb — a no-contact watch',
        short_name: 'The Climb',
        description: "Billie the goat hauls your willpower up Mount Situationship.",
        start_url: '/climb/',
        scope: '/climb/',
        display: 'standalone',
        background_color: '#161228',
        theme_color: '#161228',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{html,js,css,svg,webmanifest}']
      }
    })
  ],
  build: {
    outDir: resolve(appDirectory, '../climb'),
    emptyOutDir: true
  }
});
