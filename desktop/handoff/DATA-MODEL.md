# Data model

Persisted by the **main process** via `electron-store` (JSON on disk, in `app.getPath('userData')`).
The renderer only ever sees these shapes through IPC.

## Game

```jsonc
{
  "id": "minecraft",                // stable slug; custom games use "custom-<timestamp>"
  "name": "Minecraft",
  "cat": "Sandbox",                 // free-text category / genre
  "source": "Minecraft",            // "Steam" | "Minecraft" | "Scratch" | "LAUNCHPAD" | "Custom"
  "installed": true,
  "favorite": true,
  "featured": false,                // at most one true → Play hero + desktop live tile
  "stars": 5,                       // 1..5 editorial rating
  "progress": 0.0,                  // 0..1, drives "Weiterspielen"
  "playtime": "48 Std",             // display string (or store minutes + format in UI)

  // ── launch target (see GAME-LAUNCHING.md) ──
  "launch": {
    "kind": "steam",                // "steam" | "uri" | "exe" | "uwp" | "internal"
    "appId": "",                    // steam appid  (kind=steam)
    "uri": "",                      // full protocol uri (kind=uri, e.g. minecraft://)
    "path": "",                     // absolute exe path (kind=exe)
    "args": [],                     // optional exe args
    "aumid": "",                    // UWP AppUserModelID (kind=uwp)
    "route": ""                     // internal route (kind=internal, e.g. LAUNCHPAD mini-games)
  },

  // ── cover art ──
  "cover": null,                    // null → use generated duotone key-art; else image URL/dataURL
  "c1": "#3b8526", "c2": "#0f3d1a", // duotone fallback colors
  "emblem": "grid",                 // fallback icon id (see icons.jsx)

  "desc": "Bau, erkunde und überlebe …"  // 1–2 sentence blurb for Game Detail
}
```

Seed data lives in the prototype's `js/data.jsx` (`GAMES`, `DIRECT`, `SOURCES`). Move it to
`electron/services/gameRegistry.js` as the default registry; user edits layer on top
(the prototype's override/custom model in `gamestore.jsx` maps directly to this).

## Profile

```jsonc
{
  "kidName": "Jake",
  "avatar": null,                   // dataURL or resource path
  "theme": "space",                 // "space" | "midnight" | "aurora"
  "accent": "#38bdf8",
  "sound": true,
  "reduceMotion": false
}
```

## Parental settings

```jsonc
{
  "pinHash": "<scrypt/argon2 hash>", // NEVER store the raw PIN; demo prototype uses "1234"
  "ageRating": "9",                  // "6" | "9" | "12" → filters which games are visible
  "dailyLimitMin": 90,
  "bedtime": { "from": "20:30", "to": "07:00" },
  "approvals": {                     // per-app allow list
    "browser": true, "videos": true, "music": true, "play": true, "friends": false
  },
  "usage": { "<YYYY-MM-DD>": 54 }    // minutes used per day (for the week chart)
}
```

## Notes
- **PIN:** hash with `scrypt`/`argon2` in main; `verifyPin` compares hashes. The `1234` in the
  prototype (`js/windows.jsx` → `PARENT_PIN`) is a demo placeholder — replace on first run / setup.
- **Age rating** should gate `listGames()` server-side (main filters), not just hide in the UI.
- **Usage** ties into `onTimeLimitReached` → renderer locks back to LAUNCHPAD / a "time's up" screen.
