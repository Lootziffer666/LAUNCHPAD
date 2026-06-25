// electron/services/steamShortcuts.js — register non-Steam games as Steam
// shortcuts so they run through Steam Input (one controller driver + glyphs for
// Xbox/Epic/GOG/DRM-free titles, exactly like Steam's own "add a non-Steam
// game"). Two layers:
//   - PURE: encode/decode Valve's binary `shortcuts.vdf` format + a stable
//     shortcut appid. Fully unit-testable on any OS (round-trips byte-for-byte).
//   - OS (Windows-only): locate Steam's userdata config and write the file.
//     Guarded + flagged — needs a real Steam install and a Steam restart.
//
// Binary VDF type tags: 0x00 nested map, 0x01 string, 0x02 int32(LE), 0x08 end.

const NUL = 0x00;
const T_MAP = 0x00;
const T_STR = 0x01;
const T_INT = 0x02;
const T_END = 0x08;

// CRC-32 (IEEE) — used to derive the stable non-Steam shortcut appid.
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Steam's legacy shortcut id: crc32(exe+appname) with the high bit set. Used by
// Steam for grid art and the steam://rungameid handle.
function shortcutAppId(exe, appName) {
  const crc = crc32(Buffer.from(`${exe}${appName}`, 'utf8'));
  return (crc | 0x80000000) >>> 0;
}

function cstr(s) { return Buffer.concat([Buffer.from(String(s == null ? '' : s), 'utf8'), Buffer.from([NUL])]); }
function strField(key, val) { return Buffer.concat([Buffer.from([T_STR]), cstr(key), cstr(val)]); }
function intField(key, val) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE((val >>> 0), 0); // appid can exceed int32 range → unsigned
  return Buffer.concat([Buffer.from([T_INT]), cstr(key), b]);
}
function mapStart(key) { return Buffer.concat([Buffer.from([T_MAP]), cstr(key)]); }
const END = Buffer.from([T_END]);

// entry: { appName, exe, startDir, icon?, launchOptions?, tags?:string[], appid? }
function encodeEntry(index, e) {
  const exe = e.exe || '';
  const appName = e.appName || '';
  const appid = e.appid != null ? (e.appid >>> 0) : shortcutAppId(exe, appName);
  const parts = [
    mapStart(String(index)),
    intField('appid', appid),
    strField('AppName', appName),
    strField('Exe', exe),
    strField('StartDir', e.startDir || ''),
    strField('icon', e.icon || ''),
    strField('ShortcutPath', e.shortcutPath || ''),
    strField('LaunchOptions', e.launchOptions || ''),
    intField('IsHidden', 0),
    intField('AllowDesktopConfig', 1),
    intField('AllowOverlay', 1),
    intField('OpenVR', 0),
    intField('Devkit', 0),
    strField('DevkitGameID', ''),
    intField('LastPlayTime', e.lastPlayTime || 0),
    mapStart('tags'),
  ];
  (Array.isArray(e.tags) ? e.tags : []).forEach((tag, i) => parts.push(strField(String(i), tag)));
  parts.push(END); // end tags
  parts.push(END); // end entry
  return Buffer.concat(parts);
}

// entries: Array<entry> → Buffer (the full shortcuts.vdf payload)
function encodeShortcuts(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const body = list.map((e, i) => encodeEntry(i, e));
  return Buffer.concat([
    mapStart('shortcuts'),
    ...body,
    END, // end shortcuts map
    END, // end root
  ]);
}

// Decoder — reads the binary VDF back into a plain object. Used by the tests to
// prove the encoder round-trips, and (on Windows) to merge with an existing
// shortcuts.vdf instead of clobbering the parent's own non-Steam games.
function decodeShortcuts(buf) {
  let pos = 0;
  const readCStr = () => {
    const start = pos;
    while (pos < buf.length && buf[pos] !== NUL) pos++;
    const s = buf.toString('utf8', start, pos);
    pos++; // skip NUL
    return s;
  };
  const readMap = () => {
    const obj = {};
    while (pos < buf.length) {
      const type = buf[pos++];
      if (type === T_END) break;
      const key = readCStr();
      if (type === T_MAP) obj[key] = readMap();
      else if (type === T_STR) obj[key] = readCStr();
      else if (type === T_INT) { obj[key] = buf.readUInt32LE(pos); pos += 4; }
    }
    return obj;
  };
  // top: T_MAP "shortcuts" <map> T_END(root)
  const type = buf[pos++];
  if (type !== T_MAP) throw new Error('bad shortcuts.vdf: expected root map');
  const rootKey = readCStr();
  const map = readMap();
  return { [rootKey]: map };
}

// Map a LAUNCHPAD game's launch target to a Steam shortcut entry. exe/launch
// options follow Steam's convention: for URI/UWP launches the "exe" is the
// scheme handler invoked via cmd, so Steam Input still wraps the child game.
function gameToShortcut(game) {
  if (!game) return null;
  const L = game.launch || {};
  const name = game.name || game.id || 'Spiel';
  if (L.kind === 'exe' && L.path) {
    return { appName: name, exe: `"${L.path}"`, startDir: dirOf(L.path), launchOptions: (L.args || []).join(' '), tags: ['LAUNCHPAD'] };
  }
  if (L.kind === 'uwp' && L.pfn) {
    return { appName: name, exe: '"explorer.exe"', startDir: '', launchOptions: `shell:AppsFolder\\${L.pfn}!App`, tags: ['LAUNCHPAD'] };
  }
  if (L.kind === 'uri' && L.uri) {
    return { appName: name, exe: '"cmd.exe"', startDir: '', launchOptions: `/c start "" "${L.uri}"`, tags: ['LAUNCHPAD'] };
  }
  // Steam games are already in Steam; internal games never leave the app.
  return null;
}

function dirOf(p) {
  const s = String(p || '').replace(/[\\/][^\\/]*$/, '');
  return s ? `"${s}"` : '';
}

module.exports = {
  crc32, shortcutAppId, encodeShortcuts, decodeShortcuts, gameToShortcut,
};
