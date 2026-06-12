/* ============================================================
   LAUNCHPAD Desktop — root of the CHILD app (stage scaling + shell
   switch + gate). Two-app split: there is no parent surface in here —
   game management and parental settings live in the curator window,
   reachable only through the PIN gate (main verifies and opens it).
   ============================================================ */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProfile } from './lib/useProfile.js';
import { GameStore } from './games/useGames.js';
import { SFX } from './lib/sfx.js';
import { Desktop } from './shells/Launchpad.jsx';
import { WindowsDesktop, PinGate } from './shells/WindowsDesktop.jsx';
import { PlayOverlay } from './play/PlayLibrary.jsx';
import { AppShell } from './apps/AppShell.jsx';

function useScale(ref) {
  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
      if (ref.current) ref.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
}

function Starfield() {
  const stars = useMemo(() =>
    Array.from({ length: 42 }, () => ({
      left: Math.random() * 100, top: Math.random() * 100,
      delay: (Math.random() * 4).toFixed(2), dur: (3 + Math.random() * 4).toFixed(2),
      sc: (0.5 + Math.random()).toFixed(2),
    })), []);
  return (
    <div className="starfield">
      {stars.map((s, i) => (
        <i key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`,
          animationDuration: `${s.dur}s`, transform: `scale(${s.sc})` }}></i>
      ))}
    </div>
  );
}

export default function App() {
  const [t] = useProfile();
  const stageRef = useRef(null);
  useScale(stageRef);

  const [app, setApp] = useState(null); // {id, origin}
  const [play, setPlay] = useState(null); // {origin, initialGame} or null
  const [mode, setMode] = useState('launchpad'); // 'launchpad' | 'windows'
  const [gate, setGate] = useState(null); // null | {target: 'windows'|'curator'}

  // Games load over IPC (async). Hold the shells until the first load lands so
  // nothing renders against an empty catalogue. Brief navy splash on cold start.
  const [ready, setReady] = useState(GameStore.isLoaded());
  useEffect(() => {
    if (GameStore.isLoaded()) { setReady(true); return undefined; }
    return GameStore.subscribe(() => { if (GameStore.isLoaded()) setReady(true); });
  }, []);

  // Daily time limit reached → drop everything back to a calm LAUNCHPAD screen.
  // Bedtime works the same way but unlocks again in the morning (main emits
  // transitions both ways). On mount we ask main for the current lock state:
  // with autostart the shell can boot mid-bedtime or with the budget spent,
  // before the first ticker event ever fires.
  const [timeUp, setTimeUp] = useState(false);
  const [bedtime, setBedtime] = useState(false);
  useEffect(() => {
    if (!window.launchpad) return undefined;
    const lock = (setter) => {
      setMode('launchpad');
      setApp(null); setPlay(null); setGate(null);
      setter(true);
    };
    if (window.launchpad.shellStatus) {
      window.launchpad.shellStatus().then((s) => {
        if (!s) return;
        if (s.inBedtime) lock(setBedtime);
        else if (s.timeLeftMin <= 0) lock(setTimeUp);
      }).catch(() => {});
    }
    const offTime = window.launchpad.onTimeLimitReached
      ? window.launchpad.onTimeLimitReached(() => lock(setTimeUp))
      : undefined;
    const offBed = window.launchpad.onBedtime
      ? window.launchpad.onBedtime((active) => (active ? lock(setBedtime) : setBedtime(false)))
      : undefined;
    return () => { if (offTime) offTime(); if (offBed) offBed(); };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
    document.documentElement.style.setProperty('--comet-cyan', t.accent);
    if (t.reduceMotion) document.documentElement.setAttribute('data-reduce', '');
    else document.documentElement.removeAttribute('data-reduce');
  }, [t.theme, t.accent, t.reduceMotion]);

  useEffect(() => { SFX.enabled = t.sound; }, [t.sound]);

  const openApp = (id, origin) => { SFX.open(); setApp({ id, origin }); };
  const openPlay = (origin, initialGame) => { SFX.launch(); setPlay({ origin, initialGame: initialGame || null }); };
  // "Elternbereich" → PIN gate → main opens the separate curator window.
  const openParental = () => { SFX.open(); setGate({ target: 'curator' }); };
  const launchDirect = (game, origin) => openPlay(origin, game);
  const openWindows = () => { SFX.select(); setGate({ target: 'windows' }); };
  const unlockGate = (pin) => {
    const target = gate && gate.target;
    setGate(null);
    if (target === 'windows') setMode('windows');
    else if (window.launchpad && window.launchpad.openCurator) window.launchpad.openCurator(pin);
  };
  const backToLaunchpad = () => { SFX.back(); setMode('launchpad'); };

  if (!ready) return <div className="stage-wrap" />;

  return (
    <div className="stage-wrap">
      <div className="stage" ref={stageRef}>
        {mode === 'launchpad' && (
          <React.Fragment>
            {!t.reduceMotion && <Starfield />}
            <Desktop
              kidName={t.kidName}
              onOpenApp={openApp} onOpenPlay={openPlay} onOpenParental={openParental}
              onLaunchDirect={launchDirect} onOpenWindows={openWindows}
            />
          </React.Fragment>
        )}
        {mode === 'windows' && (
          <WindowsDesktop
            kidName={t.kidName}
            onHome={backToLaunchpad} onOpenPlay={openPlay}
            onOpenParental={openParental} onLaunchDirect={(g) => launchDirect(g)}
          />
        )}

        {app && <AppShell app={{ id: app.id }} origin={app.origin} onClose={() => setApp(null)} />}
        {play && <PlayOverlay kidName={t.kidName} origin={play.origin} initialGame={play.initialGame}
          onExit={() => setPlay(null)} />}
        {gate && (
          <PinGate
            sub={gate.target === 'windows'
              ? 'PIN eingeben, um zum Windows-Desktop zu wechseln'
              : 'PIN eingeben, um die Familienzentrale zu öffnen'}
            onUnlock={unlockGate}
            onCancel={() => setGate(null)}
          />
        )}
      </div>

      {(bedtime || timeUp) && (
        <div
          className="timeup-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 14, textAlign: 'center', padding: 32, color: '#eaf0ff',
            background: 'rgba(8,16,40,.92)', backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: 64 }}>🌙</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {bedtime ? 'Ruhezeit' : 'Für heute ist Schluss'}
          </div>
          <div style={{ fontSize: 18, color: '#9fb2e6', maxWidth: 440 }}>
            {bedtime
              ? 'Zeit zum Schlafen. LAUNCHPAD macht Pause und ist morgen früh wieder für dich da. 😴'
              : 'Die Spielzeit für heute ist aufgebraucht. Morgen geht’s weiter — bis dann! 👋'}
          </div>
        </div>
      )}
    </div>
  );
}
