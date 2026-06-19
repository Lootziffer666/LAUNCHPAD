/* ============================================================
   LAUNCHPAD -- ControllerGrid (Gate 6+7+10+11: Library Grid + Launch Adapter + Parent Gate)
   ============================================================
   A controller-navigable grid of approved game cards.
   - Arrow keys: spatial 2D navigation
   - Enter: Launch game (LaunchOverlay state machine)
   - Tab: Info overlay (players, ratings, parent notes)
   - Space: Trailer overlay
   - Escape: Close overlays / back (logged)
   - Ctrl+1/2/3: Switch glyph profile (Xbox/PS/Nintendo)
   - Ctrl+P: Open parent gate (PIN entry for Familienzentrale)
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGames, gameCover } from '../games/useGames.js';
import { InfoOverlay } from './InfoOverlay.jsx';
import { TrailerOverlay } from './TrailerOverlay.jsx';
import { LaunchOverlay } from './LaunchOverlay.jsx';
import { ParentGate } from './ParentGate.jsx';
import { getProfile, setProfile, glyph, profileName, allGlyphs } from '../lib/glyphs.js';
import '../styles/tokens.css';
import '../styles/controller.css';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 290;
const CARD_GAP = 24;
const TOAST_DURATION = 2500;

export function ControllerGrid({ onBack }) {
  const allGames = useGames();
  // Only show approved games (main already filters, but double-check)
  const games = allGames.filter(
    (g) => g.parent?.approval === 'approved' || g.approval === 'approved'
  );

  const [focusIndex, setFocusIndex] = useState(0);
  const [toast, setToast] = useState(null);
  const [infoGame, setInfoGame] = useState(null);
  const [trailerGame, setTrailerGame] = useState(null);
  const [launchGame, setLaunchGame] = useState(null);
  const [showParentGate, setShowParentGate] = useState(false);
  const [activeGlyphs, setActiveGlyphs] = useState(allGlyphs);
  const [activeProfileName, setActiveProfileName] = useState(profileName);
  const [timeLeftMin, setTimeLeftMin] = useState(null);
  const gridRef = useRef(null);
  const cardRefs = useRef([]);
  const toastTimer = useRef(null);

  // Refresh glyph display state from module
  const refreshGlyphs = useCallback(() => {
    setActiveGlyphs(allGlyphs());
    setActiveProfileName(profileName());
  }, []);

  // Calculate columns based on container width
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const measure = () => {
      if (gridRef.current) {
        const w = gridRef.current.clientWidth;
        const c = Math.max(1, Math.floor((w + CARD_GAP) / (CARD_WIDTH + CARD_GAP)));
        setCols(c);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Focus the active card
  useEffect(() => {
    const card = cardRefs.current[focusIndex];
    if (card) card.focus();
  }, [focusIndex]);

  // Show toast
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  // Keyboard navigation (only when no overlay is open)
  useEffect(() => {
    if (infoGame || trailerGame || launchGame || showParentGate) return undefined;

    const handleKey = (e) => {
      const len = games.length;
      if (len === 0) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + 1, len - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - 1, 0));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + cols, len - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - cols, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (games[focusIndex]) {
            setLaunchGame(games[focusIndex]);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (games[focusIndex]) setInfoGame(games[focusIndex]);
          break;
        case ' ':
          e.preventDefault();
          if (games[focusIndex]) setTrailerGame(games[focusIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          console.log('[ControllerGrid] Back pressed (no action at grid level)');
          if (onBack) onBack();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [games, focusIndex, cols, infoGame, trailerGame, launchGame, showParentGate, showToast, onBack]);

  // Glyph profile switching: Ctrl+1 = Xbox, Ctrl+2 = PlayStation, Ctrl+3 = Nintendo
  // Parent gate: Ctrl+P
  useEffect(() => {
    const PROFILE_MAP = { '1': 'xbox', '2': 'playstation', '3': 'nintendo' };
    const handleProfileKey = (e) => {
      if (e.ctrlKey && PROFILE_MAP[e.key]) {
        e.preventDefault();
        const newProfile = PROFILE_MAP[e.key];
        setProfile(newProfile);
        refreshGlyphs();
        showToast(`Profil: ${profileName()}`);
      }
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowParentGate(true);
      }
    };
    window.addEventListener('keydown', handleProfileKey);
    return () => window.removeEventListener('keydown', handleProfileKey);
  }, [showToast, refreshGlyphs]);

  // Cleanup toast timer
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Time-remaining indicator: poll shellStatus every 60s
  useEffect(() => {
    let alive = true;
    const fetchTime = async () => {
      if (!window.launchpad || !window.launchpad.shellStatus) return;
      try {
        const s = await window.launchpad.shellStatus();
        if (alive && s && typeof s.timeLeftMin === 'number') {
          setTimeLeftMin(s.timeLeftMin);
        }
      } catch (e) { /* swallow */ }
    };
    fetchTime();
    const interval = setInterval(fetchTime, 60000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  // Determine time badge state
  const timeBadgeColor = timeLeftMin !== null && timeLeftMin < 5
    ? '#e8673c'
    : timeLeftMin !== null && timeLeftMin < 15
      ? '#d4943a'
      : 'rgba(255,255,255,0.7)';
  const timeBadgePulse = timeLeftMin !== null && timeLeftMin < 5;

  return (
    <div className="controller-surface" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Time remaining badge */}
      {timeLeftMin !== null && (
        <div
          className={timeBadgePulse ? 'time-badge time-badge-pulse' : 'time-badge'}
          style={{
            position: 'absolute',
            top: 16,
            right: 24,
            zIndex: 6000,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(10, 21, 56, 0.7)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: timeBadgeColor,
            fontSize: 'clamp(13px, 1.4vw, 17px)',
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          <span role="img" aria-label="Zeit">&#9201;</span>
          <span>{timeLeftMin} Min</span>
        </div>
      )}
      {/* Header */}
      <header style={{ marginBottom: 'var(--space-lg, 40px)' }}>
        <h1 className="display-title">Bibliothek</h1>
        <p style={{ color: 'var(--color-muted, #8a7e74)', margin: '8px 0 0', fontSize: 'clamp(14px, 1.5vw, 18px)' }}>
          {games.length} Spiel{games.length !== 1 ? 'e' : ''} verfügbar
          &nbsp;•&nbsp; Pfeiltasten navigieren &nbsp;•&nbsp; Enter = Starten &nbsp;•&nbsp; Tab = Info &nbsp;•&nbsp; Space = Trailer
        </p>
      </header>

      {/* Grid */}
      <div
        ref={gridRef}
        className="controller-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
          gap: `${CARD_GAP}px`,
          padding: '0 0 var(--space-xl, 64px)',
        }}
      >
        {games.map((game, i) => (
          <div
            key={game.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="game-card focus-ring"
            tabIndex={0}
            role="button"
            aria-label={game.title}
            style={{
              ...gameCover(game, 145),
              minWidth: CARD_WIDTH,
              minHeight: CARD_HEIGHT,
              cursor: 'pointer',
              position: 'relative',
            }}
            onFocus={() => setFocusIndex(i)}
            onClick={() => setLaunchGame(game)}
          >
            {/* Title label at bottom */}
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '24px 16px 16px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                borderRadius: '0 0 var(--radius-lg, 24px) var(--radius-lg, 24px)',
              }}
            >
              <div style={{
                color: '#fff', fontWeight: 600,
                fontSize: 'clamp(16px, 1.8vw, 22px)',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                lineHeight: 1.3,
              }}>
                {game.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No games state */}
      {games.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl, 64px)', color: 'var(--color-muted)' }}>
          <h2>Keine freigegebenen Spiele</h2>
          <p>Bitte wende dich an deine Eltern.</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="controller-toast"
          style={{
            position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
            padding: '16px 32px', borderRadius: 'var(--radius-md, 16px)',
            background: 'var(--color-text, #3d3530)', color: '#fff',
            fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 600,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            zIndex: 7000, pointerEvents: 'none',
            animation: 'fadeInUp 200ms ease-out',
          }}
        >
          {toast}
        </div>
      )}

      {/* Info Overlay */}
      {infoGame && (
        <InfoOverlay game={infoGame} onClose={() => setInfoGame(null)} />
      )}

      {/* Trailer Overlay */}
      {trailerGame && (
        <TrailerOverlay game={trailerGame} onClose={() => setTrailerGame(null)} />
      )}

      {/* Launch Overlay */}
      {launchGame && (
        <LaunchOverlay game={launchGame} onClose={() => setLaunchGame(null)} />
      )}

      {/* Parent Gate */}
      {showParentGate && (
        <ParentGate onClose={() => setShowParentGate(false)} />
      )}

      {/* Action Hint Bar (Glyph Profile) */}
      <div
        className="glyph-hint-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--space-lg, 40px)',
          padding: '12px 24px',
          background: 'rgba(10, 21, 56, 0.85)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          zIndex: 5000,
          fontSize: 'clamp(13px, 1.4vw, 17px)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}
      >
        <span><strong>[{activeGlyphs.confirm}]</strong> Starten</span>
        <span><strong>[{activeGlyphs.back}]</strong> Zurueck</span>
        <span><strong>[{activeGlyphs.info}]</strong> Info</span>
        <span><strong>[{activeGlyphs.trailer}]</strong> Trailer</span>
        <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.85em' }}>
          {activeProfileName}
        </span>
        <span style={{ opacity: 0.4, fontSize: '0.85em' }}>
          Ctrl+P: Elternbereich
        </span>
      </div>

      {/* Inline keyframes for toast animation + time badge pulse */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .time-badge-pulse {
          animation: gentlePulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ControllerGrid;
