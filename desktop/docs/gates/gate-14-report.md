# Gate 14 -- Steam Library Import (VDF Parser + IPC)

**Status:** COMPLETE
**Date:** 2026-06-19
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|--------|
| `desktop/electron/services/steamImport.js` | VDF parser + Steam library scanner |
| `desktop/electron/services/steamImport.test.js` | Unit tests for VDF parsing and scan pipeline |
| `desktop/electron/main.js` (modified) | Registered `lp:games:scan-steam` IPC channel (curator-only) |
| `desktop/electron/preload-curator.js` (modified) | Exposed `scanSteam()` on the curator bridge |
| `desktop/docs/gates/gate-14-report.md` | This report |

## VDF Parser

A minimal recursive-descent parser for Valve Data Format (VDF/ACF files):

- Handles quoted strings with escape sequences (`\\`, `\"`, `\n`, `\t`)
- Supports nested objects (braces)
- Handles `//` line comments
- Graceful with empty or malformed input

## Steam Scanner Pipeline

1. **Path Discovery:** Checks default Steam install locations per platform:
   - Windows: `C:\Program Files (x86)\Steam`, `C:\Program Files\Steam`
   - Linux: `~/.steam/steam`, `~/.local/share/Steam`
   - macOS: `~/Library/Application Support/Steam`
2. **libraryfolders.vdf:** Parsed to extract library folder paths (supports both
   newer object format and older string-path format)
3. **ACF Scan:** Each library's `steamapps/` is scanned for `appmanifest_*.acf` files
4. **Extraction:** appid + name extracted from each manifest
5. **Output format:** `{ id: 'steam-<appid>', title, source: 'steam', launchType: 'steam', launchTarget: 'steam://rungameid/<appid>', installed: true }`
6. **Deduplication:** Same appid across multiple libraries is reported only once

## IPC Integration

- Channel: `lp:games:scan-steam` (curator-only, enforced in main.js)
- Preload: `window.launchpad.scanSteam()` available in the curator renderer
- Returns `[]` gracefully when Steam is not installed

## Testing

7 new tests:
- VDF parsing of libraryfolders.vdf format
- VDF parsing of appmanifest ACF format
- Escaped characters in paths/strings
- Empty input handling
- Comment handling
- Graceful empty return when Steam not installed
- Full pipeline test with mock temp directory (writes VDF + ACF files, parses them)

All 57 tests pass (50 existing + 7 new). Build succeeds.
