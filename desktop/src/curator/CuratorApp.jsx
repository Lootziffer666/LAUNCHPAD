/* ============================================================
   LAUNCHPAD — Familienzentrale (Parent Curator app).
   The second app of the two-app split: a classic desktop GUI where
   parents curate the library (review inbox → approve/hide/feature/
   tag) and manage safety settings. No kid-shell chrome, no stage
   scaling — a normal scrolling workspace in its own window.
   ============================================================ */
import React, { useMemo, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';
import { GameStore, useAllGames } from '../games/useGames.js';
import { ImpCard, CoverKeyField } from '../games/GameManager.jsx';
import { ParentalPanel } from '../apps/Parental.jsx';
import { CurationBar } from './CurationBar.jsx';

// Review filters — the inbox view from the plan ("Candidate Review").
const FILTERS = [
  { id: 'alle', label: 'Alle', match: () => true },
  { id: 'neu', label: 'Neu', match: (g) => g.curation === 'new' },
  { id: 'ungeklaert', label: 'Ungeklärt', match: (g) => g.curation === 'viewed' || g.curation === 'undecided' },
  { id: 'freigegeben', label: 'Freigegeben', match: (g) => g.curation === 'approved' },
  { id: 'spaeter', label: 'Für später', match: (g) => g.curation === 'forLater' },
  { id: 'versteckt', label: 'Versteckt', match: (g) => g.curation === 'hidden' },
];

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

const TABS = [
  { id: 'library', label: 'Bibliothek & Kuration', ic: 'gamepad' },
  { id: 'safety', label: 'Eltern & Sicherheit', ic: 'shield' },
];

export default function CuratorApp() {
  const [tab, setTab] = useState('library');
  const games = useAllGames();
  const approved = games.filter((g) => g.curation === 'approved').length;

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
        </div>
        <nav className="cur-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`cur-tab ${tab === t.id ? 'on' : ''}`}
              onClick={() => { setTab(t.id); SFX.swipe(); }}>
              {Icon[t.ic]()} {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="cur-main">
        {tab === 'library' && <LibraryTab />}
        {tab === 'safety' && <ParentalPanel inline />}
      </main>
    </div>
  );
}
