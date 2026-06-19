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
import { ControllerGrid } from './shells/ControllerGrid.jsx';
import { HabitatShell } from './habitat/HabitatShell.jsx';
import { BootScreen } from './shells/BootScreen.jsx';
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
  const [mode, setMode] = useState('launchpad'); // 'launchpad' | 'windows' | 'controller'
  const [controllerFading, setControllerFading] = useState(false);
  const [gate, setGate] = useState(null); // null | {target: 'windows'|'curator'}

  // Games load over IPC (async). Hold the shells until the first load lands so
  // nothing renders against an empty catalogue. Brief navy splash on cold start.
  const [ready, setReady] = useState(GameStore.isLoaded());
  useEffect(() => {
    if (GameStore.isLoaded()) { setReady(true); return undefined; }
    return GameStore.subscribe(() => { if (GameStore.isLoaded()) setReady(true); });
  }, []);

  // Lock model: main owns the state ('bedtime' | 'timeup' | null) and emits
  // every transition; the morning unlock arrives the same way. On mount we ask
  // for the current state — with autostart the shell can boot mid-bedtime or
  // with the budget spent, before the first ticker event fires. Parents can
  // override from the overlay via PIN; main re-verifies and decides how long
  // the override holds (bedtime: until the window ends, time: until midnight).
  const [lock, setLock] = useState(null);
  const [lockGate, setLockGate] = useState(false);
  useEffect(() => {
    if (!window.launchpad) return undefined;
    let alive = true;
    const apply = (l) => {
      if (!alive) return;
      if (l) {
        setMode('launchpad');
        setApp(null); setPlay(null); setGate(null);
      } else {
        setLockGate(false);
      }
      setLock(l || null);
    };
    if (window.launchpad.shellStatus) {
      window.launchpad.shellStatus().then((s) => s && apply(s.lock)).catch(() => {});
    }
    const off = window.launchpad.onLockChanged ? window.launchpad.onLockChanged(apply) : undefined;
    return () => { alive = false; if (off) off(); };
  }, []);

  // PinGate has already verified the PIN for UX; main verifies it again and
  // arms the actual override — the renderer alone can never lift the lock.
  const unlockWithPin = async (pin) => {
    setLockGate(false);
    if (!window.launchpad || !window.launchpad.shellUnlock) return;
    try {
      const r = await window.launchpad.shellUnlock(pin);
      if (r && r.ok) { SFX.launch(); setLock(r.lock || null); }
    } catch (e) { /* keep the lock */ }
  };

  // Ctrl+G toggles controller grid mode
  useEffect(() => {
    const handleCtrlG = (e) => {
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        setMode((m) => m === 'controller' ? 'launchpad' : 'controller');
      }
    };
    window.addEventListener('keydown', handleCtrlG);
    return () => window.removeEventListener('keydown', handleCtrlG);
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
  const backToLaunchpad = () => {
    SFX.back();
    if (mode === 'controller') {
      setControllerFading(true);
      setTimeout(() => { setControllerFading(false); setMode('launchpad'); }, 400);
    } else {
      setMode('launchpad');
    }
  };

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
        {mode === 'controller' && (
          <div style={{
            opacity: controllerFading ? 0 : 1,
            transition: 'opacity 400ms ease-out',
          }}>
            <BootScreen>
              <HabitatShell onBack={backToLaunchpad} />
            </BootScreen>
          </div>
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

      {lock && (
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
            {lock === 'bedtime' ? 'Ruhezeit' : 'Für heute ist Schluss'}
          </div>
          <div style={{ fontSize: 18, color: '#9fb2e6', maxWidth: 440 }}>
            {lock === 'bedtime'
              ? 'Zeit zum Schlafen. LAUNCHPAD macht Pause und ist morgen früh wieder für dich da. 😴'
              : 'Die Spielzeit für heute ist aufgebraucht. Morgen geht’s weiter — bis dann! 👋'}
          </div>
          <button
            onClick={() => { SFX.open(); setLockGate(true); }}
            style={{
              marginTop: 18, padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)',
              color: '#9fb2e6', font: 'inherit', fontSize: 13,
            }}
          >
            Eltern-Freigabe (PIN)
          </button>
          {lockGate && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
              <PinGate
                sub={lock === 'bedtime'
                  ? 'PIN eingeben, um die Ruhezeit für heute aufzuheben'
                  : 'PIN eingeben, um das Tageslimit für heute aufzuheben'}
                onUnlock={unlockWithPin}
                onCancel={() => setLockGate(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
