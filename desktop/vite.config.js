// vite.config.js — renderer build for the Electron app.
// base:'./' so the production build loads via file:// inside Electron.

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
  },
});
