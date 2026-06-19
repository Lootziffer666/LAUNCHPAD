# Gate 15 -- Xbox Cloud Shortcut Model Documented

**Status:** COMPLETE
**Date:** 2026-06-19
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|--------|
| `desktop/docs/xcloud-model.md` | Full xCloud integration model documentation |
| `desktop/docs/gates/gate-15-report.md` | This report |

## Documentation Covers

- Game object schema for xCloud entries (`launchType: 'edge-xcloud'`)
- Launch mechanism: `msedge --kiosk <url> --edge-kiosk-type=fullscreen`
- URL format: `https://www.xbox.com/play/games/<slug>`
- Discovery model: manual parent addition only (no auto-discovery)
- Session lifecycle: spawn, PID tracking, kill, force-kill fallback
- System requirements (Edge, Game Pass, internet, controller)
- Security considerations (kiosk mode lockdown, no address bar)
- Platform-specific Edge binary paths (Windows, Linux, macOS)

## Design Rationale

xCloud games are treated as a distinct launch type rather than piggybacking on the
existing `uri` type. This is deliberate:

1. The URL scheme is `https://` which is not in ALLOWED_SCHEMES (and should not be)
2. The launch requires specific Edge kiosk flags, not a generic openExternal
3. Session lifecycle (PID tracking + kill) is unique to this launch type
4. The parent must explicitly add each game -- no risk of auto-importing

## No Code Changes

Gate 15 is documentation-only. The actual implementation of the `edge-xcloud`
launch type is delivered in Gate 16 (session lifecycle).

## Testing

No code changes, so no test impact. Existing 57 tests remain green.
