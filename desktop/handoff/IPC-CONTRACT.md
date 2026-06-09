# IPC contract — `window.launchpad`

The preload script exposes a single, frozen, allow-listed API to the renderer.
The renderer **never** imports Node modules. Every method maps to one `ipcRenderer.invoke`
channel handled in `electron/main.js`. All methods are async (return Promises).

```ts
// Type sketch (TS for clarity; ship as JSDoc if the renderer is plain JS)
interface LaunchpadAPI {
  // ── Games ────────────────────────────────────────────────
  listGames(): Promise<Game[]>;                       // merged registry (seed + user edits)
  getGame(id: string): Promise<Game | null>;
  launchGame(id: string): Promise<LaunchResult>;       // ← starts Steam/Minecraft/exe (vetted)
  installGame(id: string): Promise<Game>;              // mark installed / kick off install flow
  setFavorite(id: string, value: boolean): Promise<Game>;
  setCover(id: string, source: CoverSource): Promise<Game>; // url | dataURL | gridDbId
  upsertGame(patch: Partial<Game> & {id?: string}): Promise<Game>; // add/edit (parent only)
  removeGame(id: string): Promise<void>;

  // ── Cover art (SteamGridDB) ──────────────────────────────
  // API key + fetch live in MAIN (CORS + secret stay out of the renderer).
  searchCovers(query: string): Promise<CoverHit[]>;    // returns CDN image URLs
  // (Prototype fallback — paste URL / drag-drop image — still supported via setCover.)

  // ── Shell / session ──────────────────────────────────────
  verifyPin(pin: string): Promise<boolean>;            // unlock → Windows desktop
  setPin(oldPin: string, newPin: string): Promise<boolean>;
  switchShell(mode: 'launchpad' | 'windows'): Promise<void>; // optional: tell main for kiosk flags
  getProfile(): Promise<Profile>;

  // ── Parental ─────────────────────────────────────────────
  getParentalSettings(): Promise<ParentalSettings>;
  setParentalSettings(patch: Partial<ParentalSettings>): Promise<ParentalSettings>;
  getUsageToday(): Promise<{ usedMin: number; limitMin: number }>;

  // ── System (read-only, for the desktop chrome) ───────────
  getSystemInfo(): Promise<{ battery?: number; online: boolean; volume: number }>;

  // ── Events (main → renderer) ─────────────────────────────
  onGameClosed(cb: (id: string) => void): () => void;  // returns unsubscribe
  onTimeLimitReached(cb: () => void): () => void;       // lock back to a safe screen
}

type LaunchResult =
  | { ok: true; pid?: number }
  | { ok: false; reason: 'not_installed' | 'blocked' | 'time_limit' | 'not_found' | 'error'; message?: string };

type CoverSource =
  | { kind: 'url'; url: string }
  | { kind: 'dataUrl'; data: string }
  | { kind: 'gridDb'; id: number };
```

## Channel naming
`lp:games:list`, `lp:games:launch`, `lp:pin:verify`, `lp:parental:get`, … (namespace `lp:`).
Keep a single map in `main.js`; reject any channel not in the map.

## Renderer migration (from the prototype)
The prototype's `GameStore` (in `gamestore.jsx`) already centralizes all reads/writes and
exposes a `useGames()` hook + a subscribe model. **Re-implement that same surface on top of IPC:**

```js
// src/games/useGames.js  (target)
export function useGames() {
  const [games, setGames] = useState([]);
  useEffect(() => {
    let alive = true;
    window.launchpad.listGames().then(g => alive && setGames(g));
    const off = window.launchpad.onGameClosed(() => window.launchpad.listGames().then(setGames));
    return () => { alive = false; off(); };
  }, []);
  return games;
}
// GameStore.setCover/setFavorite/etc → call window.launchpad.* then refetch.
```

Because every component already goes through `GameStore` / `useGames`, swapping the backend
is a **single-file change** in the renderer.
