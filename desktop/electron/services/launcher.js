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
  'goggalaxy', 'battlenet', 'itch',
]);

// Error classes from the original Windows launcher plan: the child sees a calm
// phase ("Das hat gerade nicht geklappt"), the class decides what we offer —
//   recoverable      → "Nochmal versuchen" makes sense
//   blocked          → start is not sensible right now (not installed, time up)
//   parent_required  → the child cannot fix this; a parent has to act
//   fatal            → retrying automatically is pointless
const FAILURE_CLASS = {
  not_found: 'fatal',
  not_approved: 'parent_required',
  blocked: 'parent_required', // age gate — a parent decision, not a child problem
  not_installed: 'blocked',
  time_limit: 'blocked',
  bedtime: 'blocked',
  error: 'recoverable',
};
const classifyFailure = (reason) => FAILURE_CLASS[reason] || 'fatal';

// Launch kind comes from game.launch.kind when set, else inferred from a few
// well-known sources. Minecraft is intentionally NOT special-cased: it is a
// game like any other and carries its own explicit launch target (uri/uwp/exe).
function inferKind(game) {
  if (game && game.launch && game.launch.kind) return game.launch.kind;
  const src = ((game && game.source) || '').toLowerCase();
  if (src === 'steam') return 'steam';
  return 'internal';
}

const schemeOf = (uri) => String(uri || '').split(':')[0].toLowerCase();

// Config errors (missing appid/path/scheme/…) are a curation problem, not a
// transient hiccup — the child can't fix them, so they class as parent_required.
const cfgError = (message) => ({ kind: 'error', reason: 'error', errorClass: 'parent_required', message });

function resolveLaunch(game) {
  if (!game) return { kind: 'error', reason: 'not_found', errorClass: 'fatal', message: 'Spiel nicht gefunden' };
  const kind = inferKind(game);
  const L = game.launch || {};

  if (kind === 'internal') return { kind: 'internal' };

  if (kind === 'steam') {
    const appid = L.appid || game.appid;
    if (!appid) return cfgError('Steam-AppID fehlt');
    return { kind: 'external', url: `steam://rungameid/${appid}` };
  }

  if (kind === 'uri') {
    const uri = L.uri || '';
    if (!uri) return cfgError('Keine Start-URL hinterlegt');
    if (!ALLOWED_SCHEMES.has(schemeOf(uri))) {
      return cfgError(`Schema nicht erlaubt: ${schemeOf(uri)}`);
    }
    return { kind: 'external', url: uri };
  }

  if (kind === 'exe') {
    if (!L.path) return cfgError('Programmpfad fehlt');
    return { kind: 'spawn', cmd: L.path, args: Array.isArray(L.args) ? L.args : [] };
  }

  if (kind === 'uwp') {
    if (!L.pfn) return cfgError('UWP-Paketname (PFN) fehlt');
    return { kind: 'spawn', cmd: 'explorer.exe', args: [`shell:AppsFolder\\${L.pfn}!App`] };
  }

  return cfgError(`Unbekannter Starttyp: ${kind}`);
}

async function launchGame(game, opts = {}) {
  const onExit = typeof opts.onExit === 'function' ? opts.onExit : null;
  const plan = resolveLaunch(game);
  if (plan.kind === 'error') {
    return { ok: false, reason: plan.reason, errorClass: plan.errorClass || classifyFailure(plan.reason), message: plan.message };
  }
  if (plan.kind === 'internal') return { ok: true, internal: true }; // renderer plays it in-app

  try {
    if (plan.kind === 'external') {
      const { shell } = require('electron');
      await shell.openExternal(plan.url);
      // External handlers (Steam, Epic, …) own their own process — we get no
      // exit signal, so return-to-launcher for these relies on the game closing
      // and the kiosk window regaining focus. Tracked launches (spawn) below do
      // call back on exit.
      return { ok: true, tracked: false };
    }
    if (plan.kind === 'spawn') {
      if (process.platform !== 'win32') {
        return { ok: false, reason: 'error', errorClass: 'fatal', message: 'Dieser Spieltyp lässt sich nur unter Windows starten' };
      }
      const { spawn } = require('node:child_process');
      const child = spawn(plan.cmd, plan.args, { detached: true, stdio: 'ignore' });
      // An async spawn failure (e.g. ENOENT) emits 'error' — without a
      // listener that would be an uncaught exception in the MAIN process.
      child.on('error', (err) => {
        console.error(`[launchpad] spawn failed for ${plan.cmd}:`, err);
      });
      // Bring the shell back to the front when the launched program exits, so
      // a closed game lands the child on LAUNCHPAD — not on the bare desktop.
      if (onExit) child.on('exit', () => { try { onExit(); } catch (e) { /* never crash main */ } });
      child.unref();
      return { ok: true, tracked: true };
    }
  } catch (e) {
    // A runtime exception (Steam hiccup, slow shell) may pass on retry.
    return { ok: false, reason: 'error', errorClass: 'recoverable', message: String((e && e.message) || e) };
  }
  return { ok: false, reason: 'error', errorClass: 'fatal', message: 'Kein Startweg' };
}

module.exports = { resolveLaunch, launchGame, classifyFailure, ALLOWED_SCHEMES };
