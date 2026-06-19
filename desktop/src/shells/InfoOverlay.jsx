/* ============================================================
   LAUNCHPAD — InfoOverlay (small game info panel)
   ============================================================
   Shown when Tab/X is pressed on a focused game card.
   Displays player count, ratings, and parent notes.
   Closed with Escape/B.
   ============================================================ */
import React, { useEffect, useRef } from 'react';

export function InfoOverlay({ game, onClose }) {
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

  const players = game.players;
  const ratings = game.ratings;
  const parentNotes = game.parent?.notes || '';

  const playerLabel = players
    ? `${players.min}–${players.max} Spieler${players.localCoop ? ' (Lokal)' : ''}${players.onlineCoop ? ' (Online)' : ''}`
    : 'Keine Angabe';

  const ratingLabel = ratings
    ? `USK ${ratings.usk ?? '?'} / PEGI ${ratings.pegi ?? '?'}`
    : 'Keine Angabe';

  const reasons = ratings?.reasons?.length ? ratings.reasons : [];

  return (
    <div
      className="info-overlay-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="info-overlay-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface, #f0ebe3)',
          color: 'var(--color-text, #3d3530)',
          borderRadius: 'var(--radius-lg, 24px)',
          padding: 'var(--space-lg, 40px)',
          maxWidth: 480, width: '90%',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700 }}>
          {game.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 'clamp(16px, 2vw, 22px)' }}>
          <div><strong>Spieler:</strong> {playerLabel}</div>
          <div><strong>Bewertung:</strong> {ratingLabel}</div>

          {/* PEGI/USK reason chips */}
          {reasons.length > 0 && (
            <div>
              <strong>Hinweise:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {reasons.map((reason, i) => (
                  <span
                    key={i}
                    className="rating-reason-chip"
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 'clamp(12px, 1.4vw, 16px)',
                      fontWeight: 500,
                      background: 'rgba(61, 53, 48, 0.08)',
                      border: '1px solid rgba(61, 53, 48, 0.15)',
                      color: 'var(--color-text, #3d3530)',
                    }}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PEGI/USK explanation */}
          {ratings && (
            <div style={{
              marginTop: 4,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(61, 53, 48, 0.04)',
              fontSize: 'clamp(12px, 1.3vw, 15px)',
              color: 'var(--color-muted, #8a7e74)',
              lineHeight: 1.5,
            }}>
              Altersempfehlung (informativ, kein automatischer Block)
            </div>
          )}

          {parentNotes && (
            <div style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(0,0,0,0.05)', borderRadius: 12 }}>
              <strong>Eltern-Notiz:</strong> {parentNotes}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, fontSize: 14, color: 'var(--color-muted, #8a7e74)' }}>
          Escape / B zum Schließen
        </div>
      </div>
    </div>
  );
}

export default InfoOverlay;
