// Renderer entry — mounts the real app (M1).
// The secure window.launchpad bridge is exposed by electron/preload.js;
// M2 re-backs the data layer on it. M1 still runs on local seed data.

import React from 'react';
import { createRoot } from 'react-dom/client';

// Brand font, bundled locally (offline + CSP-safe — no CDN phone-home).
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';

// Global styles — base tokens/themes first, then per-surface sheets.
import './styles/base.css';
import './styles/desktop.css';
import './styles/apps.css';
import './styles/launcher.css';
import './styles/parental.css';
import './styles/import.css';
import './styles/windows.css';

// Registers the <image-slot> custom element (side-effect import).
import './ui/image-slot.js';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
