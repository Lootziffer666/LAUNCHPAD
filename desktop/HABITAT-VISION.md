# HABITAT — the north star

LAUNCHPAD is the safe, shippable launcher. **HABITAT is what it wants to become:**
not a launcher you *use* but a world you **inhabit**. An avatar lives here. Things
change. It has moods, jokes, secrets — and a little bit of benevolent madness.

> Tone: **kids' cartoon × Monty Python × The Stanley Parable × P.T.**
> A launcher with a soul and a sense of humour. **Adult version included.**

This file is the compass. Every feature should ask: *does this make HABITAT feel
more alive, more mine, more surprising — without ever betraying the kid's dignity?*

---

## Pillars

1. **Inhabited.** An avatar (the kid) and a place. You arrive somewhere, you don't
   open a menu. Time of day, weather, seasons, little residents.
2. **Alive & changing.** Mini-events, rotating interactions, a narrator/off-screen
   voice with sharp, warm commentary. It's never exactly the same twice.
3. **Social, Animal-Crossing-style.** Visit other people's Habitats. Leave things.
   Bring something back. Asynchronous, gentle, no pressure.
4. **Mischief (The Stanley Parable / Monty Python).** The world plays with you:
   - the boot that *always* takes its sweet ~7s — except the rare long troll
   - a game that refuses to be picked (the cursor edges away) — then relents
   - "you chose X… so here's Y. My choice." 🤣 (rare, always self-corrects)
   - props that lie, captions that argue, a loading bar that finishes a keystroke early
5. **Easter eggs & love notes.** Rare warm moments — *"Daddy war hier 💜"* — hidden
   in the machine, found, not announced.
6. **Two voices: kid & adult.** Same engine, different content/intensity. The adult
   version leans harder into Monty Python / P.T.; the kid version stays bright,
   gentle, and **AuDHD-safe**.

## The non-negotiable: AuDHD-safe mischief

The mischief must **delight, never destabilise**. Rules for every gag:
- **Rare** and **never back-to-back** (the engine enforces this).
- **Always clearly a joke**, and **always self-corrects** within seconds.
- **No pressure, no scary audio, no strobing.** Honour reduced-motion.
- **A calm switch.** On a hard day, mischief is off and everything is plain and
  predictable. (`mischief: false` / reduced motion already does this for the boot.)
- The chosen game **always eventually launches** — a refusal gag never blocks play.

## What already exists (the first seeds)

- **Boot meta-game** — `src/lib/bootAnimations.js` + `src/boot/BootSequence.jsx`:
  randomly rotates boot clips (drop your Steam Deck animations into the manifest),
  all the same length except one rare long gag (the 20s "plug in a controller"
  troll). Built-in CSS fallback incl. the warm *"Daddy war hier"* variant. Calm
  mode for sensitive days. Selection is pure + deterministic.
- **Gentle wind-down + "Noch kurz" buffer + unlimited mode** — dignity over control.
- **Curated, per-title library** (Steam import, USK-as-advice) — the loving act of
  picking games *for* someone.

## Roadmap (rough, sequenced for joy)

**Phase 1 — Personality layer (in progress)**
- [x] Boot meta-game with random clips + rare long gag + calm mode
- [ ] Narrator/off-screen voice: data-driven quip engine (events → lines, cooldown,
      intensity), mascot speech bubble. *Make it trivial for Daddy to add lines.*
- [ ] Mischief catalog v1: the "refuses to be selected" cursor gag + the
      "my-choice launches a different game" gag (rare, self-correcting, toggleable)
- [ ] More easter eggs (long-press the mascot, Konami code, etc.)

**Phase 2 — Habitat surface**
- [ ] Avatar + a place (a room/island instead of a tile wall), customisation
- [ ] Time-of-day / weather / seasons; ambient little residents
- [ ] Mini-events that rotate

**Phase 3 — Social (Animal Crossing)**
- [ ] Visit another Habitat (companion/cloud sync), leave/bring small things
- [ ] Gifts, mailbox, gentle async presence

**Phase 4 — Two editions**
- [ ] Adult version: harder Monty Python / P.T. energy, mature content tier
- [ ] Shared engine, separate content packs + intensity profiles

## Design guardrails (so we don't lose the soul)

- Keep the **happy path sacred** — one tap to the game; mischief is seasoning.
- **Parent control ≤ kid delight** in the feature budget. For every gate, a joy.
- Mischief and personality are **data-driven** so they grow without code changes.
- Everything restrictive stays **fully optional**; "unlimited / calm / no mischief"
  are first-class states.
