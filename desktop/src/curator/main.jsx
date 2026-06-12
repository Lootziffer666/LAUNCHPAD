// Curator renderer entry — the PARENT app (two-app split).
// A normal desktop GUI: document scrolling, resizable window, no stage scaling
// and no kid-shell chrome. Talks to main through the curator bridge
// (electron/preload-curator.js).

import React from 'react';
import { createRoot } from 'react-dom/client';

// Brand font, bundled locally (offline + CSP-safe — no CDN phone-home).
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';

// base tokens, then the surfaces the curator composes
import '../styles/base.css';
import '../styles/import.css';
import '../styles/parental.css';
import '../styles/curator.css';

import CuratorApp from './CuratorApp.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CuratorApp />
  </React.StrictMode>,
);
