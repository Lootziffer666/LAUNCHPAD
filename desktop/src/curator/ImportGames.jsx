/* ============================================================
   ImportGames.jsx -- "Spiele scannen" stub UI (Gate 13).
   A standalone panel for the Curator that will eventually scan
   the local system for installed games (Steam, Epic, GOG).
   Currently shows a placeholder message on click.
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../ui/icons.jsx';

export function ImportGames() {
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="imp-import-panel">
      <h3>{Icon.gamepad()} Spiele scannen</h3>
      <p className="imp-import-desc">
        Durchsuche deinen PC nach bereits installierten Spielen und importiere sie
        in die LAUNCHPAD-Bibliothek.
      </p>
      <button
        className="imp-btn add"
        onClick={() => setShowResult(true)}
      >
        {Icon.compass()} Scan starten
      </button>
      {showResult && (
        <div className="imp-import-result">
          <p>
            Scan wuerde hier nach installierten Spielen suchen (Steam, Epic, GOG).
          </p>
          <ul>
            <li><strong>Steam:</strong> libraryfolders.vdf + appmanifest_*.acf</li>
            <li><strong>Epic Games:</strong> LauncherInstalled.dat</li>
            <li><strong>GOG Galaxy:</strong> db/galaxy-2.0.db (SQLite)</li>
          </ul>
          <p className="imp-import-hint">
            Die eigentliche Erkennung wird in einem kommenden Gate implementiert.
          </p>
        </div>
      )}
    </div>
  );
}
