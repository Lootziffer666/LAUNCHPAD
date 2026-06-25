/* ============================================================
   LAUNCHPAD -- LaunchOverlay (Gate 10: Launch Adapter)
   ============================================================
   State-machine overlay for the game launch flow.
   Phases:
     1. preparing  -- "Startklar machen..." (500ms UI delay)
     2. launching  -- "Wird geöffnet..." (IPC call in flight)
     3. success    -- brief flash, then auto-close (1s)
     4. error      -- contextual message based on errorClass
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const PHASE = {
  PREPARING: 'preparing',
  LAUNCHING: 'launching',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Map errorClass to a user-facing message.
 */
function errorMessage(errorClass, serverMessage) {
  switch (errorClass) {
    case 'recoverable':
      return 'Das hat gerade nicht geklappt. Nochmal?';
    case 'blocked':
      return serverMessage || 'Dieses Spiel kann gerade nicht gestartet werden.';
    case 'parent_required':
      return 'Dieses Spiel braucht eine Freigabe von Mama oder Papa.';
    case 'fatal':
    default:
      return 'Das hat leider nicht geklappt.';
  }
}

export function LaunchOverlay({ game, onClose }) {
  const [phase, setPhase] = useState(PHASE.PREPARING);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const successTimer = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // Launch flow: preparing -> launching -> success/error
  const doLaunch = useCallback(async () => {
    setPhase(PHASE.PREPARING);
    setError(null);

    // Phase 1: brief UI delay
    await new Promise((r) => setTimeout(r, 500));
    if (!mounted.current) return;

    // Phase 2: actual IPC call
    setPhase(PHASE.LAUNCHING);
    try {
      const result = await window.launchpad.launchGame(game.id);
      if (!mounted.current) return;

      if (result && result.ok) {
        setPhase(PHASE.SUCCESS);
        successTimer.current = setTimeout(() => {
          if (mounted.current) onClose();
        }, 1000);
      } else {
        setPhase(PHASE.ERROR);
        setError({
          errorClass: (result && result.errorClass) || 'fatal',
          message: (result && result.message) || '',
        });
      }
    } catch (e) {
      if (!mounted.current) return;
      setPhase(PHASE.ERROR);
      setError({ errorClass: 'recoverable', message: String(e.message || e) });
    }
  }, [game, onClose]);

  // Start the flow on mount
  useEffect(() => {
    doLaunch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: B/Escape closes, Enter retries on recoverable
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Enter' && phase === PHASE.ERROR && error && error.errorClass === 'recoverable') {
        e.preventDefault();
        e.stopPropagation();
        doLaunch();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [phase, error, onClose, doLaunch]);

  return (
    <div
      className="launch-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 21, 56, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9000,
        color: '#fff',
        fontFamily: 'inherit',
        textAlign: 'center',
        padding: '40px',
      }}
    >
      {/* Game title */}
      <h2 style={{ fontSize: 'clamp(20px, 3vw, 36px)', marginBottom: '24px', fontWeight: 700 }}>
        {game.title}
      </h2>

      {/* Phase: Preparing */}
      {phase === PHASE.PREPARING && (
        <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', opacity: 0.9 }}>
          Startklar machen...
        </div>
      )}

      {/* Phase: Launching */}
      {phase === PHASE.LAUNCHING && (
        <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', opacity: 0.9 }}>
          Wird geöffnet...
        </div>
      )}

      {/* Phase: Success */}
      {phase === PHASE.SUCCESS && (
        <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#7be87b' }}>
          Gestartet!
        </div>
      )}

      {/* Phase: Error */}
      {phase === PHASE.ERROR && error && (
        <div style={{ maxWidth: '500px' }}>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', marginBottom: '16px' }}>
            {errorMessage(error.errorClass, error.message)}
          </div>

          {error.errorClass === 'recoverable' && (
            <button
              onClick={() => doLaunch()}
              style={{
                marginTop: '16px',
                padding: '14px 36px',
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 600,
                borderRadius: '12px',
                border: 'none',
                background: 'var(--color-accent, #e87b4a)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Nochmal versuchen
            </button>
          )}

          <div style={{ marginTop: '24px', fontSize: 'clamp(14px, 1.5vw, 18px)', opacity: 0.6 }}>
            Escape = Schliessen
          </div>
        </div>
      )}
    </div>
  );
}

export default LaunchOverlay;
