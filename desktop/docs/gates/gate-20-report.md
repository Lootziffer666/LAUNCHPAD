# Gate 20 -- Boot Animation and Transition Masking

## Summary

When the controller shell activates (mode === 'controller'), a warm boot screen
shows "LAUNCHPAD" with a house icon for 1.5 seconds, then the grid fades in
smoothly. When leaving the grid, a matching fade-out transition plays before
returning to the Launchpad shell. All animations are CSS-only.

## Files

| File | Change |
|------|--------|
| `src/shells/BootScreen.jsx` | New component: boot splash + fade reveal logic |
| `src/App.jsx` | Wraps ControllerGrid in BootScreen; adds fade-out on back transition |

## Behavior

1. **Boot-in**: On entering controller mode:
   - Boot splash appears (house icon + "LAUNCHPAD" text, navy background)
   - Initial fade-in animation (400ms, subtle scale from 0.96 to 1)
   - After 1.5s, splash fades out (500ms) while grid fades in simultaneously
   - Total boot sequence: ~2s

2. **Fade-out**: When pressing Escape/Back in the controller grid:
   - Grid fades out (400ms ease-out)
   - Mode switches to launchpad after the fade completes

## Design Decisions

- **CSS-only**: No animation libraries. Uses `transition` + `opacity` for fade,
  `@keyframes` for the initial boot-in pulse.
- **Non-blocking**: The grid content renders behind the splash from the start.
  The boot screen is a visual mask, not a loading gate.
- **House icon**: Inline SVG matching the project branding (simple house shape
  from the icon set). No external asset dependency.
- **Duration**: 1.5s boot duration balances "feels intentional" vs. "not too slow".
  The grid is usable within 2s of activation.
- **Respect reduce-motion**: The parent `data-reduce` attribute can be used by
  future CSS to skip animations. The current implementation uses inline styles
  which are not affected, but the architecture supports it.

## Verification

- `npm run build` succeeds
- `npm test` passes (no regressions)
