/* ============================================================
   LAUNCHPAD -- Rituals (Gate 23)
   ============================================================
   Kleine wiederkehrende Momente, die Bindung schaffen, ohne
   auf toxische Gamification zurueckzugreifen.

   Rituale sind:
   - Tagesstart: Erster Start des Tages -> besondere Begruessung
   - Schatzkistentag: Samstags -> Hinweis auf die Schatzkiste
   - Wochenende: Freitag/Samstag/Sonntag -> Vibe-Kommentar (30%)
   - Vergessene Spiele: Spiele die lange nicht gespielt wurden

   Prioritaet: dailyGreeting > treasureDay > weekendVibe > forgottenGame
   Nur EIN Ritual pro Session-Start.

   Keine Streaks, kein Druck, keine FOMO.
   Wie ein Kalenderblatt, nicht wie ein Fortschrittsbalken.
   ============================================================ */

import * as stanley from './stanley.js';

const LAUNCH_DAY_KEY = 'launchpad.lastLaunchDay';

/**
 * Returns today's date string (YYYY-MM-DD) for localStorage comparison.
 * @param {Date} [now]
 * @returns {string}
 */
export function todayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if this is the first launch today by comparing localStorage.
 * Updates localStorage to mark today as launched.
 * @param {object} [storage] - localStorage-like object (for testability)
 * @param {Date} [now]
 * @returns {boolean}
 */
export function checkFirstLaunchToday(storage = globalThis.localStorage, now = new Date()) {
  if (!storage) return true; // no storage available = treat as first launch
  const today = todayString(now);
  const last = storage.getItem(LAUNCH_DAY_KEY);
  storage.setItem(LAUNCH_DAY_KEY, today);
  return last !== today;
}

/**
 * Finds a "forgotten" game -- one with low playtime or low surfacing.
 * @param {Array} games - game objects with playtime/surfacing fields
 * @returns {object|null} a game or null
 */
export function findForgottenGame(games) {
  if (!games || games.length === 0) return null;

  const candidates = games.filter((g) => {
    // Games with dash playtime are unplayed/not installed
    if (g.playtime === '\u2014' || g.playtime === '—') return false;
    // Low playtime (under 5 hours) or explicitly low surfacing
    if (g.surfacing === 'low') return true;
    const match = g.playtime && g.playtime.match(/^(\d+)\s/);
    if (match && parseInt(match[1], 10) <= 5) return true;
    return false;
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Detects which ritual (if any) is active for this session.
 *
 * @param {object} context
 * @param {number} context.hour - current hour (0-23)
 * @param {number} context.dayOfWeek - 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param {boolean} context.isFirstLaunchToday - whether this is the first launch today
 * @param {Array} context.games - available game objects
 * @param {function} [context.random] - random function (for testability), defaults to Math.random
 * @returns {{type: string, comment: string}|null}
 */
export function detectRitual(context) {
  const { hour, dayOfWeek, isFirstLaunchToday, games, random = Math.random } = context;

  // Priority 1: Daily greeting (first launch of the day)
  if (isFirstLaunchToday) {
    return { type: 'dailyGreeting', comment: stanley.dailyGreeting(hour) };
  }

  // Priority 2: Treasure day (Saturday = dayOfWeek 6)
  if (dayOfWeek === 6) {
    return { type: 'treasureDay', comment: stanley.treasureDay() };
  }

  // Priority 3: Weekend vibe (Friday=5, Saturday=6, Sunday=0) with 30% chance
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
    if (random() < 0.3) {
      return { type: 'weekendVibe', comment: stanley.weekendVibe() };
    }
  }

  // Priority 4: Forgotten game
  const forgotten = findForgottenGame(games);
  if (forgotten) {
    const title = forgotten.title || forgotten.name;
    return { type: 'forgottenGame', comment: stanley.forgottenGame(title) };
  }

  return null;
}
