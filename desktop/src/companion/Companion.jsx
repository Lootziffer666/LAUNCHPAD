/* ============================================================
   LAUNCHPAD — the companion. A critter that roams the launcher.
   - strolls to random spots near the floor, facing where it goes
   - one click  → lies down, purrs, little hearts (a pet)
   - 3 quick clicks → scratches, then bolts off-screen and sulks,
     wandering back after a while
   Reduced motion: sits calmly in a corner, can still be petted,
   never bolts. Lives inside the 1440×900 stage; the wrapper is
   click-through so only the critter itself is interactive.
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { COMPANION as C } from '../lib/companionConfig.js';
import { Sprite } from '../ui/Sprite.jsx';

export function Companion({ reduceMotion = false, onSound = () => {} }) {
  const start = { x: 200, y: C.ground.yMax };
  const [pos, setPos] = useState(start);
  const [face, setFace] = useState(1); // 1 → right, -1 → left
  const [st, setSt] = useState(reduceMotion ? 'idle' : 'wander'); // wander|idle|pet|scratch|flee|away
  const [moving, setMoving] = useState(false);
  const [dur, setDur] = useState(0);
  const [hearts, setHearts] = useState(0);

  const clicks = useRef([]);
  const timers = useRef([]);
  const posRef = useRef(pos);
  posRef.current = pos;

  const after = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const goTo = (x, y, speed) => {
    const p = posRef.current;
    const d = Math.hypot(x - p.x, y - p.y);
    setDur(Math.max(280, d / (speed || C.walkSpeed)));
    setFace(x >= p.x ? 1 : -1);
    setMoving(true);
    setPos({ x, y });
  };

  // Wander loop — schedule the next stroll whenever we're idle-ish.
  useEffect(() => {
    if (reduceMotion || st !== 'wander' || moving) return undefined;
    const wait = C.wanderMinMs + Math.random() * (C.wanderMaxMs - C.wanderMinMs);
    const id = after(() => {
      const { xMin, xMax, yMin, yMax } = C.ground;
      goTo(xMin + Math.random() * (xMax - xMin), yMin + Math.random() * (yMax - yMin));
    }, wait);
    return () => clearTimeout(id);
  }, [st, moving, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const onArrived = () => {
    setMoving(false);
    if (st === 'flee') {
      setSt('away');
      after(() => { // sulk, then saunter back from the edge
        const { xMin, xMax, yMax } = C.ground;
        setPos({ x: xMin + Math.random() * (xMax - xMin), y: yMax });
        clicks.current = [];
        setSt('wander');
      }, C.awayMs);
    }
  };

  const pet = () => {
    setMoving(false);
    setSt('pet');
    setHearts((n) => n + 1);
    onSound('select');
    after(() => setSt(reduceMotion ? 'idle' : 'wander'), C.petMs);
  };

  const annoy = () => {
    setMoving(false);
    setSt('scratch');
    onSound('back');
    after(() => {
      const p = posRef.current;
      const toLeft = p.x < 720;
      goTo(toLeft ? -160 : 1600, p.y, C.fleeSpeed);
      setSt('flee');
    }, 620);
  };

  const onClick = (e) => {
    e.stopPropagation();
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < C.rapidWindowMs);
    clicks.current.push(now);
    if (!reduceMotion && clicks.current.length >= C.scratchAt) { clicks.current = []; annoy(); }
    else pet();
  };

  if (!C.enabled || st === 'away') return null;

  const anim =
    st === 'pet' ? 'lie'
      : st === 'scratch' ? 'scratch'
        : st === 'flee' ? 'run'
          : moving ? 'walk' : 'idle';

  return (
    <div className="companion-layer" aria-hidden="true">
      <div
        className={`companion st-${st} ${moving ? 'moving' : ''}`}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          transition: moving ? `transform ${dur}ms linear` : 'none',
        }}
        onTransitionEnd={onArrived}
      >
        <button className="companion-hit" onClick={onClick} title="Hallo!">
          <Sprite
            sheet={C.sheet}
            anim={anim}
            fallback={C.fallback}
            flip={face}
            size={C.size}
            reduceMotion={reduceMotion}
            className="companion-sprite"
          />
        </button>
        {st === 'pet' && (
          <span key={hearts} className="companion-hearts">💜</span>
        )}
      </div>
    </div>
  );
}
