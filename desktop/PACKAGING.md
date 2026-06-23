# Packaging & installers

LAUNCHPAD ships as a **per-user Windows app** with a clean install/uninstall and a
**minimal, documented registry footprint**. Two formats:

| Format | Use | Registry | Build on |
|---|---|---|---|
| **NSIS `.exe`** | Direct download / sideload | tiny, per-user (HKCU only) | Windows, or Linux/Codespaces **with Wine** |
| **MSIX/APPX** | **Microsoft Store** & modern sideload | **none** (containerized) | **Windows only** |

## Build it

### Codespaces / Linux (NSIS `.exe`)
The repo ships a devcontainer that preinstalls Wine (electron-builder runs the NSIS
compiler through Wine on Linux). Open in a **GitHub Codespace**, then:

```bash
cd desktop
npm run dist:win      # → desktop/release/LAUNCHPAD-Setup-<version>.exe
```

`npm run pack:win` produces just the unpacked `LAUNCHPAD.exe` (no Wine needed) for
quick smoke tests.

### Windows (NSIS `.exe` **and** MSIX)
```bash
cd desktop
npm run dist:win      # NSIS .exe
npm run dist:msix     # MSIX/APPX for the Store
```

### CI (recommended, authoritative)
`.github/workflows/desktop-installers.yml` builds both on a `windows-latest` runner
and uploads them as artifacts. Trigger via **Actions → Desktop installers → Run**,
or push a `desktop-v*` tag.

## NSIS `.exe` — what gets installed

Configured in `package.json › build.nsis`:

- **Per-user, no admin.** `perMachine: false`, `allowElevation: false` → installs to
  the user profile, **never writes HKLM**, no UAC prompt.
- **Assisted installer** (`oneClick: false`) — the user can pick the folder.
- **Shortcuts:** Desktop + Start Menu (no menu sub-category).
- **Clean uninstall:** `deleteAppDataOnUninstall: true` removes the app's data
  (settings, PIN, library overrides under `%APPDATA%\launchpad`) so nothing is left
  behind. Remove this flag if you'd rather keep settings across re-installs.

### Registry footprint (per-user only, HKCU)

The only registry writes are the unavoidable per-user uninstall registration so the
app appears in **Settings → Apps** with a working uninstaller:

```
HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\{appId}
  DisplayName, DisplayVersion, Publisher, DisplayIcon,
  InstallLocation, UninstallString, QuietUninstallString, EstimatedSize, NoModify, NoRepair
HKCU\Software\<appId>           (install dir / per-user install marker)
```

Not written / not used: **no HKLM**, no file associations, no protocol handlers, no
services, no scheduled tasks, no shell-extension entries. Uninstall removes the keys
above and the shortcuts.

> **Autostart is registry-free.** The kiosk's "launch at login" uses a shortcut in
> the per-user **Startup folder**
> (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LAUNCHPAD.lnk`), created/
> removed at runtime by the app — **not** the `HKCU\…\Run` registry value. Turning
> autostart off deletes the shortcut. The unkillable cage itself (kiosk window,
> single-instance lock, close/Alt+F4 block, auto-relaunch, return-to-launcher) is
> **100% runtime, zero registry**.

> MSIX note: when shipped via the Store, autostart is declared in the package
> manifest (`StartupTask`) and managed by Windows — also registry-free.

## MSIX / APPX — Microsoft Store

Configured in `package.json › build.appx`. MSIX is **containerized**: install and
uninstall are managed by Windows, leave **no loose registry entries**, and are the
cleanest possible footprint — ideal for the Store.

To submit to the Store:
1. Reserve the app name in **Partner Center** and copy the assigned **Identity**
   (`identityName`, `publisher` = `CN=...`, `publisherDisplayName`).
2. Put those values into `build.appx` (current values are placeholders).
3. Optionally add custom tile assets under `build/appx/` (Square150x150Logo,
   Square44x44Logo, Wide310x150Logo, StoreLogo); otherwise electron-builder derives
   them from `build/icon.*`.
4. Build on Windows (`npm run dist:msix`) and upload the `.appx`/`.msix` — **the
   Store re-signs it**, so no local code-signing cert is required for Store delivery.

## Code signing & SmartScreen

- The NSIS `.exe` is currently **unsigned** → Windows SmartScreen shows a warning on
  first run. For public distribution, sign with an **EV/OV code-signing certificate**
  (set `build.win.certificateFile` + password, or use Azure Trusted Signing).
- MSIX via the **Store is signed by Microsoft**; for MSIX *sideloading* you need your
  own signing cert.

## Auto-update

`build.publish` points at GitHub Releases. When you publish a signed installer +
`latest.yml` to a release (e.g. `electron-builder --publish always` with `GH_TOKEN`
on a tagged build), the in-app updater (`electron/services/updater.js`) picks it up.
The CI workflow builds artifacts only and does **not** auto-publish.
