/* ============================================================
   LAUNCHPAD — ambient FX: soft lighting + drifting particles.
   Pure CSS/DOM, no assets. Gives the launcher depth and a sense of
   "place" — slow aurora light, a gentle vignette, and floating motes.
   Click-through (pointer-events: none). AuDHD-safe: reduced motion
   keeps only a static glow + vignette (no drift, no twinkle).
   ============================================================ */
import React, { useMemo } from 'react';

export function AmbientFX({ reduceMotion = false, density = 18 }) {
  const motes = useMemo(() => {
    if (reduceMotion) return [];
    return Array.from({ length: density }, () => ({
      left: Math.random() * 100,
      top: 40 + Math.random() * 60, // bias toward the lower half ("air above the floor")
      size: 2 + Math.random() * 5,
      delay: (Math.random() * 8).toFixed(2),
      dur: (9 + Math.random() * 12).toFixed(2),
      drift: (Math.random() * 40 - 20).toFixed(0),
      hue: Math.random() > 0.5 ? 'a' : 'b',
    }));
  }, [reduceMotion, density]);

  return (
    <div className={`ambient ${reduceMotion ? 'still' : ''}`} aria-hidden="true">
      <div className="ambient-aurora" />
      <div className="ambient-glow" />
      <div className="ambient-vignette" />
      {motes.map((m, i) => (
        <i
          key={i}
          className={`mote mote-${m.hue}`}
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            '--drift': `${m.drift}px`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
