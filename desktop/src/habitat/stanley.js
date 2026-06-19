/* ============================================================
   LAUNCHPAD -- Stanley Voice (Gate 22 + Gate 23 Rituals)
   ============================================================
   Stanley ist der freundliche Hausgeist des Launchers.
   Er kommentiert, was passiert -- trocken, warm, nie aufdringlich.

   Kommentare sind keyed auf Zustaende:
   - roomEntered(roomId)     Begruessung beim Betreten eines Raums
   - idle(seconds)           Kommentar bei Stillstand (>30s nichts gedrueckt)
   - timeOfDay(hour)         Tageszeit-abhaengiger Kommentar
   - preLaunch(game)         Kurzer Kommentar bevor ein Spiel startet
   - returnedFromGame()      Kommentar nach Rueckkehr
   - emptyRoom()             Wenn ein Raum leer ist
   - lowTime(minutes)        Wenn wenig Zeit uebrig ist

   Jede Funktion gibt einen zufaelligen String aus einem Pool zurueck.
   Keine KI, keine Logik -- nur gewuerfelte Saetze.

   Stanleys Regeln:
   - NIE Druck erzeugen
   - NIE Regeln verhandeln
   - NIE unklar sein
   - NIE erschrecken
   - Darf witzig sein, muss aber immer verstaendlich bleiben
   - Kind zuerst. Atmosphaere danach.
   ============================================================ */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -- Room-specific greetings --
const ROOM_COMMENTS = {
  wohnzimmer: [
    'Das Sofa wartet schon.',
    'Zusammen ist es am schoensten.',
    'Platz fuer alle!',
    'Hier kann man es sich gemuetlich machen.',
    'Willkommen im Herzstueck.',
  ],
  kinderzimmer: [
    'Dein Reich, deine Regeln.',
    'Hier gehoert alles dir.',
    'Schoen, dass du da bist.',
    'Fuehle dich wie zu Hause.',
    'Alles fuer dich allein.',
  ],
  werkstatt: [
    'Hier darf getueftelt werden.',
    'Riecht nach frischen Ideen.',
    'Handschuhe optional.',
    'Was bauen wir heute?',
    'Kreativitaet braucht keinen Plan.',
  ],
  spielplatz: [
    'Hier geht es rund!',
    'Festhalten!',
    'Action wartet.',
    'Bereit fuer ein Abenteuer?',
    'Langweilig wird es hier nie.',
  ],
  schatzkiste: [
    'Ooh, was liegt hier verborgen?',
    'Nicht jeder kennt diesen Ort.',
    'Etwas Besonderes fuer dich.',
    'Hier funkelt es.',
    'Nur das Beste.',
  ],
};

const IDLE_COMMENTS = [
  '...',
  'Hallo? Bist du noch da?',
  'Ich warte geduldig.',
  'Schau dich ruhig um.',
  'Alles gut. Kein Stress.',
  'Ich bin noch hier.',
  'Nimm dir Zeit.',
];

const PRE_LAUNCH_COMMENTS = [
  'Viel Spass da drinnen!',
  'Bereit? Los gehts.',
  'Gute Reise.',
  'Bis gleich!',
  'Hab eine gute Zeit.',
];

const RETURNED_COMMENTS = [
  'Wieder da!',
  'Willkommen zurueck.',
  'Na, wie wars?',
  'Schoene Rueckkehr.',
  'Da bist du ja wieder.',
];

const EMPTY_ROOM_COMMENTS = [
  'Hier ist es still.',
  'Noch leer -- aber nicht fuer immer.',
  'Platz fuer Neues.',
  'Manchmal ist wenig genug.',
];

const LOW_TIME_COMMENTS = [
  'Die Zeit rinnt langsam.',
  'Bald ist Pause -- geniess den Moment.',
  'Noch ein bisschen.',
  'Nutze die letzten Minuten gut.',
  'Fast geschafft fuer heute.',
];

const TIME_OF_DAY_COMMENTS = {
  morning: [
    'Guten Morgen!',
    'Frueh wach? Respekt.',
    'Ein neuer Tag wartet.',
  ],
  afternoon: [
    'Nachmittag. Beste Zeit zum Spielen.',
    'Der Tag ist noch lang.',
    'Schoen, dass du da bist.',
  ],
  evening: [
    'Guten Abend.',
    'Wird langsam spaet.',
    'Ein Spiel noch?',
  ],
};

/**
 * Returns a greeting comment for the given room.
 * @param {string} roomId
 * @returns {string|null}
 */
export function roomEntered(roomId) {
  const pool = ROOM_COMMENTS[roomId];
  if (!pool || pool.length === 0) return null;
  return pick(pool);
}

/**
 * Returns a comment for idle moments.
 * @returns {string}
 */
export function idle() {
  return pick(IDLE_COMMENTS);
}

/**
 * Returns a comment for the given time of day.
 * @param {number} hour - 0-23
 * @returns {string}
 */
export function timeOfDay(hour) {
  if (hour >= 5 && hour < 12) return pick(TIME_OF_DAY_COMMENTS.morning);
  if (hour >= 12 && hour < 18) return pick(TIME_OF_DAY_COMMENTS.afternoon);
  return pick(TIME_OF_DAY_COMMENTS.evening);
}

/**
 * Returns a comment before launching a game.
 * @param {object} _game - the game object (unused in v0)
 * @returns {string}
 */
export function preLaunch(_game) {
  return pick(PRE_LAUNCH_COMMENTS);
}

/**
 * Returns a comment when returning from a game.
 * @returns {string}
 */
export function returnedFromGame() {
  return pick(RETURNED_COMMENTS);
}

/**
 * Returns a comment when the current room is empty.
 * @returns {string}
 */
export function emptyRoom() {
  return pick(EMPTY_ROOM_COMMENTS);
}

/**
 * Returns a comment when time is running low.
 * @param {number} _minutes - remaining minutes (unused in v0)
 * @returns {string}
 */
export function lowTime(_minutes) {
  return pick(LOW_TIME_COMMENTS);
}

// ── Gate 23: Ritual Comment Pools ──

const DAILY_GREETING_COMMENTS = {
  morning: [
    'Guten Morgen! Ein neuer Tag voller Moeglichkeiten.',
    'Willkommen zurueck! Was spielen wir heute?',
    'Schoen, dass du da bist. Los gehts!',
    'Ein frischer Tag wartet auf dich.',
    'Guten Morgen, Entdecker!',
  ],
  afternoon: [
    'Hallo! Schoen, dich heute zu sehen.',
    'Willkommen zurueck! Was spielen wir heute?',
    'Der Nachmittag gehoert dir.',
    'Schoen, dass du da bist. Los gehts!',
    'Na, bereit fuer heute?',
  ],
  evening: [
    'Guten Abend! Schoen, dass du noch vorbeischaust.',
    'Willkommen zurueck! Ein ruhiger Abend wartet.',
    'Schoen, dass du da bist. Los gehts!',
    'Ein Abendbesuch -- wie nett.',
    'Der Abend gehoert dir.',
  ],
};

const TREASURE_DAY_COMMENTS = [
  'Heute ist Schatzkistentag! Schau mal, was drin liegt.',
  'Die Schatzkiste hat etwas Neues fuer dich.',
  'Samstag = Entdeckertag. Schau in die Schatzkiste!',
  'Es funkelt in der Schatzkiste -- schau rein!',
  'Besonderer Tag, besondere Schaetze.',
];

const FORGOTTEN_GAME_COMMENTS = [
  '{title} wartet schon eine Weile auf dich.',
  'Weisst du noch? {title} liegt im Regal.',
  'Vielleicht hat {title} etwas Neues zu erzaehlen.',
  '{title} vermisst dich bestimmt.',
  'Hast du {title} schon lange nicht besucht?',
];

const WEEKEND_VIBE_COMMENTS = [
  'Wochenende! Mehr Zeit zum Spielen.',
  'Endlich frei.',
  'Das Wochenende gehoert dir.',
  'Keine Eile heute -- geniess es.',
  'Wochenende. Alles ist moeglich.',
];

/**
 * Returns a daily greeting based on the hour (first launch of the day).
 * @param {number} hour - 0-23
 * @returns {string}
 */
export function dailyGreeting(hour) {
  if (hour >= 5 && hour < 12) return pick(DAILY_GREETING_COMMENTS.morning);
  if (hour >= 12 && hour < 18) return pick(DAILY_GREETING_COMMENTS.afternoon);
  return pick(DAILY_GREETING_COMMENTS.evening);
}

/**
 * Returns a comment suggesting the Schatzkiste (treasure day).
 * @returns {string}
 */
export function treasureDay() {
  return pick(TREASURE_DAY_COMMENTS);
}

/**
 * Returns a comment about a forgotten game.
 * @param {string} gameTitle - the title of the forgotten game
 * @returns {string}
 */
export function forgottenGame(gameTitle) {
  const template = pick(FORGOTTEN_GAME_COMMENTS);
  return template.replace('{title}', gameTitle);
}

/**
 * Returns a weekend vibe comment.
 * @returns {string}
 */
export function weekendVibe() {
  return pick(WEEKEND_VIBE_COMMENTS);
}
