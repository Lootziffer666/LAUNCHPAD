# HABITAT — the north star

LAUNCHPAD is the safe, shippable launcher. **HABITAT is what it wants to become:**
not a launcher you *use* but a world you **inhabit**. An avatar lives here. Things
change. It has moods, jokes, secrets — and a little bit of benevolent madness.

> Tone: **kids' cartoon × Monty Python × the warm wit of The Stanley Parable's narrator.**
> A launcher with a soul and a sense of humour. **Gentle, never scary.**

This file is the compass. Every feature should ask: *does this make HABITAT feel
more alive, more mine, more surprising — without ever betraying the kid's dignity?*

> **Scope line (important):** LAUNCHPAD/HABITAT is the warm, family product. It is
> **NOT** the horror/jumpscare launcher. The P.T.-style viral troll launcher (the
> "Stanley Launcher") is a **separate product** — different brand, different repo —
> that may reuse the underlying mischief engine but shares nothing of LAUNCHPAD's
> content or feel. See the bottom note. LAUNCHPAD never does jumpscares.

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
6. **One warm voice (kid + grown-ups).** Same world the whole family enjoys. A
   grown-up can get a slightly drier Monty-Python wit, but the feel never turns
   dark — LAUNCHPAD is bright, gentle, and **AuDHD-safe**, full stop.

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
  **Ships DORMANT** behind `FEATURES.personality` (`src/lib/features.js`) — v1 boots
  clean; the layer is switched on later, *schleichend per Update* (the sleeper effect).
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

**Phase 4 — Habitat depth**
- [ ] Richer customisation, more residents/events, seasonal content
- [ ] Shareable Habitat themes / packs (still warm, still family-safe)

## Sibling product (NOT LAUNCHPAD): the "Stanley Launcher"

The P.T.-style viral troll launcher — the one that makes a streamer jump — is a
**separate product**. Different name, different brand, **its own repo**. It may
reuse this project's *mischief engine* (the rare/timed/no-repeat machinery) as a
shared dependency, but it shares **none** of LAUNCHPAD's content, look, or family
feel. It is parked here only as a pointer so the two never get confused:

- **LAUNCHPAD** = warm, dignified, AuDHD-safe, family. **Never a jumpscare.**
- **Stanley Launcher** = horror/comedy troll for adults, opt-in, consent-gated,
  no-strobe/seizure-safe, built and shipped entirely on its own. Its design notes
  live with *that* project, not here.

## Design guardrails (so we don't lose the soul)

- Keep the **happy path sacred** — one tap to the game; mischief is seasoning.
- **Parent control ≤ kid delight** in the feature budget. For every gate, a joy.
- Mischief and personality are **data-driven** so they grow without code changes.
- Everything restrictive stays **fully optional**; "unlimited / calm / no mischief"
  are first-class states.
