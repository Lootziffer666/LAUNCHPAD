/* ============================================================
   LAUNCHPAD — Resident: an ambient cat that wanders the launcher.
   Simpler than Companion (no flee/scratch mechanic) — just roams,
   can be petted, then wanders off again. Used for cat_blue.
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { Sprite } from '../ui/Sprite.jsx';

export function Resident({ cfg, reduceMotion = false }) {
  const [pos, setPos] = useState({ x: cfg.startX, y: cfg.startY });
  const [face, setFace] = useState(-1);
  const [state, setState] = useState(reduceMotion ? 'idle' : 'wander');
  const [moving, setMoving] = useState(false);
  const [dur, setDur] = useState(0);
  const [hearts, setHearts] = useState(0);

  const timers = useRef([]);
  const posRef = useRef(pos);
  posRef.current = pos;

  const after = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const goTo = (x, y) => {
    const p = posRef.current;
    const d = Math.hypot(x - p.x, y - p.y);
    setDur(Math.max(400, d / cfg.walkSpeed));
    setFace(x >= p.x ? 1 : -1);
    setMoving(true);
    setPos({ x, y });
  };

  // Wander loop — schedule next stroll whenever idle and not moving.
  useEffect(() => {
    if (reduceMotion || state !== 'wander' || moving) return undefined;
    const wait = cfg.wanderMinMs + Math.random() * (cfg.wanderMaxMs - cfg.wanderMinMs);
    const id = after(() => {
      const { xMin, xMax, yMin, yMax } = cfg.ground;
      goTo(xMin + Math.random() * (xMax - xMin), yMin + Math.random() * (yMax - yMin));
    }, wait);
    return () => clearTimeout(id);
  }, [state, moving, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const onArrived = () => setMoving(false);

  const onClick = (e) => {
    e.stopPropagation();
    if (state === 'pet') return;
    setMoving(false);
    setState('pet');
    setHearts((n) => n + 1);
    after(() => setState(reduceMotion ? 'idle' : 'wander'), cfg.petMs);
  };

  const anim = state === 'pet' ? 'rest_idle'
    : moving ? 'walk'
    : 'idle_variants';

  return (
    <div className="companion-layer" aria-hidden="true">
      <div
        className={`companion resident st-${state} ${moving ? 'moving' : ''}`}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          transition: moving ? `transform ${dur}ms linear` : 'none',
        }}
        onTransitionEnd={onArrived}
      >
        <button className="companion-hit" onClick={onClick} title={cfg.name}>
          <Sprite
            sheet={cfg.sheet}
            anim={anim}
            fallback={cfg.fallback}
            flip={face}
            size={cfg.size}
            reduceMotion={reduceMotion}
            className="companion-sprite"
          />
        </button>
        {state === 'pet' && <span key={hearts} className="companion-hearts">💙</span>}
      </div>
    </div>
  );
}
