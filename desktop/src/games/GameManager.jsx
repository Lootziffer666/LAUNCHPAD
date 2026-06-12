/* ============================================================
   LAUNCHPAD — game-card editor building blocks: covers, launch target,
   edit, add/remove. Used by the PARENT CURATOR app (src/curator/) — the
   child shell has no management surface (two-app split). The launch
   target (Steam appid / .exe path / link) feeds launcher.js#resolveLaunch.
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';
import { GameStore, gameCover } from './useGames.js';

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

export function ImpCard({ g, children }) {
  const [url, setUrl] = useState('');
  const [hits, setHits] = useState(null); // null | 'no_key' | Result[]
  const [busy, setBusy] = useState(false);
  const setCover = () => { if (url.trim()) { GameStore.setCover(g.id, url.trim()); setUrl(''); SFX.select(); } };
  const search = async () => {
    if (!window.launchpad || !window.launchpad.searchCovers) return;
    setBusy(true); SFX.select();
    try {
      const r = await window.launchpad.searchCovers(g.name);
      if (r && r.ok) setHits(r.results || []);
      else setHits(r && r.reason === 'no_key' ? 'no_key' : []);
    } catch (e) { setHits([]); }
    setBusy(false);
  };
  const pick = (u) => { GameStore.setCover(g.id, u); setHits(null); SFX.select(); };
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
          <button className="imp-set search" onClick={search} disabled={busy}>{busy ? '…' : '🔍'} Suchen</button>
          {g.cover && <button className="imp-clear" title="Cover entfernen"
            onClick={() => { GameStore.setCover(g.id, null); SFX.back(); }}>✕</button>}
        </div>
        {hits === 'no_key' && <div className="imp-hint">Kein SteamGridDB-Key hinterlegt — oben im Kopf eintragen.</div>}
        {Array.isArray(hits) && hits.length === 0 && <div className="imp-hint">Keine Cover gefunden für „{g.name}“.</div>}
        {Array.isArray(hits) && hits.length > 0 && (
          <div className="imp-hits">
            {hits.map((h, i) => (
              <button key={i} className="imp-hit" style={{ backgroundImage: `url("${h.thumb}")` }}
                title={h.author ? `von ${h.author}` : 'Cover übernehmen'} onClick={() => pick(h.url)} />
            ))}
          </div>
        )}
        <div className="imp-meta-row">
          <input className="imp-input cat" value={g.cat} placeholder="Kategorie"
            onChange={(e) => GameStore.setField(g.id, 'cat', e.target.value)} />
          <select className="imp-input stars" value={g.stars}
            onChange={(e) => GameStore.setField(g.id, 'stars', +e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
          </select>
        </div>
        <LaunchEditor g={g} />
        {children}
        <button className="imp-remove" onClick={() => { GameStore.remove(g.id); SFX.back(); }}>Aus Bibliothek entfernen</button>
      </div>
    </div>
  );
}

// Lets the parent store their own SteamGridDB key (used by the search button).
// The key lives in main (electron-store) — only its status crosses the bridge.
export function CoverKeyField() {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (window.launchpad && window.launchpad.coversKeyStatus) {
      window.launchpad.coversKeyStatus().then(setStatus).catch(() => {});
    }
  }, []);
  const save = async () => {
    if (!window.launchpad || !window.launchpad.setCoversKey || !key.trim()) return;
    const s = await window.launchpad.setCoversKey(key.trim());
    setStatus(s); setKey(''); SFX.select();
  };
  return (
    <div className="imp-key">
      <span className={`imp-key-badge ${status && status.hasKey ? 'on' : ''}`}>
        {status && status.hasKey ? '🔑 Key aktiv' : '🔑 Kein Key'}{status && status.fromEnv ? ' · env' : ''}
      </span>
      <input className="imp-input" type="password" placeholder="SteamGridDB API-Key eingeben…" value={key}
        onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      <button className="imp-set" onClick={save}>Speichern</button>
    </div>
  );
}

// (The former overlay-style ImportManager moved into the parent curator app —
// src/curator/CuratorApp.jsx composes ImpCard + CoverKeyField directly.)
export default ImpCard;
