# Gate 18 -- PEGI/USK Reason Chips in Info Overlay

## Summary

The InfoOverlay (shown on Tab/X in the controller grid) now displays rating
reasons as styled chips/tags instead of plain comma-separated text. Additionally,
an explanatory note clarifies that these are informational age recommendations
and do not trigger automatic blocking.

## Files

| File | Change |
|------|--------|
| `src/shells/InfoOverlay.jsx` | Reasons displayed as pill-shaped chips; PEGI/USK explanation text added |

## Design Decisions

- **Chip style**: Pill-shaped (`border-radius: 999`), subtle background, matching
  the warm color palette. No aggressive colors since these are informational, not
  warnings.
- **Explanation text**: "Altersempfehlung (informativ, kein automatischer Block)"
  communicates clearly that the rating display is for parental awareness, not an
  enforced restriction.
- **Conditional rendering**: The explanation only shows when ratings exist. Chips
  only render when the `reasons` array is non-empty.

## Verification

- `npm run build` succeeds
- `npm test` passes (no regressions)
