/* ============================================================
   LAUNCHPAD — <Sprite>: sprite-sheet animator with emoji fallback.
   Ticks frames in JS (robust for any sheet) and paints them via
   background-position. With no sheet it renders a styled emoji so the
   UI is alive before any art is added. Honours reduced motion (holds
   a single frame).
   ============================================================ */
import React, { useEffect, useState } from 'react';

export function Sprite({
  sheet, anim = 'idle', fallback = '🐾', flip = 1, size = 72,
  className = '', reduceMotion = false,
}) {
  const a = sheet && sheet.animations && sheet.animations[anim];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    if (!a || !a.frames || reduceMotion) return undefined;
    const fps = a.fps || 8;
    const id = setInterval(() => setFrame((f) => (f + 1) % a.frames), 1000 / fps);
    return () => clearInterval(id);
  }, [anim, a, reduceMotion]);

  // No sheet (or unknown anim) → charming emoji fallback, animated via CSS class.
  if (!sheet || !sheet.url || !a) {
    return (
      <span
        className={`sprite-emoji ${className}`}
        data-anim={anim}
        style={{ fontSize: size, transform: `scaleX(${flip})` }}
      >
        {fallback}
      </span>
    );
  }

  const scale = size / sheet.frameH;
  return (
    <span
      className={`sprite ${className}`}
      data-anim={anim}
      style={{
        width: sheet.frameW,
        height: sheet.frameH,
        backgroundImage: `url(${sheet.url})`,
        backgroundPosition: `${-frame * sheet.frameW}px ${-(a.row || 0) * sheet.frameH}px`,
        transform: `scaleX(${flip}) scale(${scale})`,
        transformOrigin: 'center bottom',
        imageRendering: 'pixelated',
      }}
    />
  );
}
