/* ============================================================
   LAUNCHPAD — CatsLayer: renders both cat NPCs and wires up
   shared context (cursor tracking + cat-cat proximity).
   ============================================================ */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CatNPC } from './CatNPC.jsx';
import { CAT_BROWN_CONFIG, CAT_BLUE_CONFIG } from '../lib/residentsConfig.js';

export function CatsLayer({ reduceMotion = false, onSound }) {
  /* ── cursor tracking ──────────────────────────────────────── */
  const [cursorPos, setCursorPos] = useState(null);
  const stageRectRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      // Lazily cache stage rect; invalidate on resize.
      if (!stageRectRef.current) {
        const stage = document.querySelector('.stage');
        if (!stage) return;
        stageRectRef.current = stage.getBoundingClientRect();
      }
      const r = stageRectRef.current;
      if (r.width === 0 || r.height === 0) return;
      // Convert viewport px → 1440×900 stage coordinates.
      setCursorPos({
        x: ((e.clientX - r.left) / r.width)  * 1440,
        y: ((e.clientY - r.top)  / r.height) * 900,
      });
    };

    const invalidateRect = () => { stageRectRef.current = null; };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('resize',    invalidateRect);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize',    invalidateRect);
    };
  }, []);

  /* ── cat positions (for cat-cat proximity) ────────────────── */
  const [brownPos, setBrownPos] = useState(null);
  const [bluePos,  setBluePos]  = useState(null);

  const handleBrownPos = useCallback((x, y) => setBrownPos({ x, y }), []);
  const handleBluePos  = useCallback((x, y) => setBluePos({ x, y }),  []);

  return (
    <>
      <CatNPC
        cfg={CAT_BROWN_CONFIG}
        cursorPos={cursorPos}
        otherCatPos={bluePos}
        onPosChange={handleBrownPos}
        onSound={onSound}
        reduceMotion={reduceMotion}
      />
      <CatNPC
        cfg={CAT_BLUE_CONFIG}
        cursorPos={cursorPos}
        otherCatPos={brownPos}
        onPosChange={handleBluePos}
        onSound={onSound}
        reduceMotion={reduceMotion}
      />
    </>
  );
}
