/* ============================================================
   LAUNCHPAD -- StanleyBubble (Gate 22)
   ============================================================
   A small, non-interactive text bubble that shows Stanley's
   contextual comments. Fades in over 300ms, stays for ~4.5s,
   then fades out. Only one comment at a time. Pure atmosphere.
   ============================================================ */
import React, { useState, useEffect, useRef } from 'react';

const FADE_IN_MS = 300;
const VISIBLE_MS = 4500;
const FADE_OUT_MS = 300;

export function StanleyBubble({ text }) {
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [fading, setFading] = useState('in'); // 'in' | 'visible' | 'out'
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) {
      setVisible(false);
      return;
    }

    // New text arrived: show it
    setDisplayText(text);
    setVisible(true);
    setFading('in');

    // After fade-in, stay visible
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFading('visible');

      // After visible duration, fade out
      timerRef.current = setTimeout(() => {
        setFading('out');

        // After fade-out, hide completely
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, FADE_OUT_MS);
      }, VISIBLE_MS);
    }, FADE_IN_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  if (!visible || !displayText) return null;

  const opacity = fading === 'in' ? 0 : fading === 'out' ? 0 : 1;

  return (
    <div
      className="stanley-bubble"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        top: 20,
        left: 24,
        zIndex: 6500,
        maxWidth: 320,
        padding: '10px 18px',
        borderRadius: 'var(--radius-md, 16px)',
        background: 'rgba(10, 21, 56, 0.6)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--color-muted, #8a7e74)',
        fontFamily: 'var(--font-body, inherit)',
        fontSize: 'clamp(13px, 1.3vw, 16px)',
        fontStyle: 'italic',
        lineHeight: 1.4,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity,
        transition: `opacity ${FADE_IN_MS}ms ease-in-out`,
        animation: fading === 'in' ? `stanleyFadeIn ${FADE_IN_MS}ms ease-out forwards` : 'none',
      }}
    >
      {displayText}
      <style>{`
        @keyframes stanleyFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default StanleyBubble;
