/* ============================================================
   LAUNCHPAD — boot animations.
   The launcher boots into a randomly chosen animation from a
   collection (the user's curated Steam Deck boot clips). They all
   run the SAME length — the dependable ~7s boot — EXCEPT one long
   gag clip that fires only rarely (e.g. the 20s "plug in a
   controller" troll). Drop real video files into the manifest;
   until then a built-in CSS fallback keeps the boot full of
   character (including a warm, rare "Daddy war hier 💜").

   pickAnimation() is pure → unit-tested for the rotation, the
   no-immediate-repeat rule, the rare-gag odds, and calm mode.
   ============================================================ */

// Real clips. Drop files into desktop/public/boot/ and list them here. Keep
// every NORMAL clip the same durationMs; mark the single long troll gag:true.
//   { id: 'deck-classic', src: 'boot/deck-classic.webm', durationMs: 7000 }
//   { id: 'controller-troll', src: 'boot/controller-troll.webm', durationMs: 20000, gag: true }
export const BOOT_MANIFEST = [];

// Built-in CSS fallbacks (no video files needed). Same contract: the normals
// share one length, the gag is the long one.
export const FALLBACK_CLIPS = [
  { id: 'rocket', kind: 'css', variant: 'rocket', durationMs: 7000, caption: 'LAUNCHPAD' },
  { id: 'warp', kind: 'css', variant: 'warp', durationMs: 7000, caption: 'LAUNCHPAD' },
  { id: 'daddy', kind: 'css', variant: 'daddy', durationMs: 7000, caption: 'Daddy war hier 💜', warm: true },
  { id: 'controller', kind: 'css', variant: 'controller', durationMs: 20000, gag: true, caption: 'Bitte Controller einstecken …' },
];

export function listClips({ manifest = BOOT_MANIFEST, fallback = FALLBACK_CLIPS } = {}) {
  return manifest.length ? manifest : fallback;
}

function pickNoRepeat(pool, last, rng) {
  if (!pool || pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  const choices = pool.filter((c) => c.id !== last);
  const arr = choices.length ? choices : pool;
  return arr[Math.floor(rng() * arr.length)];
}

// Choose the next boot clip. Deterministic given `rng` so tests pin every path.
//   reduceMotion / mischief:false → calm: a normal clip, never the long gag.
//   otherwise → the long gag fires ~1 in 7 boots; else a random normal clip,
//   never the same one twice in a row.
export function pickAnimation({ clips, last = null, reduceMotion = false, mischief = true, rng = Math.random } = {}) {
  const all = clips && clips.length ? clips : FALLBACK_CLIPS;
  const normals = all.filter((c) => !c.gag);
  const gags = all.filter((c) => c.gag);

  if (reduceMotion || !mischief) {
    return pickNoRepeat(normals.length ? normals : all, last, rng);
  }
  if (gags.length && rng() < 1 / 7) {
    return pickNoRepeat(gags, last, rng);
  }
  return pickNoRepeat(normals.length ? normals : all, last, rng);
}

export const durationOf = (clip) => (clip && clip.durationMs) || 7000;
