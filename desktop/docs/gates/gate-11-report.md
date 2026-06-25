# Gate 11 -- Parent Mode PIN Gate in Controller Shell

**Status:** COMPLETE  
**Date:** 2026-06-19  
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|---------|
| `desktop/src/shells/ParentGate.jsx` | PIN entry overlay with keypad and recovery flow |
| `desktop/src/shells/ControllerGrid.jsx` (modified) | Ctrl+P shortcut, hint bar, navigation blocking |
| `desktop/docs/gates/gate-11-report.md` | This report |

## Features Implemented

### ParentGate PIN Entry (ParentGate.jsx)

A full-screen overlay providing controller-friendly PIN input:

- **Numpad Layout:** 3x4 grid (1-9, 0, Delete, Confirm) with 80px buttons
- **Arrow Key Navigation:** Focus moves spatially through keypad buttons
- **Direct Digit Input:** Physical keyboard 0-9 keys also work
- **PIN Display:** Entered digits shown as dots (privacy)
- **PIN Length:** 4-8 digits supported
- **Verification:** Calls `window.launchpad.verifyPin(pin)` via IPC
- **Curator Launch:** On correct PIN, calls `window.launchpad.openCurator(pin)`
- **Error Handling:** Friendly message on wrong PIN, no lockout counter visible
- **Escape to Close:** Returns to grid without any penalty

### Recovery Flow

Accessible via "PIN vergessen?" link at the bottom:

- Text input for XXXX-XXXX-XXXX recovery code
- Calls `window.launchpad.resetPinWithRecovery(code, '1234')`
- On success: informs parent PIN was reset to 1234
- On failure: friendly error message, can retry
- Escape returns to PIN entry or closes entirely

### ControllerGrid Integration

- **Ctrl+P Shortcut:** Opens the ParentGate overlay from anywhere in the grid
- **Hint Bar:** "Ctrl+P: Elternbereich" shown (subtle, low opacity)
- **Navigation Blocking:** Grid arrow keys and Enter are disabled while ParentGate is active
- **Global Handler:** Ctrl+P works regardless of overlay state (uses the profile/shortcut useEffect)

## Design Decisions

1. **No lockout counter** -- The child should not see failed attempts or feel pressured. The only feedback is a gentle "nicht korrekt" message.
2. **Fixed reset PIN** -- Recovery resets to '1234' (the default). Parent is prompted to change it immediately. This avoids a complex "enter new PIN" flow in the recovery overlay.
3. **Overlay z-index 9000** -- Above all other overlays (launch=6000, info=8000) to ensure parent gate is always on top.
4. **80px buttons** -- Large enough for 10-foot controller navigation, matching the controller-first design philosophy.
5. **No timer/pressure** -- The PIN entry is calm and friendly, suitable for a child-visible UI.
6. **Direct keyboard digits** -- Physical keyboard input works alongside the on-screen keypad for flexibility.

## IPC Channels Used

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `lp:pin:verify` | renderer -> main | Verify entered PIN |
| `lp:curator:open` | renderer -> main | Open curator window (PIN re-verified in main) |
| `lp:recovery:reset` | renderer -> main | Reset PIN with recovery code |

All channels already existed from the parental backend (Gate pre-existing) and FEAT-002.

## Testing

- `npm run build` succeeds (Vite compiles all JSX without errors)
- `npm test` passes (all 50 existing tests)
- No new runtime dependencies added

## Architecture

```
Ctrl+P pressed in ControllerGrid
    |
    v
setShowParentGate(true)
    |
    v
ParentGate mounts (z-index 9000, blocks grid nav)
    |
    v
User enters PIN via keypad (arrows navigate, digits input)
    |
    v
Submit -> window.launchpad.verifyPin(pin)
    |
    +-- ok=true --> openCurator(pin) --> close gate
    |
    +-- ok=false --> "nicht korrekt" message, clear input
    |
    v (alternative)
"PIN vergessen?" -> Recovery input
    |
    v
resetPinWithRecovery(code, '1234')
    |
    +-- ok --> "PIN auf 1234 zurueckgesetzt"
    +-- fail --> "Code nicht gueltig"
```

## Next Steps

- Gate 12: Gamepad API integration (physical A/B button mapping)
- Gate 13: Launch history and "recently played" sorting
