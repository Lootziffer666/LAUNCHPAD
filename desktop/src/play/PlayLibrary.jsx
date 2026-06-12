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

// Friendly German copy for a blocked/failed launch (gentle, no scary language).
function launchMessage(res) {
  switch (res && res.reason) {
    case 'time_limit': return 'Die Spielzeit für heute ist aufgebraucht 🌙';
    case 'blocked': return (res && res.message) || 'Dieses Spiel ist für dich noch gesperrt.';
    case 'not_approved': return 'Dieses Spiel ist noch nicht freigegeben.';
    case 'not_installed': return 'Dieses Spiel ist noch nicht installiert.';
    case 'not_found': return 'Spiel nicht gefunden.';
    default: return (res && res.message) || 'Start fehlgeschlagen.';
  }
}

export function PlayOverlay({ kidName, origin, onExit, initialGame }) {
  const games = useGames();
  const [tab, setTabRaw] = useState(0);
  const [closing, setClosing] = useState(false);
  const [detail, setDetail] = useState(initialGame || null);
  const [launch, setLaunch] = useState(null); // {g, phase: 'preflight'|'opening'|'failed', …}

  const setTab = (i) => { if (i !== tab) SFX.swipe(); setTabRaw(i); };
  const doExit = () => { setClosing(true); SFX.close(); setTimeout(onExit, 300); };
  const openDetail = (g) => { SFX.select(); setDetail(g); };

  // Real launch with honest transition phases (windows-plan rule: the
  // transition may calm, but never lie): preflight ("Startklar machen")
  // while main checks the gate + resolves the target, opening ("Spiel wird
  // geöffnet") once the start actually fired, failed otherwise. The error
  // class decides whether retrying is offered.
  const launchGame = async (g) => {
    SFX.launch();
    setLaunch({ g, phase: 'preflight' });
    let res = { ok: true };
    if (window.launchpad && window.launchpad.launchGame) {
      try { res = await window.launchpad.launchGame(g.id); }
      catch (e) { res = { ok: false, reason: 'error', errorClass: 'recoverable', message: String((e && e.message) || e) }; }
    }
    if (res && res.ok) setLaunch({ g, phase: 'opening' });
    else {
      setLaunch({
        g, phase: 'failed',
        message: launchMessage(res),
        canRetry: !res || res.errorClass === 'recoverable' || !res.errorClass,
      });
    }
  };

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

  // After a successful launch the external game takes over — auto-dismiss the
  // "opening" splash so it doesn't hang. Failed launches stay until tapped.
  useEffect(() => {
    if (launch && launch.phase === 'opening') {
      const t = setTimeout(() => setLaunch(null), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [launch]);

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
          <div className="launch-art" style={launch.g.cover
            ? { backgroundImage: `url("${launch.g.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: CometData.cover(launch.g.c1, launch.g.c2) }}>
            {!launch.g.cover && <div style={{ width: 96, height: 96, color: 'rgba(255,255,255,.9)' }}>{Icon[launch.g.emblem] && Icon[launch.g.emblem]()}</div>}
          </div>
          <div className="launch-name">{launch.g.name}</div>
          {launch.phase === 'failed' && (
            <>
              <div className="launch-status blocked">Das hat gerade nicht geklappt</div>
              <div className="launch-substatus">{launch.message}</div>
              <div className="launch-actions">
                {launch.canRetry && (
                  <button className="launch-back" onClick={() => launchGame(launch.g)}>Nochmal versuchen</button>
                )}
                <button className="launch-back" onClick={() => { SFX.back(); setLaunch(null); }}>Zurück</button>
              </div>
            </>
          )}
          {launch.phase === 'preflight' && (
            <>
              <div className="launch-status">Startklar machen</div>
              <div className="launch-substatus">Wir prüfen kurz alles</div>
              <div className="launch-loader"><i></i></div>
              <button className="launch-back" onClick={() => { SFX.back(); setLaunch(null); }}>Abbrechen</button>
            </>
          )}
          {launch.phase === 'opening' && (
            <>
              <div className="launch-status">Spiel wird geöffnet</div>
              <div className="launch-substatus">Das dauert nur einen Moment</div>
              <div className="launch-loader"><i></i></div>
              <button className="launch-back" onClick={() => { SFX.back(); setLaunch(null); }}>Abbrechen</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayOverlay;
