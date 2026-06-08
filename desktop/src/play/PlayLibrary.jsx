/* ============================================================
   LAUNCHPAD — Play (library) overlay: tabs, featured hero, grid,
   Game Detail + launch splash.
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/icons.jsx';
import { CometData } from '../lib/data.js';
import { useGames } from '../games/useGames.js';
import { SFX } from '../lib/sfx.js';
import { CoverFill, srcBadge, stars } from './cover.jsx';
import { GameDetail } from './GameDetail.jsx';

const TABS = [
  { id: 'bibliothek', label: 'bibliothek' },
  { id: 'favoriten', label: 'favoriten' },
  { id: 'installiert', label: 'installiert' },
];

export function PlayOverlay({ kidName, origin, onExit, onOpenImport, initialGame }) {
  const games = useGames();
  const [tab, setTabRaw] = useState(0);
  const [closing, setClosing] = useState(false);
  const [detail, setDetail] = useState(initialGame || null);
  const [launch, setLaunch] = useState(null);

  const setTab = (i) => { if (i !== tab) SFX.swipe(); setTabRaw(i); };
  const doExit = () => { setClosing(true); SFX.close(); setTimeout(onExit, 300); };
  const openDetail = (g) => { SFX.select(); setDetail(g); };
  const launchGame = (g) => { SFX.launch(); setLaunch(g); };

  useEffect(() => {
    const onKey = (e) => {
      if (launch) { if (e.key === 'Escape') setLaunch(null); return; }
      if (detail) { if (e.key === 'Escape') setDetail(null); return; }
      if (e.key === 'Escape') doExit();
      else if (e.key === 'ArrowRight') setTab(Math.min(tab + 1, TABS.length - 1));
      else if (e.key === 'ArrowLeft') setTab(Math.max(tab - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, detail, launch]);

  // keep detail object fresh after store edits (fav/install)
  const liveDetail = detail ? (games.find((x) => x.id === detail.id) || detail) : null;

  const zx = origin ? `${origin.x}%` : '50%';
  const zy = origin ? `${origin.y}%` : '50%';
  if (!games.length) return null;

  const featured = games.find((g) => g.featured && g.installed) || games.find((g) => g.installed) || games[0];
  const filtered = tab === 1 ? games.filter((g) => g.favorite)
    : tab === 2 ? games.filter((g) => g.installed)
      : games;

  return (
    <div className={`play-overlay ${closing ? 'closing' : ''}`} style={{ '--zx': zx, '--zy': zy }}>
      <div className="boot-flash"></div>

      <header className="pl-header">
        <div className="pl-brand">
          <div className="lp-mark"><span></span></div>
          <div className="pl-word">LAUNCH<b>PAD</b> <em>/ play</em></div>
        </div>
        <div className="pl-right">
          <button className="pl-ghost" onClick={onOpenImport}>{Icon.plus()} Spiele</button>
          <div className="pl-user">
            <image-slot id="play-avatar" shape="circle" placeholder="Foto"></image-slot>
            <span>{kidName}</span>
          </div>
          <button className="pl-exit" onClick={doExit}>{Icon.close()} Desktop</button>
        </div>
      </header>

      <nav className="pl-tabs">
        {TABS.map((t, i) => (
          <button key={t.id} className={`pl-tab ${i === tab ? 'active' : ''}`} onClick={() => setTab(i)}>{t.label}</button>
        ))}
      </nav>

      <main className="pl-main">
        {/* featured hero (only on bibliothek) */}
        {tab === 0 && (
          <div className="pl-feature" onClick={() => openDetail(featured)}>
            <div className="plf-bg" style={featured.cover ? { backgroundImage: `url("${featured.cover}")` } : { background: CometData.cover(featured.c1, featured.c2, 110) }}></div>
            <div className="plf-scrim"></div>
            <div className="plf-tx">
              <span className="plf-kick">Zuletzt gespielt</span>
              <h2>{featured.name}</h2>
              <div className="plf-meta">{featured.cat} · {stars(featured.stars)}</div>
              <div className="plf-actions">
                <button className="plf-play" onClick={(e) => { e.stopPropagation(); launchGame(featured); }}>{Icon.play()} Starten</button>
                <button className="plf-more" onClick={(e) => { e.stopPropagation(); openDetail(featured); }}>Details</button>
              </div>
            </div>
            {srcBadge(featured) && <div className="plf-badge">{srcBadge(featured)}</div>}
          </div>
        )}

        <div className="pl-rowtitle">{TABS[tab].label} <span>· {filtered.length}</span></div>
        <div className="pl-grid">
          {filtered.map((g) => (
            <button key={g.id} className={`pl-card ${!g.installed ? 'dim' : ''}`} onClick={() => openDetail(g)}>
              <CoverFill g={g}>
                <div className="pc-scrim"></div>
                {g.favorite && <span className="pc-fav">{Icon.heart()}</span>}
                {!g.installed && <span className="pc-cloud">{Icon.plus()}</span>}
                <div className="pc-foot">
                  <div className="pc-src">{srcBadge(g)}</div>
                  <div className="pc-name">{g.name}</div>
                  <div className="pc-cat">{g.cat}</div>
                </div>
              </CoverFill>
            </button>
          ))}
        </div>
      </main>

      <div className="pl-hint">
        <span><kbd>←</kbd><kbd>→</kbd> Tabs</span>
        <span><kbd>Enter</kbd> Auswählen</span>
        <span><kbd>Esc</kbd> Zurück</span>
      </div>

      {/* Game Detail */}
      {liveDetail && <GameDetail g={liveDetail} onBack={() => { SFX.back(); setDetail(null); }} onLaunch={launchGame} />}

      {/* launch splash */}
      {launch && (
        <div className="launch-splash">
          <div className="launch-art" style={launch.cover
            ? { backgroundImage: `url("${launch.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: CometData.cover(launch.c1, launch.c2) }}>
            {!launch.cover && <div style={{ width: 96, height: 96, color: 'rgba(255,255,255,.9)' }}>{Icon[launch.emblem] && Icon[launch.emblem]()}</div>}
          </div>
          <div className="launch-name">{launch.name}</div>
          <div className="launch-status">Wird gestartet …</div>
          <div className="launch-loader"><i></i></div>
          <button className="launch-back" onClick={() => { SFX.back(); setLaunch(null); }}>Abbrechen</button>
        </div>
      )}
    </div>
  );
}

export default PlayOverlay;
