/* ============================================================
   LAUNCHPAD — Glyph Profiles (Gate 7)
   ============================================================
   Pure display module. Maps internal actions (confirm, back,
   info, trailer) to controller-specific button labels.
   The active profile is persisted in localStorage.
   This does NOT change any keyboard or input behaviour.
   ============================================================ */

const STORAGE_KEY = 'launchpad.glyphProfile';

/**
 * Glyph mapping: action -> profile -> display symbol
 */
const PROFILES = {
  xbox: {
    confirm: 'A',
    back: 'B',
    info: 'X',
    trailer: 'Y',
  },
  playstation: {
    confirm: '\u2715',   // ✕
    back: '\u25CB',      // ○
    info: '\u25A1',      // □
    trailer: '\u25B3',   // △
  },
  nintendo: {
    confirm: 'B',
    back: 'A',
    info: 'Y',
    trailer: 'X',
  },
};

const PROFILE_NAMES = {
  xbox: 'Xbox',
  playstation: 'PlayStation',
  nintendo: 'Nintendo',
};

/**
 * Returns the active glyph profile key.
 * Falls back to 'xbox' if nothing is stored or the value is invalid.
 */
export function getProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && PROFILES[stored]) return stored;
  } catch (_) {
    /* localStorage unavailable */
  }
  return 'xbox';
}

/**
 * Persists the given profile key to localStorage.
 * @param {string} name - One of 'xbox', 'playstation', 'nintendo'
 */
export function setProfile(name) {
  if (!PROFILES[name]) return;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch (_) {
    /* localStorage unavailable */
  }
}

/**
 * Returns the display glyph for a given internal action
 * based on the currently active profile.
 * @param {string} action - One of 'confirm', 'back', 'info', 'trailer'
 * @returns {string} The glyph string (e.g. 'A', '✕', '△')
 */
export function glyph(action) {
  const profile = PROFILES[getProfile()];
  return profile[action] || action;
}

/**
 * Returns the human-readable name of the active profile.
 * @returns {string} e.g. 'Xbox', 'PlayStation', 'Nintendo'
 */
export function profileName() {
  return PROFILE_NAMES[getProfile()] || 'Xbox';
}

/**
 * Returns all four action glyphs for the active profile.
 * Useful for rendering the full hint bar.
 * @returns {{ confirm: string, back: string, info: string, trailer: string }}
 */
export function allGlyphs() {
  return { ...PROFILES[getProfile()] };
}

export default { getProfile, setProfile, glyph, profileName, allGlyphs };
