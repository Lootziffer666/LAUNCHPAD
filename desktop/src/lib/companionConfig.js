/* ============================================================
   LAUNCHPAD — companion (the wandering critter) config.
   A living creature that roams the launcher: pet it and it lies down
   purring; pester it (rapid clicks) and it scratches and bolts off,
   sulking for a while before it wanders back. Emoji fallback now;
   drop a real sprite sheet in `sheet` to bring your art to life.
   AuDHD-safe: reduced motion → it sits calmly and never bolts.
   ============================================================ */

export const COMPANION = {
  enabled: true,
  fallback: '🐈', // shown until a sprite sheet is provided
  size: 92, // rendered height in stage px (stage is 1440×900)

  // Behaviour tuning
  scratchAt: 3, // this many clicks within rapidWindowMs → scratch + flee
  rapidWindowMs: 1500,
  petMs: 4200, // how long it lies down / purrs after a single pet
  awayMs: 26000, // how long it sulks off-screen after fleeing
  wanderMinMs: 1400, // pause range between wander hops
  wanderMaxMs: 4200,
  walkSpeed: 0.16, // px per ms while strolling
  fleeSpeed: 0.7, // px per ms while bolting

  // Ground band it roams within (keeps it near the "floor", away from the header)
  ground: { xMin: 80, xMax: 1360, yMin: 560, yMax: 820 },

  // --- Sprite sheet (optional) ---
  // Drop your animation sheet under desktop/public/sprites/ and describe it here.
  // Frames are read left→right on the given row. Example:
  //   sheet: {
  //     url: '/sprites/cat.png', frameW: 64, frameH: 64,
  //     animations: {
  //       idle:    { row: 0, frames: 4, fps: 4 },
  //       walk:    { row: 1, frames: 6, fps: 10 },
  //       lie:     { row: 2, frames: 4, fps: 6 },
  //       scratch: { row: 3, frames: 6, fps: 12 },
  //       run:     { row: 4, frames: 6, fps: 14 },
  //     },
  //   }
  sheet: null,
};
