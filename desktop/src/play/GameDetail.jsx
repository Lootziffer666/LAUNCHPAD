/* ============================================================
   LAUNCHPAD — Game Detail (start / install / favorite)
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { CometData } from '../lib/data.js';
import { GameStore } from '../games/useGames.js';
import { SFX } from '../lib/sfx.js';
import { CoverFill, srcBadge, stars } from './cover.jsx';

export function GameDetail({ g, onBack, onLaunch }) {
  const [installing, setInstalling] = useState(false);
  const install = () => {
    setInstalling(true);
    SFX.select();
    // M3: replace the timeout with window.launchpad.installGame(g.id).
    setTimeout(() => { GameStore.install(g.id); setInstalling(false); }, 1400);
  };
  return (
    <div className="gd">
      <div className="gd-bg" style={g.cover
        ? { backgroundImage: `url("${g.cover}")` }
        : { background: CometData.cover(g.c1, g.c2) }}></div>
      <div className="gd-bg-scrim"></div>

      <button className="gd-back" onClick={onBack}>{Icon.chevL()} Zurück</button>

      <div className="gd-inner">
        <div className="gd-cover"><CoverFill g={g} /></div>
        <div className="gd-info">
          <div className="gd-srcrow">
            {srcBadge(g)}
            <span className={`gd-state ${g.installed ? 'on' : ''}`}>
              {g.installed ? <>{Icon.shield()} Installiert</> : 'Nicht installiert'}
            </span>
          </div>
          <h1 className="gd-title">{g.name}</h1>
          <div className="gd-meta">{g.cat} · {stars(g.stars)}{g.installed && g.playtime !== '—' ? ` · ${g.playtime} gespielt` : ''}</div>
          <p className="gd-desc">{g.desc}</p>

          {g.progress > 0 && g.installed && (
            <div className="gd-prog">
              <div className="gd-prog-lbl"><span>Fortschritt</span><span>{Math.round(g.progress * 100)}%</span></div>
              <div className="gd-prog-bar"><i style={{ width: `${g.progress * 100}%` }}></i></div>
            </div>
          )}

          <div className="gd-actions">
            {g.installed ? (
              <button className="gd-play" onClick={() => onLaunch(g)}>{Icon.play()} {g.progress > 0 ? 'Weiterspielen' : 'Starten'}</button>
            ) : (
              <button className="gd-play install" onClick={install} disabled={installing}>
                {installing ? <>{Icon.bolt()} Wird installiert…</> : <>{Icon.plus()} Installieren</>}
              </button>
            )}
            <button className={`gd-fav ${g.favorite ? 'on' : ''}`} onClick={() => { GameStore.toggleFavorite(g.id); SFX.select(); }}>
              {Icon.heart()} {g.favorite ? 'Favorit' : 'Merken'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameDetail;
