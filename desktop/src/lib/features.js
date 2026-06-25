/* ============================================================
   LAUNCHPAD — feature flags.
   v1 ships CLEAN. The personality / mischief layer (boot meta-game,
   gags, narrator, …) is present in the code but DORMANT — it arrives
   later, on purpose, *schleichend per Update*: a future release flips
   `personality` on (and can ramp `mischiefIntensity` over versions),
   so the launcher that was plain one day quietly comes alive the next.

   NOTE: dignity features (gentle wind-down, "Noch kurz" buffer,
   unlimited mode) are NOT part of this layer — they always ship.
   ============================================================ */

export const FEATURES = {
  // OFF for the shipping build. A later update sets this true.
  personality: false,

  // 0 = none … 1 = full. Lets the rollout ramp gently once `personality` is on.
  // Reserved for the update path; ignored while `personality` is false.
  mischiefIntensity: 0,
};

// Optional override hook for the update/rollout path (and dev): a future
// version can persist a flag and read it here without touching call sites.
export function personalityEnabled() {
  return !!FEATURES.personality;
}
