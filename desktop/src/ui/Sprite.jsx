/* ============================================================
   LAUNCHPAD — <Sprite>: sprite-sheet animator with emoji fallback.
   Ticks frames in JS (robust for any sheet) and paints them via
   background-position. With no sheet it renders a styled emoji so the
   UI is alive before any art is added. Honours reduced motion (holds
   a single frame).

   Two sheet formats are supported:
   - Legacy row-grid: { url, frameW, frameH, animations: { name: { row, frames (number), fps } } }
   - Rect-based:      { url, sheetW, sheetH, frameRects: { ID: {x,y,w,h} },
                        animations: { name: { frames (string[]), fps, loop } } }
   ============================================================ */
import React, { useEffect, useState } from 'react';

export function Sprite({
  sheet, anim = 'idle', fallback = '🐾', flip = 1, size = 72,
  className = '', reduceMotion = false,
}) {
  const a = sheet && sheet.animations && sheet.animations[anim];
  const isRectBased = a && Array.isArray(a.frames);
  const frameCount = a ? (isRectBased ? a.frames.length : a.frames) : 0;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    if (!a || !frameCount || reduceMotion) return undefined;
    const fps = a.fps || 8;
    const id = setInterval(() => setFrame((f) => (f + 1) % frameCount), 1000 / fps);
    return () => clearInterval(id);
  }, [anim, a, reduceMotion, frameCount]);

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

  // Rect-based format: each frame has an explicit {x,y,w,h} in the sheet.
  if (isRectBased && sheet.frameRects) {
    const frameId = a.frames[frame % a.frames.length];
    const rect = sheet.frameRects[frameId] || sheet.frameRects[a.frames[0]];
    const scale = size / rect.h;
    const sw = (sheet.sheetW || 1536) * scale;
    const sh = (sheet.sheetH || 523) * scale;
    return (
      <span
        className={`sprite ${className}`}
        data-anim={anim}
        style={{
          display: 'inline-block',
          width: Math.round(rect.w * scale),
          height: Math.round(rect.h * scale),
          backgroundImage: `url(${sheet.url})`,
          backgroundSize: `${sw}px ${sh}px`,
          backgroundPosition: `${-rect.x * scale}px ${-rect.y * scale}px`,
          backgroundRepeat: 'no-repeat',
          transform: `scaleX(${flip})`,
          transformOrigin: 'center bottom',
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  // Legacy row-grid format.
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
