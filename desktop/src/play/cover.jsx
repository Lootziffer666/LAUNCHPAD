/* ============================================================
   LAUNCHPAD — Play shared bits: CoverFill, source badge, stars.
   ============================================================ */
import React from 'react';
import { Icon } from '../ui/icons.jsx';
import { CometData } from '../lib/data.js';

export function srcBadge(g) {
  const s = CometData.SOURCES[g.source] || CometData.SOURCES.LAUNCHPAD;
  return <span className="g-src" style={{ background: s.c }}>{s.label}</span>;
}

export function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export function CoverFill({ g, children }) {
  if (g.cover) {
    return (
      <div className="cv" style={{ backgroundImage: `url("${g.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {children}
      </div>
    );
  }
  return (
    <div className="cv" style={{ background: CometData.cover(g.c1, g.c2) }}>
      <div className="cv-ring"></div>
      <div className="cv-emb">{Icon[g.emblem] && Icon[g.emblem]()}</div>
      {children}
    </div>
  );
}
