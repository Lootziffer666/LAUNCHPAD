/* ============================================================
   LAUNCHPAD -- HabitatShell (Gate 21: Habitat Rooms v0)
   ============================================================
   Replaces the flat ControllerGrid with spatial room navigation.
   - Left/Right arrows switch between rooms (with animation)
   - Within a room: Up/Down/Enter navigate the game grid
   - All existing overlays (Launch, Info, Trailer, ParentGate)
     continue to work as before.
   - Glyph hints, time indicator, and boot screen are preserved.
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGames, gameCover } from '../games/useGames.js';
import { ROOMS, gamesForRoom } from './rooms.js';
import { InfoOverlay } from '../shells/InfoOverlay.jsx';
import { TrailerOverlay } from '../shells/TrailerOverlay.jsx';
import { LaunchOverlay } from '../shells/LaunchOverlay.jsx';
import { ParentGate } from '../shells/ParentGate.jsx';
import { getProfile, setProfile, glyph, profileName, allGlyphs } from '../lib/glyphs.js';
import '../styles/tokens.css';
import '../styles/controller.css';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 290;
const CARD_GAP = 24;
const TOAST_DURATION = 2500;
const ROOM_ANNOUNCE_DURATION = 800;

export function HabitatShell({ onBack }) {
  const allGames = useGames();
  // Only show approved games
  const games = allGames.filter(
    (g) => g.parent?.approval === 'approved' || g.approval === 'approved'
  );

  const [roomIndex, setRoomIndex] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [roomAnnounce, setRoomAnnounce] = useState(null);
  const [slideDir, setSlideDir] = useState(null); // 'left' | 'right' | null
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
  const announceTimer = useRef(null);
  const slideTimer = useRef(null);

  const currentRoom = ROOMS[roomIndex];
  const roomGames = gamesForRoom(currentRoom, games);

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
  }, [focusIndex, roomIndex]);

  // Show toast
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  // Room switch with animation
  const switchRoom = useCallback((direction) => {
    const newIndex = direction === 'right'
      ? (roomIndex + 1) % ROOMS.length
      : (roomIndex - 1 + ROOMS.length) % ROOMS.length;

    setSlideDir(direction);
    setRoomIndex(newIndex);
    setFocusIndex(0);

    // Show room name announcement
    setRoomAnnounce(ROOMS[newIndex]);
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setRoomAnnounce(null), ROOM_ANNOUNCE_DURATION);

    // Clear slide direction after animation
    if (slideTimer.current) clearTimeout(slideTimer.current);
    slideTimer.current = setTimeout(() => setSlideDir(null), 400);
  }, [roomIndex]);

  // Keyboard navigation (only when no overlay is open)
  useEffect(() => {
    if (infoGame || trailerGame || launchGame || showParentGate) return undefined;

    const handleKey = (e) => {
      const len = roomGames.length;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (len === 0 || focusIndex === len - 1 || (focusIndex % cols === cols - 1)) {
            // At right edge of grid or empty room: switch room
            switchRoom('right');
          } else {
            setFocusIndex((i) => Math.min(i + 1, len - 1));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (len === 0 || focusIndex === 0 || (focusIndex % cols === 0)) {
            // At left edge of grid or empty room: switch room
            switchRoom('left');
          } else {
            setFocusIndex((i) => Math.max(i - 1, 0));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (len > 0) setFocusIndex((i) => Math.min(i + cols, len - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (len > 0) setFocusIndex((i) => Math.max(i - cols, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (roomGames[focusIndex]) {
            setLaunchGame(roomGames[focusIndex]);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (roomGames[focusIndex]) setInfoGame(roomGames[focusIndex]);
          break;
        case ' ':
          e.preventDefault();
          if (roomGames[focusIndex]) setTrailerGame(roomGames[focusIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          if (onBack) onBack();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roomGames, focusIndex, cols, roomIndex, infoGame, trailerGame, launchGame, showParentGate, switchRoom, onBack]);

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

  // Cleanup timers
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (announceTimer.current) clearTimeout(announceTimer.current);
    if (slideTimer.current) clearTimeout(slideTimer.current);
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

      {/* Room Announcement (big text, appears briefly on room switch) */}
      {roomAnnounce && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 8000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            animation: 'roomAnnounce 800ms ease-out forwards',
          }}
        >
          <div style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}>{roomAnnounce.emoji}</div>
          <div style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            textAlign: 'center',
          }}>
            {roomAnnounce.name}
          </div>
        </div>
      )}

      {/* Room Header */}
      <header style={{ marginBottom: 'var(--space-md, 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>{currentRoom.emoji}</span>
          <div>
            <h1 className="display-title" style={{ margin: 0 }}>{currentRoom.name}</h1>
            <p style={{
              color: 'var(--color-muted, #8a7e74)',
              margin: '4px 0 0',
              fontSize: 'clamp(14px, 1.5vw, 18px)',
            }}>
              {currentRoom.description}
            </p>
          </div>
        </div>
        <p style={{
          color: 'var(--color-muted, #8a7e74)',
          margin: '8px 0 0',
          fontSize: 'clamp(13px, 1.3vw, 16px)',
        }}>
          {roomGames.length} Spiel{roomGames.length !== 1 ? 'e' : ''}
          &nbsp;&bull;&nbsp; Links/Rechts = Raum wechseln &nbsp;&bull;&nbsp; Enter = Starten &nbsp;&bull;&nbsp; Tab = Info
        </p>
      </header>

      {/* Game Grid (slides on room change) */}
      <div
        ref={gridRef}
        style={{
          transform: slideDir === 'right' ? 'translateX(0)' : slideDir === 'left' ? 'translateX(0)' : 'none',
          animation: slideDir ? `slideIn${slideDir === 'right' ? 'Left' : 'Right'} 300ms ease-out` : 'none',
        }}
      >
        {roomGames.length > 0 ? (
          <div
            className="controller-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
              gap: `${CARD_GAP}px`,
              padding: '0 0 var(--space-xl, 64px)',
            }}
          >
            {roomGames.map((game, i) => (
              <div
                key={game.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="game-card focus-ring"
                tabIndex={0}
                role="button"
                aria-label={game.title || game.name}
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
                    {game.title || game.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-xl, 64px)',
            color: 'var(--color-muted)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{currentRoom.emoji}</div>
            <h2 style={{ margin: '0 0 8px' }}>Hier ist es noch ruhig.</h2>
            <p>Probiere einen anderen Raum aus!</p>
          </div>
        )}
      </div>

      {/* Room Indicator (bottom dots/emojis) */}
      <div
        style={{
          position: 'fixed',
          bottom: 52,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '8px 20px',
          borderRadius: 999,
          background: 'rgba(10, 21, 56, 0.7)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 5500,
        }}
      >
        {ROOMS.map((room, i) => (
          <span
            key={room.id}
            style={{
              fontSize: i === roomIndex ? 24 : 16,
              opacity: i === roomIndex ? 1 : 0.4,
              transition: 'all 200ms ease-out',
              filter: i === roomIndex ? 'none' : 'grayscale(0.5)',
            }}
            title={room.name}
          >
            {room.emoji}
          </span>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="controller-toast"
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
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

      {/* Inline keyframes */}
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
        @keyframes roomAnnounce {
          0% { opacity: 0; transform: scale(0.9); }
          30% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        @keyframes slideInLeft {
          from { opacity: 0.5; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0.5; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default HabitatShell;
