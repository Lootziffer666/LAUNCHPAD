/* ============================================================
   LAUNCHPAD — Familienzentrale (Parent Curator app).
   The second app of the two-app split: a classic desktop GUI where
   parents curate the library (review inbox → approve/hide/feature/
   tag) and manage safety settings. No kid-shell chrome, no stage
   scaling — a normal scrolling workspace in its own window.
   ============================================================ */
import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';
import { GameStore, useAllGames, gameCover } from '../games/useGames.js';
import { ImpCard, CoverKeyField } from '../games/GameManager.jsx';
import { ParentalPanel } from '../apps/Parental.jsx';
import { CurationBar } from './CurationBar.jsx';
import { WishlistTab, DealsTab } from './SteamTools.jsx';
import { SteamImport } from './SteamImport.jsx';

// Review filters — the inbox view from the plan ("Candidate Review").
const FILTERS = [
  { id: 'alle', label: 'Alle', match: () => true },
  { id: 'neu', label: 'Neu', match: (g) => g.curation === 'new' },
  { id: 'ungeklaert', label: 'Ungeklärt', match: (g) => g.curation === 'viewed' || g.curation === 'undecided' },
  { id: 'freigegeben', label: 'Freigegeben', match: (g) => g.curation === 'approved' },
  { id: 'spaeter', label: 'Für später', match: (g) => g.curation === 'forLater' },
  { id: 'versteckt', label: 'Versteckt', match: (g) => g.curation === 'hidden' },
];

// Startseite ordnen — which approved games are pinned as tiles on the child
// home, and in what order. Reorder normalizes homeOrder to the array indices.
function HomeArrangement() {
  const games = useAllGames();
  const pinned = games
    .filter((g) => g.pinned)
    .sort((a, b) => (Number.isFinite(a.homeOrder) ? a.homeOrder : 9) - (Number.isFinite(b.homeOrder) ? b.homeOrder : 9));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= pinned.length) return;
    const arr = pinned.slice();
    const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp;
    arr.forEach((g, i) => GameStore.setField(g.id, 'homeOrder', i));
    SFX.swipe();
  };
  const unpin = (g) => { GameStore.setField(g.id, 'pinned', false); SFX.back(); };
  if (!pinned.length) {
    return (
      <div className="cur-home">
        <div className="cur-home-head"><b>{Icon.grid()} Startseite ordnen</b></div>
        <div className="cur-home-empty">Noch keine Kachel angeheftet. Unten bei einem freigegebenen Spiel „An Startseite anheften".</div>
      </div>
    );
  }
  return (
    <div className="cur-home">
      <div className="cur-home-head">
        <b>{Icon.grid()} Startseite ordnen</b>
        <span>{pinned.length} {pinned.length === 1 ? 'Kachel' : 'Kacheln'} · erste = große Hauptkachel</span>
      </div>
      <div className="cur-home-list">
        {pinned.map((g, i) => (
          <div className="cur-home-row" key={g.id}>
            <span className="cur-home-pos">{i === 0 ? '★' : i + 1}</span>
            <span className="cur-home-cover" style={gameCover(g)}>{!g.cover && (Icon[g.emblem] ? Icon[g.emblem]() : Icon.gamepad())}</span>
            <span className="cur-home-name">{g.name}</span>
            <div className="cur-home-btns">
              <button className="imp-btn ghost" disabled={i === 0} onClick={() => move(i, -1)} title="Nach oben">↑</button>
              <button className="imp-btn ghost" disabled={i === pinned.length - 1} onClick={() => move(i, 1)} title="Nach unten">↓</button>
              <button className="imp-btn ghost" onClick={() => unpin(g)} title="Von der Startseite nehmen">Lösen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LibraryTab() {
  const games = useAllGames();
  const [filter, setFilter] = useState('alle');
  const counts = useMemo(() => {
    const c = {};
    for (const f of FILTERS) c[f.id] = games.filter(f.match).length;
    return c;
  }, [games]);
  const active = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const shown = games.filter(active.match);
  const reviewCount = games.filter((g) => g.curation === 'new' || g.curation === 'viewed' || g.curation === 'undecided').length;

  return (
    <div className="cur-lib">
      <div className="cur-toolbar">
        <div className="cur-chips">
          {FILTERS.map((f) => (
            <button key={f.id} className={`cur-chip ${filter === f.id ? 'on' : ''}`}
              onClick={() => { setFilter(f.id); SFX.swipe(); }}>
              {f.label} <em>{counts[f.id]}</em>
            </button>
          ))}
        </div>
        <div className="cur-actions">
          <button className="imp-btn ghost" onClick={() => {
            if (confirm('Alle Cover & Änderungen zurücksetzen?')) { GameStore.reset(); SFX.back(); }
          }}>Zurücksetzen</button>
          <button className="imp-btn add" onClick={() => { GameStore.addGame(); setFilter('neu'); SFX.select(); }}>
            {Icon.plus()} Spiel hinzufügen
          </button>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="cur-inbox-hint">
          {reviewCount} {reviewCount === 1 ? 'Titel wartet' : 'Titel warten'} auf eine Entscheidung —
          neue Einträge erscheinen erst nach <b>Freigeben</b> im Kinder-Launcher.
        </div>
      )}

      <CoverKeyField />
      <ImportGames />

      <HomeArrangement />

      <div className="cur-cards">
        {shown.map((g) => (
          <ImpCard key={g.id} g={g}>
            <CurationBar g={g} />
          </ImpCard>
        ))}
        {!shown.length && (
          <div className="cur-empty">Keine Titel mit Status „{active.label}“.</div>
        )}
      </div>
    </div>
  );
}

// wishlist/deals are the Steam-family pages — parents can switch each one off
// under Eltern & Sicherheit (settings.modules); library and safety are fixed.
const TABS = [
  { id: 'library', label: 'Bibliothek & Kuration', ic: 'gamepad', fixed: true },
  { id: 'steam', label: 'Steam-Import', ic: 'bolt', fixed: true },
  { id: 'wishlist', label: 'Wunschliste', ic: 'star' },
  { id: 'deals', label: 'Angebote', ic: 'bell' },
  { id: 'safety', label: 'Eltern & Sicherheit', ic: 'shield', fixed: true },
];

export default function CuratorApp() {
  const [tab, setTab] = useState('library');
  const games = useAllGames();
  const approved = games.filter((g) => g.curation === 'approved').length;

  const [modules, setModules] = useState({ wishlist: true, deals: true });
  useEffect(() => {
    const lp = typeof window !== 'undefined' && window.launchpad;
    if (!lp || !lp.getParentalSettings) return undefined;
    const load = () => lp.getParentalSettings()
      .then((s) => { if (s && s.modules) setModules((m) => ({ ...m, ...s.modules })); })
      .catch(() => {});
    load();
    // settings saves broadcast games-changed → tab set follows immediately
    return lp.onGamesChanged ? lp.onGamesChanged(load) : undefined;
  }, []);

  const tabs = TABS.filter((t) => t.fixed || modules[t.id] !== false);
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('library');
  }, [modules]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreviewedCount = games.filter((g) => g.curation === 'new' || g.curation === 'viewed' || g.curation === 'undecided').length;

  return (
    <div className="cur-app">
      <header className="cur-head">
        <div className="cur-brand">
          <div className="lp-mark"><span></span></div>
          <div>
            <div className="cur-title">LAUNCHPAD <em>Familienzentrale</em></div>
            <div className="cur-sub">
              Kuratieren statt verwalten — {approved} von {games.length} Titeln freigegeben.
              Der Kinder-Launcher zeigt nur Freigegebenes.
            </div>
          </div>
          {unreviewedCount > 0 && (
            <div className="cur-unreviewed-badge" onClick={() => { setTab('library'); SFX.swipe(); }}>
              {unreviewedCount} ungeprüft
            </div>
          )}
        </div>
        <nav className="cur-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`cur-tab ${tab === t.id ? 'on' : ''}`}
              onClick={() => { setTab(t.id); SFX.swipe(); }}>
              {Icon[t.ic]()} {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="cur-main">
        {tab === 'library' && <LibraryTab />}
        {tab === 'steam' && <SteamImport />}
        {tab === 'wishlist' && <WishlistTab />}
        {tab === 'deals' && <DealsTab />}
        {tab === 'safety' && <ParentalPanel inline />}
      </main>
    </div>
  );
}
