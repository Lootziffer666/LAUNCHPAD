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
import { BootSequence } from './boot/BootSequence.jsx';
import { listClips, pickAnimation } from './lib/bootAnimations.js';
import { personalityEnabled } from './lib/features.js';

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

// Gentle, AuDHD-friendly wind-down. Calm and steady — no pressure countdown,
// no audio, no flashing. Brief reassuring note when crossing a mark; from the
// persist threshold a steady "save when you can" line stays put.
function WindDown({ warn, reduce }) {
  const { enabled, warnAt = [], persistFromMin = 5, minutesLeft } = warn || {};
  const [toast, setToast] = useState(null);
  const announced = useRef(new Set());
  useEffect(() => {
    if (!enabled || !Number.isFinite(minutesLeft)) return undefined;
    const ceiling = Math.max(30, ...warnAt);
    if (minutesLeft > ceiling) { announced.current.clear(); return undefined; } // far from end → reset (new day / grace)
    const hit = warnAt
      .filter((tt) => minutesLeft <= tt && !announced.current.has(tt))
      .sort((a, b) => b - a)[0];
    if (hit != null && minutesLeft > persistFromMin) {
      announced.current.add(hit);
      setToast(`Noch ${minutesLeft} Minuten – alles gut. 💜`);
      const id = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [minutesLeft, enabled]);

  if (!enabled) return null;
  const persist = Number.isFinite(minutesLeft) && minutesLeft <= persistFromMin && minutesLeft > 0;
  return (
    <React.Fragment>
      {toast && <div className={`wd-toast ${reduce ? 'noanim' : ''}`}>{toast}</div>}
      {persist && (
        <div className="wd-banner" role="status" aria-live="polite">
          💜 Speicher in Ruhe – in {minutesLeft} {minutesLeft === 1 ? 'Minute' : 'Minuten'} ist für heute Schluss.
        </div>
      )}
    </React.Fragment>
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

  // The boot meta-game is part of the DORMANT personality layer — off in the
  // shipping build, switched on later via update. v1 boots clean.
  const personality = personalityEnabled();
  const [bootDone, setBootDone] = useState(false);
  const [bootClip] = useState(() => {
    if (!personality) return null;
    let last = null;
    try { last = localStorage.getItem('lp_boot_last'); } catch (e) { /* ignore */ }
    const clip = pickAnimation({ clips: listClips(), last, reduceMotion: t.reduceMotion });
    try { if (clip) localStorage.setItem('lp_boot_last', clip.id); } catch (e) { /* ignore */ }
    return clip;
  });

  // Lock model: main owns the state ('bedtime' | 'timeup' | null) and emits
  // every transition; the morning unlock arrives the same way. On mount we ask
  // for the current state — with autostart the shell can boot mid-bedtime or
  // with the budget spent, before the first ticker event fires. Parents can
  // override from the overlay via PIN; main re-verifies and decides how long
  // the override holds (bedtime: until the window ends, time: until midnight).
  const [lock, setLock] = useState(null);
  const [lockGate, setLockGate] = useState(false);
  const [warn, setWarn] = useState(null); // wind-down status from main
  const [grace, setGrace] = useState({ enabled: false, usesLeft: 0, minutes: 5 });
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
      window.launchpad.shellStatus().then((s) => {
        if (!s || !alive) return;
        apply(s.lock);
        if (s.windDown) setWarn(s.windDown);
        if (s.grace) setGrace(s.grace);
      }).catch(() => {});
    }
    const offLock = window.launchpad.onLockChanged ? window.launchpad.onLockChanged(apply) : undefined;
    const offWarn = window.launchpad.onTimeWarn ? window.launchpad.onTimeWarn((w) => { if (alive) setWarn(w); }) : undefined;
    return () => { alive = false; if (offLock) offLock(); if (offWarn) offWarn(); };
  }, []);

  // Kid "Noch kurz" buffer — a few more minutes to save, no PIN, no parent.
  const useGrace = async () => {
    if (!window.launchpad || !window.launchpad.requestGrace) return;
    try {
      const r = await window.launchpad.requestGrace();
      if (r && r.ok) {
        SFX.select();
        setLock(null);
        setGrace((g) => ({ ...g, usesLeft: r.usesLeft }));
      }
    } catch (e) { /* keep the lock */ }
  };

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

  // When a tracked (spawned) game exits, main brings the shell forward and
  // emits game-closed — drop any overlay and land back on the LAUNCHPAD home,
  // so a finished game always ends in the launcher, never on a bare desktop.
  useEffect(() => {
    if (!window.launchpad || !window.launchpad.onGameClosed) return undefined;
    const off = window.launchpad.onGameClosed(() => {
      setPlay(null); setApp(null); setGate(null); setMode('launchpad');
    });
    return off;
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

  // v1 ships clean: a brief plain splash until the catalogue loads. The boot
  // meta-game only runs once the personality layer is switched on by an update.
  if (personality && (!ready || !bootDone)) {
    return (
      <div className="stage-wrap">
        <BootSequence clip={bootClip} kidName={t.kidName} reduceMotion={t.reduceMotion}
          onDone={() => setBootDone(true)} />
      </div>
    );
  }
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

      {!lock && <WindDown warn={warn} reduce={t.reduceMotion} />}

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
          <div style={{ fontSize: 64 }}>{lock === 'bedtime' ? '🌙' : '🌟'}</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {lock === 'bedtime' ? 'Ruhezeit' : 'Pause für heute'}
          </div>
          <div style={{ fontSize: 18, color: '#9fb2e6', maxWidth: 460 }}>
            {lock === 'bedtime'
              ? 'Zeit zum Schlafen. LAUNCHPAD macht Pause und ist morgen früh wieder für dich da. 😴'
              : 'Für heute hast du genug gespielt – morgen geht’s weiter. Deine verdiente Zeit bleibt dir erhalten. 💜'}
          </div>

          {lock === 'timeup' && grace.enabled && grace.usesLeft > 0 && (
            <button
              onClick={useGrace}
              style={{
                marginTop: 16, padding: '12px 22px', borderRadius: 999, cursor: 'pointer',
                background: 'linear-gradient(135deg,#2a6f8e,#1c3f6e)', border: 'none',
                color: '#eaf0ff', font: 'inherit', fontSize: 16, fontWeight: 700,
              }}
            >
              Noch {grace.minutes} Minuten zum Speichern
            </button>
          )}
          {lock === 'timeup' && grace.enabled && grace.usesLeft > 0 && (
            <div style={{ fontSize: 12.5, color: '#6b7da6' }}>
              In Ruhe fertig machen – danach ist für heute Schluss.
            </div>
          )}

          <button
            onClick={() => { SFX.open(); setLockGate(true); }}
            style={{
              marginTop: 10, padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
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
