/* ============================================================
   LAUNCHPAD — cat behavior engine (pure, no React).
   State machine for both cat NPCs.  Each state has an animation
   name, z-layer, duration range, movement type, and transition
   table.  Context (cursor, other cat, click count) can trigger
   interrupt transitions before the natural timer fires.
   ============================================================ */

// ── State IDs ─────────────────────────────────────────────────
export const S = {
  IDLE:         'idle',
  ALERT:        'alert',
  PROUD:        'proud',
  SIT:          'sit',
  IGNORE:       'ignore',
  WALK:         'walk',
  STALK:        'stalk',
  CHASE_CURSOR: 'chase_cursor',
  POUNCE:       'pounce',
  PLAY:         'play',
  DOZE:         'doze',
  SLEEP:        'sleep',
  STRETCH:      'stretch',
  BEG:          'beg',
  WAVE:         'wave',
  GROOM:        'groom',
  BELLY:        'belly',
  HISS:         'hiss',
  SCARED:       'scared',
  TILE_REST:    'tile_rest',
  CAT_MEET:     'cat_meet',
  FLEE:         'flee',
  AWAY:         'away',
  PET:          'pet',
};

// ── State definitions ──────────────────────────────────────────
// moves: null | 'wander' | 'stalk_toward' | 'cursor' | 'play_hop'
//        | 'tile' | 'other_cat' | 'offscreen'
// zLayer: 'above' (z-index 6) | 'below' (z-index 0, behind .desktop z-1)
// interruptible: cursor / cat-proximity can fire mid-state
export const STATE_DEF = {
  idle: {
    anim: 'idle_stand', zLayer: 'above',
    minMs: 900,  maxMs: 2800, moves: 'wander',        interruptible: true,
  },
  alert: {
    anim: 'idle_alert', zLayer: 'above',
    minMs: 700,  maxMs: 1800, moves: null,             interruptible: true,
  },
  proud: {
    anim: 'idle_proud', zLayer: 'above',
    minMs: 900,  maxMs: 2200, moves: null,             interruptible: true,
  },
  sit: {
    anim: 'sit_calm',   zLayer: 'above',
    minMs: 5000, maxMs: 15000, moves: null,            interruptible: true,
  },
  ignore: {
    anim: 'sit_back',   zLayer: 'above',
    minMs: 4000, maxMs: 12000, moves: null,            interruptible: false,
  },
  walk: {
    anim: 'walk_normal', zLayer: 'above',
    minMs: 1200, maxMs: 3200, moves: 'wander',         interruptible: true,
  },
  stalk: {
    anim: 'stalk_low',  zLayer: 'below', // sneaks behind tiles
    minMs: 1000, maxMs: 2200, moves: 'stalk_toward',   interruptible: false,
  },
  chase_cursor: {
    anim: 'run_fast',   zLayer: 'above',
    minMs: 600,  maxMs: 1600, moves: 'cursor',         interruptible: false,
  },
  pounce: {
    anim: 'pounce_attack', zLayer: 'above',
    minMs: 700,  maxMs: 1200, moves: null,             interruptible: false,
  },
  play: {
    anim: 'play_active', zLayer: 'above',
    minMs: 1200, maxMs: 2800, moves: 'play_hop',       interruptible: false,
  },
  doze: {
    anim: 'rest_idle',  zLayer: 'above',
    minMs: 8000, maxMs: 20000, moves: null,            interruptible: true,
  },
  sleep: {
    anim: 'sleep_curl', zLayer: 'above',
    minMs: 15000, maxMs: 45000, moves: null,           interruptible: false,
  },
  stretch: {
    anim: 'stretch',    zLayer: 'above',
    minMs: 1100, maxMs: 1900, moves: null,             interruptible: false,
  },
  beg: {
    anim: 'beg_upright', zLayer: 'above',
    minMs: 1200, maxMs: 2800, moves: null,             interruptible: true,
  },
  wave: {
    anim: 'wave_dance', zLayer: 'above',
    minMs: 1200, maxMs: 2500, moves: null,             interruptible: true,
  },
  groom: {
    anim: 'groom',      zLayer: 'above',
    minMs: 4000, maxMs: 12000, moves: null,            interruptible: true,
  },
  belly: {
    anim: 'belly_up',   zLayer: 'above',
    minMs: 5000, maxMs: 14000, moves: null,            interruptible: true,
  },
  hiss: {
    anim: 'hiss_warn',  zLayer: 'above',
    minMs: 550,  maxMs: 1000, moves: null,             interruptible: false,
  },
  scared: {
    anim: 'scared_arch', zLayer: 'above',
    minMs: 700,  maxMs: 1400, moves: null,             interruptible: false,
  },
  tile_rest: {
    anim: 'rest_idle',  zLayer: 'above', // ON TOP of a tile
    minMs: 6000, maxMs: 18000, moves: 'tile',          interruptible: false,
  },
  cat_meet: {
    anim: 'idle_alert', zLayer: 'above',
    minMs: 1200, maxMs: 3000, moves: 'other_cat',      interruptible: false,
  },
  flee: {
    anim: 'run_fast',   zLayer: 'above',
    minMs: 800,  maxMs: 1600, moves: 'offscreen',      interruptible: false,
  },
  away: {
    anim: 'sleep_curl', zLayer: 'above',
    minMs: 20000, maxMs: 28000, moves: null,           interruptible: false,
  },
  pet: {
    anim: 'belly_up',   zLayer: 'above',
    minMs: 2800, maxMs: 4800, moves: null,             interruptible: false,
  },
};

// ── Weighted random helper ─────────────────────────────────────
export function pickWeighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [st, w] of pairs) {
    r -= w;
    if (r <= 0) return st;
  }
  return pairs[pairs.length - 1][0];
}

// ── Transition tables ──────────────────────────────────────────
// prettier-ignore
export const TRANSITIONS = {
  idle:         [['sit',28],['groom',22],['doze',14],['walk',8],['alert',6],['belly',8],['tile_rest',7],['stalk',3],['idle',4]],
  alert:        [['sit',28],['groom',22],['idle',20],['walk',10],['stalk',8],['doze',12]],
  proud:        [['sit',30],['groom',24],['idle',20],['wave',8],['doze',10],['walk',8]],
  sit:          [['doze',28],['groom',26],['ignore',10],['belly',12],['idle',8],['walk',6],['beg',5],['wave',5]],
  ignore:       [['sit',30],['groom',28],['doze',22],['idle',20]],
  walk:         [['sit',30],['groom',20],['idle',18],['doze',12],['belly',8],['tile_rest',7],['walk',5]],
  stalk:        [['pounce',30],['sit',25],['idle',20],['groom',15],['alert',10]],
  chase_cursor: [['pounce',24],['sit',28],['idle',28],['groom',20]],
  pounce:       [['sit',30],['belly',24],['groom',22],['idle',24]],
  play:         [['sit',28],['groom',24],['belly',20],['idle',18],['doze',10]],
  doze:         [['sleep',40],['doze',20],['groom',16],['sit',14],['stretch',10]],
  sleep:        [['sleep',36],['doze',28],['stretch',20],['sit',16]],
  stretch:      [['sit',32],['groom',26],['idle',22],['walk',10],['doze',10]],
  beg:          [['sit',30],['groom',26],['idle',22],['wave',22]],
  wave:         [['sit',30],['groom',26],['idle',24],['beg',10],['doze',10]],
  groom:        [['sit',26],['doze',24],['belly',18],['idle',16],['groom',10],['walk',6]],
  belly:        [['groom',28],['doze',22],['sit',20],['idle',16],['stretch',14]],
  hiss:         [['ignore',30],['sit',26],['scared',22],['idle',22]],
  scared:       [['sit',30],['idle',26],['ignore',22],['walk',12],['hiss',10]],
  tile_rest:    [['doze',28],['groom',24],['sit',24],['idle',14],['walk',10]],
  cat_meet:     [['ignore',26],['sit',24],['groom',20],['hiss',16],['idle',14]],
  flee:         [['away',100]],
  away:         [['idle',100]], // return handled by timer
  pet:          [['belly',30],['groom',28],['sit',24],['idle',18]],
};

// ── States that trigger meow sounds ───────────────────────────
export const MEOW_STATES = new Set(['wave', 'beg', 'alert', 'cat_meet', 'chase_cursor', 'pounce']);

// ── Speech bubble text by state ───────────────────────────────
export const BUBBLE_TEXT = {
  wave: '~nyaa~', beg: '...?', cat_meet: '!', pounce: '!!',
  alert: '?', hiss: '>:3', scared: 'x_x',
};

// ── Compute next state given current state and context ─────────
export function nextState(current, { cursorFast, cursorDist, otherCatDist, interruptible, canFlee }) {
  // Context-driven interrupts (only if state is interruptible)
  if (interruptible) {
    if (cursorFast && cursorDist < 100) return S.CHASE_CURSOR;
    if (otherCatDist < 115)            return S.CAT_MEET;
  }
  // 3-click flee interrupt is handled in the component directly.
  return pickWeighted(TRANSITIONS[current] || TRANSITIONS.idle);
}
