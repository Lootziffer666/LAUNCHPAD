/* ============================================================
   LAUNCHPAD — cat residents config.
   Shared frame rects + animation set for both cat skins.
   Exports CAT_BROWN_CONFIG (interactive companion) and
   CAT_BLUE_CONFIG (ambient resident).
   ============================================================ */

// Pixel-exact frame rects from the 1536×523 spritesheet.
// Rows separated by 32 px gaps; columns by 6 px gaps.
export const FRAME_RECTS = {
  F01:  { x: 0,    y: 0,   w: 149, h: 153 }, // idle_stand
  F02:  { x: 155,  y: 0,   w: 148, h: 153 }, // walk_step_1
  F03:  { x: 308,  y: 0,   w: 149, h: 153 }, // walk_step_2
  F04:  { x: 462,  y: 0,   w: 149, h: 153 }, // pounce_prep / stretch
  F05:  { x: 616,  y: 0,   w: 149, h: 153 }, // scared / arched back
  F06:  { x: 771,  y: 0,   w: 148, h: 153 }, // hop_air
  F07:  { x: 925,  y: 0,   w: 149, h: 153 }, // walk_step_4
  F08:  { x: 1079, y: 0,   w: 149, h: 153 }, // sit_front
  F09:  { x: 1233, y: 0,   w: 148, h: 153 }, // sit_side
  F10:  { x: 1387, y: 0,   w: 149, h: 153 }, // stand_upright / dance

  F11:  { x: 0,    y: 185, w: 149, h: 153 }, // roll_back (on back)
  F12:  { x: 155,  y: 185, w: 148, h: 153 }, // lie_side (awake)
  F13:  { x: 308,  y: 185, w: 149, h: 153 }, // sleep_curl
  F14:  { x: 462,  y: 185, w: 149, h: 153 }, // run_with_item / pounce grab
  F15:  { x: 616,  y: 185, w: 149, h: 153 }, // idle_front_3q / cautious step
  F16:  { x: 771,  y: 185, w: 148, h: 153 }, // sit_front_alt
  F17:  { x: 925,  y: 185, w: 149, h: 153 }, // stand_upright_beg
  F18:  { x: 1079, y: 185, w: 149, h: 153 }, // pounce land / play
  F19:  { x: 1233, y: 185, w: 148, h: 153 }, // sit_groom / hold object
  F20:  { x: 1387, y: 185, w: 149, h: 153 }, // sit_back (turned away)

  F21:  { x: 0,    y: 370, w: 149, h: 153 }, // crouch_stalk
  F22:  { x: 155,  y: 370, w: 148, h: 153 }, // play_bow / stretch_down
  F23:  { x: 308,  y: 370, w: 149, h: 153 }, // stalk_low / creep
  F24:  { x: 462,  y: 370, w: 149, h: 153 }, // hiss_attack
  F25:  { x: 616,  y: 370, w: 149, h: 153 }, // groom_sit / roll_paw
};

export const ANIMATIONS = {
  // ── Standing / Idle ──────────────────────────────
  idle_stand:    { frames: ['F01', 'F02', 'F03'],             fps: 0.35, loop: true },
  idle_alert:    { frames: ['F01', 'F03', 'F08', 'F03'],     fps: 0.6,  loop: true },
  idle_proud:    { frames: ['F01', 'F10', 'F03', 'F01'],     fps: 0.5,  loop: true },
  idle_curious:  { frames: ['F02', 'F15', 'F04', 'F15'],     fps: 0.8,  loop: true },

  // ── Walking ──────────────────────────────────────
  walk_normal:   { frames: ['F01', 'F02', 'F03', 'F05', 'F07'], fps: 8,  loop: true },
  walk_sneaky:   { frames: ['F04', 'F07', 'F15', 'F23'],        fps: 6,  loop: true },

  // ── Running ──────────────────────────────────────
  run_fast:      { frames: ['F02', 'F03', 'F05', 'F07'],     fps: 14, loop: true },

  // ── Sitting ──────────────────────────────────────
  sit_calm:      { frames: ['F08', 'F09', 'F16'],             fps: 0.3,  loop: true },
  sit_back:      { frames: ['F20'],                           fps: 1,    loop: true },

  // ── Doze / Sleep ─────────────────────────────────
  sleep_curl:    { frames: ['F13'],                           fps: 1,    loop: true },
  rest_idle:     { frames: ['F12', 'F13'],                   fps: 0.7,  loop: true },

  // ── Stretch (one-shot) ───────────────────────────
  stretch:       { frames: ['F22', 'F04', 'F01'],            fps: 2,    loop: false },

  // ── Stalk / Hunt ─────────────────────────────────
  stalk_low:     { frames: ['F21', 'F23'],                   fps: 5,    loop: true },

  // ── Pounce (one-shot) ────────────────────────────
  pounce_attack: { frames: ['F21', 'F06', 'F14', 'F18', 'F22'], fps: 10, loop: false },

  // ── Play ─────────────────────────────────────────
  play_active:   { frames: ['F14', 'F18', 'F21'],            fps: 8,    loop: true },

  // ── Social ───────────────────────────────────────
  beg_upright:   { frames: ['F17'],                          fps: 1,    loop: true },
  wave_dance:    { frames: ['F10', 'F17', 'F25'],            fps: 3,    loop: true },

  // ── Grooming ─────────────────────────────────────
  groom:         { frames: ['F19', 'F25'],                   fps: 2,    loop: true },

  // ── Belly / Roll ─────────────────────────────────
  belly_up:      { frames: ['F11', 'F25'],                   fps: 1.5,  loop: true },

  // ── Defensive ────────────────────────────────────
  hiss_warn:     { frames: ['F05', 'F24', 'F05'],            fps: 4,    loop: true },
  scared_arch:   { frames: ['F05'],                          fps: 1,    loop: true },

  // ── Legacy aliases (Companion.jsx / Resident.jsx compat) ──────────────
  idle:          { frames: ['F01', 'F08', 'F09', 'F15', 'F16', 'F20'], fps: 0.8, loop: true },
  walk:          { frames: ['F01', 'F02', 'F03', 'F05', 'F07'],        fps: 8,   loop: true },
  lie:           { frames: ['F12', 'F13'],                              fps: 2,   loop: true },
  scratch:       { frames: ['F23', 'F24'],                              fps: 4,   loop: true },
  run:           { frames: ['F02', 'F03', 'F05', 'F07'],                fps: 14,  loop: true },
  idle_variants: { frames: ['F01', 'F08', 'F09', 'F10', 'F15', 'F16', 'F20'], fps: 0.8, loop: true },
  rest_idle_v2:  { frames: ['F12', 'F13'],                              fps: 2,   loop: true },
  pounce:        { frames: ['F04', 'F21', 'F22', 'F01'],               fps: 10,  loop: false },
  small_hop:     { frames: ['F05', 'F06', 'F22', 'F01'],               fps: 10,  loop: false },
  groom_sit:     { frames: ['F25', 'F19'],                              fps: 2,   loop: true },
};

function makeSheet(url) {
  return { url, sheetW: 1536, sheetH: 523, frameRects: FRAME_RECTS, animations: ANIMATIONS };
}

// Brown cat — the main interactive companion (roams the left half).
export const CAT_BROWN_SHEET = makeSheet('/sprites/cat_brown.png');

export const CAT_BROWN_CONFIG = {
  id: 'cat_brown',
  name: 'Zimtchen',
  fallback: '🐈',
  heartEmoji: '💜',
  size: 92,
  startX: 260,
  startY: 790,
  startDelay: 400,
  ground: { xMin: 80,  xMax: 700,  yMin: 590, yMax: 830 },
  tileY:  { min: 630,  max: 710 }, // y range for tile_rest state
  walkSpeed:  0.16,
  runSpeed:   0.70,
  fleeSpeed:  0.70,
  canFlee:    true,
  awayMs:     22000,
  sheet: makeSheet('/sprites/cat_brown.png'),
};

// Blue cat — ambient resident (roams the right half).
export const CAT_BLUE_CONFIG = {
  id: 'cat_blue',
  name: 'Schneeflocke',
  fallback: '🐈',
  heartEmoji: '💙',
  size: 92,
  startX: 1080,
  startY: 790,
  startDelay: 1400,
  ground: { xMin: 740, xMax: 1360, yMin: 590, yMax: 830 },
  tileY:  { min: 630,  max: 710 },
  walkSpeed:  0.10,
  runSpeed:   0.55,
  fleeSpeed:  0.55,
  canFlee:    false,
  awayMs:     0,
  sheet: makeSheet('/sprites/cat_blue.png'),
};

// Backward-compat export used by the old companionConfig.js import
export const RESIDENT_CATS = [CAT_BLUE_CONFIG];
