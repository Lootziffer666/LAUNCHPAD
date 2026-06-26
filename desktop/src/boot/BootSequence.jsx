/* ============================================================
   LAUNCHPAD — boot player.
   Plays one boot clip (a video from the manifest, or a built-in CSS
   fallback) for its duration, then hands off to the shell. Reduced
   motion gets a static frame. The clip itself is chosen by
   lib/bootAnimations.js.
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { durationOf } from '../lib/bootAnimations.js';

const GLYPH = { rocket: '🚀', warp: '🚀', daddy: '💜', controller: '🎮' };
const asset = (s) => (s && s.startsWith('/') ? s : `/${s}`);

// Inline styles for the epic boot effects (CSP-safe, no external CSS needed)
const glowRingStyle = {
  position: 'absolute',
  width: 220,
  height: 220,
  borderRadius: '50%',
  border: '3px solid rgba(100, 200, 255, 0.6)',
  boxShadow: '0 0 40px rgba(100, 200, 255, 0.5), inset 0 0 40px rgba(100, 200, 255, 0.2)',
  animation: 'boot-glow-pulse 1.2s ease-in-out infinite',
};

const particleContainerStyle = {
  position: 'absolute',
  width: 300,
  height: 300,
  pointerEvents: 'none',
};

function Particle({ index }) {
  const angle = (index / 12) * 360;
  const delay = (index * 0.06).toFixed(2);
  return (
    <i
      className="boot-particle"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: index % 2 === 0 ? '#64c8ff' : '#a78bfa',
        transform: `rotate(${angle}deg) translateY(-60px)`,
        opacity: 0,
        animation: `boot-particle-burst 0.8s ${delay}s ease-out forwards`,
      }}
    />
  );
}

export function BootSequence({ clip, kidName = 'Jake', reduceMotion = false, onDone = () => {} }) {
  const doneRef = useRef(false);
  const dur = durationOf(clip);
  const variant = (clip && clip.variant) || 'rocket';
  const isVideo = !!(clip && clip.src);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'reveal'

  useEffect(() => {
    const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone(); } };
    // Safety timer so a stalled/silent video can never wedge the boot.
    const id = setTimeout(finish, dur + (isVideo ? 1200 : 300));
    // Transition to reveal phase after 1.5s
    const revealId = setTimeout(() => setPhase('reveal'), 1500);
    return () => { clearTimeout(id); clearTimeout(revealId); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const caption = String((clip && clip.caption) || 'LAUNCHPAD').replace('{name}', kidName);

  return (
    <div className={`boot boot-${variant} ${reduceMotion ? 'noanim' : ''} ${clip && clip.warm ? 'boot-warm' : ''}`}>
      {/* Keyframe definitions (CSP-safe inline style element) */}
      <style>{`
        @keyframes boot-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes boot-particle-burst {
          0% { opacity: 1; transform: rotate(var(--angle, 0deg)) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--angle, 0deg)) translateY(-140px) scale(0.2); }
        }
        @keyframes boot-subtext-fade {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes boot-name-enter {
          0% { opacity: 0; transform: translateY(8px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .boot-epic-caption {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: #eaf0ff;
          text-shadow: 0 0 20px rgba(100, 200, 255, 0.8), 0 0 60px rgba(100, 200, 255, 0.4);
          margin-top: 32px;
        }
        .boot-subtext {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(100, 200, 255, 0.9);
          margin-top: 12px;
          animation: boot-subtext-fade 2s 1.2s ease-out forwards;
        }
        .boot-kidname {
          font-size: 22px;
          font-weight: 700;
          color: #a78bfa;
          margin-top: 8px;
          opacity: 0;
          animation: boot-name-enter 0.6s 1.6s ease-out forwards;
        }
      `}</style>

      {isVideo ? (
        <video
          className="boot-video"
          src={asset(clip.src)}
          autoPlay
          muted
          playsInline
          onEnded={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
        />
      ) : (
        <div className="boot-stage">
          {/* Pulsing glow ring behind the glyph */}
          {!reduceMotion && <div style={glowRingStyle}></div>}
          {/* Particle burst effect */}
          {!reduceMotion && (
            <div style={particleContainerStyle}>
              {Array.from({ length: 12 }, (_, i) => <Particle key={i} index={i} />)}
            </div>
          )}
          <div className="boot-orbit"></div>
          <div className="boot-glyph">{GLYPH[variant] || '🚀'}</div>
        </div>
      )}
      <div className="boot-epic-caption">{caption}</div>
      <div className="boot-subtext">INITIATING...</div>
      {phase === 'reveal' && kidName && (
        <div className="boot-kidname">{kidName}</div>
      )}
      {!isVideo && <div className="boot-bar"><i style={{ animationDuration: `${dur}ms` }}></i></div>}
    </div>
  );
}
