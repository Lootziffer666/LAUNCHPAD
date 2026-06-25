# Sprites — drop your animation sheets here

Files in `desktop/public/` are served at the app root, so a sheet saved as
`desktop/public/sprites/cat.png` is referenced as `/sprites/cat.png`.

## How to bring a sprite to life (the companion)

1. Drop your sheet here, e.g. `sprites/cat.png`.
2. Open `src/lib/companionConfig.js` and fill in `sheet`:

```js
sheet: {
  url: '/sprites/cat.png',
  frameW: 64,            // width of ONE frame, in px
  frameH: 64,            // height of ONE frame, in px
  animations: {
    // each row of the sheet is one animation; frames read left → right
    idle:    { row: 0, frames: 4,  fps: 4  },
    walk:    { row: 1, frames: 6,  fps: 10 },
    lie:     { row: 2, frames: 4,  fps: 6  },  // shown when petted (purring)
    scratch: { row: 3, frames: 6,  fps: 12 },  // shown when pestered
    run:     { row: 4, frames: 6,  fps: 14 },  // shown while fleeing
  },
}
```

### Sheet layout expected
- A grid: **rows = animations**, **columns = frames** (left → right).
- Every frame is exactly `frameW × frameH`. No padding between frames.
- Transparent background (PNG). Pixel art is rendered crisp (`image-rendering: pixelated`).
- The critter "stands" on its bottom edge — anchor art to the bottom of each frame.

If `sheet` is `null`, the companion falls back to a friendly emoji so the UI is
still alive. The five animation names above are the ones the companion uses; extra
rows are fine and ignored.

> Tip: send me one sheet + its grid (frame size, which row is which) and I'll wire
> the exact config for you.
