// electron/services/curation.js — the curation model (pure, no Electron deps).
//
// Adopted from the original Windows launcher plan ("Family Console Shell"):
// approval and surfacing are SEPARATE axes — "Genehmigung und Sichtbarkeit
// sind nicht dasselbe". A game can be approved but low-prominence, parked for
// later, or hidden but tagged so a future gem isn't lost. The child shell
// shows approved games only; every other state is parent-side workflow.
// Containment is a third, independent axis: a successful launch is not the
// same as a safe play space ("Direktstart ist Komfort, keine Kindersicherung").

// Parent workflow states. 'approved' is the only child-visible one.
const CURATION_STATES = ['new', 'viewed', 'undecided', 'approved', 'forLater', 'hidden'];

// Prominence inside the child shell — independent of approval.
const SURFACING_LEVELS = ['featured', 'normal', 'low'];

// How well the child stays inside the intended play space after launch.
const CONTAINMENT_LEVELS = ['strong', 'soft', 'weak', 'open', 'unknown'];

// Occasion/intent tags offered in the curator (free text is also allowed).
const SUGGESTED_TAGS = [
  'Winter', 'Weihnachten', 'Ferien', 'Cousins da', 'mit Bruder', 'mit Papa',
  'kurze Session', 'ruhige Session', 'wenn älter', 'Geheimtipp',
];

// Entries that predate the curation model (seed catalogue, earlier installs)
// stay child-visible: they were already on the shelf before approval existed.
// Games created through the curator start as 'new' (set in gameRegistry.upsert)
// so nothing reaches the child without a conscious decision.
function withCurationDefaults(g) {
  if (!g) return g; // defensive: callers map over registry arrays, but never throw on a hole
  const curation = CURATION_STATES.includes(g.curation) ? g.curation : 'approved';
  const surfacing = SURFACING_LEVELS.includes(g.surfacing)
    ? g.surfacing
    : (g.featured ? 'featured' : 'normal');
  const containment = CONTAINMENT_LEVELS.includes(g.containment) ? g.containment : 'unknown';
  return {
    ...g,
    curation,
    surfacing,
    containment,
    tags: Array.isArray(g.tags) ? g.tags : [],
    parentWarning: typeof g.parentWarning === 'string' && g.parentWarning.trim()
      ? g.parentWarning : null,
    featured: surfacing === 'featured', // the child UI keeps reading `featured`
  };
}

function childVisible(g) {
  return !!g && g.curation === 'approved';
}

// Child grid order: featured first, low prominence last; stable otherwise.
const SURF_ORDER = { featured: 0, normal: 1, low: 2 };
function childOrder(a, b) {
  return (SURF_ORDER[a.surfacing] ?? 1) - (SURF_ORDER[b.surfacing] ?? 1);
}

module.exports = {
  CURATION_STATES, SURFACING_LEVELS, CONTAINMENT_LEVELS, SUGGESTED_TAGS,
  withCurationDefaults, childVisible, childOrder,
};
