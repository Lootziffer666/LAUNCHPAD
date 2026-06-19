/* ============================================================
   LAUNCHPAD -- Habitat Rooms (Gate 21)
   ============================================================
   Each room defines a spatial zone in the Habitat navigation.
   Games are assigned to rooms via filter functions. A game can
   appear in multiple rooms. Filters handle missing `players`
   data gracefully (fallback: kinderzimmer).
   ============================================================ */

export const ROOMS = [
  {
    id: 'wohnzimmer',
    name: 'Wohnzimmer',
    emoji: '\u{1F6CB}\uFE0F',
    description: 'Zusammen spielen',
    filter: (game) => {
      const p = game.players;
      if (!p) return false;
      return !!(p.localCoop || (p.max && p.max > 1));
    },
  },
  {
    id: 'kinderzimmer',
    name: 'Kinderzimmer',
    emoji: '\u{1F9F8}',
    description: 'Für dich allein',
    filter: (game) => {
      const p = game.players;
      // If no players data, default to kinderzimmer
      if (!p) return true;
      return p.max === 1;
    },
  },
  {
    id: 'werkstatt',
    name: 'Werkstatt',
    emoji: '\u{1F527}',
    description: 'Bauen und Tüfteln',
    filter: (game) => {
      const cats = ['Logik', 'Lernspiel', 'Puzzle', 'Aufbau'];
      if (cats.includes(game.cat)) return true;
      if (game.source === 'LAUNCHPAD') return true;
      return false;
    },
  },
  {
    id: 'spielplatz',
    name: 'Spielplatz',
    emoji: '\u{1F3A2}',
    description: 'Action und Abenteuer',
    filter: (game) => {
      const cats = ['Rennen', 'Abenteuer'];
      if (cats.includes(game.cat)) return true;
      const p = game.players;
      if (p && p.competitive) return true;
      return false;
    },
  },
  {
    id: 'schatzkiste',
    name: 'Schatzkiste',
    emoji: '\u{1F381}',
    description: 'Besondere Empfehlungen',
    filter: (game) => game.surfacing === 'featured',
  },
];

/**
 * Get all games that belong to a given room.
 * @param {object} room - A room from ROOMS
 * @param {Array} games - Full list of available games
 * @returns {Array} filtered games for this room
 */
export function gamesForRoom(room, games) {
  return games.filter(room.filter);
}

export default ROOMS;
