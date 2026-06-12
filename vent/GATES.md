# 🚪 GATES — VENT

---

## 🔜 Nächste Gates

### Gate VE-011: Steam API Client
- **Branch:** `gate/ve-011-steam-api`
- **To-Dos:**
  - [ ] Steam Web API Integration
  - [ ] Auth (Steam OpenID)
  - [ ] Game-Library-Abfrage
  - [ ] Family-Sharing-Status
- **Akzeptanz:** Library-Daten korrekt abgerufen
- **Kill:** API-Key im Code

### Gate VE-012: Wishlist Manager
- **Branch:** `gate/ve-012-wishlist`
- **To-Dos:**
  - [ ] Wishlist Import/Sync
  - [ ] Preis-Tracking pro Spiel
  - [ ] Sale-Alerts (Push Notification)
  - [ ] Cross-Family-Wishlist-Vergleich
- **Akzeptanz:** Wishlist synchronisiert, Alerts funktionieren
- **Kill:** Polling häufiger als 1x/Stunde

### Gate VE-013: Family Session Manager
- **Branch:** `gate/ve-013-family-sessions`
- **To-Dos:**
  - [ ] Wer spielt gerade was?
  - [ ] Session-Konflikt-Erkennung
  - [ ] Slot-Planung (wer spielt wann)
  - [ ] Notification bei Slot-Freigabe
- **Akzeptanz:** Familien-Sessions sichtbar
- **Kill:** Ohne Steam-Auth

### Gate VE-014: Android Widget
- **Branch:** `gate/ve-014-widget`
- **To-Dos:**
  - [ ] Homescreen Widget mit aktiven Sessions
  - [ ] Quick-Launch für Slot-Anfrage
  - [ ] Glance API (Compose)
  - [ ] Refresh-Intervall konfigurierbar
- **Akzeptanz:** Widget zeigt Live-Status
- **Kill:** Widget ohne Auto-Refresh
