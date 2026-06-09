/* ============================================================
   LAUNCHPAD Desktop — root app (stage scaling + shell switch + gate)
   ============================================================ */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProfile } from './lib/useProfile.js';
import { GameStore } from './games/useGames.js';
import { SFX } from './lib/sfx.js';
import { Desktop } from './shells/Launchpad.jsx';
import { WindowsDesktop, PinGate } from './shells/WindowsDesktop.jsx';
import { PlayOverlay } from './play/PlayLibrary.jsx';
import { AppShell } from './apps/AppShell.jsx';
import { ParentalPanel } from './apps/Parental.jsx';
import { ImportManager } from './games/GameManager.jsx';

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
  const [parental, setParental] = useState(false);
  const [imp, setImp] = useState(false);
  const [mode, setMode] = useState('launchpad'); // 'launchpad' | 'windows'
  const [gate, setGate] = useState(false); // PIN gate before windows

  // Games load over IPC (async). Hold the shells until the first load lands so
  // nothing renders against an empty catalogue. Brief navy splash on cold start.
  const [ready, setReady] = useState(GameStore.isLoaded());
  useEffect(() => {
    if (GameStore.isLoaded()) { setReady(true); return undefined; }
    return GameStore.subscribe(() => { if (GameStore.isLoaded()) setReady(true); });
  }, []);

  // Daily time limit reached → drop everything back to a calm LAUNCHPAD screen.
  const [timeUp, setTimeUp] = useState(false);
  useEffect(() => {
    if (!window.launchpad || !window.launchpad.onTimeLimitReached) return undefined;
    return window.launchpad.onTimeLimitReached(() => {
      setMode('launchpad');
      setApp(null); setPlay(null); setParental(false); setImp(false); setGate(false);
      setTimeUp(true);
    });
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
  const openParental = () => { SFX.open(); setParental(true); };
  const openImport = () => { SFX.open(); setImp(true); };
  const launchDirect = (game, origin) => openPlay(origin, game);
  const openWindows = () => { SFX.select(); setGate(true); };
  const unlockWindows = () => { setGate(false); setMode('windows'); };
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
          onExit={() => setPlay(null)} onOpenImport={openImport} />}
        {parental && <ParentalPanel kidName={t.kidName} onClose={() => setParental(false)} />}
        {imp && <ImportManager onClose={() => setImp(false)} />}
        {gate && <PinGate onUnlock={unlockWindows} onCancel={() => setGate(false)} />}
      </div>

      {timeUp && (
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
          <div style={{ fontSize: 32, fontWeight: 800 }}>Für heute ist Schluss</div>
          <div style={{ fontSize: 18, color: '#9fb2e6', maxWidth: 440 }}>
            Die Spielzeit für heute ist aufgebraucht. Morgen geht’s weiter — bis dann! 👋
          </div>
        </div>
      )}
    </div>
  );
}
