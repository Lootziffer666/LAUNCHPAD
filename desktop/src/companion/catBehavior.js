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
    minMs: 1800, maxMs: 5500, moves: null,             interruptible: true,
  },
  ignore: {
    anim: 'sit_back',   zLayer: 'above',
    minMs: 1800, maxMs: 4500, moves: null,             interruptible: false,
  },
  walk: {
    anim: 'walk_normal', zLayer: 'above',
    minMs: 1200, maxMs: 3800, moves: 'wander',         interruptible: true,
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
    minMs: 2800, maxMs: 7500, moves: null,             interruptible: true,
  },
  sleep: {
    anim: 'sleep_curl', zLayer: 'above',
    minMs: 5000, maxMs: 14000, moves: null,            interruptible: false,
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
    minMs: 2000, maxMs: 4800, moves: null,             interruptible: true,
  },
  belly: {
    anim: 'belly_up',   zLayer: 'above',
    minMs: 1800, maxMs: 4500, moves: null,             interruptible: true,
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
    minMs: 3500, maxMs: 9000, moves: 'tile',           interruptible: false,
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
  idle:         [['walk',18],['sit',16],['alert',11],['stalk',7],['groom',10],['beg',4],['wave',3],['proud',5],['tile_rest',5],['idle',21]],
  alert:        [['idle',17],['walk',19],['stalk',14],['sit',17],['proud',8],['groom',9],['idle',16]],
  proud:        [['idle',28],['wave',13],['beg',9],['walk',21],['sit',15],['groom',14]],
  sit:          [['idle',13],['walk',11],['doze',20],['groom',24],['beg',8],['ignore',7],['alert',10],['wave',7]],
  ignore:       [['idle',30],['walk',28],['sit',22],['groom',20]],
  walk:         [['idle',22],['sit',17],['alert',10],['groom',10],['stalk',8],['belly',5],['tile_rest',7],['walk',21]],
  stalk:        [['pounce',36],['idle',22],['walk',20],['groom',12],['alert',10]],
  chase_cursor: [['pounce',28],['play',24],['idle',28],['stalk',20]],
  pounce:       [['play',40],['belly',22],['idle',26],['groom',12]],
  play:         [['idle',26],['groom',21],['belly',16],['pounce',14],['stalk',11],['sit',12]],
  doze:         [['sleep',34],['groom',20],['idle',17],['stretch',16],['sit',13]],
  sleep:        [['sleep',24],['stretch',40],['doze',22],['sit',14]],
  stretch:      [['idle',40],['walk',28],['groom',20],['sit',12]],
  beg:          [['wave',28],['idle',24],['walk',24],['sit',24]],
  wave:         [['idle',34],['walk',24],['beg',18],['groom',24]],
  groom:        [['idle',27],['sit',23],['doze',20],['walk',16],['belly',14]],
  belly:        [['groom',26],['play',19],['idle',30],['stretch',14],['sit',11]],
  hiss:         [['ignore',28],['scared',22],['idle',28],['walk',22]],
  scared:       [['idle',28],['walk',28],['hiss',12],['ignore',22],['sit',10]],
  tile_rest:    [['idle',28],['walk',28],['groom',24],['doze',20]],
  cat_meet:     [['hiss',18],['play',20],['ignore',22],['groom',18],['idle',22]],
  flee:         [['away',100]],
  away:         [['idle',100]], // return handled by timer
  pet:          [['belly',28],['groom',28],['idle',22],['sit',22]],
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
    if (cursorFast && cursorDist < 170) return S.CHASE_CURSOR;
    if (otherCatDist < 115)            return S.CAT_MEET;
  }
  // 3-click flee interrupt is handled in the component directly.
  return pickWeighted(TRANSITIONS[current] || TRANSITIONS.idle);
}
