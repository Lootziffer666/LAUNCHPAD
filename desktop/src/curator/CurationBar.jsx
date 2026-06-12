/* ============================================================
   LAUNCHPAD Curator — per-game curation controls.
   The two-axis model from the original Windows launcher plan:
   approval (Status) and surfacing (Präsenz) are separate decisions,
   plus occasion tags, age rating and the containment classification
   with its parent warning. Writes go through GameStore.setField →
   lp:games:upsert (curator-only channel).
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { GameStore } from '../games/useGames.js';
import { SFX } from '../lib/sfx.js';

export const CURATION_LABELS = {
  new: 'Neu',
  viewed: 'Gesehen',
  undecided: 'Ungeklärt',
  approved: 'Freigegeben',
  forLater: 'Für später',
  hidden: 'Versteckt',
};

const SURFACING_LABELS = {
  featured: 'Vorgestellt',
  normal: 'Normal',
  low: 'Zurückhaltend',
};

const CONTAINMENT_LABELS = {
  strong: 'Stark eingezäunt',
  soft: 'Weich eingezäunt',
  weak: 'Durchlässig',
  open: 'Offener Hub',
  unknown: 'Ungeprüft',
};

// Occasion/intent tags from the plan — curation is also "Bewahrung zukünftiger
// guter Erfahrungen", not just block/allow.
const SUGGESTED_TAGS = [
  'Winter', 'Weihnachten', 'Ferien', 'Cousins da', 'mit Bruder', 'mit Papa',
  'kurze Session', 'ruhige Session', 'wenn älter', 'Geheimtipp',
];

function set(g, field, value) {
  GameStore.setField(g.id, field, value);
  SFX.select();
}

function TagEditor({ g }) {
  const [draft, setDraft] = useState('');
  const tags = Array.isArray(g.tags) ? g.tags : [];
  const add = (t) => {
    const tag = t.trim();
    if (!tag || tags.includes(tag)) return;
    set(g, 'tags', [...tags, tag]);
    setDraft('');
  };
  const remove = (t) => set(g, 'tags', tags.filter((x) => x !== t));
  const suggestions = SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 5);
  return (
    <div className="curb-tags">
      <span className="curb-lbl">Anlässe</span>
      <div className="curb-tag-row">
        {tags.map((t) => (
          <button key={t} className="curb-tag on" title="Tag entfernen" onClick={() => remove(t)}>{t} ✕</button>
        ))}
        {suggestions.map((t) => (
          <button key={t} className="curb-tag" title="Tag hinzufügen" onClick={() => add(t)}>+ {t}</button>
        ))}
        <input
          className="curb-tag-input" placeholder="eigener Tag…" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add(draft)}
        />
      </div>
    </div>
  );
}

export function CurationBar({ g }) {
  const containmentRisky = g.containment === 'weak' || g.containment === 'open';
  // Draft the warning locally and commit on blur/Enter — writing through on
  // every keystroke would mean an IPC round-trip + store write per character.
  const [warnDraft, setWarnDraft] = useState(g.parentWarning || '');
  useEffect(() => { setWarnDraft(g.parentWarning || ''); }, [g.parentWarning]);
  const commitWarning = () => {
    if (warnDraft.trim() !== (g.parentWarning || '')) {
      GameStore.setField(g.id, 'parentWarning', warnDraft.trim());
    }
  };
  return (
    <div className="curb">
      {/* approval — the only state the child shell acts on */}
      <div className="curb-row">
        <span className="curb-lbl">Status</span>
        <div className="curb-seg">
          {Object.entries(CURATION_LABELS).map(([v, label]) => (
            <button
              key={v}
              className={`curb-opt ${g.curation === v ? 'on' : ''} ${v === 'approved' ? 'ok' : ''} ${v === 'hidden' ? 'off' : ''}`}
              onClick={() => set(g, 'curation', v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* surfacing — prominence is a separate decision from approval */}
      <div className="curb-row">
        <span className="curb-lbl">Präsenz</span>
        <div className="curb-seg">
          {Object.entries(SURFACING_LABELS).map(([v, label]) => (
            <button key={v} className={`curb-opt ${g.surfacing === v ? 'on' : ''}`}
              onClick={() => set(g, 'surfacing', v)}>
              {label}
            </button>
          ))}
        </div>
        <span className="curb-lbl">ab</span>
        <select className="imp-input curb-age" value={String(g.minAge ?? 6)}
          onChange={(e) => set(g, 'minAge', +e.target.value)}>
          {['6', '9', '12'].map((a) => <option key={a} value={a}>{a}+</option>)}
        </select>
      </div>

      <TagEditor g={g} />

      {/* containment — launch success ≠ safe play space */}
      <div className="curb-row">
        <span className="curb-lbl">Einzäunung</span>
        <select className={`imp-input curb-cont ${containmentRisky ? 'warn' : ''}`} value={g.containment || 'unknown'}
          onChange={(e) => set(g, 'containment', e.target.value)}>
          {Object.entries(CONTAINMENT_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        {containmentRisky && (
          <input className="imp-input curb-warning" placeholder="Elternhinweis, z. B. „Moduswechsel bleibt möglich“"
            value={warnDraft}
            onChange={(e) => setWarnDraft(e.target.value)}
            onBlur={commitWarning}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} />
        )}
      </div>
      {containmentRisky && g.parentWarning && (
        <div className="curb-warnline">⚠ {g.parentWarning}</div>
      )}

      {/* honest summary: what the child actually sees */}
      <div className={`curb-visible ${g.curation === 'approved' ? 'yes' : 'no'}`}>
        {g.curation === 'approved'
          ? `Im Kinder-Launcher sichtbar (Altersfreigabe ${g.minAge ?? 6}+ vorausgesetzt)`
          : 'Nicht im Kinder-Launcher sichtbar'}
      </div>
    </div>
  );
}

export default CurationBar;
