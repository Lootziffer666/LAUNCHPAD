/* ============================================================
   LAUNCHPAD — shared seed data (renderer-side for M1).
   Game "cover art" = stylized duotone key-art (gradient + emblem)
   unless a real cover image is imported via the Game manager.

   M2: GAMES move to electron/services/gameRegistry.js (main); the
   static hubs (LEARN/CREATE/BOOKMARKS) stay renderer-side as content.
   ============================================================ */

const cover = (a, b, ang = 145) => `linear-gradient(${ang}deg, ${a}, ${b})`;

// source badge meta
const SOURCES = {
  Steam: { label: 'Steam', c: '#1b2838' },
  Minecraft: { label: 'Minecraft', c: '#3b8526' },
  Scratch: { label: 'Scratch', c: '#e8920c' },
  LAUNCHPAD: { label: 'LAUNCHPAD', c: '#3b1d8a' },
  Xbox: { label: 'Xbox', c: '#107c10' },
  Epic: { label: 'Epic', c: '#2a2a2a' },
  GOG: { label: 'GOG', c: '#86328a' },
  Windows: { label: 'Programm', c: '#0067c0' },
  Web: { label: 'Web', c: '#2563eb' },
};

// Resolve a source badge safely — unknown sources fall back to a neutral chip
// instead of throwing (sources are user-editable now: Xbox/Epic/GOG/…).
const sourceBadge = (src) => SOURCES[src] || { label: src || 'Spiel', c: '#475569' };

const GAMES = [
  { id: 'minecraft', name: 'Minecraft', cat: 'Sandbox', source: 'Minecraft', installed: true, favorite: true,
    featured: true, progress: 0.0, playtime: '48 Std', stars: 5, c1: '#3b8526', c2: '#0f3d1a', emblem: 'grid',
    desc: 'Bau, erkunde und überlebe in einer Welt aus Blöcken. Allein oder im Kreativmodus.' },
  { id: 'galaxy-racer', name: 'Galaxy Racer', cat: 'Rennen', source: 'Steam', installed: true, favorite: true,
    progress: 0.3, playtime: '9 Std', stars: 4, c1: '#a855f7', c2: '#1e1b4b', emblem: 'rocket',
    desc: 'Heize durch Neon-Nebel und überhole alle auf der Sternenbahn.' },
  { id: 'pixel-pirates', name: 'Pixel Pirates', cat: 'Abenteuer', source: 'Steam', installed: true,
    progress: 0.62, playtime: '21 Std', stars: 5, c1: '#0ea5e9', c2: '#0c2f6b', emblem: 'compass',
    desc: 'Segle über die Pixel-Meere, finde Schätze und löse Inselrätsel.' },
  { id: 'robo-lab', name: 'Robo Lab', cat: 'Logik', source: 'Scratch', installed: true, favorite: true,
    progress: 0.18, playtime: '4 Std', stars: 5, c1: '#f43f5e', c2: '#5b1418', emblem: 'flask',
    desc: 'Programmiere kleine Roboter und löse knifflige Tüftel-Aufgaben.' },
  { id: 'tower-forge', name: 'Tower Forge', cat: 'Aufbau', source: 'Steam', installed: false,
    progress: 0, playtime: '—', stars: 4, c1: '#22c55e', c2: '#064e3b', emblem: 'grid',
    desc: 'Türme bauen, verteidigen, erweitern. Strategie mit Stil.' },
  { id: 'animal-island', name: 'Animal Island', cat: 'Simulation', source: 'Steam', installed: true,
    progress: 0.72, playtime: '33 Std', stars: 5, c1: '#34d399', c2: '#0c4a4a', emblem: 'leaf',
    desc: 'Kümmere dich um deine Insel voller Tiere und Freunde.' },
  { id: 'math-quest', name: 'Math Quest', cat: 'Lernspiel', source: 'LAUNCHPAD', installed: true,
    progress: 0.4, playtime: '6 Std', stars: 4, c1: '#f59e0b', c2: '#7c2d12', emblem: 'calc',
    desc: 'Rechen-Duelle gegen freundliche Monster — werde zum Zahlen-Helden.' },
  { id: 'puzzle-pop', name: 'Puzzle Pop', cat: 'Puzzle', source: 'LAUNCHPAD', installed: true,
    progress: 0.95, playtime: '14 Std', stars: 3, c1: '#fb923c', c2: '#7f1d4b', emblem: 'bolt',
    desc: 'Knall dich durch hunderte farbenfrohe Level.' },
  { id: 'word-wizards', name: 'Word Wizards', cat: 'Wort', source: 'LAUNCHPAD', installed: false,
    progress: 0, playtime: '—', stars: 4, c1: '#06b6d4', c2: '#0f5e5e', emblem: 'book',
    desc: 'Zaubere mit Buchstaben und werde zum Wort-Magier.' },
];

// direct-launch tiles on the desktop (platforms / favourite games)
const DIRECT = [
  { id: 'minecraft', name: 'Minecraft', source: 'Minecraft', c1: '#3b8526', c2: '#0f3d1a', emblem: 'grid' },
  { id: 'steam', name: 'Steam', source: 'Steam', c1: '#2a475e', c2: '#0e1a26', emblem: 'gamepad', platform: true },
  { id: 'robo-lab', name: 'Scratch', source: 'Scratch', c1: '#e8920c', c2: '#7c4a06', emblem: 'flask' },
];

// Lernen hub — each category carries an `apps` array of launchable learning
// tools. `kind` tells the launcher how to open them:
//   'winget'   → installable desktop app (wingetId used by auto-install)
//   'web'      → opens in the safe browser / webview
//   'internal' → handled inside LAUNCHPAD itself
const LEARN = [
  {
    title: 'Mathe', sub: 'Üben & Rätsel', c1: '#f59e0b', c2: '#b45309', ic: 'calc',
    apps: [
      { id: 'geogebra', name: 'GeoGebra', description: 'Geometrie, Algebra und mehr — visuell erkunden.', icon: 'compass', kind: 'winget', wingetId: 'GeoGebra.Classic' },
      { id: 'khan-math', name: 'Khan Academy Mathe', description: 'Übungen und Videos zu allen Mathe-Themen.', icon: 'globe', kind: 'web', url: 'https://de.khanacademy.org/math' },
      { id: 'math-quest', name: 'Math Quest', description: 'Rechen-Duelle gegen freundliche Monster.', icon: 'calc', kind: 'internal' },
      { id: 'tux-math', name: 'Tux Math', description: 'Arcade-Rechenspiel mit dem Linux-Pinguin.', icon: 'bolt', kind: 'winget', wingetId: 'TuxFamily.TuxMath' },
    ],
  },
  {
    title: 'Lesen', sub: 'Geschichten & Bücher', c1: '#7c3aed', c2: '#4c1d95', ic: 'book',
    apps: [
      { id: 'kindle', name: 'Kindle', description: 'E-Books lesen — riesige Kinderbibliothek.', icon: 'book', kind: 'winget', wingetId: 'Amazon.Kindle' },
      { id: 'antolin', name: 'Antolin', description: 'Lesequiz zu tausenden Buchtiteln.', icon: 'star', kind: 'web', url: 'https://antolin.westermann.de' },
      { id: 'story-lib', name: 'Geschichten-Bibliothek', description: 'Kurzgeschichten zum Vorlesen und Selberlesen.', icon: 'heart', kind: 'web', url: 'https://www.einfachvorlesen.de' },
    ],
  },
  {
    title: 'Forschen', sub: 'Experimente entdecken', c1: '#16a34a', c2: '#065f46', ic: 'flask',
    apps: [
      { id: 'scratch', name: 'Scratch', description: 'Programmieren lernen mit bunten Blöcken.', icon: 'bolt', kind: 'winget', wingetId: 'MIT.Scratch.4' },
      { id: 'stellarium', name: 'Stellarium', description: 'Den Sternenhimmel live erkunden.', icon: 'star', kind: 'winget', wingetId: 'Stellarium.Stellarium' },
      { id: 'science-zone', name: 'Science Zone', description: 'Experimente und Erklärvideos.', icon: 'flask', kind: 'web', url: 'https://www.planet-schule.de' },
    ],
  },
  {
    title: 'Weltkarte', sub: 'Länder & Kulturen', c1: '#0891b2', c2: '#0c4a6e', ic: 'map',
    apps: [
      { id: 'marble', name: 'KDE Marble', description: 'Interaktiver Weltatlas zum Entdecken.', icon: 'map', kind: 'winget', wingetId: 'KDE.Marble' },
      { id: 'seterra', name: 'Seterra', description: 'Geografie-Quiz: Länder, Hauptstädte, Flaggen.', icon: 'globe', kind: 'web', url: 'https://www.seterra.com/de' },
      { id: 'world-atlas', name: 'World Atlas', description: 'Karten, Fakten und Kulturen der Welt.', icon: 'compass', kind: 'web', url: 'https://www.worldatlas.com' },
    ],
  },
];

// Kreativ hub
const CREATE = [
  { title: 'Zeichnen', sub: 'Malen & Skizzieren', c1: '#db2777', c2: '#831843', ic: 'palette' },
  { title: 'Musik', sub: 'Beats bauen', c1: '#6d28d9', c2: '#2e1065', ic: 'music' },
  { title: 'Coden', sub: 'Blöcke & Spiele', c1: '#ea6418', c2: '#7c2d12', ic: 'bolt' },
  { title: 'Video', sub: 'Clips schneiden', c1: '#0d9488', c2: '#134e4a', ic: 'film' },
];

const BOOKMARKS = [
  { name: 'Wikipedia Kids', c1: '#0891b2', c2: '#155e75', ic: 'globe' },
  { name: 'Math Playground', c1: '#f59e0b', c2: '#b45309', ic: 'calc' },
  { name: 'Science Zone', c1: '#16a34a', c2: '#065f46', ic: 'flask' },
  { name: 'Story Library', c1: '#7c3aed', c2: '#4c1d95', ic: 'book' },
  { name: 'Code Club', c1: '#ea6418', c2: '#7c2d12', ic: 'bolt' },
  { name: 'World Atlas', c1: '#2563eb', c2: '#1e3a8a', ic: 'map' },
];

export const CometData = { cover, SOURCES, sourceBadge, GAMES, DIRECT, LEARN, CREATE, BOOKMARKS };
export default CometData;
