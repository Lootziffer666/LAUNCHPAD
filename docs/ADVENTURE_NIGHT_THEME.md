# Launchpad – Adventure Night

## UI audit

The functional home grid, folders, gestures and app launch path remain intentionally unchanged.
The most visible inherited surfaces were the opaque app drawer, generic search chrome, dense app
rows and the old dark status treatment. Those are the first surfaces replaced by this skin.

## Visual DNA

* **World:** deep blue night opening into twilight and a quiet green horizon.
* **Mood:** companionship, space and curiosity—not control, scoring or a game dashboard.
* **Accents:** warm starlight is reserved for progress, focus and small landmarks.
* **Type:** DM Sans for quiet utility text; Nunito only for short, friendly headings.
* **Space:** icons remain the primary content. Panels are translucent and only used when a second
  surface needs separation, such as the app drawer.
* **Shape and depth:** 18–28 dp radii, one-pixel light edges, no stacked cards or heavy shadows.
* **Motion:** tap feedback is a restrained 1.04× scale with a fast ease, never a bounce.

The background illustration is original Launchpad vector artwork. Its two travellers, sky,
starlight, hills and camp light use only generic geometric forms and no franchise characters,
symbols, type, logos or copied assets.

## Asset policy

This first theme stage is deliberately text-only in Git: Android XML gradients, shapes and
VectorDrawable paths provide the complete background and surface treatment. It introduces no
PNG, JPEG, WebP, binary font, encoded binary payload or external asset pack. Future raster
illustrations, if ever needed, must use named integration slots and be delivered separately;
the launcher must never require them to render a complete Adventure Night experience.

## Next visible surfaces

1. Retint the remaining contextual popup menu and folder editor with the night/mist tokens.
2. Replace inherited widget-picker chrome after the home and app-drawer interaction is validated.
3. Add an optional user setting for the Launchpad world versus a personal system wallpaper.
