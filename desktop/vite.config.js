// vite.config.js — renderer build for the Electron app.
// base:'./' so the production build loads via file:// inside Electron.
// Two entries — the child shell (index.html) and the parent curator
// (curator.html) are separate apps sharing one bundle pipeline.

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome120', // matches Electron 31's Chromium; safe to use modern JS/CSS
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        curator: fileURLToPath(new URL('./curator.html', import.meta.url)),
      },
    },
  },
});
