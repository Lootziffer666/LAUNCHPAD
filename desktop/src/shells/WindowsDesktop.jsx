/* ============================================================
   LAUNCHPAD — Windows-style desktop + Start menu + PIN gate.
   Original "grown-up" desktop, reachable from LAUNCHPAD behind a
   parent PIN. "Zurück zu LAUNCHPAD" returns instantly and ungated.
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/icons.jsx';
import { CometData as DW } from '../lib/data.js';
import { useGames, gameCover } from '../games/useGames.js';
import { SFX } from '../lib/sfx.js';

/* ---------------- PIN gate ----------------
   Verifies against the hashed PIN in main via window.launchpad.verifyPin.
   Falls back to the demo "1234" only when no bridge is present (plain browser).
   On success the entered PIN is passed to onUnlock so the caller can hand it
   to main again (e.g. lp:curator:open re-verifies before opening the window). */
export function PinGate({ onUnlock, onCancel, sub }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [mode, setMode] = useState('pin'); // 'pin' | 'recover'
  const [recCode, setRecCode] = useState('');
  const [recPin, setRecPin] = useState('');
  const [recMsg, setRecMsg] = useState(null);
  const checking = React.useRef(false);

  useEffect(() => {
    let alive = true;
    if (window.launchpad && window.launchpad.pinStatus) {
      window.launchpad.pinStatus()
        .then((s) => { if (alive) { setShowHint(!!(s && s.pinIsDefault)); setHasRecovery(!!(s && s.hasRecovery)); } })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, []);

  const submitRecovery = async () => {
    if (!window.launchpad || !window.launchpad.recoverPin) { setRecMsg('Nicht verfügbar'); return; }
    if (String(recPin).length < 4) { setRecMsg('Neue PIN braucht mind. 4 Ziffern'); SFX.back(); return; }
    let r = { ok: false };
    try { r = await window.launchpad.recoverPin(recCode.trim(), recPin); }
    catch (e) { r = { ok: false, reason: 'error' }; }
    if (r && r.ok) {
      SFX.launch();
      setRecMsg('PIN neu gesetzt ✓ — bitte mit der neuen PIN anmelden.');
      setRecCode(''); setRecPin('');
      setTimeout(() => { setMode('pin'); setRecMsg(null); }, 2200);
    } else {
      SFX.back();
      setRecMsg(r && r.reason === 'no_recovery' ? 'Kein Wiederherstellungscode hinterlegt.' : 'Code stimmt nicht.');
    }
  };

  const submit = async (code) => {
    if (checking.current) return;
    checking.current = true;
    let ok = false;
    try {
      ok = window.launchpad ? await window.launchpad.verifyPin(code) : code === '1234';
    } catch (e) {
      ok = false;
    }
    checking.current = false;
    if (ok) { SFX.launch(); onUnlock(code); }
    else { setErr(true); SFX.back(); setTimeout(() => { setErr(false); setPin(''); }, 500); }
  };

  const press = (d) => {
    if (pin.length >= 4) return;
    SFX.select();
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => submit(next), 140);
  };
  const del = () => { SFX.back(); setPin((p) => p.slice(0, -1)); };

  useEffect(() => {
    const onKey = (e) => {
      if (mode !== 'pin') { if (e.key === 'Escape') setMode('pin'); return; }
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') del();
      else if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin, mode]);

  return (
    <div className="pin-gate">
      <div className="pin-card">
        <div className="pin-av">{Icon.lock()}</div>
        <div className="pin-title">Elternzugang</div>
        {mode === 'pin' ? (
          <React.Fragment>
            <div className="pin-sub">{sub || 'PIN eingeben, um zum Windows-Desktop zu wechseln'}</div>
            <div className={`pin-dots ${err ? 'err' : ''}`}>
              {[0, 1, 2, 3].map((i) => <i key={i} className={i < pin.length ? 'on' : ''}></i>)}
            </div>
            <div className="pin-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} className="pin-key" onClick={() => press(String(n))}>{n}</button>
              ))}
              <button className="pin-key fn" onClick={onCancel}>Zurück</button>
              <button className="pin-key" onClick={() => press('0')}>0</button>
              <button className="pin-key fn" onClick={del}>⌫</button>
            </div>
            {showHint && <div className="pin-hint">Demo-PIN: <b>1234</b> · in den Eltern-Einstellungen änderbar</div>}
            {hasRecovery && (
              <button className="pin-forgot" onClick={() => { SFX.select(); setMode('recover'); setRecMsg(null); }}>
                PIN vergessen?
              </button>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="pin-sub">Wiederherstellungscode eingeben und eine neue PIN setzen.</div>
            <div className="pin-recover">
              <input className="pin-rec-input" autoFocus placeholder="XXXX-XXXX-XXXX-XXXX"
                value={recCode} onChange={(e) => setRecCode(e.target.value)} />
              <input className="pin-rec-input" type="password" inputMode="numeric" placeholder="Neue PIN (mind. 4 Ziffern)"
                value={recPin} onChange={(e) => setRecPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submitRecovery()} />
              <div className="pin-rec-actions">
                <button className="pin-key fn" onClick={() => { SFX.back(); setMode('pin'); setRecMsg(null); }}>Zurück</button>
                <button className="pin-key go" onClick={submitRecovery}>PIN zurücksetzen</button>
              </div>
              {recMsg && <div className="pin-hint">{recMsg}</div>}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* ---------------- Start menu ---------------- */
const START_APPS = [
  { id: 'play', name: 'Spiele', ic: 'gamepad', c: '#6d28d9' },
  { id: 'files', name: 'Dateien', ic: 'grid', c: '#0891b2' },
  { id: 'web', name: 'Browser', ic: 'globe', c: '#2563eb' },
  { id: 'parental', name: 'Eltern', ic: 'shield', c: '#0d9488' },
  { id: 'settings', name: 'System', ic: 'gear', c: '#64748b' },
  { id: 'music', name: 'Medien', ic: 'music', c: '#db2777' },
  { id: 'calc', name: 'Rechner', ic: 'calc', c: '#f59e0b' },
  { id: 'store', name: 'Store', ic: 'bolt', c: '#16a34a' },
];

function StartMenu({ kidName, onClose, onHome, onAction }) {
  return (
    <React.Fragment>
      <div className="start-scrim" onClick={onClose}></div>
      <div className="start-menu">
        <div className="start-search">{Icon.search()} Suchen…</div>

        <div className="start-home-tile" onClick={onHome}>
          <div className="sht-ic"><span></span></div>
          <div>
            <b>Zurück zu LAUNCHPAD</b>
            <small>{kidName}s sicherer Desktop</small>
          </div>
        </div>

        <p className="start-label">Angeheftet</p>
        <div className="start-grid">
          {START_APPS.map((a) => (
            <button key={a.id} className="start-app" onClick={() => onAction(a.id)}>
              <div className="sa-ic" style={{ background: a.c }}>{Icon[a.ic]()}</div>
              <span>{a.name}</span>
            </button>
          ))}
        </div>

        <div className="start-foot">
          <div className="start-user">
            <image-slot id="start-avatar" shape="circle" placeholder="Foto"></image-slot>
            <span>Administrator</span>
          </div>
          <button className="start-power" onClick={onHome} title="Abmelden zu LAUNCHPAD">{Icon.power()}</button>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------------- generic app window ---------------- */
function FilesWindow({ onClose }) {
  const folders = ['Dokumente', 'Bilder', 'Downloads', 'Spiele', 'Musik', 'Videos', 'Schule', 'Projekte'];
  return (
    <div className="win-app">
      <div className="win-app-bar">
        <div className="wt-ic">{Icon.grid()}</div>
        <b>Dateien</b>
        <div className="wt-ctrls">
          <button>—</button><button>▢</button><button className="x" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="win-app-body">
        <div className="win-side">
          {[['home', 'Schnellzugriff'], ['image', 'Dieser PC'], ['grid', 'Netzwerk']].map(([ic, l]) => (
            <div key={l} className="si">{Icon[ic]()} {l}</div>
          ))}
        </div>
        <div className="win-main">
          <div className="win-folder-grid">
            {folders.map((f) => (
              <div key={f} className="win-folder"><div className="ff"></div><span>{f}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Windows desktop ---------------- */
export function WindowsDesktop({ kidName, onHome, onOpenPlay, onOpenParental, onLaunchDirect }) {
  const games = useGames();
  const [now, setNow] = useState(new Date());
  const [start, setStart] = useState(false);
  const [sel, setSel] = useState(null);
  const [filesOpen, setFilesOpen] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const mc = games.find((g) => g.id === 'minecraft') || games[0];

  const desktopIcons = [
    { id: 'home', label: 'LAUNCHPAD', home: true, onOpen: onHome },
    { id: 'play', label: 'Spiele', ic: 'gamepad', c: '#6d28d9', onOpen: () => onOpenPlay() },
    { id: 'files', label: 'Dateien', ic: 'grid', c: '#0891b2', onOpen: () => setFilesOpen(true) },
    { id: 'parental', label: 'Eltern', ic: 'shield', c: '#0d9488', onOpen: onOpenParental },
    { id: 'mc', label: mc.name, cover: mc, src: 'Minecraft', onOpen: () => onLaunchDirect(mc) },
    { id: 'recycle', label: 'Papierkorb', ic: 'close', c: '#475569', onOpen: () => {} },
  ];

  const startAction = (id) => {
    setStart(false);
    if (id === 'play' || id === 'store') onOpenPlay();
    else if (id === 'parental') onOpenParental();
    else if (id === 'files') setFilesOpen(true);
    else if (id === 'web') onOpenPlay(); // routed; real app maps to browser
  };

  return (
    <div className="windows" onClick={() => setSel(null)}>
      <div className="win-wall"><i></i><i></i><i></i></div>

      {/* desktop icons */}
      <div className="win-icons" onClick={(e) => e.stopPropagation()}>
        {desktopIcons.map((ic) => (
          <button key={ic.id} className={`win-ico ${ic.home ? 'home' : ''} ${sel === ic.id ? 'sel' : ''}`}
            onClick={() => setSel(ic.id)} onDoubleClick={ic.onOpen}>
            <div className="wi-badge cover" style={ic.cover ? gameCover(ic.cover) : (ic.c ? { background: ic.c } : {})}>
              {ic.home && <span></span>}
              {!ic.home && !ic.cover && Icon[ic.ic]()}
              {ic.src && <span className="wi-src" style={{ background: DW.SOURCES[ic.src].c }}>{Icon.gamepad()}</span>}
            </div>
            <div className="wi-label">{ic.label}</div>
          </button>
        ))}
      </div>

      {filesOpen && <FilesWindow onClose={() => setFilesOpen(false)} />}

      {/* start menu */}
      {start && <StartMenu kidName={kidName} onClose={() => setStart(false)} onHome={onHome} onAction={startAction} />}

      {/* taskbar */}
      <div className="win-taskbar" onClick={(e) => e.stopPropagation()}>
        <button className="tb-start" onClick={() => { setStart(!start); SFX.select(); }} title="Start">
          <div className="pad"><i></i><i></i><i></i><i></i></div>
        </button>
        <button className="tb-home" onClick={onHome}>
          <div className="hm"><span></span></div> LAUNCHPAD
        </button>
        <div className="tb-search">{Icon.search()} Suchen</div>

        <div className="tb-pins">
          <button className="tb-pin" onClick={() => onOpenPlay()} title="Spiele"><div className="pi" style={{ background: '#6d28d9' }}>{Icon.gamepad()}</div></button>
          <button className="tb-pin run" onClick={() => setFilesOpen(true)} title="Dateien"><div className="pi" style={{ background: '#0891b2' }}>{Icon.grid()}</div></button>
          <button className="tb-pin" onClick={() => onOpenPlay()} title="Browser"><div className="pi" style={{ background: '#2563eb' }}>{Icon.globe()}</div></button>
          <button className="tb-pin" onClick={onOpenParental} title="Eltern"><div className="pi" style={{ background: '#0d9488' }}>{Icon.shield()}</div></button>
        </div>

        <div className="tb-tray">
          <div className="tb-sys">{Icon.wifi()}{Icon.volume()}{Icon.battery()}</div>
          <div className="tb-clock"><div className="t">{timeStr}</div><div className="d">{dateStr}</div></div>
        </div>
      </div>
    </div>
  );
}

export default WindowsDesktop;
