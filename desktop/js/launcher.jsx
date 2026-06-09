/* ============================================================
   LAUNCHPAD — Play (library) + Game Detail
   ============================================================ */
const { useState: useStateL, useEffect: useEffectL, useRef: useRefL } = React;
const DL = window.CometData;

const TABS = [
  { id: "bibliothek", label: "bibliothek" },
  { id: "favoriten", label: "favoriten" },
  { id: "installiert", label: "installiert" },
];

function srcBadge(g) {
  const s = DL.SOURCES[g.source] || DL.SOURCES.LAUNCHPAD;
  return <span className="g-src" style={{ background: s.c }}>{s.label}</span>;
}
function stars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

function CoverFill({ g, children }) {
  if (g.cover) return <div className="cv" style={{ backgroundImage: `url("${g.cover}")`, backgroundSize: "cover", backgroundPosition: "center" }}>{children}</div>;
  return (
    <div className="cv" style={{ background: DL.cover(g.c1, g.c2) }}>
      <div className="cv-ring"></div>
      <div className="cv-emb">{window.Icon[g.emblem] && window.Icon[g.emblem]()}</div>
      {children}
    </div>
  );
}

/* ---------- Game Detail ---------- */
function GameDetail({ g, onBack, onLaunch }) {
  const [installing, setInstalling] = useStateL(false);
  const install = () => {
    setInstalling(true);
    window.SFX && SFX.select();
    setTimeout(() => { GameStore.install(g.id); setInstalling(false); }, 1400);
  };
  return (
    <div className="gd">
      <div className="gd-bg" style={g.cover
        ? { backgroundImage: `url("${g.cover}")` }
        : { background: DL.cover(g.c1, g.c2) }}></div>
      <div className="gd-bg-scrim"></div>

      <button className="gd-back" onClick={onBack}>{window.Icon.chevL()} Zurück</button>

      <div className="gd-inner">
        <div className="gd-cover"><CoverFill g={g} /></div>
        <div className="gd-info">
          <div className="gd-srcrow">
            {srcBadge(g)}
            <span className={`gd-state ${g.installed ? "on" : ""}`}>
              {g.installed ? <>{window.Icon.shield()} Installiert</> : "Nicht installiert"}
            </span>
          </div>
          <h1 className="gd-title">{g.name}</h1>
          <div className="gd-meta">{g.cat} · {stars(g.stars)}{g.installed && g.playtime !== "—" ? ` · ${g.playtime} gespielt` : ""}</div>
          <p className="gd-desc">{g.desc}</p>

          {g.progress > 0 && g.installed && (
            <div className="gd-prog">
              <div className="gd-prog-lbl"><span>Fortschritt</span><span>{Math.round(g.progress * 100)}%</span></div>
              <div className="gd-prog-bar"><i style={{ width: `${g.progress * 100}%` }}></i></div>
            </div>
          )}

          <div className="gd-actions">
            {g.installed ? (
              <button className="gd-play" onClick={() => onLaunch(g)}>{window.Icon.play()} {g.progress > 0 ? "Weiterspielen" : "Starten"}</button>
            ) : (
              <button className="gd-play install" onClick={install} disabled={installing}>
                {installing ? <>{window.Icon.bolt()} Wird installiert…</> : <>{window.Icon.plus()} Installieren</>}
              </button>
            )}
            <button className={`gd-fav ${g.favorite ? "on" : ""}`} onClick={() => { GameStore.toggleFavorite(g.id); window.SFX && SFX.select(); }}>
              {window.Icon.heart()} {g.favorite ? "Favorit" : "Merken"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Play library ---------- */
function PlayOverlay({ kidName, origin, onExit, onOpenImport, initialGame }) {
  const games = useGames();
  const [tab, setTabRaw] = useStateL(0);
  const [closing, setClosing] = useStateL(false);
  const [detail, setDetail] = useStateL(initialGame || null);
  const [launch, setLaunch] = useStateL(null);

  const setTab = (i) => { if (i !== tab) window.SFX && SFX.swipe(); setTabRaw(i); };
  const doExit = () => { setClosing(true); window.SFX && SFX.close(); setTimeout(onExit, 300); };
  const openDetail = (g) => { window.SFX && SFX.select(); setDetail(g); };
  const launchGame = (g) => { window.SFX && SFX.launch(); setLaunch(g); };

  useEffectL(() => {
    const onKey = (e) => {
      if (launch) { if (e.key === "Escape") setLaunch(null); return; }
      if (detail) { if (e.key === "Escape") setDetail(null); return; }
      if (e.key === "Escape") doExit();
      else if (e.key === "ArrowRight") setTab(Math.min(tab + 1, TABS.length - 1));
      else if (e.key === "ArrowLeft") setTab(Math.max(tab - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, detail, launch]);

  // keep detail object fresh after store edits (fav/install)
  const liveDetail = detail ? (games.find((x) => x.id === detail.id) || detail) : null;

  const zx = origin ? `${origin.x}%` : "50%";
  const zy = origin ? `${origin.y}%` : "50%";
  if (!games.length) return null;

  const featured = games.find((g) => g.featured && g.installed) || games.find((g) => g.installed) || games[0];
  const filtered = tab === 1 ? games.filter((g) => g.favorite)
    : tab === 2 ? games.filter((g) => g.installed)
    : games;

  return (
    <div className={`play-overlay ${closing ? "closing" : ""}`} style={{ "--zx": zx, "--zy": zy }}>
      <div className="boot-flash"></div>

      <header className="pl-header">
        <div className="pl-brand">
          <div className="lp-mark"><span></span></div>
          <div className="pl-word">LAUNCH<b>PAD</b> <em>/ play</em></div>
        </div>
        <div className="pl-right">
          <button className="pl-ghost" onClick={onOpenImport}>{window.Icon.plus()} Spiele</button>
          <div className="pl-user">
            <image-slot id="play-avatar" shape="circle" placeholder="Foto"></image-slot>
            <span>{kidName}</span>
          </div>
          <button className="pl-exit" onClick={doExit}>{window.Icon.close()} Desktop</button>
        </div>
      </header>

      <nav className="pl-tabs">
        {TABS.map((t, i) => (
          <button key={t.id} className={`pl-tab ${i === tab ? "active" : ""}`} onClick={() => setTab(i)}>{t.label}</button>
        ))}
      </nav>

      <main className="pl-main">
        {/* featured hero (only on bibliothek) */}
        {tab === 0 && (
          <div className="pl-feature" onClick={() => openDetail(featured)}>
            <div className="plf-bg" style={featured.cover ? { backgroundImage: `url("${featured.cover}")` } : { background: DL.cover(featured.c1, featured.c2, 110) }}></div>
            <div className="plf-scrim"></div>
            <div className="plf-tx">
              <span className="plf-kick">Zuletzt gespielt</span>
              <h2>{featured.name}</h2>
              <div className="plf-meta">{featured.cat} · {stars(featured.stars)}</div>
              <div className="plf-actions">
                <button className="plf-play" onClick={(e) => { e.stopPropagation(); launchGame(featured); }}>{window.Icon.play()} Starten</button>
                <button className="plf-more" onClick={(e) => { e.stopPropagation(); openDetail(featured); }}>Details</button>
              </div>
            </div>
            {srcBadge(featured) && <div className="plf-badge">{srcBadge(featured)}</div>}
          </div>
        )}

        <div className="pl-rowtitle">{TABS[tab].label} <span>· {filtered.length}</span></div>
        <div className="pl-grid">
          {filtered.map((g) => (
            <button key={g.id} className={`pl-card ${!g.installed ? "dim" : ""}`} onClick={() => openDetail(g)}>
              <CoverFill g={g}>
                <div className="pc-scrim"></div>
                {g.favorite && <span className="pc-fav">{window.Icon.heart()}</span>}
                {!g.installed && <span className="pc-cloud">{window.Icon.plus()}</span>}
                <div className="pc-foot">
                  <div className="pc-src">{srcBadge(g)}</div>
                  <div className="pc-name">{g.name}</div>
                  <div className="pc-cat">{g.cat}</div>
                </div>
              </CoverFill>
            </button>
          ))}
        </div>
      </main>

      <div className="pl-hint">
        <span><kbd>←</kbd><kbd>→</kbd> Tabs</span>
        <span><kbd>Enter</kbd> Auswählen</span>
        <span><kbd>Esc</kbd> Zurück</span>
      </div>

      {/* Game Detail */}
      {liveDetail && <GameDetail g={liveDetail} onBack={() => { window.SFX && SFX.back(); setDetail(null); }} onLaunch={launchGame} />}

      {/* launch splash */}
      {launch && (
        <div className="launch-splash">
          <div className="launch-art" style={launch.cover
            ? { backgroundImage: `url("${launch.cover}")`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: DL.cover(launch.c1, launch.c2) }}>
            {!launch.cover && <div style={{ width: 96, height: 96, color: "rgba(255,255,255,.9)" }}>{window.Icon[launch.emblem] && window.Icon[launch.emblem]()}</div>}
          </div>
          <div className="launch-name">{launch.name}</div>
          <div className="launch-status">Wird gestartet …</div>
          <div className="launch-loader"><i></i></div>
          <button className="launch-back" onClick={() => { window.SFX && SFX.back(); setLaunch(null); }}>Abbrechen</button>
        </div>
      )}
    </div>
  );
}

window.PlayOverlay = PlayOverlay;
