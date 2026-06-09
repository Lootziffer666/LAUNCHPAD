/* ============================================================
   COMET — Game import manager (SteamGridDB)
   ============================================================ */
const { useState: useStateI } = React;

function ImpCover({ g }) {
  const [drag, setDrag] = useStateI(false);
  const onFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => { GameStore.setCover(g.id, r.result); window.SFX && SFX.select(); };
    r.readAsDataURL(file);
  };
  return (
    <div className={`imp-cover ${drag ? "drag" : ""}`} style={window.gameCover(g)}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
      onClick={() => document.getElementById(`imp-file-${g.id}`).click()}>
      {!g.cover && <div className="emb">{window.Icon[g.emblem] ? window.Icon[g.emblem]() : window.Icon.gamepad()}</div>}
      <div className="drop-hint">{window.Icon.image()} Bild ablegen<br />oder klicken</div>
      <input id={`imp-file-${g.id}`} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files[0])} />
    </div>
  );
}

function ImpCard({ g }) {
  const [url, setUrl] = useStateI("");
  const setCover = () => { if (url.trim()) { GameStore.setCover(g.id, url.trim()); setUrl(""); window.SFX && SFX.select(); } };
  return (
    <div className="imp-card">
      <ImpCover g={g} />
      <div className="imp-fields">
        <input className="imp-input tit" value={g.name} placeholder="Spielname"
          onChange={(e) => GameStore.setField(g.id, "name", e.target.value)} />
        <div className="imp-url-row">
          <input className="imp-input" value={url} placeholder="SteamGridDB Cover-URL einfügen…"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setCover()} />
          <button className="imp-set" onClick={setCover}>Setzen</button>
          {g.cover && <button className="imp-clear" title="Cover entfernen"
            onClick={() => { GameStore.setCover(g.id, null); window.SFX && SFX.back(); }}>✕</button>}
        </div>
        <div className="imp-meta-row">
          <input className="imp-input cat" value={g.cat} placeholder="Kategorie"
            onChange={(e) => GameStore.setField(g.id, "cat", e.target.value)} />
          <select className="imp-input stars" value={g.stars}
            onChange={(e) => GameStore.setField(g.id, "stars", +e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
        </div>
        <button className="imp-remove" onClick={() => { GameStore.remove(g.id); window.SFX && SFX.back(); }}>Aus Bibliothek entfernen</button>
      </div>
    </div>
  );
}

function ImportManager({ onClose }) {
  const [closing, setClosing] = useStateI(false);
  const games = useGames();
  const close = () => { setClosing(true); window.SFX && SFX.close(); setTimeout(onClose, 240); };

  return (
    <div className="imp-layer">
      <div className="imp-scrim" onClick={close}></div>
      <div className={`imp-window ${closing ? "closing" : ""}`}>
        <div className="imp-head">
          <div className="i-ic">{window.Icon.gamepad()}</div>
          <div>
            <h2>Spiele verwalten &amp; importieren</h2>
            <div className="i-sub">
              Cover von <a href="https://www.steamgriddb.com" target="_blank" rel="noopener">SteamGridDB</a> holen:
              Grid öffnen → Bild-Adresse kopieren → unten einfügen. Oder ein Bild direkt auf die Kachel ziehen.
            </div>
          </div>
          <button className="imp-close" onClick={close} aria-label="Schließen">{window.Icon.close()}</button>
        </div>

        <div className="imp-body">
          {games.map((g) => <ImpCard key={g.id} g={g} />)}
        </div>

        <div className="imp-foot">
          <span className="count">{games.length} Spiele in der Bibliothek</span>
          <button className="imp-btn ghost" onClick={() => { if (confirm("Alle Cover & Änderungen zurücksetzen?")) { GameStore.reset(); window.SFX && SFX.back(); } }}>Zurücksetzen</button>
          <button className="imp-btn add" onClick={() => { GameStore.addGame(); window.SFX && SFX.select(); }}>{window.Icon.plus()} Spiel hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

window.ImportManager = ImportManager;
