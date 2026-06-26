// Tests for electron/services/winget.js
//
// Mocks child_process to verify command construction, status tracking, and
// error handling without requiring a real winget installation.
//
// Run with: npm test   (node --test)

const { test, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

// --- Mock child_process ---

let execFileCalls = [];
let spawnCalls = [];
let execFileCallback = null;
let spawnInstance = null;

// We use node:test mock.module to intercept child_process.
// Since node:test's module mocking requires top-level await or specific setup,
// we'll re-require the module with a custom approach using require cache manipulation.

function createMockChildProcess() {
  execFileCalls = [];
  spawnCalls = [];
  execFileCallback = null;
  spawnInstance = null;
}

// Create a mock spawn that returns an EventEmitter with stdout/stderr
function createSpawnMock() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.stdin = null;
  spawnInstance = proc;
  return proc;
}

// Override the module by patching require cache
const Module = require('node:module');
const originalRequire = Module.prototype.require;

let mockExecFile;
let mockSpawn;

function setupMocks() {
  mockExecFile = (cmd, args, opts, cb) => {
    // Handle 3-arg form (no opts)
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    execFileCalls.push({ cmd, args, opts });
    execFileCallback = cb;
  };
  mockSpawn = (cmd, args, opts) => {
    spawnCalls.push({ cmd, args, opts });
    return createSpawnMock();
  };
}

// We need to test the module with mocked child_process.
// Strategy: directly manipulate the require cache so that when winget.js
// requires 'node:child_process', it gets our mock.
const path = require('node:path');
const wingetPath = path.resolve(__dirname, 'winget.js');

function loadWingetWithMocks() {
  // Remove cached version
  delete require.cache[wingetPath];

  // Temporarily patch the child_process module
  const cpPath = require.resolve('node:child_process');
  const originalCp = require.cache[cpPath];

  require.cache[cpPath] = {
    id: cpPath,
    filename: cpPath,
    loaded: true,
    exports: {
      execFile: (...args) => mockExecFile(...args),
      spawn: (...args) => mockSpawn(...args),
    },
  };

  const winget = require(wingetPath);

  // Restore
  if (originalCp) {
    require.cache[cpPath] = originalCp;
  } else {
    delete require.cache[cpPath];
  }

  return winget;
}

// ---- Tests ----

test('checkWinget: returns not_windows when not on win32', async () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  // On non-Windows (CI runs Linux), should immediately resolve
  if (process.platform !== 'win32') {
    const result = await winget.checkWinget();
    assert.equal(result.available, false);
    assert.equal(result.reason, 'not_windows');
  }
});

test('checkWinget: on win32 calls where.exe winget', async () => {
  if (process.platform !== 'win32') return; // skip on non-Windows
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const promise = winget.checkWinget();
  // Simulate success
  assert.equal(execFileCalls.length, 1);
  assert.equal(execFileCalls[0].cmd, 'where.exe');
  assert.deepEqual(execFileCalls[0].args, ['winget']);
  execFileCallback(null, 'C:\\winget.exe');
  const result = await promise;
  assert.equal(result.available, true);
});

test('isInstalled: returns false on non-Windows', async () => {
  if (process.platform === 'win32') return;
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const result = await winget.isInstalled('GeoGebra.Classic');
  assert.equal(result.installed, false);
});

test('isInstalled: returns false for empty wingetId', async () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const result = await winget.isInstalled('');
  assert.equal(result.installed, false);
});

test('getStatus: returns not_installed by default', () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  assert.equal(winget.getStatus('GeoGebra.Classic'), 'not_installed');
});

test('getStatus: returns set status after setStatus', () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  winget.setStatus('GeoGebra.Classic', 'installed');
  assert.equal(winget.getStatus('GeoGebra.Classic'), 'installed');
});

test('install: returns error for empty id', async () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const result = await winget.install('');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'no_id');
});

test('install: returns error for non-Windows', async () => {
  if (process.platform === 'win32') return;
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const result = await winget.install('GeoGebra.Classic');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'not_windows');
  assert.equal(winget.getStatus('GeoGebra.Classic'), 'failed');
});

test('install: prevents double install', async () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  winget.setStatus('GeoGebra.Classic', 'installing');
  const result = await winget.install('GeoGebra.Classic');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'already_installing');
});

test('install: returns ok if already installed', async () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  winget.setStatus('GeoGebra.Classic', 'installed');
  const result = await winget.install('GeoGebra.Classic');
  assert.equal(result.ok, true);
});

test('install: on win32 spawns winget with correct args', async () => {
  if (process.platform !== 'win32') return;
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const progressEvents = [];
  const promise = winget.install('GeoGebra.Classic', {
    onProgress: (p) => progressEvents.push(p),
  });

  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0].cmd, 'winget');
  assert.deepEqual(spawnCalls[0].args, [
    'install', 'GeoGebra.Classic',
    '--accept-source-agreements', '--accept-package-agreements',
  ]);

  // Simulate progress
  spawnInstance.stdout.emit('data', Buffer.from('Downloading...\n'));
  // Simulate completion
  spawnInstance.emit('close', 0);

  const result = await promise;
  assert.equal(result.ok, true);
  assert.equal(winget.getStatus('GeoGebra.Classic'), 'installed');
  assert.ok(progressEvents.length > 0);
});

test('install: on win32 handles spawn error', async () => {
  if (process.platform !== 'win32') return;
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const promise = winget.install('Bad.Package');

  spawnInstance.emit('error', new Error('ENOENT'));
  const result = await promise;
  assert.equal(result.ok, false);
  assert.match(result.error, /ENOENT/);
  assert.equal(winget.getStatus('Bad.Package'), 'failed');
});

test('install: on win32 handles non-zero exit code', async () => {
  if (process.platform !== 'win32') return;
  setupMocks();
  const winget = loadWingetWithMocks();
  winget._reset();

  const promise = winget.install('Bad.Package');
  spawnInstance.emit('close', 1);

  const result = await promise;
  assert.equal(result.ok, false);
  assert.match(result.error, /code 1/);
  assert.equal(winget.getStatus('Bad.Package'), 'failed');
});

test('_reset clears all status', () => {
  setupMocks();
  const winget = loadWingetWithMocks();
  winget.setStatus('a', 'installed');
  winget.setStatus('b', 'failed');
  winget._reset();
  assert.equal(winget.getStatus('a'), 'not_installed');
  assert.equal(winget.getStatus('b'), 'not_installed');
});
