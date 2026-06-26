/* ============================================================
   LAUNCHPAD — HabitatWorld (3D Tile World)
   ============================================================
   A 3x2 grid of "habitat boxes" that open to reveal 3D model-viewer
   scenes. Each box has a door (tile image), a diorama background,
   and a GLB model inside rendered with <model-viewer>.

   Design reference: project/LAUNCHPAD Habitat.dc.html
   ============================================================ */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Side-effect import: registers <model-viewer> custom element.
import '@google/model-viewer';

import { SFX } from '../lib/sfx';

/* ---------- particle motes config ---------- */
const MOTE_COLORS = ['#5ef0f0', '#a67cff', '#ffd966', '#6ea8ff', '#c9a6ff', '#5fe6b0'];
const MOTE_COUNT = 35;

/* ---------- data: 6 boxes mapped to GLB models ---------- */
const MODELS = {
  play:    { src: '/models/kitchen.glb',        orbit: '180deg 74deg 68%' },
  apps:    { src: '/models/office.glb',         orbit: '190deg 72deg 65%' },
  library: { src: '/models/cabin.glb',          orbit: '180deg 68deg 70%' },
  create:  { src: '/models/stanley_office.glb', orbit: '190deg 72deg 60%' },
  watch:   { src: '/models/night_sky.glb',      orbit: '180deg 75deg 72%' },
  explore: { src: '/models/forest.glb',         orbit: '185deg 70deg 72%' },
};

const DATA = [
  { key: 'play',    label: 'Play',    tag: '8 Spiele bereit',        accent: '#6ea8ff', scene: '/dioramas/spielen.jpg',      tile: '/tiles/play.png' },
  { key: 'apps',    label: 'Apps',    tag: 'Alle Programme',         accent: '#57e0d8', scene: '/dioramas/musik.jpg',         tile: '/tiles/apps.png' },
  { key: 'library', label: 'Library', tag: 'Buecher & Hoerspiele',  accent: '#c9a6ff', scene: '/dioramas/geschichten.jpg',   tile: '/tiles/library.png' },
  { key: 'create',  label: 'Create',  tag: 'Malen, Musik & Code',   accent: '#5fe6b0', scene: '/dioramas/kreativ.jpg',       tile: '/tiles/create.png' },
  { key: 'watch',   label: 'Watch',   tag: 'Filme & Serien',        accent: '#7fb0ff', scene: '/dioramas/entdecken.jpg',     tile: '/tiles/watch.png' },
  { key: 'explore', label: 'Explore', tag: 'Entdecke neue Orte',    accent: '#b79cff', scene: '/dioramas/lernen.jpg',        tile: '/tiles/explore.png' },
];

/* ---------- icon helper (inline SVG like prototype) ---------- */
function BoxIcon({ name, size = 46 }) {
  const paths = {
    play:    <path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none" />,
    apps:    <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
    library: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H19" /></>,
    create:  <><path d="M5 19l-1 1 1-4L16 5a2.1 2.1 0 0 1 3 3L8 19z" /><path d="M14 7l3 3" /></>,
    watch:   <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
    explore: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', width: '100%', height: '100%' }}>
      {paths[name] || paths.play}
    </svg>
  );
}

/* ---------- main component ---------- */
export function HabitatWorld({ onBack }) {
  const [active, setActive] = useState(null); // index of open box or null
  const [view, setView] = useState('home'); // 'home' | 'opening' | 'in' | 'closing'
  const [hover, setHover] = useState(null);
  const [entered, setEntered] = useState(false);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Play arrival sound on mount and trigger enter animation
  useEffect(() => {
    SFX.launch();
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Grid layout constants (matching prototype)
  const W = 400, H = 248, COLW = 452, ROWH = 300;

  const pos = useCallback((i) => {
    const col = i % 3, row = Math.floor(i / 3);
    return {
      col, row,
      x: (col - 1) * COLW,
      y: row * ROWH - 150,
      z: col === 1 ? 0 : 30,
      ry: (1 - col) * 6,
    };
  }, [COLW, ROWH]);

  // Open a box
  const openBox = useCallback((i) => {
    if (view !== 'home') return;
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
    setActive(i);
    setView('opening');
    SFX.doorOpen();
    openTimerRef.current = setTimeout(() => setView('in'), 980);
  }, [view]);

  // Close the active box
  const closeBox = useCallback(() => {
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
    setView('closing');
    SFX.close();
    closeTimerRef.current = setTimeout(() => {
      setView('home');
      setActive(null);
    }, 1050);
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(openTimerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Escape to close, or go back
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (view === 'in' || view === 'opening') {
          closeBox();
        } else if (onBack) {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, closeBox, onBack]);

  // Compute world transform for camera fly-in
  const inside = view !== 'home';
  const worldTransform = useMemo(() => {
    if (view === 'in' && active != null) {
      const p = pos(active);
      return `translateZ(1380px) rotateX(0deg) rotateY(${-p.ry}deg) translateX(${-p.x}px) translateY(${-p.y}px) translateZ(${-p.z}px)`;
    }
    return 'translateZ(0px) rotateX(3deg)';
  }, [view, active, pos]);

  // 3D overlay data
  const show3d = active != null && (view === 'opening' || view === 'in');
  const d3Tile = active != null ? DATA[active] : DATA[0];
  const mconf = MODELS[d3Tile.key] || MODELS.play;

  // Atmospheric rays (static, generated once)
  const rays = useMemo(() => {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const left = 8 + i * 20;
      const w = 40 + Math.random() * 50;
      const rot = -5 + Math.random() * 10;
      out.push(
        <div key={i} style={{
          position: 'absolute', left: `${left}%`, top: '-30%',
          width: `${w}px`, height: '160%',
          transformOrigin: 'top center',
          transform: `rotate(${rot.toFixed(1)}deg)`,
          background: 'linear-gradient(180deg, rgba(180,210,255,.4), rgba(150,190,255,.07) 50%, transparent 75%)',
          filter: 'blur(10px)', mixBlendMode: 'screen',
        }} />
      );
    }
    return out;
  }, []);

  // Particle motes (floating ambient specks)
  const motes = useMemo(() => {
    const out = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
      const color = MOTE_COLORS[i % MOTE_COLORS.length];
      const size = 2 + Math.random() * 4;
      const left = Math.random() * 100;
      const top = 20 + Math.random() * 80;
      const dur = 6 + Math.random() * 10;
      const delay = Math.random() * dur;
      out.push(
        <div key={i} className="hw-mote" style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          boxShadow: `0 0 ${size * 2}px ${color}`,
          animationDuration: `${dur}s`,
          animationDelay: `-${delay}s`,
        }} />
      );
    }
    return out;
  }, []);

  // Debounce ref for magic SFX on hover
  const magicDebounceRef = useRef(0);
  const playMagic = useCallback(() => {
    const now = Date.now();
    if (now - magicDebounceRef.current > 300) {
      magicDebounceRef.current = now;
      SFX.magic();
    }
  }, []);

  return (
    <div className={`habitat-world${entered ? '' : ' entering'}`}>
      {/* Atmosphere layer */}
      <div className="hw-atmo">
        <div className="hw-atmo-glow" />
        <div className="hw-atmo-vignette" />
      </div>

      {/* Floating particle motes */}
      <div className="hw-motes">
        {motes}
      </div>

      {/* Cat mascots (model-viewer, small, floating) */}
      {!inside && (
        <>
          <div className="hw-cat-model hw-cat-model--left">
            <model-viewer
              src="/models/cat_a.glb"
              auto-rotate
              rotation-per-second="20deg"
              interaction-prompt="none"
              camera-controls="false"
              disable-zoom
              environment-image="neutral"
              exposure="1.2"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
          <div className="hw-cat-model hw-cat-model--right">
            <model-viewer
              src="/models/cat_b.glb"
              auto-rotate
              rotation-per-second="15deg"
              interaction-prompt="none"
              camera-controls="false"
              disable-zoom
              environment-image="neutral"
              exposure="1.2"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        </>
      )}

      {/* 3D world (boxes grid) */}
      <div className="hw-world" style={{ transform: worldTransform }}>
        {DATA.map((d, i) => {
          const p = pos(i);
          const isActive = active === i;
          const isHover = hover === i;
          const doorOpen = isActive && (view === 'opening' || view === 'in');
          const dim = inside && !isActive;

          // Door hinge position depends on column/row
          let dHinge, dOpen;
          if (p.col === 0) { dHinge = '0% 50%'; dOpen = 'rotateY(-118deg)'; }
          else if (p.col === 2) { dHinge = '100% 50%'; dOpen = 'rotateY(118deg)'; }
          else if (p.row === 0) { dHinge = '50% 0%'; dOpen = 'rotateX(118deg)'; }
          else { dHinge = '50% 100%'; dOpen = 'rotateX(-118deg)'; }

          return (
            <div key={d.key} className="hw-boxwrap" style={{
              transform: `translate3d(${p.x}px,${p.y}px,${p.z}px) rotateY(${p.ry}deg)`,
              opacity: dim ? 0 : 1,
              pointerEvents: inside ? 'none' : 'auto',
            }}>
              <div className="hw-box" style={{
                width: W, height: H,
                transform: isHover && !inside ? 'translateZ(26px)' : 'translateZ(0)',
              }}>
                {/* Interior (diorama background) */}
                <div className="hw-interior" style={{ transform: `translateZ(-70px)` }}>
                  <div className="hw-interior-bg" style={{ backgroundImage: `url('${d.scene}')` }} />
                  <div className="hw-interior-vignette" />
                  <div className="hw-interior-info">
                    <div className="hw-interior-icon" style={{ color: '#fff' }}>
                      <BoxIcon name={d.key} size={48} />
                    </div>
                    <div>
                      <div className="hw-interior-label">{d.label}</div>
                      <div className="hw-interior-tag">{d.tag}</div>
                    </div>
                  </div>
                </div>

                {/* Rim / border */}
                <div className="hw-rim" />

                {/* Door */}
                <button
                  className="hw-door"
                  onClick={() => openBox(i)}
                  onMouseEnter={() => { setHover(i); playMagic(); }}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    transformOrigin: dHinge,
                    transform: `translateZ(3px) ${doorOpen ? dOpen : 'rotateY(0deg)'}`,
                  }}
                >
                  <div className="hw-door-face" style={{
                    background: `linear-gradient(150deg, color-mix(in srgb, ${d.accent} 80%, #1b2746), color-mix(in srgb, ${d.accent} 44%, #0c1326))`,
                    boxShadow: isHover && !inside ? '0 30px 60px rgba(0,0,0,.5)' : '0 14px 36px rgba(0,0,0,.4)',
                  }}>
                    <div className="hw-door-tile" style={{ backgroundImage: `url('${d.tile}')` }} />
                    <div className="hw-door-inset" />
                    <div className="hw-door-glow" style={{
                      background: `radial-gradient(120% 80% at 50% 30%, ${d.accent}, transparent 60%)`,
                      opacity: isHover && !inside ? 0.5 : 0.16,
                    }} />
                  </div>
                  <div className="hw-door-inner">
                    <div className="hw-door-hinge" />
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Front FX layer (particles/rays) */}
      <div className="hw-fx" style={{ opacity: inside ? 0 : 1 }}>
        {rays}
      </div>

      {/* 3D Model overlay */}
      {show3d && (
        <div className="hw-3d" style={{ opacity: view === 'in' ? 1 : 0 }}>
          <model-viewer
            src={mconf.src}
            loading="eager"
            reveal="auto"
            camera-controls
            disable-zoom
            interaction-prompt="none"
            auto-rotate
            rotation-per-second="12deg"
            exposure="1.05"
            shadow-intensity="0.85"
            shadow-softness="1"
            environment-image="neutral"
            camera-orbit={view === 'in' ? mconf.orbit : mconf.orbit.replace(/\d+%$/, '95%')}
            min-camera-orbit="auto auto auto"
            max-camera-orbit="auto auto auto"
            field-of-view="auto"
            style={{
              width: '100%', height: '100%',
              backgroundColor: 'transparent',
              '--poster-color': 'transparent',
            }}
          />

          {/* Atmospheric overlays */}
          <div className="hw-3d-glow" />
          <div className="hw-3d-vignette" />
          <div className="hw-3d-rays">{rays}</div>

          {/* Exit orb */}
          <button className="hw-exit-orb" onClick={closeBox} title="Zurueck zur Welt">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#eaf3ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 7l-5 5 5 5" />
            </svg>
          </button>

          {/* Info panel */}
          <div className="hw-3d-panel" style={{ opacity: view === 'in' ? 1 : 0 }}>
            <div className="hw-3d-panel-halo" />
            <div className="hw-3d-panel-card">
              <div className="hw-3d-panel-header">
                <div className="hw-3d-panel-icon" style={{
                  background: `linear-gradient(150deg, ${d3Tile.accent} 0%, ${d3Tile.accent}44 100%)`,
                }}>
                  <BoxIcon name={d3Tile.key} size={26} />
                </div>
                <div>
                  <div className="hw-3d-panel-title">{d3Tile.label}</div>
                  <div className="hw-3d-panel-sub">{d3Tile.tag}</div>
                </div>
              </div>
              <button className="hw-3d-panel-btn" onClick={closeBox} style={{ background: d3Tile.accent }}>
                {d3Tile.label} oeffnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button (always visible in habitat) */}
      {onBack && !inside && (
        <button className="hw-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 7l-5 5 5 5" />
          </svg>
          Zurueck
        </button>
      )}
    </div>
  );
}

export default HabitatWorld;
