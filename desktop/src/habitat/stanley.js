/* ============================================================
   LAUNCHPAD -- Stanley Voice v0 (Gate 22)
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
