// electron/services/winget.js — winget package manager integration.
//
// Manages installation of predefined learning/creative apps via winget.
// Tracks in-memory status per wingetId: 'not_installed'|'installing'|'installed'|'failed'.
// Uses child_process.execFile for checks and child_process.spawn for installs
// (streaming stdout for progress events).

const { execFile, spawn } = require('node:child_process');

// In-memory status map: wingetId -> { status, error? }
const statusMap = new Map();

/**
 * Check whether winget is available on this system.
 * Returns { available: true } or { available: false, reason: string }.
 */
function checkWinget() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve({ available: false, reason: 'not_windows' });
    }
    execFile('where.exe', ['winget'], { timeout: 10000 }, (err) => {
      if (err) {
        return resolve({ available: false, reason: 'not_found' });
      }
      resolve({ available: true });
    });
  });
}

/**
 * Check if a specific package is already installed.
 * Returns { installed: true/false }.
 */
function isInstalled(wingetId) {
  return new Promise((resolve) => {
    if (!wingetId) return resolve({ installed: false });
    if (process.platform !== 'win32') return resolve({ installed: false });

    execFile(
      'winget',
      ['list', '--id', wingetId, '--exact', '--accept-source-agreements'],
      { timeout: 30000 },
      (err, stdout) => {
        if (err) {
          // Exit code non-zero typically means not found
          return resolve({ installed: false });
        }
        // winget list returns the package row if installed; check if the id appears in output
        const found = stdout && stdout.includes(wingetId);
        resolve({ installed: found });
      }
    );
  });
}

/**
 * Get the current status for a wingetId.
 * Returns 'not_installed'|'installing'|'installed'|'failed'.
 */
function getStatus(wingetId) {
  if (!wingetId) return 'not_installed';
  const entry = statusMap.get(wingetId);
  return entry ? entry.status : 'not_installed';
}

/**
 * Install a package via winget. Non-blocking: returns immediately.
 * Calls onProgress({ wingetId, status, line }) as stdout lines arrive.
 * Resolves when the install finishes or fails.
 *
 * @param {string} wingetId - The winget package identifier
 * @param {{ onProgress?: function }} opts - Options
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
function install(wingetId, opts = {}) {
  const { onProgress } = opts;

  if (!wingetId) {
    return Promise.resolve({ ok: false, error: 'no_id' });
  }

  // Already installing?
  const current = statusMap.get(wingetId);
  if (current && current.status === 'installing') {
    return Promise.resolve({ ok: false, error: 'already_installing' });
  }
  if (current && current.status === 'installed') {
    return Promise.resolve({ ok: true });
  }

  if (process.platform !== 'win32') {
    statusMap.set(wingetId, { status: 'failed', error: 'not_windows' });
    return Promise.resolve({ ok: false, error: 'not_windows' });
  }

  statusMap.set(wingetId, { status: 'installing' });
  if (onProgress) onProgress({ wingetId, status: 'installing', line: '' });

  return new Promise((resolve) => {
    const child = spawn(
      'winget',
      ['install', wingetId, '--accept-source-agreements', '--accept-package-agreements'],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let lastLine = '';

    const handleData = (data) => {
      const lines = data.toString().split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        lastLine = line;
        if (onProgress) onProgress({ wingetId, status: 'installing', line });
      }
    };

    if (child.stdout) child.stdout.on('data', handleData);
    if (child.stderr) child.stderr.on('data', handleData);

    child.on('error', (err) => {
      statusMap.set(wingetId, { status: 'failed', error: err.message });
      if (onProgress) onProgress({ wingetId, status: 'failed', line: err.message });
      resolve({ ok: false, error: err.message });
    });

    child.on('close', (code) => {
      if (code === 0) {
        statusMap.set(wingetId, { status: 'installed' });
        if (onProgress) onProgress({ wingetId, status: 'installed', line: lastLine });
        resolve({ ok: true });
      } else {
        const msg = `winget exited with code ${code}`;
        statusMap.set(wingetId, { status: 'failed', error: msg });
        if (onProgress) onProgress({ wingetId, status: 'failed', line: msg });
        resolve({ ok: false, error: msg });
      }
    });
  });
}

/**
 * Set status directly (useful for initializing known-installed apps).
 */
function setStatus(wingetId, status) {
  statusMap.set(wingetId, { status });
}

/**
 * Reset status map (useful for testing).
 */
function _reset() {
  statusMap.clear();
}

module.exports = { checkWinget, isInstalled, install, getStatus, setStatus, _reset };
