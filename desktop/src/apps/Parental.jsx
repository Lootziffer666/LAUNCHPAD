/* ============================================================
   LAUNCHPAD — Eltern & Sicherheit panel.
   Bound to the persisted parental settings + usage via IPC
   (window.launchpad.getParentalSettings / setParentalSettings /
   getUsageToday / setPin). Falls back to local defaults with no bridge.
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';

const api = (typeof window !== 'undefined' && window.launchpad) || null;

const PAR_APPS = [
  { id: 'browser', name: 'Browser', sub: 'Sicheres Surfen', ic: 'globe', c: '#2563eb' },
  { id: 'videos', name: 'Videos', sub: 'Comet Video', ic: 'film', c: '#7c3aed' },
  { id: 'music', name: 'Musik', sub: 'Comet Music', ic: 'music', c: '#db2777' },
  { id: 'play', name: 'Game Launcher', sub: 'Comet Arcade', ic: 'gamepad', c: '#6d28d9' },
  { id: 'friends', name: 'Freunde-Chat', sub: 'Nachrichten & Status', ic: 'chat', c: '#0d9488' },
];

const WEEK = [
  { d: 'Mo', v: 0.5 }, { d: 'Di', v: 0.7 }, { d: 'Mi', v: 0.4 },
  { d: 'Do', v: 0.85 }, { d: 'Fr', v: 0.95 }, { d: 'Sa', v: 0.6, today: true }, { d: 'So', v: 0 },
];

// `inline` renders the panel as a static pane (curator app) instead of the
// overlay window — no scrim, no close button, no zoom animation. onClose
// defaults to a no-op so inline use can't hit an undefined callback.
export function ParentalPanel({ kidName = 'Jake', onClose = () => {}, inline = false }) {
  const [closing, setClosing] = useState(false);
  const [limit, setLimit] = useState(90);
  const [used, setUsed] = useState(0);
  const [age, setAge] = useState('9');
  const [bedFrom, setBedFrom] = useState('20:30');
  const [bedTo, setBedTo] = useState('07:00');
  const [approvals, setApprovals] = useState({ browser: true, videos: true, music: true, play: true, friends: false });
  const [kiosk, setKiosk] = useState(false);
  const [autostart, setAutostart] = useState(true);
  const [modules, setModules] = useState({ wishlist: true, deals: true });
  const [saved, setSaved] = useState(false);

  // PIN change
  const [pinOld, setPinOld] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinMsg, setPinMsg] = useState(null);
  // recovery code
  const [hasRecovery, setHasRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState(null); // shown once after generation

  useEffect(() => {
    let alive = true;
    if (!api) return undefined;
    Promise.all([api.getParentalSettings(), api.getUsageToday()])
      .then(([s, u]) => {
        if (!alive) return;
        if (s) {
          setLimit(s.dailyLimitMin ?? 90);
          setAge(String(s.ageRating ?? '9'));
          if (s.bedtime) { setBedFrom(s.bedtime.from || '20:30'); setBedTo(s.bedtime.to || '07:00'); }
          if (s.approvals) setApprovals((a) => ({ ...a, ...s.approvals }));
          setKiosk(!!s.kiosk);
          setAutostart(s.autostart !== false);
          if (s.modules) setModules((m) => ({ ...m, ...s.modules }));
          setHasRecovery(!!s.hasRecovery);
        }
        if (u) setUsed(u.usedMin || 0);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const close = () => { setClosing(true); SFX.close(); setTimeout(onClose, 240); };
  const toggle = (id) => { SFX.select(); setApprovals((a) => ({ ...a, [id]: !a[id] })); };
  const usedPct = Math.min(100, (used / limit) * 100);
  const over = used > limit;

  const save = async () => {
    SFX.select();
    if (api) {
      try {
        await api.setParentalSettings({ ageRating: age, dailyLimitMin: limit, bedtime: { from: bedFrom, to: bedTo }, approvals, kiosk, autostart, modules });
      } catch (e) { /* ignore */ }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const changePin = async () => {
    if (!api) { setPinMsg('Nicht verfügbar'); return; }
    if (String(pinNew).length < 4) { setPinMsg('Neue PIN braucht mind. 4 Ziffern'); SFX.back(); return; }
    let ok = false;
    try { ok = await api.setPin(pinOld, pinNew); } catch (e) { ok = false; }
    if (ok) { setPinOld(''); setPinNew(''); SFX.select(); setPinMsg('PIN geändert ✓'); }
    else { SFX.back(); setPinMsg('Alte PIN stimmt nicht'); }
    setTimeout(() => setPinMsg(null), 2600);
  };

  const makeRecovery = async () => {
    if (!api || !api.generateRecoveryCode) { setPinMsg('Nicht verfügbar'); return; }
    try {
      const r = await api.generateRecoveryCode();
      if (r && r.ok && r.code) { setRecoveryCode(r.code); setHasRecovery(true); SFX.launch(); }
    } catch (e) { SFX.back(); }
  };

  const panel = (
      <div className={`par-window ${closing ? 'closing' : ''} ${inline ? 'inline' : ''}`}>
        <div className="par-head">
          <div className="p-ic">{Icon.shield()}</div>
          <div>
            <h2>Eltern &amp; Sicherheit</h2>
            <div className="p-sub">Verwalte {kidName}s Konto — geschützt durch Eltern-PIN</div>
          </div>
          <div className="par-pin">{Icon.lock()} PIN aktiv</div>
          {!inline && <button className="par-close" onClick={close} aria-label="Schließen">{Icon.close()}</button>}
        </div>

        <div className="par-body">
          {/* daily screen time */}
          <div className="par-card span2">
            <h3>{Icon.clock()} Tägliche Bildschirmzeit</h3>
            <p className="desc">Wie lange darf {kidName} pro Tag das Gerät nutzen?</p>
            <div className="par-slider">
              <input type="range" min="30" max="180" step="15" value={limit}
                onChange={(e) => { setLimit(+e.target.value); SFX.select(); }} />
              <div className="val">{Math.floor(limit / 60)}h {limit % 60 ? `${limit % 60}m` : ''} <small>/ Tag</small></div>
            </div>
            <div className="par-used">
              <div className="lbl"><span>Heute genutzt</span><span>{used} / {limit} Min{over ? ' · Limit erreicht' : ''}</span></div>
              <div className="bar"><i className={over ? 'over' : ''} style={{ width: `${usedPct}%` }}></i></div>
            </div>
          </div>

          {/* age rating */}
          <div className="par-card">
            <h3>{Icon.star()} Altersfreigabe</h3>
            <p className="desc">Inhalte werden passend gefiltert.</p>
            <div className="par-seg">
              {[['6', 'ab 6 J.'], ['9', 'ab 9 J.'], ['12', 'ab 12 J.']].map(([v, l]) => (
                <button key={v} className={age === v ? 'on' : ''} onClick={() => { setAge(v); SFX.select(); }}>
                  {v}+<span className="seg-sub">{l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* bedtime */}
          <div className="par-card">
            <h3>{Icon.power()} Ruhezeit</h3>
            <p className="desc">Ab dieser Uhrzeit wird das Gerät gesperrt.</p>
            <div className="par-bed">
              <input type="time" value={bedFrom} onChange={(e) => setBedFrom(e.target.value)} />
              <span className="arrow">bis</span>
              <input type="time" value={bedTo} onChange={(e) => setBedTo(e.target.value)} />
            </div>
          </div>

          {/* app approvals */}
          <div className="par-card span2">
            <h3>{Icon.shield()} App-Freigaben</h3>
            <p className="desc">Lege fest, welche Apps {kidName} öffnen darf.</p>
            {PAR_APPS.map((a) => (
              <div className="par-row" key={a.id}>
                <div className="r-ic" style={{ background: a.c }}>{Icon[a.ic]()}</div>
                <div className="r-meta"><b>{a.name}</b><span>{a.sub}</span></div>
                <div className={`p-toggle ${approvals[a.id] ? 'on' : ''}`} onClick={() => toggle(a.id)}><i></i></div>
              </div>
            ))}
          </div>

          {/* Familienzentrale pages — each one individually disableable */}
          <div className="par-card span2">
            <h3>{Icon.grid()} Seiten der Familienzentrale</h3>
            <p className="desc">Nicht benötigte Seiten lassen sich einzeln ausblenden. Bibliothek und dieser Bereich bleiben immer da.</p>
            <div className="par-row">
              <div className="r-ic" style={{ background: '#f59e0b' }}>{Icon.star()}</div>
              <div className="r-meta"><b>Wunschliste</b><span>Spiele vormerken, Zielpreise setzen, Preise prüfen</span></div>
              <div className={`p-toggle ${modules.wishlist !== false ? 'on' : ''}`}
                onClick={() => { SFX.select(); setModules((m) => ({ ...m, wishlist: m.wishlist === false })); }}><i></i></div>
            </div>
            <div className="par-row">
              <div className="r-ic" style={{ background: '#db2777' }}>{Icon.bell()}</div>
              <div className="r-meta"><b>Angebote</b><span>Aktuelle Steam-Deals, Treffer aus der Wunschliste hervorgehoben</span></div>
              <div className={`p-toggle ${modules.deals !== false ? 'on' : ''}`}
                onClick={() => { SFX.select(); setModules((m) => ({ ...m, deals: m.deals === false })); }}><i></i></div>
            </div>
          </div>

          {/* device & start behaviour */}
          <div className="par-card span2">
            <h3>{Icon.power()} Gerät &amp; Start</h3>
            <p className="desc">Wie sich LAUNCHPAD auf diesem PC verhält. Änderungen wirken sofort.</p>
            <div className="par-row">
              <div className="r-ic" style={{ background: '#0891b2' }}>{Icon.lock()}</div>
              <div className="r-meta"><b>Kioskmodus</b><span>Vollbild-Käfig — kein Fenster-Ausbruch, kein Minimieren</span></div>
              <div className={`p-toggle ${kiosk ? 'on' : ''}`} onClick={() => { SFX.select(); setKiosk(!kiosk); }}><i></i></div>
            </div>
            <div className="par-row">
              <div className="r-ic" style={{ background: '#16a34a' }}>{Icon.power()}</div>
              <div className="r-meta"><b>Automatisch starten</b><span>LAUNCHPAD startet, sobald sich das Profil am PC anmeldet</span></div>
              <div className={`p-toggle ${autostart ? 'on' : ''}`} onClick={() => { SFX.select(); setAutostart(!autostart); }}><i></i></div>
            </div>
          </div>

          {/* parent PIN */}
          <div className="par-card span2">
            <h3>{Icon.lock()} Eltern-PIN</h3>
            <p className="desc">PIN für den Elternzugang (Familienzentrale &amp; Windows-Desktop) ändern (mind. 4 Ziffern).</p>
            <div className="par-bed">
              <input type="password" inputMode="numeric" placeholder="Aktuelle PIN" value={pinOld}
                onChange={(e) => setPinOld(e.target.value)} />
              <input type="password" inputMode="numeric" placeholder="Neue PIN" value={pinNew}
                onChange={(e) => setPinNew(e.target.value)} />
              <button className="par-btn" onClick={changePin}>PIN ändern</button>
            </div>
            {pinMsg && <div className="desc" style={{ marginTop: 6 }}>{pinMsg}</div>}

            <div className="par-recovery">
              <div className="par-rec-head">
                <b>{Icon.shield()} Wiederherstellungscode</b>
                <span className={`par-rec-badge ${hasRecovery ? 'on' : ''}`}>
                  {hasRecovery ? 'Code aktiv' : 'Kein Code'}
                </span>
              </div>
              <p className="desc">
                Falls die PIN einmal vergessen wird: Mit diesem Code lässt sich am Kinder-Gerät
                eine neue PIN setzen — ohne Datenverlust. <b>Jetzt notieren und sicher aufbewahren</b>
                (er wird nur einmal angezeigt).
              </p>
              {recoveryCode ? (
                <div className="par-rec-code">
                  <code>{recoveryCode}</code>
                  <button className="par-btn" onClick={() => {
                    try { navigator.clipboard.writeText(recoveryCode); SFX.select(); } catch (e) { /* ignore */ }
                  }}>Kopieren</button>
                </div>
              ) : (
                <button className="par-btn" onClick={makeRecovery}>
                  {hasRecovery ? 'Neuen Code erzeugen & anzeigen' : 'Code erzeugen & anzeigen'}
                </button>
              )}
              {recoveryCode && (
                <div className="desc" style={{ marginTop: 6 }}>
                  Ein neuer Code ersetzt den alten. Nach dem Schließen ist er nicht mehr abrufbar.
                </div>
              )}
            </div>
          </div>

          {/* weekly activity */}
          <div className="par-card span2 par-week-wrap">
            <h3>{Icon.trophy()} Wochenübersicht</h3>
            <p className="desc">Bildschirmzeit der letzten 7 Tage · Ø 71 Min/Tag · <span className="stat"><b>Diese Woche: 8h 20m</b></span></p>
            <div className="par-week">
              {WEEK.map((w) => (
                <div className="day" key={w.d}>
                  <div className={`col ${w.today ? 'today' : ''}`} style={{ height: `${Math.max(4, w.v * 100)}%` }}></div>
                  <div className="dl">{w.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="par-foot">
          <span className={`saved ${saved ? 'show' : ''}`}>{Icon.shield()} Einstellungen gespeichert</span>
          <button className="par-btn primary" onClick={save}>Speichern</button>
        </div>
      </div>
  );

  if (inline) return panel;
  return (
    <div className="par-layer">
      <div className="par-scrim" onClick={close}></div>
      {panel}
    </div>
  );
}

export default ParentalPanel;
