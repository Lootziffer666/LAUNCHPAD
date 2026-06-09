// electron/services/launcher.js — resolve a game's launch target and run it.
//
// resolveLaunch(game) is PURE (no Electron, no OS calls) so it is unit-testable
// on any platform: it returns a *plan* describing HOW to launch. launchGame(game)
// performs the side effect (shell.openExternal / detached child spawn) and only
// then lazy-requires Electron / child_process — so the real OS launch happens at
// call time (exe/uwp need Windows).
//
// Launch kind comes from game.launch.kind, else inferred from game.source:
//   Steam     → steam  (needs launch.appid)
//   Minecraft → uri    (minecraft://)
//   LAUNCHPAD / Scratch / unknown → internal (runs in-app)
//
// URI launches are restricted to an allow-list of schemes so a bad entry can't
// turn into file://, vbscript:, etc.

const ALLOWED_SCHEMES = new Set([
  'steam', 'minecraft', 'com.epicgames.launcher', 'uplay',
  'origin', 'roblox', 'msstore', 'ms-windows-store',
]);

function inferKind(game) {
  if (game && game.launch && game.launch.kind) return game.launch.kind;
  const src = ((game && game.source) || '').toLowerCase();
  if (src === 'steam') return 'steam';
  if (src === 'minecraft') return 'uri';
  return 'internal';
}

const schemeOf = (uri) => String(uri || '').split(':')[0].toLowerCase();

function resolveLaunch(game) {
  if (!game) return { kind: 'error', reason: 'not_found', message: 'Spiel nicht gefunden' };
  const kind = inferKind(game);
  const L = game.launch || {};

  if (kind === 'internal') return { kind: 'internal' };

  if (kind === 'steam') {
    const appid = L.appid || game.appid;
    if (!appid) return { kind: 'error', reason: 'error', message: 'Steam-AppID fehlt' };
    return { kind: 'external', url: `steam://rungameid/${appid}` };
  }

  if (kind === 'uri') {
    const uri = L.uri || (game.source === 'Minecraft' ? 'minecraft://' : '');
    if (!uri) return { kind: 'error', reason: 'error', message: 'Keine Start-URL hinterlegt' };
    if (!ALLOWED_SCHEMES.has(schemeOf(uri))) {
      return { kind: 'error', reason: 'error', message: `Schema nicht erlaubt: ${schemeOf(uri)}` };
    }
    return { kind: 'external', url: uri };
  }

  if (kind === 'exe') {
    if (!L.path) return { kind: 'error', reason: 'error', message: 'Programmpfad fehlt' };
    return { kind: 'spawn', cmd: L.path, args: Array.isArray(L.args) ? L.args : [] };
  }

  if (kind === 'uwp') {
    if (!L.pfn) return { kind: 'error', reason: 'error', message: 'UWP-Paketname (PFN) fehlt' };
    return { kind: 'spawn', cmd: 'explorer.exe', args: [`shell:AppsFolder\\${L.pfn}!App`] };
  }

  return { kind: 'error', reason: 'error', message: `Unbekannter Starttyp: ${kind}` };
}

async function launchGame(game) {
  const plan = resolveLaunch(game);
  if (plan.kind === 'error') return { ok: false, reason: plan.reason, message: plan.message };
  if (plan.kind === 'internal') return { ok: true, internal: true }; // renderer plays it in-app

  try {
    if (plan.kind === 'external') {
      const { shell } = require('electron');
      await shell.openExternal(plan.url);
      return { ok: true };
    }
    if (plan.kind === 'spawn') {
      if (process.platform !== 'win32') {
        return { ok: false, reason: 'error', message: 'Dieser Spieltyp lässt sich nur unter Windows starten' };
      }
      const { spawn } = require('node:child_process');
      spawn(plan.cmd, plan.args, { detached: true, stdio: 'ignore' }).unref();
      return { ok: true };
    }
  } catch (e) {
    return { ok: false, reason: 'error', message: String((e && e.message) || e) };
  }
  return { ok: false, reason: 'error', message: 'Kein Startweg' };
}

module.exports = { resolveLaunch, launchGame, ALLOWED_SCHEMES };
