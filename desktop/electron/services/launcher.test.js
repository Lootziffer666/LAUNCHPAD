// Tests for the M3 launch logic. resolveLaunch() is pure, so every branch is
// exercised here on any platform; launchGame() is checked only for its
// deterministic paths (error short-circuit, internal, and the non-Windows
// spawn guard) — the real OS launches (shell.openExternal / spawn) need a
// running Electron / Windows and are smoke-tested there.
//
// Run with: npm test   (node --test)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveLaunch, launchGame, ALLOWED_SCHEMES } = require('./launcher.js');

test('no game → not_found error', () => {
  const p = resolveLaunch(null);
  assert.equal(p.kind, 'error');
  assert.equal(p.reason, 'not_found');
});

test('internal: inferred from source and from explicit kind', () => {
  assert.deepEqual(resolveLaunch({ source: 'LAUNCHPAD' }), { kind: 'internal' });
  assert.deepEqual(resolveLaunch({ source: 'Scratch' }), { kind: 'internal' });
  assert.deepEqual(resolveLaunch({ source: 'Whatever' }), { kind: 'internal' });
  assert.deepEqual(resolveLaunch({ source: 'Steam', launch: { kind: 'internal' } }), { kind: 'internal' });
});

test('steam: appid from launch or game, → steam://rungameid', () => {
  assert.deepEqual(
    resolveLaunch({ source: 'Steam', launch: { appid: '440' } }),
    { kind: 'external', url: 'steam://rungameid/440' },
  );
  // appid can also live on the game itself
  assert.deepEqual(
    resolveLaunch({ source: 'steam', appid: '620' }),
    { kind: 'external', url: 'steam://rungameid/620' },
  );
});

test('steam: missing appid → error', () => {
  const p = resolveLaunch({ source: 'Steam' });
  assert.equal(p.kind, 'error');
  assert.match(p.message, /AppID/i);
});

test('uri: Minecraft source defaults to minecraft://', () => {
  assert.deepEqual(
    resolveLaunch({ source: 'Minecraft' }),
    { kind: 'external', url: 'minecraft://' },
  );
});

test('uri: an allow-listed scheme passes through', () => {
  assert.deepEqual(
    resolveLaunch({ launch: { kind: 'uri', uri: 'roblox://placeId=123' } }),
    { kind: 'external', url: 'roblox://placeId=123' },
  );
});

test('uri: SECURITY — disallowed schemes are rejected', () => {
  for (const bad of ['file:///etc/passwd', 'vbscript:msgbox', 'javascript:alert(1)', 'data:text/html,x']) {
    const p = resolveLaunch({ launch: { kind: 'uri', uri: bad } });
    assert.equal(p.kind, 'error', `${bad} should be blocked`);
    assert.match(p.message, /nicht erlaubt/i);
  }
});

test('uri: every ALLOWED_SCHEME really is allowed', () => {
  for (const s of ALLOWED_SCHEMES) {
    const p = resolveLaunch({ launch: { kind: 'uri', uri: `${s}://go` } });
    assert.equal(p.kind, 'external', `${s} should be allowed`);
  }
});

test('uri: missing uri → error', () => {
  const p = resolveLaunch({ launch: { kind: 'uri' } });
  assert.equal(p.kind, 'error');
});

test('exe: path → spawn plan, args default to []', () => {
  assert.deepEqual(
    resolveLaunch({ launch: { kind: 'exe', path: 'C:/Games/run.exe' } }),
    { kind: 'spawn', cmd: 'C:/Games/run.exe', args: [] },
  );
  assert.deepEqual(
    resolveLaunch({ launch: { kind: 'exe', path: 'a.exe', args: ['-w'] } }),
    { kind: 'spawn', cmd: 'a.exe', args: ['-w'] },
  );
  // non-array args are not trusted → coerced to []
  assert.deepEqual(
    resolveLaunch({ launch: { kind: 'exe', path: 'a.exe', args: 'oops' } }).args,
    [],
  );
});

test('exe: missing path → error', () => {
  assert.equal(resolveLaunch({ launch: { kind: 'exe' } }).kind, 'error');
});

test('uwp: pfn → explorer.exe shell:AppsFolder plan', () => {
  assert.deepEqual(
    resolveLaunch({ launch: { kind: 'uwp', pfn: 'Mojang.MinecraftUWP_8wekyb3d8bbwe' } }),
    { kind: 'spawn', cmd: 'explorer.exe', args: ['shell:AppsFolder\\Mojang.MinecraftUWP_8wekyb3d8bbwe!App'] },
  );
});

test('uwp: missing pfn → error', () => {
  assert.equal(resolveLaunch({ launch: { kind: 'uwp' } }).kind, 'error');
});

test('explicit launch.kind overrides the source inference', () => {
  // source says Steam, but the entry is really an exe — kind wins
  assert.equal(resolveLaunch({ source: 'Steam', launch: { kind: 'exe', path: 'x.exe' } }).kind, 'spawn');
});

test('unknown kind → error', () => {
  const p = resolveLaunch({ launch: { kind: 'banana' } });
  assert.equal(p.kind, 'error');
  assert.match(p.message, /Starttyp/i);
});

// ---- launchGame: deterministic paths only ----

test('launchGame: error plan surfaces ok:false with reason', async () => {
  const r = await launchGame({ source: 'Steam' }); // missing appid
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'error');
});

test('launchGame: internal → ok, flagged for in-app play', async () => {
  const r = await launchGame({ source: 'LAUNCHPAD' });
  assert.deepEqual(r, { ok: true, internal: true });
});

test('launchGame: spawn launch off-Windows is refused with a clear message', async (t) => {
  if (process.platform === 'win32') return t.skip('Windows actually spawns');
  const r = await launchGame({ launch: { kind: 'exe', path: 'C:/x.exe' } });
  assert.equal(r.ok, false);
  assert.match(r.message, /Windows/);
});
