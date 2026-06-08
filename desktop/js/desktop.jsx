/* ============================================================
   LAUNCHPAD — Desktop Home
   ============================================================ */
const { useState: useStateD, useEffect: useEffectD } = React;
const DD = window.CometData;

function MiniClock() {
  const [now, setNow] = useStateD(new Date());
  useEffectD(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return <span className="hd-time">{time}</span>;
}

function originFromEvent(e) {
  const stage = document.querySelector(".stage");
  const r = stage.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  return { x: Math.max(0, Math.min(100, (cx / r.width) * 100)), y: Math.max(0, Math.min(100, (cy / r.height) * 100)) };
}

function Desktop({ kidName, onOpenApp, onOpenPlay, onOpenParental, onLaunchDirect, onOpenWindows }) {
  const games = useGames();
  const installedCount = games.filter((g) => g.installed).length;
  const favs = games.filter((g) => g.favorite && g.installed).slice(0, 3);
  const featCover = games.find((g) => g.featured) || games[0];

  return (
    <div className="desktop">
      {/* top bar — minimal, confident */}
      <header className="hd">
        <div className="hd-brand">
          <div className="lp-mark"><span></span></div>
          <div className="hd-word">LAUNCH<b>PAD</b></div>
        </div>
        <div className="hd-right">
          <MiniClock />
          <div className="hd-user">
            <span className="hd-name">{kidName}</span>
            <image-slot id="desktop-avatar" shape="circle" placeholder="Foto"></image-slot>
          </div>
        </div>
      </header>

      {/* tile grid */}
      <div className="grid-area">
        <div className="home-grid">
          {/* SPIELEN hero */}
          <button className=" htile play" onClick={(e) => onOpenPlay(originFromEvent(e))}>
            <div className="play-glow"></div>
            <div className="play-top">
              <div className="htile-ic">{window.Icon.gamepad()}</div>
              <span className="play-count">{installedCount} Spiele bereit</span>
            </div>
            <div className="play-foot">
              <h2>Spielen</h2>
              <div className="play-favs">
                {favs.map((g) => (
                  <span key={g.id} className="pf" style={window.gameCover(g)} title={g.name}>
                    {!g.cover && <i>{window.Icon[g.emblem] && window.Icon[g.emblem]()}</i>}
                  </span>
                ))}
                <span className="pf more">+{Math.max(0, installedCount - favs.length)}</span>
              </div>
            </div>
            <span className="play-cta">{window.Icon.play()} Bibliothek öffnen</span>
          </button>

          {/* category tiles */}
          <button className="htile c-teal" onClick={(e) => onOpenApp("lernen", originFromEvent(e))}>
            <div className="htile-ic">{window.Icon.flask()}</div>
            <div className="htile-label">Lernen</div>
          </button>
          <button className="htile c-pink" onClick={(e) => onOpenApp("kreativ", originFromEvent(e))}>
            <div className="htile-ic">{window.Icon.palette()}</div>
            <div className="htile-label">Kreativ</div>
          </button>
          <button className="htile c-blue" onClick={(e) => onOpenApp("web", originFromEvent(e))}>
            <div className="htile-ic">{window.Icon.globe()}</div>
            <div className="htile-label">Web</div>
          </button>

          {/* direct launch — Minecraft (cover art) */}
          <button className="htile direct" style={window.gameCover(featCover, 135)} onClick={(e) => onLaunchDirect(featCover, originFromEvent(e))}>
            <div className="direct-scrim"></div>
            {!featCover.cover && <div className="direct-emb">{window.Icon[featCover.emblem] && window.Icon[featCover.emblem]()}</div>}
            <div className="direct-foot">
              <span className="src-badge" style={{ background: DD.SOURCES[featCover.source].c }}>{DD.SOURCES[featCover.source].label}</span>
              <div className="htile-label sm">{featCover.name}</div>
            </div>
          </button>

          {/* direct row: Steam + Scratch */}
          {DD.DIRECT.filter((d) => d.id !== featCover.id).map((d) => (
            <button key={d.id} className="htile direct small" style={{ background: DD.cover(d.c1, d.c2, 135) }}
              onClick={(e) => d.platform ? onOpenPlay(originFromEvent(e)) : onLaunchDirect(games.find(g => g.id === d.id) || d, originFromEvent(e))}>
              <div className="direct-emb sm">{window.Icon[d.emblem] && window.Icon[d.emblem]()}</div>
              <div className="direct-foot">
                <span className="src-badge" style={{ background: DD.SOURCES[d.source].c }}>{DD.SOURCES[d.source].label}</span>
                <div className="htile-label sm">{d.name}</div>
              </div>
            </button>
          ))}

          {/* utility: Windows-Desktop (gated) */}
          <button className="htile glass" onClick={(e) => onOpenWindows(originFromEvent(e))}>
            <div className="win-lock">{window.Icon.lock()}</div>
            <div className="htile-ic soft">{window.Icon.grid()}</div>
            <div className="htile-label sm soft">Windows-Desktop</div>
          </button>

          {/* Elternbereich */}
          <button className="htile glass" onClick={onOpenParental}>
            <div className="htile-ic soft">{window.Icon.lock()}</div>
            <div className="htile-label sm soft">Elternbereich</div>
          </button>
        </div>
      </div>
    </div>
  );
}

window.Desktop = Desktop;
