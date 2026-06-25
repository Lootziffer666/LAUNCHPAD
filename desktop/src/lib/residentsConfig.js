/* ============================================================
   LAUNCHPAD — resident cats config.
   Frame rects and animations shared by both cat skins.
   The companion (Companion.jsx) uses cat_brown with full interactive
   behaviour. Resident.jsx renders the ambient cat_blue alongside.
   ============================================================ */

// Pixel-exact frame rects from the spritesheet mapping (1536×523 px).
// Rows are separated by 32 px gaps; columns by 6 px gaps.
const FRAME_RECTS = {
  F01:  { x: 0,    y: 0,   w: 149, h: 153 },
  F02:  { x: 155,  y: 0,   w: 148, h: 153 },
  F03:  { x: 308,  y: 0,   w: 149, h: 153 },
  F04:  { x: 462,  y: 0,   w: 149, h: 153 },
  F05:  { x: 616,  y: 0,   w: 149, h: 153 },
  F06:  { x: 771,  y: 0,   w: 148, h: 153 },
  F07:  { x: 925,  y: 0,   w: 149, h: 153 },
  F08:  { x: 1079, y: 0,   w: 149, h: 153 },
  F09:  { x: 1233, y: 0,   w: 148, h: 153 },
  F10:  { x: 1387, y: 0,   w: 149, h: 153 },

  F11:  { x: 0,    y: 185, w: 149, h: 153 },
  F12:  { x: 155,  y: 185, w: 148, h: 153 },
  F13:  { x: 308,  y: 185, w: 149, h: 153 },
  F14:  { x: 462,  y: 185, w: 149, h: 153 },
  F15:  { x: 616,  y: 185, w: 149, h: 153 },
  F16:  { x: 771,  y: 185, w: 148, h: 153 },
  F17:  { x: 925,  y: 185, w: 149, h: 153 },
  F18:  { x: 1079, y: 185, w: 149, h: 153 },
  F19:  { x: 1233, y: 185, w: 148, h: 153 },
  F20:  { x: 1387, y: 185, w: 149, h: 153 },

  F21:  { x: 0,    y: 370, w: 149, h: 153 },
  F22:  { x: 155,  y: 370, w: 148, h: 153 },
  F23:  { x: 308,  y: 370, w: 149, h: 153 },
  F24:  { x: 462,  y: 370, w: 149, h: 153 },
  F25:  { x: 616,  y: 370, w: 149, h: 153 },
};

// Named animations consumed by both Companion.jsx (idle/walk/lie/scratch/run)
// and Resident.jsx (idle_variants/walk/rest_idle).
const ANIMATIONS = {
  // Core keys expected by Companion.jsx state machine
  idle:    { frames: ['F01', 'F08', 'F09', 'F15', 'F16', 'F20'], fps: 0.8, loop: true },
  walk:    { frames: ['F01', 'F02', 'F03', 'F05', 'F07'],         fps: 8,   loop: true },
  lie:     { frames: ['F12', 'F13'],                               fps: 2,   loop: true },
  scratch: { frames: ['F23', 'F24'],                               fps: 4,   loop: true },
  run:     { frames: ['F02', 'F03', 'F05', 'F07'],                 fps: 14,  loop: true },

  // Extra animations for Resident.jsx / future use
  idle_variants:     { frames: ['F01', 'F08', 'F09', 'F10', 'F15', 'F16', 'F20'], fps: 0.8, loop: true },
  rest_idle:         { frames: ['F12', 'F13'],                                      fps: 2,   loop: true },
  rest_roll_to_sleep:{ frames: ['F11', 'F12', 'F13'],                              fps: 5,   loop: false },
  eat_cycle:         { frames: ['F17', 'F18', 'F19'],                              fps: 6,   loop: true },
  pounce:            { frames: ['F04', 'F21', 'F22', 'F01'],                       fps: 10,  loop: false },
  small_hop:         { frames: ['F05', 'F06', 'F22', 'F01'],                       fps: 10,  loop: false },
  groom:             { frames: ['F25'],                                             fps: 1,   loop: true },
};

function makeSheet(url) {
  return { url, sheetW: 1536, sheetH: 523, frameRects: FRAME_RECTS, animations: ANIMATIONS };
}

// Brown cat — used as the main interactive companion (companionConfig.js).
export const CAT_BROWN_SHEET = makeSheet('/sprites/cat_brown.png');

// Blue cat — ambient resident that wanders alongside.
export const RESIDENT_CATS = [
  {
    id: 'cat_blue',
    name: 'Schneeflocke',
    fallback: '🐈',
    size: 92,
    startX: 1050,
    startY: 780,
    ground: { xMin: 80, xMax: 1360, yMin: 560, yMax: 820 },
    wanderMinMs: 3500,
    wanderMaxMs: 9000,
    walkSpeed: 0.10,
    petMs: 5200,
    sheet: makeSheet('/sprites/cat_blue.png'),
  },
];
