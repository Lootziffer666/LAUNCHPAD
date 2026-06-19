# Xbox Cloud Gaming (xCloud) -- Shortcut Model

## Overview

Xbox Cloud Gaming (xCloud) games are cloud-streamed titles that run in the browser.
They do not require local installation and are not auto-discoverable from the filesystem.
Parents manually add xCloud games to the LAUNCHPAD library through the Curator.

## Game Object Schema

```js
{
  id: 'xcloud-<slug>',        // unique identifier, e.g. 'xcloud-forza-horizon-5'
  title: 'Forza Horizon 5',
  source: 'xcloud',
  launchType: 'edge-xcloud',
  launchTarget: 'https://www.xbox.com/play/games/<slug>',
  installed: true,             // always true (cloud = always available)
  cat: 'Rennen',
  curation: 'new',            // starts as 'new', parent must approve
}
```

## Launch Mechanism

xCloud games launch Microsoft Edge in kiosk (fullscreen) mode:

```
msedge --kiosk <url> --edge-kiosk-type=fullscreen
```

Parameters:
- `--kiosk <url>` -- Opens Edge in kiosk mode at the specified URL
- `--edge-kiosk-type=fullscreen` -- Removes all browser chrome (address bar, tabs, etc.)

The child sees only the game stream, with no access to the browser itself.

## URL Format

All xCloud game URLs follow this pattern:

```
https://www.xbox.com/play/games/<slug>
```

Examples:
- `https://www.xbox.com/play/games/forza-horizon-5`
- `https://www.xbox.com/play/games/minecraft-legends`
- `https://www.xbox.com/play/games/sea-of-thieves`

The slug is the URL-friendly game name as listed on xbox.com/play.

## Discovery

There is **no automatic discovery** for xCloud games. Parents must:

1. Open the Curator (Familienzentrale)
2. Click "Spiel hinzufuegen"
3. Set `launchType: 'edge-xcloud'`
4. Enter the xCloud URL as `launchTarget`
5. Approve the game (curation state -> 'approved')

This is intentional: xCloud requires an active Xbox Game Pass subscription, and
the child should not see games the family does not have access to.

## Session Lifecycle

1. **Spawn:** LAUNCHPAD spawns `msedge` as a detached child process with kiosk flags
2. **Track:** The spawned process PID is stored for cleanup
3. **Kill:** When the child presses "Spiel beenden" (or time limit / bedtime triggers),
   LAUNCHPAD sends SIGTERM (Linux/macOS) or calls `taskkill` (Windows) on the PID
4. **Fallback:** If the process does not exit within 5 seconds, force-kill

## Requirements

- Microsoft Edge must be installed on the system
- An active Xbox Game Pass Ultimate subscription is required for cloud streaming
- A stable internet connection (minimum 10 Mbps recommended)
- A connected controller (Xbox controller recommended)

## Security Considerations

- The kiosk mode prevents the child from navigating away from the game page
- Edge in kiosk mode has no address bar, so the child cannot browse freely
- The LAUNCHPAD session kill ensures Edge is always cleaned up
- `edge-xcloud` is a dedicated launch type -- it does not inherit from the
  generic `uri` type, so the ALLOWED_SCHEMES list is not bypassed

## Platform Notes

| Platform | Edge Binary | Notes |
|----------|-------------|-------|
| Windows  | `msedge` (in PATH) or `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` | Primary target |
| Linux    | `microsoft-edge` or `microsoft-edge-stable` | Available via Microsoft repo |
| macOS    | `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge` | Less common for gaming |

LAUNCHPAD currently targets Windows as the primary platform for xCloud gaming.
