/* ============================================================
   LAUNCHPAD — child home (Metro-style big-tile launcher)
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/icons.jsx';
import { CometData as DD } from '../lib/data.js';
import { useGames, gameCover } from '../games/useGames.js';

function MiniClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return <span className="hd-time">{time}</span>;
}

function originFromEvent(e) {
  const stage = document.querySelector('.stage');
  if (!stage) return { x: 50, y: 50 };
  const r = stage.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  return { x: Math.max(0, Math.min(100, (cx / r.width) * 100)), y: Math.max(0, Math.min(100, (cy / r.height) * 100)) };
}

export function Desktop({ kidName, onOpenApp, onOpenPlay, onOpenParental, onLaunchDirect, onOpenWindows, onOpenHabitat }) {
  const games = useGames();
  const installedCount = games.filter((g) => g.installed).length;
  const favs = games.filter((g) => g.favorite && g.installed).slice(0, 3);
  // Home tiles are data-driven now: parents pin games to the home screen and
  // order them in the Familienzentrale. The first pinned game is the big hero
  // tile; the rest fill the smaller direct tiles. Falls back to featured/first.
  const pinned = games
    .filter((g) => g.pinned)
    .sort((a, b) => (Number.isFinite(a.homeOrder) ? a.homeOrder : 9) - (Number.isFinite(b.homeOrder) ? b.homeOrder : 9));
  const heroGame = pinned[0] || games.find((g) => g.featured) || games[0];
  const directRest = (pinned.length ? pinned.slice(1) : games.filter((g) => g.id !== (heroGame && heroGame.id)).slice(0, 2));

  return (
    <div className="desktop">
      {/* top bar — minimal, confident */}
      <header className="hd">
        <div className="hd-brand">
          <div className="lp-mark"><span></span></div>
          <div className="hd-word">LAUNCH<b>PAD</b></div>
        </div>
        <div className="hd-right">
          <MiniClock />
          <div className="hd-user">
            <span className="hd-name">{kidName}</span>
            <image-slot id="desktop-avatar" shape="circle" placeholder="Foto"></image-slot>
          </div>
        </div>
      </header>

      {/* tile grid */}
      <div className="grid-area">
        <div className="home-grid">
          {/* SPIELEN hero */}
          <button className=" htile play" onClick={(e) => onOpenPlay(originFromEvent(e))}>
            <div className="play-glow"></div>
            <div className="play-top">
              <div className="htile-ic">{Icon.gamepad()}</div>
              <span className="play-count">{installedCount} Spiele bereit</span>
            </div>
            <div className="play-foot">
              <h2>Spielen</h2>
              <div className="play-favs">
                {favs.map((g) => (
                  <span key={g.id} className="pf" style={gameCover(g)} title={g.name}>
                    {!g.cover && <i>{Icon[g.emblem] && Icon[g.emblem]()}</i>}
                  </span>
                ))}
                <span className="pf more">+{Math.max(0, installedCount - favs.length)}</span>
              </div>
            </div>
            <span className="play-cta">{Icon.play()} Bibliothek öffnen</span>
          </button>

          {/* category tiles */}
          <button className="htile c-teal" onClick={(e) => onOpenApp('lernen', originFromEvent(e))}>
            <div className="htile-ic">{Icon.flask()}</div>
            <div className="htile-label">Lernen</div>
          </button>
          <button className="htile c-pink" onClick={(e) => onOpenApp('kreativ', originFromEvent(e))}>
            <div className="htile-ic">{Icon.palette()}</div>
            <div className="htile-label">Kreativ</div>
          </button>
          <button className="htile c-blue" onClick={(e) => onOpenApp('web', originFromEvent(e))}>
            <div className="htile-ic">{Icon.globe()}</div>
            <div className="htile-label">Web</div>
          </button>

          {/* direct launch — first pinned game (data-driven hero) */}
          {heroGame && (
            <button className="htile direct" style={gameCover(heroGame, 135)} onClick={(e) => onLaunchDirect(heroGame, originFromEvent(e))}>
              <div className="direct-scrim"></div>
              {!heroGame.cover && <div className="direct-emb">{Icon[heroGame.emblem] && Icon[heroGame.emblem]()}</div>}
              <div className="direct-foot">
                <span className="src-badge" style={{ background: DD.sourceBadge(heroGame.source).c }}>{DD.sourceBadge(heroGame.source).label}</span>
                <div className="htile-label sm">{heroGame.name}</div>
              </div>
            </button>
          )}

          {/* remaining pinned games as smaller direct tiles */}
          {directRest.map((d) => (
            <button key={d.id} className="htile direct small" style={gameCover(d, 135)}
              onClick={(e) => onLaunchDirect(d, originFromEvent(e))}>
              <div className="direct-scrim"></div>
              {!d.cover && <div className="direct-emb sm">{Icon[d.emblem] && Icon[d.emblem]()}</div>}
              <div className="direct-foot">
                <span className="src-badge" style={{ background: DD.sourceBadge(d.source).c }}>{DD.sourceBadge(d.source).label}</span>
                <div className="htile-label sm">{d.name}</div>
              </div>
            </button>
          ))}

          {/* utility: Habitat 3D Welt */}
          <button className="htile glass" onClick={(e) => onOpenHabitat(originFromEvent(e))}>
            <div className="htile-ic soft">{Icon.compass()}</div>
            <div className="htile-label sm soft">3D Welt</div>
          </button>

          {/* utility: Windows-Desktop (gated) */}
          <button className="htile glass" onClick={(e) => onOpenWindows(originFromEvent(e))}>
            <div className="win-lock">{Icon.lock()}</div>
            <div className="htile-ic soft">{Icon.grid()}</div>
            <div className="htile-label sm soft">Windows-Desktop</div>
          </button>

          {/* Elternbereich */}
          <button className="htile glass" onClick={onOpenParental}>
            <div className="htile-ic soft">{Icon.lock()}</div>
            <div className="htile-label sm soft">Elternbereich</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Desktop;
