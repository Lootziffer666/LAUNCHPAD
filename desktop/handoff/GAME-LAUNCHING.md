# Launching games (Steam / Minecraft / local .exe / UWP)

All launching happens in the **main process** (`electron/services/launcher.js`).
The renderer only sends a **game id**; main resolves it against the registry and decides how
to start it. Never let the renderer pass a raw path to `spawn` — always look up `game.launch`
from the trusted registry by id.

```js
// electron/services/launcher.js
const { shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

async function launchGame(game) {
  const L = game.launch || {};
  switch (L.kind) {

    case 'steam':            // Steam must be installed; this hands off to the Steam client
      // steam://run/<appid>  (also steam://rungameid/<id>)
      await shell.openExternal(`steam://run/${L.appId}`);
      return { ok: true };

    case 'uri':              // any registered protocol, e.g. minecraft:// , com.epicgames.launcher://
      await shell.openExternal(L.uri);
      return { ok: true };

    case 'exe': {            // local executable (e.g. a Minecraft launcher, itch game)
      if (!L.path || !fs.existsSync(L.path)) return { ok: false, reason: 'not_installed' };
      const child = spawn(L.path, L.args || [], { detached: true, stdio: 'ignore' });
      child.unref();
      child.on('close', () => notifyClosed(game.id));
      return { ok: true, pid: child.pid };
    }

    case 'uwp':              // Microsoft Store / UWP app via AppUserModelID
      // Windows: start shell:AppsFolder\<AUMID>
      spawn('explorer.exe', [`shell:AppsFolder\\${L.aumid}`], { detached: true }).unref();
      return { ok: true };

    case 'internal':         // LAUNCHPAD's own mini-games — handled in the renderer, no OS call
      return { ok: true, internal: L.route };

    default:
      return { ok: false, reason: 'error', message: 'unknown launch kind' };
  }
}
```

## Per-source notes

### Steam  →  `kind: "steam"`, `appId`
- `steam://run/<appId>` launches the game (Steam shows its own dialog if not installed).
- Find appIds at store.steampowered.com (the number in the URL) or via the local
  `steamapps/appmanifest_<appId>.acf` files.
- Detecting "installed": read Steam's `libraryfolders.vdf` + `appmanifest_*.acf` (optional polish).

### Minecraft  →  `kind: "uri"` (`minecraft://`) or `kind: "exe"`
- Java/Bedrock launchers register protocols; otherwise point `kind:"exe"` at the launcher path
  (e.g. `%ProgramFiles%\Minecraft Launcher\MinecraftLauncher.exe`), or `kind:"uwp"` with the
  Bedrock AUMID for the Store edition.

### Scratch  →  `kind: "uri"` or `kind: "internal"`
- Offline editor: `kind:"exe"`. Online: open the project in the **embedded** safe webview
  (`kind:"internal"`, route handled in renderer) — do not shell out to a full browser.

### Local .exe  →  `kind: "exe"`, `path` (+ optional `args`)
- Parent adds these in the **Game Manager** (prototype `import.jsx`); add a path picker
  (`dialog.showOpenDialog`) in the real app. Validate the path exists before storing.

## Guardrails before any launch
1. Game exists in registry (`getGame(id)` ≠ null).
2. `installed === true` (else return `not_installed` → UI shows "Installieren").
3. Passes age rating + parental `approvals`.
4. Not over `dailyLimitMin` / not in bedtime window (else `time_limit`).
5. Only then resolve `launch` and start it.

## "Installed" vs "Detail" vs "Launch" in the UI (already built)
- Play library card → **Game Detail** (`GameDetail` in `launcher.jsx`).
- Detail shows **Starten / Weiterspielen** (installed) or **Installieren** (not).
- The prototype simulates install (1.4 s) and launch (splash). Wire `Starten` → `launchGame(id)`
  and surface `LaunchResult.reason` as the existing toast/splash states.
