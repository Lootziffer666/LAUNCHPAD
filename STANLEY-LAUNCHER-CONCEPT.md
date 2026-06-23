> ⚠️ **SEPARATE PRODUCT — NOT LAUNCHPAD.**
> This is the concept for the standalone **Stanley Launcher** (adult horror/comedy
> troll). It is **not** part of LAUNCHPAD, shares none of its content/feel, and
> should live in **its own repo**. Captured here only so the idea isn't lost —
> move it out when the Stanley repo exists. LAUNCHPAD stays warm and never scary.

# Stanley Launcher — the slow burn

A launcher that, over many sessions and **real elapsed days**, stops being a tool
and starts *noticing you*. The horror is in the doubt — "was that real?" — long
before anything overt happens. Then the fourth wall goes.

> Tone: **The Stanley Parable × P.T. × a Mr. X / Nemesis-style stalker** who is in
> no hurry at all.

## The escalation arc (example beats)

The dread is **gated by usage + time**, not random — that's what makes it feel
*aware*. Each stage only arms after the previous one has had time to settle.

1. **Seed.** You use the launcher, you launch a game. Nothing unusual. It learns
   your habit (which game, how often).
2. **A sigh.** Next direct launch of that game → a subtle, almost-deniable sigh.
3. **The flinch.** Next time the cursor *glitches just past* the target for a
   frame. Could be your mouse. Could be nothing.
4. **Doubt.** Then: nothing. Everything normal. Later — footsteps somewhere.
   Nothing there. Something shifts behind an icon in your **peripheral vision**;
   you look — gone.
5. **The knock.** You launch the game and **3× KNOCK**, blown-out / too loud.
   Silence. Then **everything is normal for ~3 days.** (The wait is the weapon.)
6. **Refusal.** You go to launch it. A voice: *"Schon wieder? Ich glaube nicht."*
   The icon vanishes.
7. **The reveal.** While you fight for control of the cursor, someone steps —
   unhurried — out from behind an icon. He talks *to you*: about the simple,
   monotonous life this little Stanley-aversion leads, trapped in the loop.
8. **Then the games begin.**

## Engineering shape (shared "mischief engine", dialled to dread)

- A **persistent escalation state machine**: stage advances on (launch count of a
  specific game) × (real days elapsed since last beat). Survives restarts.
- **Per-target memory** (it picks the game *you* keep launching).
- Effect primitives: deniable cursor nudge, peripheral-motion sprite, positional
  ambient audio, the overdrive knock, voice lines, icon removal, an **actor reveal**
  (the stalker), and eventually scripted "games".
- **Pacing engine**: long cooldowns and quiet stretches are first-class — the
  silence between beats is the design.

## Non-negotiable safety (or it's a liability, not a hit)

- **Opt-in / consent on first run** + clear horror content warning.
- **No strobing / rapid flashing** — photosensitivity is real harm. Reduced-motion
  = no scares.
- **Recoverable always** — never bricks the session; the chosen game can still run.
- **Hard wall from LAUNCHPAD** — none of this code or content ever ships in the
  family build.
