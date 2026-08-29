import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  root: './',
  base: process.env['VITE_BASE_PATH'] ?? '/zarata/',
  publicDir: 'public',

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Zarata',
        short_name: 'Zarata',
        description:
          'A sound level meter: watch the noise, drag a limit, get a beep when it is crossed.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        categories: ['utilities', 'health'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],

  server: { port: 5173, strictPort: false, open: false },
  preview: { port: 4173, strictPort: false },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: { compress: { drop_console: true } },
    cssMinify: 'lightningcss',
  },

  resolve: {
    alias: {
      '@contexts': resolve(__dirname, './src/contexts'),
      '@shared-kernel': resolve(__dirname, './src/shared-kernel'),
      '@apps': resolve(__dirname, './src/apps'),
    },
  },

  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
