/* ============================================================
   LAUNCHPAD — app sub-screens (Lernen / Kreativ / Web)
   tile→app semantic zoom
   ============================================================ */
const { useState: useStateA } = React;
const D = window.CometData;

function AppShell({ app, origin, onClose }) {
  const [closing, setClosing] = useStateA(false);
  const close = () => { setClosing(true); window.SFX && SFX.close(); setTimeout(onClose, 250); };
  const zx = origin ? `${origin.x}%` : "50%";
  const zy = origin ? `${origin.y}%` : "50%";
  const meta = APPS[app.id];
  return (
    <div className="app-layer">
      <div className="app-scrim" onClick={close}></div>
      <div className={`app-window ${closing ? "closing" : ""}`} style={{ "--zx": zx, "--zy": zy }}>
        <div className="app-head" style={{ background: D.cover(meta.c1, meta.c2, 120) }}>
          <div className="app-ic">{window.Icon[meta.icon]()}</div>
          <div><h2>{meta.title}</h2></div>
          <span className="app-tag">{meta.tag}</span>
          <button className="app-close" onClick={close} aria-label="Schließen">{window.Icon.close()}</button>
        </div>
        <div className="app-body">{meta.render()}</div>
      </div>
    </div>
  );
}
window.AppShell = AppShell;

function HubGrid({ items }) {
  return (
    <div className="hub-grid">
      {items.map((it, i) => (
        <button key={i} className="hub-card" style={{ background: D.cover(it.c1, it.c2, 135) }}>
          <div className="hub-ic">{window.Icon[it.ic]()}</div>
          <div className="hub-tx">
            <h3>{it.title}</h3>
            <p>{it.sub}</p>
          </div>
          <span className="hub-go">{window.Icon.chevR()}</span>
        </button>
      ))}
    </div>
  );
}

function WebApp() {
  return (
    <div>
      <div className="browser-bar">
        <div className="browser-pill">{window.Icon.chevL()}</div>
        <div className="browser-url">{window.Icon.lock()}<span>kids.launchpad-search.com</span></div>
        <div className="safe-note">{window.Icon.shield()} Sicher</div>
      </div>
      <div className="section-title">Lesezeichen</div>
      <div className="bm-grid">
        {D.BOOKMARKS.map((b, i) => (
          <button key={i} className="bm" style={{ background: D.cover(b.c1, b.c2) }}>
            <div className="bm-ic">{window.Icon[b.ic]()}</div>
            <b>{b.name}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

const APPS = {
  lernen:  { title: "Lernen",  tag: "Wissen & Üben",   icon: "flask",   c1: "#0d9488", c2: "#0c4a4a", render: () => <HubGrid items={D.LEARN} /> },
  kreativ: { title: "Kreativ", tag: "Selber machen",   icon: "palette", c1: "#db2777", c2: "#831843", render: () => <HubGrid items={D.CREATE} /> },
  web:     { title: "Web",     tag: "Sicher surfen",   icon: "globe",   c1: "#2563eb", c2: "#1e3a8a", render: () => <WebApp /> },
};
