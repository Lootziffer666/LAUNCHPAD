// electron/services/steamImport.js -- Steam library scanner (Gate 14).
//
// Reads Valve's libraryfolders.vdf to discover Steam library paths, then
// scans each path for appmanifest_*.acf files to enumerate installed games.
// Both VDF and ACF are in Valve Data Format (nested key-value, not JSON).
//
// Returns an array of game objects ready for upsert into the LAUNCHPAD registry:
//   [{ id, title, source, launchType, launchTarget, installed }]

const fs = require('node:fs');
const path = require('node:path');

// ── VDF Parser (minimal, covers libraryfolders.vdf + appmanifest ACFs) ──
// VDF is a recursive key-value format:
//   "key"   "value"          <- string pair
//   "key"   { ... }          <- nested block
// We parse into a plain object tree.

function parseVdf(text) {
  let pos = 0;
  const len = text.length;

  function skipWhitespace() {
    while (pos < len) {
      const ch = text[pos];
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { pos++; continue; }
      // skip // line comments
      if (ch === '/' && pos + 1 < len && text[pos + 1] === '/') {
        while (pos < len && text[pos] !== '\n') pos++;
        continue;
      }
      break;
    }
  }

  function readString() {
    skipWhitespace();
    if (pos >= len) return null;
    if (text[pos] !== '"') return null;
    pos++; // skip opening quote
    let result = '';
    while (pos < len) {
      const ch = text[pos];
      if (ch === '\\' && pos + 1 < len) {
        pos++;
        const esc = text[pos];
        if (esc === 'n') result += '\n';
        else if (esc === 't') result += '\t';
        else if (esc === '\\') result += '\\';
        else if (esc === '"') result += '"';
        else result += esc;
        pos++;
      } else if (ch === '"') {
        pos++; // skip closing quote
        return result;
      } else {
        result += ch;
        pos++;
      }
    }
    return result; // unterminated string -- best effort
  }

  function readObject() {
    const obj = {};
    while (pos < len) {
      skipWhitespace();
      if (pos >= len) break;
      if (text[pos] === '}') { pos++; break; }
      const key = readString();
      if (key === null) break;
      skipWhitespace();
      if (pos < len && text[pos] === '{') {
        pos++; // skip opening brace
        obj[key] = readObject();
      } else {
        const value = readString();
        obj[key] = value;
      }
    }
    return obj;
  }

  skipWhitespace();
  // A VDF file can start with a root key + block, or just a block
  if (text[pos] === '"') {
    const rootKey = readString();
    skipWhitespace();
    if (pos < len && text[pos] === '{') {
      pos++;
      const rootObj = readObject();
      return { [rootKey]: rootObj };
    }
    return { [rootKey]: null };
  }
  if (text[pos] === '{') {
    pos++;
    return readObject();
  }
  return {};
}

// ── Steam path detection ──

function defaultSteamPaths() {
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam',
    ];
  }
  if (process.platform === 'darwin') {
    const home = process.env.HOME || '/Users';
    return [
      path.join(home, 'Library/Application Support/Steam'),
    ];
  }
  // Linux
  const home = process.env.HOME || '/home';
  return [
    path.join(home, '.steam/steam'),
    path.join(home, '.local/share/Steam'),
  ];
}

function findLibraryFolders(steamPaths) {
  for (const sp of steamPaths) {
    const vdfPath = path.join(sp, 'steamapps', 'libraryfolders.vdf');
    // Alternate location (older Steam versions)
    const vdfPathAlt = path.join(sp, 'config', 'libraryfolders.vdf');
    for (const candidate of [vdfPath, vdfPathAlt]) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

// ── Scan logic ──

function scanAcfFiles(libraryPath) {
  const steamapps = path.join(libraryPath, 'steamapps');
  if (!fs.existsSync(steamapps)) return [];

  const entries = fs.readdirSync(steamapps).filter((f) => f.startsWith('appmanifest_') && f.endsWith('.acf'));
  const games = [];

  for (const entry of entries) {
    try {
      const content = fs.readFileSync(path.join(steamapps, entry), 'utf8');
      const parsed = parseVdf(content);
      const state = parsed.AppState || parsed.appstate || {};
      const appid = state.appid || state.AppID;
      const name = state.name || state.Name;
      if (!appid || !name) continue;
      games.push({
        id: `steam-${appid}`,
        title: name,
        source: 'steam',
        launchType: 'steam',
        launchTarget: `steam://rungameid/${appid}`,
        installed: true,
      });
    } catch (_) {
      // skip unreadable manifests
    }
  }
  return games;
}

/**
 * Scan the local Steam installation for installed games.
 * Returns an array of game descriptors or an empty array if Steam is not found.
 */
function scanSteam() {
  const steamPaths = defaultSteamPaths();
  const vdfFile = findLibraryFolders(steamPaths);
  if (!vdfFile) return [];

  let vdfContent;
  try {
    vdfContent = fs.readFileSync(vdfFile, 'utf8');
  } catch (_) {
    return [];
  }

  const parsed = parseVdf(vdfContent);
  const root = parsed.libraryfolders || parsed.LibraryFolders || {};

  // Each numbered key (0, 1, 2, ...) is a library folder with a "path" field
  const libraryPaths = [];
  for (const key of Object.keys(root)) {
    const entry = root[key];
    if (entry && typeof entry === 'object' && entry.path) {
      libraryPaths.push(entry.path);
    } else if (typeof entry === 'string') {
      // older format: key -> path string directly
      libraryPaths.push(entry);
    }
  }

  const allGames = [];
  for (const lp of libraryPaths) {
    allGames.push(...scanAcfFiles(lp));
  }

  // Dedupe by id (multiple libraries can have manifests for the same game)
  const seen = new Set();
  return allGames.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

module.exports = { scanSteam, parseVdf };
