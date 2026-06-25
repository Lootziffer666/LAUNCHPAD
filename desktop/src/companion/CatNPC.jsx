/* ============================================================
   LAUNCHPAD — CatNPC: full-behaviour cat resident.

   Behaviours implemented:
   • 20+ NPC states (idle, alert, proud, sit, ignore, walk, stalk,
     chase_cursor, pounce, play, doze, sleep, stretch, beg, wave,
     groom, belly, hiss, scared, tile_rest, cat_meet, flee, pet)
   • Z-layer switching: stalk = behind tiles (z-index 0), all
     others = above tiles (z-index 6)
   • Cursor chasing: fast cursor within 170 px → chase_cursor
   • Cat-cat proximity: cats within 115 px → cat_meet
   • Click-to-pet → belly_up + purr + heart; 3 rapid clicks (if
     canFlee) → hiss → flee off-screen → sulk → return
   • Occasional meow sounds + speech bubble on expressive states
   • Reduced motion: sits calmly, no movement, no flee
   ============================================================ */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sprite } from '../ui/Sprite.jsx';
import { STATE_DEF, TRANSITIONS, MEOW_STATES, BUBBLE_TEXT, pickWeighted, nextState } from './catBehavior.js';

export function CatNPC({
  cfg,
  cursorPos,      // { x, y } stage-coords | null
  otherCatPos,    // { x, y } stage-coords | null
  onPosChange,    // (x, y) => void — for cat-cat proximity in parent
  onSound,        // (key: string) => void
  reduceMotion = false,
}) {
  /* ── position ─────────────────────────────────────────────── */
  const [pos,      setPos]      = useState({ x: cfg.startX, y: cfg.startY });
  const [face,     setFace]     = useState(-1);
  const [isMoving, setIsMoving] = useState(false);
  const [moveDur,  setMoveDur]  = useState(0);
  const posRef = useRef({ x: cfg.startX, y: cfg.startY });

  /* ── state machine ────────────────────────────────────────── */
  const [catState, setCatState] = useState('idle');
  const [zLayer,   setZLayer]   = useState('above');
  const stateRef   = useRef('idle');
  const stateTimer = useRef(null);

  /* ── UI ───────────────────────────────────────────────────── */
  const [hearts,  setHearts]  = useState(0);
  const [bubble,  setBubble]  = useState(null); // { text, key }
  const bubbleTimer = useRef(null);

  /* ── prop refs (avoid stale closures in callbacks) ────────── */
  const cfgRef         = useRef(cfg);         cfgRef.current = cfg;
  const cursorRef      = useRef(cursorPos);   cursorRef.current = cursorPos;
  const otherCatRef    = useRef(otherCatPos); otherCatRef.current = otherCatPos;
  const onPosChangeRef = useRef(onPosChange); onPosChangeRef.current = onPosChange;
  const onSoundRef     = useRef(onSound);     onSoundRef.current = onSound;
  const reduceRef      = useRef(reduceMotion);reduceRef.current = reduceMotion;
  const cursorVelRef   = useRef(0);
  const prevCursorRef  = useRef(null);
  const clicksRef      = useRef([]);          // timestamps of recent clicks
  const movingRef      = useRef(false);

  /* ── cleanup on unmount ───────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (stateTimer.current)  clearTimeout(stateTimer.current);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

  /* ── cursor velocity ──────────────────────────────────────── */
  useEffect(() => {
    if (!cursorPos) return;
    const prev = prevCursorRef.current;
    if (prev) cursorVelRef.current = Math.hypot(cursorPos.x - prev.x, cursorPos.y - prev.y);
    prevCursorRef.current = cursorPos;
  }, [cursorPos]);

  /* ── movement ─────────────────────────────────────────────── */
  const moveTo = useCallback((x, y, speed) => {
    const p = posRef.current;
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < 6) return;
    const dur = Math.max(320, d / speed);
    setFace(x >= p.x ? 1 : -1);
    setMoveDur(dur);
    setIsMoving(true);
    movingRef.current = true;
    posRef.current = { x, y };
    setPos({ x, y });
    onPosChangeRef.current?.(x, y);
  }, []);

  const onArrived = useCallback(() => {
    setIsMoving(false);
    movingRef.current = false;
    onPosChangeRef.current?.(posRef.current.x, posRef.current.y);
  }, []);

  /* ── pick movement target ─────────────────────────────────── */
  const pickTarget = useCallback((moveType) => {
    const c   = cfgRef.current;
    const p   = posRef.current;
    const cur = cursorRef.current;
    const oth = otherCatRef.current;
    const { xMin, xMax, yMin, yMax } = c.ground;
    const rnd = (a, b) => a + Math.random() * (b - a);

    switch (moveType) {
      case 'wander':
        return { x: rnd(xMin, xMax), y: rnd(yMin, yMax), spd: c.walkSpeed };

      case 'stalk_toward': {
        // Move slowly toward cursor or a random in-ground target.
        const tx = cur ? rnd(p.x + (cur.x - p.x) * 0.35, p.x + (cur.x - p.x) * 0.65) : rnd(xMin, xMax);
        const ty = cur ? rnd(p.y + (cur.y - p.y) * 0.35, p.y + (cur.y - p.y) * 0.65) : rnd(yMin, yMax);
        return {
          x: Math.max(xMin, Math.min(xMax, tx)),
          y: Math.max(yMin, Math.min(yMax, ty)),
          spd: c.walkSpeed * 0.55,
        };
      }

      case 'cursor': {
        if (!cur) return { x: rnd(xMin, xMax), y: rnd(yMin, yMax), spd: c.runSpeed };
        return {
          x: Math.max(xMin, Math.min(xMax, cur.x)),
          y: Math.max(yMin, Math.min(yMax, cur.y)),
          spd: c.runSpeed,
        };
      }

      case 'play_hop': {
        const dx = (Math.random() - 0.5) * 180;
        const dy = (Math.random() - 0.5) * 90;
        return {
          x: Math.max(xMin, Math.min(xMax, p.x + dx)),
          y: Math.max(yMin, Math.min(yMax, p.y + dy)),
          spd: c.walkSpeed * 2.2,
        };
      }

      case 'tile': {
        // Move to the bottom tile zone (overlaps with tile row 3 in the stage).
        const ty = c.tileY || { min: 630, max: 710 };
        return { x: rnd(xMin + 80, xMax - 80), y: rnd(ty.min, ty.max), spd: c.walkSpeed };
      }

      case 'other_cat': {
        if (!oth) return null;
        const dx = oth.x - p.x;
        const dy = oth.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 90) return null; // already close
        const frac = 1 - (80 / dist);
        return {
          x: Math.max(xMin, Math.min(xMax, p.x + dx * frac)),
          y: Math.max(yMin, Math.min(yMax, p.y + dy * frac)),
          spd: c.walkSpeed * 1.4,
        };
      }

      case 'offscreen': {
        const toLeft = p.x < 720;
        return { x: toLeft ? -220 : 1660, y: p.y, spd: c.fleeSpeed };
      }

      default:
        return null;
    }
  }, []);

  /* ── speech bubble ────────────────────────────────────────── */
  const showBubble = useCallback((text) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble({ text, key: Date.now() });
    bubbleTimer.current = setTimeout(() => setBubble(null), 2400);
  }, []);

  /* ── enter a state ────────────────────────────────────────── */
  const enterState = useCallback((newState) => {
    if (stateTimer.current) clearTimeout(stateTimer.current);

    const def = STATE_DEF[newState] || STATE_DEF.idle;
    stateRef.current = newState;
    setCatState(newState);
    setZLayer(def.zLayer || 'above');

    /* --- movement --- */
    if (!reduceRef.current && def.moves) {
      const t = pickTarget(def.moves);
      if (t) moveTo(t.x, t.y, t.spd);
    }

    /* --- special effects --- */
    if (newState === 'pet') {
      setHearts((n) => n + 1);
      onSoundRef.current?.('purr');
      showBubble('~ ♥ ~');
    }
    if (MEOW_STATES.has(newState) && Math.random() < 0.28) {
      setTimeout(() => {
        onSoundRef.current?.('meow');
        showBubble(BUBBLE_TEXT[newState] || 'miau');
      }, 180);
    }
    if (newState === 'hiss') {
      showBubble(BUBBLE_TEXT.hiss);
    }

    /* --- 'away' state: just wait for the return timer --- */
    if (newState === 'away') {
      const c = cfgRef.current;
      stateTimer.current = setTimeout(() => {
        if (stateRef.current !== 'away') return;
        const { xMin, xMax, yMax } = c.ground;
        const x = xMin + Math.random() * (xMax - xMin);
        posRef.current = { x, y: yMax + 20 };
        setPos({ x, y: yMax + 20 });
        clicksRef.current = [];
        enterState('idle');
      }, c.awayMs || 22000);
      return;
    }

    /* --- schedule next state --- */
    const dur = def.minMs + Math.random() * (def.maxMs - def.minMs);
    stateTimer.current = setTimeout(() => {
      if (stateRef.current !== newState) return;
      const p   = posRef.current;
      const cur = cursorRef.current;
      const oth = otherCatRef.current;
      const next = nextState(newState, {
        cursorFast:    cursorVelRef.current > 10,
        cursorDist:    cur ? Math.hypot(cur.x - p.x, cur.y - p.y) : 9999,
        otherCatDist:  oth ? Math.hypot(oth.x - p.x, oth.y - p.y) : 9999,
        interruptible: def.interruptible,
        canFlee:       cfgRef.current.canFlee,
      });
      enterState(next);
    }, dur);
  }, [moveTo, showBubble, pickTarget]); // stable — refs only inside

  /* ── initial kick-off ─────────────────────────────────────── */
  useEffect(() => {
    const id = setTimeout(
      () => enterState(reduceMotion ? 'sit' : 'idle'),
      cfg.startDelay || 0,
    );
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── reactive cursor interrupt ────────────────────────────── */
  const lastCursorInterrupt = useRef(0);
  useEffect(() => {
    if (!cursorPos || reduceMotion) return;
    const now = Date.now();
    if (now - lastCursorInterrupt.current < 400) return;
    const p    = posRef.current;
    const dist = Math.hypot(cursorPos.x - p.x, cursorPos.y - p.y);
    const def  = STATE_DEF[stateRef.current] || {};
    if (def.interruptible && cursorVelRef.current > 12 && dist < 170) {
      lastCursorInterrupt.current = now;
      enterState('chase_cursor');
    }
  }, [cursorPos, reduceMotion, enterState]);

  /* ── reactive cat-cat proximity ───────────────────────────── */
  const lastCatInterrupt = useRef(0);
  useEffect(() => {
    if (!otherCatPos) return;
    const now = Date.now();
    if (now - lastCatInterrupt.current < 1800) return;
    const p    = posRef.current;
    const dist = Math.hypot(otherCatPos.x - p.x, otherCatPos.y - p.y);
    const noInt = new Set(['flee', 'away', 'hiss', 'cat_meet', 'chase_cursor', 'pounce', 'pet']);
    if (dist < 115 && !noInt.has(stateRef.current)) {
      lastCatInterrupt.current = now;
      enterState('cat_meet');
    }
  }, [otherCatPos, enterState]);

  /* ── click handler ────────────────────────────────────────── */
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const now = Date.now();
    clicksRef.current = clicksRef.current.filter((t) => now - t < 1500);
    clicksRef.current.push(now);

    if (cfgRef.current.canFlee && clicksRef.current.length >= 3) {
      clicksRef.current = [];
      enterState('hiss');
      // After hiss anim finishes, flee then sulk off-screen
      setTimeout(() => {
        const p      = posRef.current;
        const toLeft = p.x < 720;
        const offX   = toLeft ? -220 : 1660;
        moveTo(offX, p.y, cfgRef.current.fleeSpeed || 0.7);
        stateRef.current = 'flee';
        setCatState('flee');
        const fleeDur = Math.abs(offX - p.x) / (cfgRef.current.fleeSpeed || 0.7) + 200;
        setTimeout(() => enterState('away'), fleeDur);
      }, 680);
    } else if (!['flee', 'away', 'pet', 'hiss'].includes(stateRef.current)) {
      enterState('pet');
    }
  }, [enterState, moveTo]);

  /* ── render ───────────────────────────────────────────────── */
  if (catState === 'away') return null;

  const def    = STATE_DEF[catState] || STATE_DEF.idle;
  const zIndex = zLayer === 'below' ? 0 : 6;

  return (
    <div className="companion-layer" style={{ zIndex }} aria-hidden="true">
      <div
        className={`companion npc st-${catState} ${isMoving ? 'moving' : ''}`}
        style={{
          transform:  `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          transition: isMoving ? `transform ${moveDur}ms linear` : 'none',
        }}
        onTransitionEnd={onArrived}
      >
        <button className="companion-hit" onClick={handleClick} title={cfg.name}>
          <Sprite
            sheet={cfg.sheet}
            anim={def.anim}
            fallback={cfg.fallback}
            flip={face}
            size={cfg.size}
            reduceMotion={reduceMotion}
            className="companion-sprite"
          />
        </button>

        {catState === 'pet' && (
          <span key={hearts} className="companion-hearts">{cfg.heartEmoji || '💜'}</span>
        )}

        {bubble && (
          <span key={bubble.key} className="cat-bubble">
            {bubble.text}
          </span>
        )}
      </div>
    </div>
  );
}
