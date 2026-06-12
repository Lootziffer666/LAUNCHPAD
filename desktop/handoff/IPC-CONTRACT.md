# IPC contract — `window.launchpad` (two bridges since the two-app split)

Each window gets its own frozen, allow-listed preload bridge; the renderer **never** imports
Node modules. Every method maps to one `ipcRenderer.invoke` channel handled in
`electron/main.js`. All methods are async (return Promises).

**Enforcement is two-layered:** the child preload simply doesn't expose parent methods, AND
main answers curator-only channels **only** when `event.sender` is the curator window's
webContents (anything else gets `{ ok:false, reason:'forbidden' }`).

## Child bridge (`electron/preload.js` → index.html)

```ts
interface LaunchpadChildAPI {
  // games — approved-only + age-filtered + surfacing-sorted in main
  listGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | null>;     // null for un-approved / age-blocked ids
  launchGame(id: string): Promise<LaunchResult>;
  installGame(id: string): Promise<Game>;
  setFavorite(id: string, value: boolean): Promise<Game>;

  // shell / gate
  verifyPin(pin: string): Promise<boolean>;
  pinStatus(): Promise<{ pinIsDefault: boolean }>;       // demo-PIN hint only, no settings leak
  openCurator(pin: string): Promise<{ ok: boolean }>;    // PIN re-verified in MAIN, then the
                                                         // curator window opens (the only door)
  // events
  onGameClosed(cb): () => void;
  onTimeLimitReached(cb): () => void;
  onGamesChanged(cb): () => void;   // any mutation in either window → refetch
}
```

## Curator bridge (`electron/preload-curator.js` → curator.html)

```ts
interface LaunchpadCuratorAPI {
  // catalogue — full, unfiltered (curation states, containment, tags included)
  listAllGames(): Promise<Game[]>;
  upsertGame(patch: Partial<Game> & {id?: string}): Promise<Game>; // curation edits go here too
  removeGame(id: string): Promise<void>;
  resetGames(): Promise<void>;
  setCover(id: string, source: CoverSource): Promise<Game>;

  // covers (SteamGridDB) — key + fetch live in MAIN
  searchCovers(query: string): Promise<{ok: boolean, results?: CoverHit[]}>;
  coversKeyStatus(): Promise<{hasKey: boolean, fromEnv?: boolean}>;
  setCoversKey(key: string): Promise<{hasKey: boolean}>;

  // parental settings / PIN / usage
  setPin(oldPin: string, newPin: string): Promise<boolean>;
  getParentalSettings(): Promise<ParentalSettings>;
  setParentalSettings(patch: Partial<ParentalSettings>): Promise<ParentalSettings>;
  getUsageToday(): Promise<{ usedMin: number; limitMin: number }>;

  onGamesChanged(cb): () => void;
}
```

```ts
type LaunchResult =
  | { ok: true; internal?: boolean; dryRun?: boolean }
  | { ok: false;
      reason: 'not_approved' | 'not_installed' | 'blocked' | 'time_limit' | 'not_found' | 'error';
      errorClass: 'recoverable' | 'blocked' | 'parent_required' | 'fatal';  // drives the child
      message?: string };                                                   // transition UI

type CoverSource =
  | { kind: 'url'; url: string }
  | { kind: 'dataUrl'; data: string }
  | { kind: 'gridDb'; id: number };
```

## Channel naming
`lp:games:list`, `lp:games:launch`, `lp:pin:verify`, `lp:curator:open`, … (namespace `lp:`).
One channel→handler map per scope in `main.js` (`childHandlers` / `curatorHandlers`); any
channel not in a map rejects, curator channels additionally check the sender.
