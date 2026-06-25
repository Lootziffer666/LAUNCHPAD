/* ============================================================
   LAUNCHPAD -- BootScreen (Gate 20: warm boot animation)
   ============================================================
   Shown briefly (1.5s) when the controller grid is activated.
   Displays the LAUNCHPAD name + house icon, then fades into
   the grid. CSS-only animations, no external libraries.
   ============================================================ */
import React, { useState, useEffect } from 'react';

const BOOT_DURATION = 1500; // ms before content fades in

// Simple house SVG icon (matches the project branding)
function HouseIcon() {
  return (
    <svg
      width="64" height="64" viewBox="0 0 256 256"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.9 }}
    >
      <path
        d="M128 20L20 108h28v108h60v-72h40v72h60V108h28L128 20z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BootScreen({ children }) {
  const [phase, setPhase] = useState('boot'); // 'boot' | 'reveal' | 'done'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), BOOT_DURATION);
    const t2 = setTimeout(() => setPhase('done'), BOOT_DURATION + 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return <>{children}</>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Boot splash */}
      <div
        className="boot-splash"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 9500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: 'var(--color-bg, #0a1538)',
          color: 'rgba(255,255,255,0.9)',
          opacity: phase === 'reveal' ? 0 : 1,
          transition: 'opacity 500ms ease-out',
          pointerEvents: phase === 'reveal' ? 'none' : 'auto',
        }}
      >
        <HouseIcon />
        <div style={{
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          LAUNCHPAD
        </div>
      </div>

      {/* Content behind (fades in as splash fades out) */}
      <div
        className="boot-content"
        style={{
          opacity: phase === 'boot' ? 0 : 1,
          transition: 'opacity 500ms ease-in',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes bootFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .boot-splash {
          animation: bootFadeIn 400ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export function FadeOut({ active, children, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => {
      setVisible(false);
      if (onDone) onDone();
    }, 400);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!visible && active) return null;

  return (
    <div style={{
      opacity: active ? 0 : 1,
      transition: 'opacity 400ms ease-out',
    }}>
      {children}
    </div>
  );
}

export default BootScreen;
