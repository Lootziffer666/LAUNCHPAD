/* ============================================================
   LAUNCHPAD — ControllerGrid (Gate 6: Library Grid v0)
   ============================================================
   A controller-navigable grid of approved game cards.
   - Arrow keys: spatial 2D navigation
   - Enter: "Launch requested" toast
   - Tab: Info overlay (players, ratings, parent notes)
   - Space: Trailer overlay
   - Escape: Close overlays / back (logged)
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGames, gameCover } from '../games/useGames.js';
import { InfoOverlay } from './InfoOverlay.jsx';
import { TrailerOverlay } from './TrailerOverlay.jsx';
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
  const gridRef = useRef(null);
  const cardRefs = useRef([]);
  const toastTimer = useRef(null);

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
    if (infoGame || trailerGame) return undefined;

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
            showToast(`Launch requested: ${games[focusIndex].title}`);
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
  }, [games, focusIndex, cols, infoGame, trailerGame, showToast, onBack]);

  // Cleanup toast timer
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  return (
    <div className="controller-surface" style={{ position: 'relative', overflow: 'hidden' }}>
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
            onClick={() => showToast(`Launch requested: ${game.title}`)}
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

      {/* Inline keyframes for toast animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ControllerGrid;
