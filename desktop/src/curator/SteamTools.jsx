/* ============================================================
   LAUNCHPAD Familienzentrale — Steam-family tools.
   Wunschliste: entries with target prices, live price check
   (CheapShark via main, no key needed). Angebote: top Steam
   deals filtered to the parent's min-discount preference,
   wishlist hits highlighted. Both pages can be disabled
   individually under Eltern & Sicherheit.
   ============================================================ */
import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../ui/icons.jsx';
import { SFX } from '../lib/sfx.js';

const api = (typeof window !== 'undefined' && window.launchpad) || null;

const STATE_LABEL = {
  under: 'Zielpreis erreicht',
  near: 'Fast am Ziel',
  above: 'Über Zielpreis',
};

function StateBadge({ state }) {
  if (!state) return null;
  return <span className={`wl-state ${state}`}>{STATE_LABEL[state]}</span>;
}

export function WishlistTab() {
  const [items, setItems] = useState([]);
  const [checking, setChecking] = useState(false);
  const [title, setTitle] = useState('');
  const [appId, setAppId] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (!api) return;
    api.listWishlist().then((l) => setItems(l || [])).catch(() => {});
  }, []);

  const add = async () => {
    if (!api || !title.trim()) return;
    SFX.select();
    const next = await api.upsertWishlist({ title, steamAppId: appId, targetPrice: parseFloat(String(target).replace(',', '.')) });
    setItems(next || []);
    setTitle(''); setAppId(''); setTarget('');
  };

  const remove = async (id) => {
    if (!api) return;
    SFX.back();
    setItems(await api.removeWishlist(id) || []);
  };

  const setItemTarget = async (it, value) => {
    if (!api) return;
    const targetPrice = parseFloat(String(value).replace(',', '.'));
    const next = await api.upsertWishlist({ ...it, targetPrice });
    setItems(next || []);
  };

  const checkPrices = async () => {
    if (!api || checking) return;
    SFX.select();
    setChecking(true);
    try {
      const out = await api.refreshWishlistPrices();
      if (out && out.items) setItems(out.items);
    } catch (e) { /* offline → keep list as-is */ }
    setChecking(false);
  };

  return (
    <div className="cur-lib">
      <div className="cur-toolbar">
        <div className="cur-sub">
          Spiele, die die Familie im Blick hat — mit Zielpreis und aktuellem Steam-Preis (USD, via CheapShark).
        </div>
        <div className="cur-actions">
          <button className="imp-btn ghost" onClick={checkPrices} disabled={checking}>
            {checking ? 'Prüfe Preise…' : 'Preise prüfen'}
          </button>
        </div>
      </div>

      <div className="par-card span2">
        <h3>{Icon.plus()} Spiel vormerken</h3>
        <div className="wl-form">
          <input className="wl-input" placeholder="Titel" value={title}
            onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <input className="wl-input sm" placeholder="Steam App-ID (optional)" value={appId}
            onChange={(e) => setAppId(e.target.value.replace(/[^0-9]/g, ''))} />
          <input className="wl-input sm" placeholder="Zielpreis $" value={target}
            onChange={(e) => setTarget(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="par-btn primary" onClick={add}>Hinzufügen</button>
        </div>
        <p className="desc">Mit App-ID kann der aktuelle Preis automatisch geprüft werden.</p>
      </div>

      <div className="par-card span2">
        <h3>{Icon.star()} Wunschliste</h3>
        {items.map((it) => (
          <div className="par-row" key={it.id}>
            <div className="r-ic" style={{ background: it.state === 'under' ? '#16a34a' : '#4f46e5' }}>{Icon.star()}</div>
            <div className="r-meta">
              <b>{it.title}</b>
              <span>
                {it.steamAppId ? `App ${it.steamAppId}` : 'ohne App-ID'}
                {it.price && it.price.salePrice ? ` · aktuell $${it.price.salePrice}` : ''}
                {it.price && it.price.isOnSale ? ` (−${it.price.savingsPercent}%)` : ''}
              </span>
            </div>
            <StateBadge state={it.state} />
            <input className="wl-input target" placeholder="Ziel $" defaultValue={it.targetPrice ?? ''}
              onBlur={(e) => e.target.value !== String(it.targetPrice ?? '') && setItemTarget(it, e.target.value)} />
            <button className="imp-btn ghost" onClick={() => remove(it.id)} title="Entfernen">{Icon.close()}</button>
          </div>
        ))}
        {!items.length && <div className="cur-empty">Noch keine Einträge — oben das erste Spiel vormerken.</div>}
      </div>
    </div>
  );
}

export function DealsTab() {
  const [deals, setDeals] = useState(null); // null = loading, [] = loaded/empty
  const [minSavings, setMinSavings] = useState(30);
  const [wishlist, setWishlist] = useState([]);

  const load = useCallback(async () => {
    if (!api) return;
    setDeals(null);
    try {
      const [out, wl, s] = await Promise.all([
        api.topDeals(),
        api.listWishlist(),
        api.getParentalSettings(),
      ]);
      setDeals((out && out.deals) || []);
      setWishlist(wl || []);
      if (s && s.dealsMinSavings) setMinSavings(s.dealsMinSavings);
    } catch (e) {
      setDeals([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setThreshold = async (v) => {
    SFX.select();
    setMinSavings(v);
    if (api) {
      try { await api.setParentalSettings({ dealsMinSavings: v }); } catch (e) { /* ignore */ }
    }
    load();
  };

  const onWishlist = (d) =>
    wishlist.some((w) =>
      (w.steamAppId && w.steamAppId === d.steamAppId) ||
      (w.title && d.title && w.title.toLowerCase() === d.title.toLowerCase()));

  return (
    <div className="cur-lib">
      <div className="cur-toolbar">
        <div className="cur-chips">
          {[30, 50, 70].map((v) => (
            <button key={v} className={`cur-chip ${minSavings === v ? 'on' : ''}`} onClick={() => setThreshold(v)}>
              ab −{v}%
            </button>
          ))}
        </div>
        <div className="cur-actions">
          <button className="imp-btn ghost" onClick={load}>Aktualisieren</button>
        </div>
      </div>

      {deals === null && <div className="cur-empty">Lade Angebote…</div>}
      {deals && !deals.length && (
        <div className="cur-empty">Keine Angebote gefunden — bist du offline?</div>
      )}
      {deals && deals.length > 0 && (
        <div className="deal-grid">
          {deals.map((d, i) => (
            <div className={`deal-card ${onWishlist(d) ? 'hit' : ''}`} key={`${d.steamAppId || d.title}-${i}`}>
              {d.thumb ? <img src={d.thumb} alt="" loading="lazy" /> : <div className="deal-noimg">{Icon.gamepad()}</div>}
              <div className="deal-meta">
                <b>{d.title}</b>
                <span>
                  <em className="deal-sale">${d.salePrice}</em>
                  <s>${d.normalPrice}</s>
                  <i className="deal-pct">−{d.savingsPercent}%</i>
                </span>
                {onWishlist(d) && <span className="deal-hit">{Icon.star()} Auf der Wunschliste</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
