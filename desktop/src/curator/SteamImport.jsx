/* ============================================================
   LAUNCHPAD — Steam-Import (Familienzentrale tab).
   Pull the whole owned Steam library by SteamID, then optionally
   auto-approve by USK age rating so a 2000-title f2p account isn't
   reviewed by hand. USK is treated as ADVICE: the parent can always
   approve everything regardless of rating.
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';

const api = (typeof window !== 'undefined' && window.launchpad) || null;

const IMPORT_ERR = {
  no_key: 'Kein Steam-Web-API-Key hinterlegt.',
  bad_steamid: 'SteamID64 muss 17 Ziffern haben.',
  unauthorized: 'Key abgelehnt – stimmt der API-Key?',
  http: 'Steam antwortet gerade nicht (HTTP-Fehler).',
  error: 'Netzwerkfehler – später nochmal versuchen.',
};

const USK_OPTIONS = [
  { v: '0', label: 'USK 0 (ohne Altersbeschränkung)' },
  { v: '6', label: 'USK 6' },
  { v: '12', label: 'USK 12' },
  { v: '16', label: 'USK 16' },
  { v: '18', label: 'USK 18' },
];

export function SteamImport() {
  const [status, setStatus] = useState({ hasKey: false, hasSteamId: false, steamId: '' });
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [maxUsk, setMaxUsk] = useState('6');
  const [progress, setProgress] = useState(null); // { checked, total, approved, phase }
  const running = progress && progress.phase !== 'done';

  useEffect(() => {
    if (!api || !api.steamStatus) return undefined;
    api.steamStatus().then((s) => { if (s) { setStatus(s); setSteamId(s.steamId || ''); } }).catch(() => {});
    const off = api.onSteamProgress ? api.onSteamProgress((p) => setProgress(p)) : undefined;
    return off;
  }, []);

  const saveCreds = async () => {
    if (!api) return;
    const r = await api.setSteamCreds({ apiKey: apiKey || undefined, steamId: steamId || undefined });
    if (r) { setStatus(r); SFX.select(); setMsg('Zugang gespeichert ✓'); setApiKey(''); }
  };

  const doImport = async () => {
    if (!api) return;
    setBusy(true); setMsg(null); SFX.select();
    try {
      const r = await api.steamImport();
      if (r && r.ok) { SFX.launch(); setMsg(`Import: ${r.added} neu, ${r.updated} aktualisiert (von ${r.total}). Jetzt freigeben.`); }
      else { SFX.back(); setMsg(IMPORT_ERR[r && r.reason] || 'Import fehlgeschlagen.'); }
    } catch (e) { SFX.back(); setMsg('Import fehlgeschlagen.'); }
    setBusy(false);
  };

  const autoApprove = async () => {
    if (!api) return;
    SFX.select(); setProgress({ phase: 'start', checked: 0, total: 0, approved: 0 });
    try { await api.steamAutoApprove(maxUsk); } catch (e) { setProgress(null); }
  };
  const stopApprove = async () => { if (api) { try { await api.steamAutoApproveStop(); } catch (e) { /* ignore */ } } };

  const approveAll = async () => {
    if (!api || !api.approveAll) return;
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm
      && !window.confirm('Wirklich ALLE Spiele freigeben – unabhängig von der USK-Einstufung?')) return;
    SFX.select();
    const r = await api.approveAll();
    if (r && r.ok) { SFX.launch(); setMsg(`${r.approved} Spiele freigegeben (USK ignoriert).`); }
  };

  return (
    <div className="cur-steam">
      <div className="cur-steam-intro">
        <h2>{Icon.gamepad()} Steam-Bibliothek importieren</h2>
        <p className="desc">
          Holt deine gekauften &amp; kostenlosen Steam-Spiele automatisch über deine SteamID.
          Nichts wird sofort sichtbar – alles landet erst zur Freigabe in der Bibliothek.
        </p>
      </div>

      <div className="cur-steam-grid">
        {/* credentials */}
        <div className="par-card">
          <h3>{Icon.lock()} Steam-Zugang</h3>
          <p className="desc">
            Web-API-Key: <span className="mono">steamcommunity.com/dev/apikey</span> ·
            SteamID64 (17 Ziffern): <span className="mono">steamid.io</span> · Profil &amp; Spieldetails auf „öffentlich".
          </p>
          <label className="cur-field">
            <span>Web-API-Key</span>
            <input type="password" className="imp-input" placeholder={status.hasKey ? '•••••• (gespeichert)' : 'API-Key einfügen…'}
              value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </label>
          <label className="cur-field">
            <span>SteamID64</span>
            <input className="imp-input" inputMode="numeric" placeholder="7656119…"
              value={steamId} onChange={(e) => setSteamId(e.target.value.replace(/\D/g, ''))} />
          </label>
          <div className="cur-steam-actions">
            <button className="par-btn" onClick={saveCreds}>Zugang speichern</button>
            <span className={`par-rec-badge ${status.hasKey && status.hasSteamId ? 'on' : ''}`}>
              {status.hasKey && status.hasSteamId ? 'bereit' : 'unvollständig'}
            </span>
          </div>
        </div>

        {/* import + approve */}
        <div className="par-card">
          <h3>{Icon.bolt()} Importieren &amp; freigeben</h3>
          <button className="par-btn primary" onClick={doImport} disabled={busy || !(status.hasKey && status.hasSteamId)}>
            {busy ? 'Importiere…' : 'Bibliothek jetzt importieren'}
          </button>

          <div className="cur-steam-usk">
            <span className="desc">USK ist nur ein <b>Hinweis</b> – du entscheidest. Bequem-Helfer:</span>
            <div className="cur-steam-row">
              <select className="imp-input" value={maxUsk} onChange={(e) => setMaxUsk(e.target.value)}>
                {USK_OPTIONS.map((o) => <option key={o.v} value={o.v}>bis {o.label}</option>)}
              </select>
              {running
                ? <button className="par-btn" onClick={stopApprove}>Stop</button>
                : <button className="par-btn" onClick={autoApprove}>Automatisch nach Alter freigeben</button>}
            </div>
            {progress && (
              <div className="cur-steam-prog">
                <div className="cur-steam-bar"><i style={{ width: `${progress.total ? Math.round((progress.checked / progress.total) * 100) : 0}%` }}></i></div>
                <span className="desc">
                  {progress.phase === 'done'
                    ? `Fertig: ${progress.approved} freigegeben (${progress.checked} geprüft)${progress.stopped ? ', gestoppt' : ''}.`
                    : `Prüfe Altersfreigaben… ${progress.checked}/${progress.total} · ${progress.approved} freigegeben`}
                </span>
              </div>
            )}
            <button className="par-btn ghost" onClick={approveAll}>Alle freigeben (egal welche USK)</button>
          </div>
          {msg && <div className="desc cur-steam-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
