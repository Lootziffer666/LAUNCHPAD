// Renderer entry. M0 = an on-brand boot screen that proves the React root mounts
// and the secure preload bridge (window.launchpad) reached the renderer.
// M1 replaces <Boot/> with the real shells (see handoff/PROJECT-STRUCTURE.md → src/App.jsx).

import React from 'react';
import { createRoot } from 'react-dom/client';
import './boot.css';

const bridgeReady = typeof window !== 'undefined' && Boolean(window.launchpad);

function Boot() {
  return (
    <div className="lp-boot">
      <div className="lp-boot__mark">LAUNCHPAD</div>
      <div className="lp-boot__sub">Desktop</div>
      <div className={`lp-boot__bridge ${bridgeReady ? 'is-ok' : 'is-missing'}`}>
        {bridgeReady ? 'Sichere Brücke verbunden' : 'Brücke fehlt'}
      </div>
      <div className="lp-boot__note">Gerüst läuft · M0</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boot />
  </React.StrictMode>,
);
