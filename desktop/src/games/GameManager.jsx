/* ============================================================
   LAUNCHPAD — Game manager: covers, launch target, edit, add/remove.
   Launch target (Steam appid / .exe path / link) is set per game and feeds
   launcher.js#resolveLaunch. Nice-to-have later: a native file picker for
   .exe (dialog.showOpenDialog via IPC) and SteamGridDB cover search.
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';
import { GameStore, useAllGames, gameCover } from './useGames.js';

function ImpCover({ g }) {
  const [drag, setDrag] = useState(false);
  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => { GameStore.setCover(g.id, r.result); SFX.select(); };
    r.readAsDataURL(file);
  };
  return (
    <div className={`imp-cover ${drag ? 'drag' : ''}`} style={gameCover(g)}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
      onClick={() => document.getElementById(`imp-file-${g.id}`).click()}>
      {!g.cover && <div className="emb">{Icon[g.emblem] ? Icon[g.emblem]() : Icon.gamepad()}</div>}
      <div className="drop-hint">{Icon.image()} Bild ablegen<br />oder klicken</div>
      <input id={`imp-file-${g.id}`} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files[0])} />
    </div>
  );
}

// How each game starts. The select maps to a canonical `launch` object that
// electron/services/launcher.js#resolveLaunch understands, and keeps `source`
// in sync so the badge matches. Steam needs an appid; exe a Windows path; the
// link option is scheme-checked in main.
const LAUNCH_KINDS = [
  { v: 'steam', label: 'Steam', src: 'Steam' },
  { v: 'minecraft', label: 'Minecraft', src: 'Minecraft' },
  { v: 'exe', label: 'Windows-Programm', src: 'Windows' },
  { v: 'uri', label: 'Web-/App-Link', src: 'Web' },
  { v: 'internal', label: 'In LAUNCHPAD', src: 'LAUNCHPAD' },
];

function launchKindOf(g) {
  const L = g.launch;
  if (L && L.kind === 'steam') return 'steam';
  if (L && L.kind === 'exe') return 'exe';
  if (L && L.kind === 'internal') return 'internal';
  if (L && L.kind === 'uri') return L.uri === 'minecraft://' ? 'minecraft' : 'uri';
  const s = (g.source || '').toLowerCase();
  if (s === 'steam') return 'steam';
  if (s === 'minecraft') return 'minecraft';
  return 'internal';
}

function LaunchEditor({ g }) {
  const kind = launchKindOf(g);
  const L = g.launch || {};
  const write = (launch, src) => { GameStore.setField(g.id, 'launch', launch); GameStore.setField(g.id, 'source', src); SFX.select(); };
  const changeKind = (v) => {
    const src = (LAUNCH_KINDS.find((k) => k.v === v) || {}).src;
    if (v === 'steam') write({ kind: 'steam', appid: L.appid || g.appid || '' }, src);
    else if (v === 'minecraft') write({ kind: 'uri', uri: 'minecraft://' }, src);
    else if (v === 'exe') write({ kind: 'exe', path: L.path || '' }, src);
    else if (v === 'uri') write({ kind: 'uri', uri: (L.uri && L.uri !== 'minecraft://') ? L.uri : '' }, src);
    else write({ kind: 'internal' }, src);
  };
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, opacity: 0.7, minWidth: 36 }}>Start</span>
      <select className="imp-input" style={{ flex: '0 0 auto' }} value={kind} onChange={(e) => changeKind(e.target.value)}>
        {LAUNCH_KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
      </select>
      {kind === 'steam' && (
        <input className="imp-input" placeholder="Steam AppID (z. B. 1145360)" value={L.appid || g.appid || ''}
          onChange={(e) => GameStore.setField(g.id, 'launch', { kind: 'steam', appid: e.target.value.replace(/\D/g, '') })} />
      )}
      {kind === 'exe' && (
        <input className="imp-input" placeholder="Pfad zur .exe (Windows)" value={L.path || ''}
          onChange={(e) => GameStore.setField(g.id, 'launch', { kind: 'exe', path: e.target.value })} />
      )}
      {kind === 'uri' && (
        <input className="imp-input" placeholder="Link, z. B. roblox://…" value={L.uri || ''}
          onChange={(e) => GameStore.setField(g.id, 'launch', { kind: 'uri', uri: e.target.value.trim() })} />
      )}
    </div>
  );
}

function ImpCard({ g }) {
  const [url, setUrl] = useState('');
  const setCover = () => { if (url.trim()) { GameStore.setCover(g.id, url.trim()); setUrl(''); SFX.select(); } };
  return (
    <div className="imp-card">
      <ImpCover g={g} />
      <div className="imp-fields">
        <input className="imp-input tit" value={g.name} placeholder="Spielname"
          onChange={(e) => GameStore.setField(g.id, 'name', e.target.value)} />
        <div className="imp-url-row">
          <input className="imp-input" value={url} placeholder="SteamGridDB Cover-URL einfügen…"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setCover()} />
          <button className="imp-set" onClick={setCover}>Setzen</button>
          {g.cover && <button className="imp-clear" title="Cover entfernen"
            onClick={() => { GameStore.setCover(g.id, null); SFX.back(); }}>✕</button>}
        </div>
        <div className="imp-meta-row">
          <input className="imp-input cat" value={g.cat} placeholder="Kategorie"
            onChange={(e) => GameStore.setField(g.id, 'cat', e.target.value)} />
          <select className="imp-input stars" value={g.stars}
            onChange={(e) => GameStore.setField(g.id, 'stars', +e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
          </select>
        </div>
        <LaunchEditor g={g} />
        <button className="imp-remove" onClick={() => { GameStore.remove(g.id); SFX.back(); }}>Aus Bibliothek entfernen</button>
      </div>
    </div>
  );
}

export function ImportManager({ onClose }) {
  const [closing, setClosing] = useState(false);
  const games = useAllGames();
  const close = () => { setClosing(true); SFX.close(); setTimeout(onClose, 240); };

  return (
    <div className="imp-layer">
      <div className="imp-scrim" onClick={close}></div>
      <div className={`imp-window ${closing ? 'closing' : ''}`}>
        <div className="imp-head">
          <div className="i-ic">{Icon.gamepad()}</div>
          <div>
            <h2>Spiele verwalten &amp; importieren</h2>
            <div className="i-sub">
              Cover von <a href="https://www.steamgriddb.com" target="_blank" rel="noopener">SteamGridDB</a> holen:
              Grid öffnen → Bild-Adresse kopieren → unten einfügen. Oder ein Bild direkt auf die Kachel ziehen.
            </div>
          </div>
          <button className="imp-close" onClick={close} aria-label="Schließen">{Icon.close()}</button>
        </div>

        <div className="imp-body">
          {games.map((g) => <ImpCard key={g.id} g={g} />)}
        </div>

        <div className="imp-foot">
          <span className="count">{games.length} Spiele in der Bibliothek</span>
          <button className="imp-btn ghost" onClick={() => { if (confirm('Alle Cover & Änderungen zurücksetzen?')) { GameStore.reset(); SFX.back(); } }}>Zurücksetzen</button>
          <button className="imp-btn add" onClick={() => { GameStore.addGame(); SFX.select(); }}>{Icon.plus()} Spiel hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

export default ImportManager;
