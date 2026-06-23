// Tests for the pure Steam non-Steam-shortcut layer (binary shortcuts.vdf).
// The encoder must round-trip through the decoder byte-for-byte so we can trust
// it against real Steam; gameToShortcut maps launch targets to Steam Input
// wrappers. The OS write (locating Steam userdata, persisting the file) is
// Windows-only and smoke-tested there.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  crc32, shortcutAppId, encodeShortcuts, decodeShortcuts, gameToShortcut,
} = require('./steamShortcuts.js');

test('crc32 matches the known IEEE check value', () => {
  // "123456789" → 0xCBF43926 is the standard CRC-32 test vector.
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('shortcutAppId is stable and has the high bit set', () => {
  const a = shortcutAppId('"C:/g.exe"', 'Game');
  const b = shortcutAppId('"C:/g.exe"', 'Game');
  assert.equal(a, b); // deterministic
  assert.equal(a >= 0x80000000, true); // top bit set (non-Steam shortcut id)
});

test('encode → decode round-trips a list of shortcuts', () => {
  const entries = [
    { appName: 'GOG Game', exe: '"D:/GOG/g.exe"', startDir: '"D:/GOG"', launchOptions: '-fullscreen', tags: ['LAUNCHPAD', 'GOG'] },
    { appName: 'Xbox Game', exe: '"explorer.exe"', launchOptions: 'shell:AppsFolder\\Pkg_abc!App', tags: ['LAUNCHPAD'] },
  ];
  const buf = encodeShortcuts(entries);
  const out = decodeShortcuts(buf);
  const sc = out.shortcuts;
  assert.equal(Object.keys(sc).length, 2);
  assert.equal(sc['0'].AppName, 'GOG Game');
  assert.equal(sc['0'].Exe, '"D:/GOG/g.exe"');
  assert.equal(sc['0'].LaunchOptions, '-fullscreen');
  assert.equal(sc['0'].tags['0'], 'LAUNCHPAD');
  assert.equal(sc['0'].tags['1'], 'GOG');
  assert.equal(sc['1'].AppName, 'Xbox Game');
  assert.equal(sc['1'].LaunchOptions, 'shell:AppsFolder\\Pkg_abc!App');
  // appid present and stable
  assert.equal(sc['0'].appid, shortcutAppId('"D:/GOG/g.exe"', 'GOG Game'));
});

test('empty list still produces a valid (decodable) file', () => {
  const out = decodeShortcuts(encodeShortcuts([]));
  assert.deepEqual(out, { shortcuts: {} });
});

test('gameToShortcut maps exe / uwp / uri launches, skips steam + internal', () => {
  assert.equal(gameToShortcut({ name: 'Steam', launch: { kind: 'steam', appid: '1' } }), null);
  assert.equal(gameToShortcut({ name: 'Internal', launch: { kind: 'internal' } }), null);

  const exe = gameToShortcut({ name: 'GOG', launch: { kind: 'exe', path: 'D:/g/x.exe', args: ['-w'] } });
  assert.equal(exe.exe, '"D:/g/x.exe"');
  assert.equal(exe.startDir, '"D:/g"');
  assert.equal(exe.launchOptions, '-w');

  const uwp = gameToShortcut({ name: 'Xbox', launch: { kind: 'uwp', pfn: 'Pkg_abc' } });
  assert.equal(uwp.exe, '"explorer.exe"');
  assert.match(uwp.launchOptions, /shell:AppsFolder\\Pkg_abc!App/);

  const uri = gameToShortcut({ name: 'Epic', launch: { kind: 'uri', uri: 'com.epicgames.launcher://apps/x?action=launch' } });
  assert.equal(uri.exe, '"cmd.exe"');
  assert.match(uri.launchOptions, /start "" "com\.epicgames/);
});
