/* ============================================================
   COMET — Eltern & Sicherheit panel
   ============================================================ */
const { useState: useStateP } = React;

const PAR_APPS = [
  { id: "browser", name: "Browser", sub: "Sicheres Surfen", ic: "globe", c: "#2563eb" },
  { id: "videos", name: "Videos", sub: "Comet Video", ic: "film", c: "#7c3aed" },
  { id: "music", name: "Musik", sub: "Comet Music", ic: "music", c: "#db2777" },
  { id: "arcade", name: "Game Launcher", sub: "Comet Arcade", ic: "gamepad", c: "#6d28d9" },
  { id: "friends", name: "Freunde-Chat", sub: "Nachrichten & Status", ic: "chat", c: "#0d9488" },
];

const WEEK = [
  { d: "Mo", v: 0.5 }, { d: "Di", v: 0.7 }, { d: "Mi", v: 0.4 },
  { d: "Do", v: 0.85 }, { d: "Fr", v: 0.95 }, { d: "Sa", v: 0.6, today: true }, { d: "So", v: 0 },
];

function ParentalPanel({ kidName = "Jake", onClose }) {
  const [closing, setClosing] = useStateP(false);
  const [limit, setLimit] = useStateP(90);
  const [used] = useStateP(54);
  const [age, setAge] = useStateP("9");
  const [bedtime, setBedtime] = useStateP("20:30");
  const [approvals, setApprovals] = useStateP({ browser: true, videos: true, music: true, arcade: true, friends: false });
  const [saved, setSaved] = useStateP(false);

  const close = () => { setClosing(true); window.SFX && SFX.close(); setTimeout(onClose, 240); };
  const toggle = (id) => { window.SFX && SFX.select(); setApprovals((a) => ({ ...a, [id]: !a[id] })); };
  const usedPct = Math.min(100, (used / limit) * 100);
  const over = used > limit;

  const save = () => {
    window.SFX && SFX.select();
    setSaved(true); setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="par-layer">
      <div className="par-scrim" onClick={close}></div>
      <div className={`par-window ${closing ? "closing" : ""}`}>
        <div className="par-head">
          <div className="p-ic">{window.Icon.shield()}</div>
          <div>
            <h2>Eltern &amp; Sicherheit</h2>
            <div className="p-sub">Verwalte {kidName}s Konto — geschützt durch Eltern-PIN</div>
          </div>
          <div className="par-pin">{window.Icon.lock()} PIN aktiv</div>
          <button className="par-close" onClick={close} aria-label="Schließen">{window.Icon.close()}</button>
        </div>

        <div className="par-body">
          {/* daily screen time */}
          <div className="par-card span2">
            <h3>{window.Icon.clock()} Tägliche Bildschirmzeit</h3>
            <p className="desc">Wie lange darf {kidName} pro Tag das Gerät nutzen?</p>
            <div className="par-slider">
              <input type="range" min="30" max="180" step="15" value={limit}
                onChange={(e) => { setLimit(+e.target.value); window.SFX && SFX.select(); }} />
              <div className="val">{Math.floor(limit / 60)}h {limit % 60 ? `${limit % 60}m` : ""} <small>/ Tag</small></div>
            </div>
            <div className="par-used">
              <div className="lbl"><span>Heute genutzt</span><span>{used} / {limit} Min{over ? " · Limit erreicht" : ""}</span></div>
              <div className="bar"><i className={over ? "over" : ""} style={{ width: `${usedPct}%` }}></i></div>
            </div>
          </div>

          {/* age rating */}
          <div className="par-card">
            <h3>{window.Icon.star()} Altersfreigabe</h3>
            <p className="desc">Inhalte werden passend gefiltert.</p>
            <div className="par-seg">
              {[["6", "ab 6 J."], ["9", "ab 9 J."], ["12", "ab 12 J."]].map(([v, l]) => (
                <button key={v} className={age === v ? "on" : ""} onClick={() => { setAge(v); window.SFX && SFX.select(); }}>
                  {v}+<span className="seg-sub">{l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* bedtime */}
          <div className="par-card">
            <h3>{window.Icon.power()} Ruhezeit</h3>
            <p className="desc">Ab dieser Uhrzeit wird das Gerät gesperrt.</p>
            <div className="par-bed">
              <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
              <span className="arrow">bis</span>
              <input type="time" defaultValue="07:00" />
            </div>
          </div>

          {/* app approvals */}
          <div className="par-card span2">
            <h3>{window.Icon.shield()} App-Freigaben</h3>
            <p className="desc">Lege fest, welche Apps {kidName} öffnen darf.</p>
            {PAR_APPS.map((a) => (
              <div className="par-row" key={a.id}>
                <div className="r-ic" style={{ background: a.c }}>{window.Icon[a.ic]()}</div>
                <div className="r-meta"><b>{a.name}</b><span>{a.sub}</span></div>
                <div className={`p-toggle ${approvals[a.id] ? "on" : ""}`} onClick={() => toggle(a.id)}><i></i></div>
              </div>
            ))}
          </div>

          {/* weekly activity */}
          <div className="par-card span2 par-week-wrap">
            <h3>{window.Icon.trophy()} Wochenübersicht</h3>
            <p className="desc">Bildschirmzeit der letzten 7 Tage · Ø 71 Min/Tag · <span className="stat"><b>Diese Woche: 8h 20m</b></span></p>
            <div className="par-week">
              {WEEK.map((w) => (
                <div className="day" key={w.d}>
                  <div className={`col ${w.today ? "today" : ""}`} style={{ height: `${Math.max(4, w.v * 100)}%` }}></div>
                  <div className="dl">{w.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="par-foot">
          <span className={`saved ${saved ? "show" : ""}`}>{window.Icon.shield()} Einstellungen gespeichert</span>
          <button className="par-btn primary" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

window.ParentalPanel = ParentalPanel;
