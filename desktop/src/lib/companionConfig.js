/* ============================================================
   LAUNCHPAD — companion (the wandering critter) config.
   A living creature that roams the launcher: pet it and it lies down
   purring; pester it (rapid clicks) and it scratches and bolts off,
   sulking for a while before it wanders back.
   AuDHD-safe: reduced motion → it sits calmly and never bolts.
   ============================================================ */
import { CAT_BROWN_SHEET } from './residentsConfig.js';

export const COMPANION = {
  enabled: true,
  fallback: '🐈',
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
  ground: { xMin: 80, xMax: 720, yMin: 600, yMax: 820 },

  sheet: CAT_BROWN_SHEET,
};
