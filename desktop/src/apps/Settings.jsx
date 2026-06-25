/* ============================================================
   LAUNCHPAD — Settings overlay (child-accessible)
   Theme, accent, name, sound, reduce-motion.
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useProfile } from '../lib/useProfile.js';
import { SFX } from '../lib/sfx.js';

const THEMES = [
  { id: 'space', label: 'Space', color: '#0a1538' },
  { id: 'midnight', label: 'Midnight', color: '#15081f' },
  { id: 'aurora', label: 'Aurora', color: '#03201f' },
];

const ACCENTS = [
  '#38bdf8', '#8b5cf6', '#f472b6', '#2dd4bf',
  '#fbbf24', '#fb923c', '#34d399', '#f87171',
];

export function Settings({ onClose }) {
  const [profile, setField] = useProfile();
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    SFX.close();
    setTimeout(onClose, 250);
  };

  return (
    <div className="set-layer">
      <div className="set-scrim" onClick={close}></div>
      <div className={`set-window ${closing ? 'closing' : ''}`}>
        <div className="set-head">
          <div className="set-ic">{Icon.gear()}</div>
          <div>
            <h2>Einstellungen</h2>
            <span className="set-sub">Dein Profil anpassen</span>
          </div>
          <button className="set-close" onClick={close} aria-label="Schliessen">{Icon.close()}</button>
        </div>

        <div className="set-body">
          {/* Kid name */}
          <div className="set-card">
            <h3>{Icon.users()} Dein Name</h3>
            <input
              className="set-input"
              type="text"
              value={profile.kidName}
              onChange={(e) => { setField('kidName', e.target.value); }}
              placeholder="Name eingeben"
              maxLength={24}
            />
          </div>

          {/* Theme selector */}
          <div className="set-card">
            <h3>{Icon.palette()} Farbwelt</h3>
            <div className="set-themes">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  className={`set-theme-btn ${profile.theme === th.id ? 'active' : ''}`}
                  style={{ '--tc': th.color }}
                  onClick={() => { SFX.select(); setField('theme', th.id); }}
                >
                  <span className="set-theme-dot"></span>
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div className="set-card">
            <h3>{Icon.star()} Akzentfarbe</h3>
            <div className="set-accents">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  className={`set-swatch ${profile.accent === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => { SFX.select(); setField('accent', c); }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <div className="set-card set-row">
            <div className="set-row-meta">
              <span className="set-row-ic">{Icon.volume()}</span>
              <b>Sound-Effekte</b>
            </div>
            <div
              className={`p-toggle ${profile.sound ? 'on' : ''}`}
              onClick={() => { SFX.select(); setField('sound', !profile.sound); }}
            ><i></i></div>
          </div>

          {/* Reduce motion toggle */}
          <div className="set-card set-row">
            <div className="set-row-meta">
              <span className="set-row-ic">{Icon.bolt()}</span>
              <b>Weniger Bewegung</b>
            </div>
            <div
              className={`p-toggle ${profile.reduceMotion ? 'on' : ''}`}
              onClick={() => { SFX.select(); setField('reduceMotion', !profile.reduceMotion); }}
            ><i></i></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
