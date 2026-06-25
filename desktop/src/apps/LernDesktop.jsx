/* ============================================================
   LAUNCHPAD — Lern-Desktop
   Full-screen learning environment with category sidebar and
   launchable app cards. Each app has a kind (winget/web/internal)
   and an optional wingetId for auto-install integration (FEAT-003).
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { CometData as D } from '../lib/data.js';
import { SFX } from '../lib/sfx.js';
import { useWinget, useWingetStatus } from '../lib/useWinget.js';

function KindBadge({ kind }) {
  const labels = { winget: 'App', web: 'Web', internal: 'Intern' };
  return <span className={`ld-badge ld-badge--${kind}`}>{labels[kind] || kind}</span>;
}

function AppCard({ app, catColor }) {
  const { install } = useWinget();
  const { status, line } = useWingetStatus(app.wingetId || '');

  const handleClick = () => {
    SFX.select();
    if (app.kind === 'web' && app.url) {
      // Web apps open in the safe browser (wired later)
      if (window.launchpad && window.launchpad.openUrl) {
        window.launchpad.openUrl(app.url);
      }
    } else if (app.kind === 'winget' && app.wingetId) {
      if (status === 'installed') {
        // Already installed: launch via shell (future: dedicated launcher)
        return;
      }
      if (status === 'installing') {
        // Already in progress, do nothing
        return;
      }
      // Trigger install
      install(app.wingetId);
    }
    // internal apps: handled in-app (future)
  };

  const statusLabel = () => {
    if (app.kind !== 'winget') return null;
    switch (status) {
      case 'installing':
        return <span className="ld-install-status ld-install-status--installing">Wird installiert...</span>;
      case 'installed':
        return <span className="ld-install-status ld-install-status--installed">Installiert</span>;
      case 'failed':
        return <span className="ld-install-status ld-install-status--failed">Fehler</span>;
      default:
        return <span className="ld-install-status">Installieren</span>;
    }
  };

  return (
    <button className="ld-app-card" onClick={handleClick} style={{ '--cat-color': catColor }}>
      <div className="ld-app-icon">{Icon[app.icon] ? Icon[app.icon]() : Icon.play()}</div>
      <div className="ld-app-info">
        <h4 className="ld-app-name">{app.name}</h4>
        <p className="ld-app-desc">{app.description}</p>
      </div>
      <div className="ld-app-meta">
        <KindBadge kind={app.kind} />
        {statusLabel()}
      </div>
      <span className="ld-app-go">{Icon.chevR()}</span>
    </button>
  );
}

function CategoryTab({ cat, active, onClick }) {
  return (
    <button
      className={`ld-tab ${active ? 'ld-tab--active' : ''}`}
      onClick={onClick}
      style={{ '--tab-c1': cat.c1, '--tab-c2': cat.c2 }}
    >
      <div className="ld-tab-icon">{Icon[cat.ic] ? Icon[cat.ic]() : Icon.star()}</div>
      <div className="ld-tab-text">
        <span className="ld-tab-title">{cat.title}</span>
        <span className="ld-tab-sub">{cat.sub}</span>
      </div>
    </button>
  );
}

export function LernDesktop({ onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    SFX.close();
    setTimeout(onClose, 280);
  };

  const activeCat = D.LEARN[activeIdx];

  return (
    <div className={`ld-layer ${closing ? 'ld-layer--closing' : ''}`}>
      <div className="ld-scrim" onClick={close}></div>
      <div className="ld-container">
        {/* Header */}
        <header className="ld-header">
          <div className="ld-header-left">
            <div className="ld-header-icon">{Icon.flask()}</div>
            <div>
              <h2 className="ld-title">Lern-Desktop</h2>
              <span className="ld-subtitle">Wissen & Entdecken</span>
            </div>
          </div>
          <button className="ld-close" onClick={close} aria-label="Schliessen">
            {Icon.close()}
          </button>
        </header>

        <div className="ld-body">
          {/* Sidebar */}
          <nav className="ld-sidebar">
            {D.LEARN.map((cat, i) => (
              <CategoryTab
                key={cat.title}
                cat={cat}
                active={i === activeIdx}
                onClick={() => { SFX.select(); setActiveIdx(i); }}
              />
            ))}
          </nav>

          {/* Content */}
          <main className="ld-content">
            <div className="ld-content-header" style={{ background: D.cover(activeCat.c1, activeCat.c2, 120) }}>
              <div className="ld-content-icon">{Icon[activeCat.ic]()}</div>
              <div>
                <h3>{activeCat.title}</h3>
                <p>{activeCat.sub}</p>
              </div>
            </div>
            <div className="ld-app-list">
              {activeCat.apps.map((app) => (
                <AppCard key={app.id} app={app} catColor={activeCat.c1} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default LernDesktop;
