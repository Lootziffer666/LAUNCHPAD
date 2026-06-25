/* ============================================================
   LAUNCHPAD — TrailerOverlay (trailer preview panel)
   ============================================================
   Shown when Space/Y is pressed on a focused game card.
   Displays trailerUrl or "Kein Trailer verfügbar".
   Closed with Escape/B.
   ============================================================ */
import React, { useEffect, useRef } from 'react';

export function TrailerOverlay({ game, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!game) return null;

  const hasTrailer = game.trailerUrl && game.trailerUrl.trim().length > 0;

  return (
    <div
      className="trailer-overlay-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="trailer-overlay-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface, #f0ebe3)',
          color: 'var(--color-text, #3d3530)',
          borderRadius: 'var(--radius-lg, 24px)',
          padding: 'var(--space-lg, 40px)',
          maxWidth: 540, width: '90%',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700 }}>
          {game.title}
        </h2>

        {hasTrailer ? (
          <div style={{ fontSize: 'clamp(16px, 2vw, 22px)' }}>
            <div style={{ marginBottom: 12 }}>Trailer:</div>
            <a
              href={game.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-focus, #e8952f)', wordBreak: 'break-all' }}
            >
              {game.trailerUrl}
            </a>
          </div>
        ) : (
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', color: 'var(--color-muted, #8a7e74)' }}>
            Kein Trailer verfügbar
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 14, color: 'var(--color-muted, #8a7e74)' }}>
          Escape / B zum Schließen
        </div>
      </div>
    </div>
  );
}

export default TrailerOverlay;
