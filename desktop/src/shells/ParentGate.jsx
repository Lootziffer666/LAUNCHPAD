/* ============================================================
   LAUNCHPAD -- ParentGate (Gate 11: Parent Mode PIN Gate)
   ============================================================
   A controller-navigable PIN entry overlay that gates access to
   the parent/curator area (Familienzentrale).

   - Numpad layout: 1-9, 0, Backspace, Confirm
   - Arrow keys navigate between buttons
   - Enter confirms the PIN
   - Escape/B closes the gate (returns to grid)
   - PIN digits shown as dots for privacy
   - "PIN vergessen?" link opens recovery code input
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['del', '0', 'ok'],
];

const BUTTON_SIZE = 80;
const BUTTON_GAP = 12;

export function ParentGate({ onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryError, setRecoveryError] = useState(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [focusRow, setFocusRow] = useState(0);
  const [focusCol, setFocusCol] = useState(1);
  const buttonRefs = useRef([]);
  const recoveryInputRef = useRef(null);

  // Focus the active keypad button
  useEffect(() => {
    if (showRecovery) return;
    const row = buttonRefs.current[focusRow];
    if (row && row[focusCol]) {
      row[focusCol].focus();
    }
  }, [focusRow, focusCol, showRecovery]);

  // Focus recovery input when entering recovery mode
  useEffect(() => {
    if (showRecovery && recoveryInputRef.current) {
      recoveryInputRef.current.focus();
    }
  }, [showRecovery]);

  const handleSubmitPin = useCallback(async () => {
    if (pin.length < 4) {
      setError('Bitte mindestens 4 Ziffern eingeben.');
      return;
    }
    setError(null);
    try {
      const ok = await window.launchpad.verifyPin(pin);
      if (ok) {
        setSuccess(true);
        // Open curator window with verified PIN
        await window.launchpad.openCurator(pin);
        // Close the gate after a brief moment
        setTimeout(() => onClose(), 600);
      } else {
        setError('PIN ist nicht korrekt. Bitte nochmal versuchen.');
        setPin('');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte nochmal versuchen.');
      setPin('');
    }
  }, [pin, onClose]);

  const handleKeypadPress = useCallback((key) => {
    setError(null);
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
    } else if (key === 'ok') {
      handleSubmitPin();
    } else {
      setPin((p) => (p.length < 8 ? p + key : p));
    }
  }, [handleSubmitPin]);

  const handleRecoverySubmit = useCallback(async () => {
    if (recoveryCode.trim().length < 10) {
      setRecoveryError('Bitte den vollstaendigen Code eingeben.');
      return;
    }
    setRecoveryError(null);
    try {
      const result = await window.launchpad.resetPinWithRecovery(recoveryCode.trim(), '1234');
      if (result && result.ok) {
        setRecoverySuccess(true);
        setRecoveryError(null);
      } else {
        setRecoveryError('Code nicht gueltig. Bitte pruefen und erneut versuchen.');
      }
    } catch (err) {
      setRecoveryError('Ein Fehler ist aufgetreten.');
    }
  }, [recoveryCode]);

  // Keyboard navigation for keypad
  useEffect(() => {
    if (showRecovery) return undefined;

    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusRow((r) => Math.max(0, r - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusRow((r) => Math.min(KEYPAD_LAYOUT.length - 1, r + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusCol((c) => Math.max(0, c - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusCol((c) => Math.min(2, c + 1));
          break;
        case 'Enter':
          e.preventDefault();
          handleSubmitPin();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Backspace':
          e.preventDefault();
          setPin((p) => p.slice(0, -1));
          break;
        default:
          // Direct digit input via keyboard
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            setPin((p) => (p.length < 8 ? p + e.key : p));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showRecovery, handleSubmitPin, onClose]);

  // Recovery mode keyboard
  useEffect(() => {
    if (!showRecovery) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (recoverySuccess) {
          onClose();
        } else {
          setShowRecovery(false);
          setRecoveryCode('');
          setRecoveryError(null);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleRecoverySubmit();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showRecovery, handleRecoverySubmit, recoverySuccess, onClose]);

  const getButtonLabel = (key) => {
    if (key === 'del') return '\u232B';
    if (key === 'ok') return '\u2713';
    return key;
  };

  if (success) {
    return (
      <div className="parent-gate-overlay" style={overlayStyle}>
        <div style={panelStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
          <h2 style={titleStyle}>Willkommen!</h2>
          <p style={subtitleStyle}>Familienzentrale wird geoeffnet...</p>
        </div>
      </div>
    );
  }

  if (showRecovery) {
    return (
      <div className="parent-gate-overlay" style={overlayStyle}>
        <div style={panelStyle}>
          <h2 style={titleStyle}>PIN-Wiederherstellung</h2>
          {recoverySuccess ? (
            <>
              <p style={{ ...subtitleStyle, color: '#4caf50' }}>
                PIN wurde auf 1234 zurueckgesetzt.
              </p>
              <p style={subtitleStyle}>
                Bitte oeffne den Elternbereich erneut und aendere die PIN.
              </p>
              <button
                style={actionButtonStyle}
                onClick={onClose}
                autoFocus
              >
                Schliessen
              </button>
            </>
          ) : (
            <>
              <p style={subtitleStyle}>
                Gib den Wiederherstellungscode ein, den du bei der Einrichtung erhalten hast.
              </p>
              <input
                ref={recoveryInputRef}
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                style={recoveryInputStyle}
                aria-label="Wiederherstellungscode"
              />
              {recoveryError && (
                <p style={errorStyle}>{recoveryError}</p>
              )}
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  style={actionButtonStyle}
                  onClick={handleRecoverySubmit}
                >
                  Bestaetigen
                </button>
                <button
                  style={{ ...actionButtonStyle, background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryCode('');
                    setRecoveryError(null);
                  }}
                >
                  Zurueck
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="parent-gate-overlay" style={overlayStyle}>
      <div style={panelStyle}>
        <h2 style={titleStyle}>Elternbereich</h2>
        <p style={subtitleStyle}>Bitte PIN eingeben</p>

        {/* PIN dots display */}
        <div style={pinDisplayStyle} aria-live="polite" aria-label={`${pin.length} Ziffern eingegeben`}>
          {pin.length > 0
            ? Array.from({ length: pin.length }, (_, i) => (
                <span key={i} style={dotStyle}>&#9679;</span>
              ))
            : <span style={{ opacity: 0.3 }}>----</span>
          }
        </div>

        {/* Error message */}
        {error && <p style={errorStyle}>{error}</p>}

        {/* Keypad */}
        <div style={keypadStyle}>
          {KEYPAD_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} style={keypadRowStyle}>
              {row.map((key, colIdx) => (
                <button
                  key={key}
                  ref={(el) => {
                    if (!buttonRefs.current[rowIdx]) buttonRefs.current[rowIdx] = [];
                    buttonRefs.current[rowIdx][colIdx] = el;
                  }}
                  className="focus-ring"
                  style={{
                    ...keyButtonStyle,
                    ...(key === 'ok' ? okButtonStyle : {}),
                    ...(key === 'del' ? delButtonStyle : {}),
                  }}
                  onClick={() => handleKeypadPress(key)}
                  aria-label={key === 'del' ? 'Loeschen' : key === 'ok' ? 'Bestaetigen' : key}
                  tabIndex={rowIdx === focusRow && colIdx === focusCol ? 0 : -1}
                >
                  {getButtonLabel(key)}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* PIN vergessen link */}
        <button
          style={forgotLinkStyle}
          onClick={() => setShowRecovery(true)}
          tabIndex={-1}
        >
          PIN vergessen?
        </button>

        {/* Escape hint */}
        <p style={{ ...subtitleStyle, marginTop: '24px', fontSize: '14px', opacity: 0.5 }}>
          Escape = Schliessen
        </p>
      </div>
    </div>
  );
}

// --- Styles ---

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 21, 56, 0.92)',
  backdropFilter: 'blur(12px)',
  zIndex: 9000,
  animation: 'fadeIn 200ms ease-out',
};

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '48px 56px',
  borderRadius: '32px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  maxWidth: '440px',
  width: '90vw',
};

const titleStyle = {
  color: '#fff',
  fontSize: 'clamp(24px, 3vw, 32px)',
  fontWeight: 700,
  marginBottom: '8px',
  letterSpacing: '0.01em',
};

const subtitleStyle = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 'clamp(14px, 1.6vw, 18px)',
  marginBottom: '24px',
  textAlign: 'center',
};

const pinDisplayStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '24px',
  minHeight: '40px',
  alignItems: 'center',
  fontSize: '28px',
  color: '#fff',
  letterSpacing: '4px',
};

const dotStyle = {
  fontSize: '28px',
  lineHeight: 1,
};

const errorStyle = {
  color: '#ff8a80',
  fontSize: '15px',
  marginBottom: '12px',
  textAlign: 'center',
};

const keypadStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${BUTTON_GAP}px`,
};

const keypadRowStyle = {
  display: 'flex',
  gap: `${BUTTON_GAP}px`,
  justifyContent: 'center',
};

const keyButtonStyle = {
  width: `${BUTTON_SIZE}px`,
  height: `${BUTTON_SIZE}px`,
  borderRadius: '16px',
  border: '2px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#fff',
  fontSize: '28px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 150ms, border-color 150ms, transform 100ms',
  outline: 'none',
};

const okButtonStyle = {
  background: 'rgba(76, 175, 80, 0.25)',
  borderColor: 'rgba(76, 175, 80, 0.5)',
};

const delButtonStyle = {
  background: 'rgba(255, 138, 128, 0.15)',
  borderColor: 'rgba(255, 138, 128, 0.3)',
};

const forgotLinkStyle = {
  marginTop: '20px',
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '14px',
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: '8px 16px',
};

const actionButtonStyle = {
  padding: '14px 32px',
  borderRadius: '12px',
  border: 'none',
  background: 'rgba(76, 175, 80, 0.3)',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const recoveryInputStyle = {
  width: '100%',
  maxWidth: '280px',
  padding: '14px 20px',
  borderRadius: '12px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#fff',
  fontSize: '18px',
  textAlign: 'center',
  letterSpacing: '2px',
  outline: 'none',
  fontFamily: 'monospace',
};

export default ParentGate;
