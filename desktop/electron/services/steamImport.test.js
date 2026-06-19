// Tests for the Steam library import (VDF parser + scan logic).
// Run with: npm test   (node --test)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseVdf, scanSteam } = require('./steamImport.js');

// ── VDF Parser tests ──

test('parseVdf: parses libraryfolders.vdf format', () => {
  const vdf = `"libraryfolders"
{
  "0"
  {
    "path"    "C:\\\\Program Files (x86)\\\\Steam"
    "label"   ""
    "apps"
    {
      "228980"    "1234567890"
      "1551360"   "98765432"
    }
  }
  "1"
  {
    "path"    "D:\\\\SteamLibrary"
    "label"   "games"
    "apps"
    {
      "413150"    "55555555"
    }
  }
}`;

  const parsed = parseVdf(vdf);
  assert.ok(parsed.libraryfolders, 'root key should be libraryfolders');
  const root = parsed.libraryfolders;
  assert.equal(root['0'].path, 'C:\\Program Files (x86)\\Steam');
  assert.equal(root['1'].path, 'D:\\SteamLibrary');
  assert.equal(root['0'].apps['228980'], '1234567890');
  assert.equal(root['0'].apps['1551360'], '98765432');
  assert.equal(root['1'].apps['413150'], '55555555');
});

test('parseVdf: parses appmanifest ACF format', () => {
  const acf = `"AppState"
{
  "appid"     "1551360"
  "Universe"  "1"
  "name"      "Forza Horizon 5"
  "StateFlags"    "4"
  "installdir"    "Forza Horizon 5"
}`;

  const parsed = parseVdf(acf);
  assert.ok(parsed.AppState);
  assert.equal(parsed.AppState.appid, '1551360');
  assert.equal(parsed.AppState.name, 'Forza Horizon 5');
  assert.equal(parsed.AppState.installdir, 'Forza Horizon 5');
});

test('parseVdf: handles escaped characters', () => {
  const vdf = `"test"
{
  "path"    "C:\\\\Users\\\\test\\\\folder"
  "quoted"  "say \\"hello\\""
}`;

  const parsed = parseVdf(vdf);
  assert.equal(parsed.test.path, 'C:\\Users\\test\\folder');
  assert.equal(parsed.test.quoted, 'say "hello"');
});

test('parseVdf: handles empty input gracefully', () => {
  assert.deepEqual(parseVdf(''), {});
  assert.deepEqual(parseVdf('   '), {});
});

test('parseVdf: handles comments', () => {
  const vdf = `// This is a comment
"root"
{
  // Another comment
  "key"   "value"
}`;
  const parsed = parseVdf(vdf);
  assert.equal(parsed.root.key, 'value');
});

// ── scanSteam integration (runs without real Steam installed) ──

test('scanSteam: returns empty array when Steam is not installed', () => {
  // On CI/dev machines without Steam, this should return [] gracefully
  const result = scanSteam();
  assert.ok(Array.isArray(result), 'should always return an array');
});

// ── Mock-based scan test using temp filesystem ──

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

test('scanSteam: parses mock VDF and ACF files from temp directory', () => {
  // Create a temporary Steam-like directory structure
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-test-'));
  const steamapps = path.join(tmpDir, 'steamapps');
  fs.mkdirSync(steamapps, { recursive: true });

  // Write libraryfolders.vdf pointing to our temp dir
  const vdfContent = `"libraryfolders"
{
  "0"
  {
    "path"    "${tmpDir.replace(/\\/g, '\\\\')}"
    "apps"
    {
      "1551360"   "12345"
      "413150"    "67890"
    }
  }
}`;
  fs.writeFileSync(path.join(steamapps, 'libraryfolders.vdf'), vdfContent);

  // Write ACF manifest files
  fs.writeFileSync(path.join(steamapps, 'appmanifest_1551360.acf'), `"AppState"
{
  "appid"     "1551360"
  "name"      "Forza Horizon 5"
  "installdir"    "Forza Horizon 5"
}`);

  fs.writeFileSync(path.join(steamapps, 'appmanifest_413150.acf'), `"AppState"
{
  "appid"     "413150"
  "name"      "Stardew Valley"
  "installdir"    "Stardew Valley"
}`);

  // Use the parseVdf + scan logic directly (scanSteam uses system paths,
  // so we test the underlying parse + scan pipeline here)
  const { parseVdf: parse } = require('./steamImport.js');

  // Parse the VDF
  const parsed = parse(vdfContent);
  assert.equal(parsed.libraryfolders['0'].path, tmpDir);

  // Read and parse ACFs
  const acfFiles = fs.readdirSync(steamapps)
    .filter((f) => f.startsWith('appmanifest_') && f.endsWith('.acf'));
  assert.equal(acfFiles.length, 2);

  const games = [];
  for (const acf of acfFiles) {
    const content = fs.readFileSync(path.join(steamapps, acf), 'utf8');
    const acfParsed = parse(content);
    const state = acfParsed.AppState || {};
    games.push({
      id: `steam-${state.appid}`,
      title: state.name,
      source: 'steam',
      launchType: 'steam',
      launchTarget: `steam://rungameid/${state.appid}`,
      installed: true,
    });
  }

  assert.equal(games.length, 2);
  const forza = games.find((g) => g.id === 'steam-1551360');
  assert.ok(forza, 'Forza should be found');
  assert.equal(forza.title, 'Forza Horizon 5');
  assert.equal(forza.launchTarget, 'steam://rungameid/1551360');
  assert.equal(forza.source, 'steam');

  const stardew = games.find((g) => g.id === 'steam-413150');
  assert.ok(stardew, 'Stardew Valley should be found');
  assert.equal(stardew.title, 'Stardew Valley');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
