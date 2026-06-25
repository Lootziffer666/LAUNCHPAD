# Gate 3 -- Minimal App Scaffold

**Status:** PASS  
**Datum:** 2025-06-19  
**Branch:** `kiro/desktop-shipping-audit`

---

## 1. Build & Test Ergebnis

| Schritt | Befehl | Ergebnis |
|---------|--------|----------|
| Abhaengigkeiten | `cd desktop && npm ci` | 493 Pakete installiert |
| Build (Vite) | `cd desktop && npm run build` | Erfolgreich (920ms, dist/ erzeugt) |
| Tests | `cd desktop && npm test` | **50/50 bestanden**, 0 fehlgeschlagen |

Keine Console-Errors, keine Warnungen im Build-Output (nur npm audit Hinweise zu upstream deps).

---

## 2. Dokumentierte Befehle

### Entwicklung starten
```bash
cd desktop && npm install && npm run dev
```
Startet Vite Dev-Server + Electron mit Hot-Reload. Zwei Fenster: Child-Shell und Curator-Fenster.

### Produktions-Build
```bash
cd desktop && npm run build
```
Erzeugt optimierte Bundles in `desktop/dist/` (index.html + curator.html + Assets).

### Tests ausfuehren
```bash
cd desktop && npm test
```
Nutzt den Node.js Built-in Test Runner (`node --test "electron/**/*.test.js"`). Aktuell 50 Tests.

---

## 3. Bestehende Architektur

```
desktop/
├── electron/
│   ├── main.js              # Electron Main Process (IPC-Handler)
│   ├── preload.js           # Bridge fuer Child-Window (window.launchpad.*)
│   ├── preload-curator.js   # Bridge fuer Curator-Window
│   └── services/            # Business-Logik (parental, cover, launch, deals...)
├── src/                     # React-Renderer (Vite)
│   ├── apps/                # Feature-Panels (Parental, Games, ...)
│   └── components/          # Shared UI Components
├── build-resources/         # Electron-Builder Assets (icon.svg, icon.png)
├── content/                 # Spiel-Katalog Daten (games.sample.json)
├── index.html               # Entry: Child-Shell
├── curator.html             # Entry: Curator/Eltern-Fenster
├── vite.config.js           # Vite Konfiguration (Multi-Page)
└── package.json             # Scripts, Dependencies, electron-builder config
```

**Kern-Prinzipien:**
- Electron Main Process haelt alle IPC-Handler (childHandlers + curatorHandlers)
- Preload-Scripts exponieren typisierte Bridges (kein nodeIntegration)
- Services-Schicht kapselt Logik (Parental PIN, Game Launch, Cover Fetch, Deals)
- React-Renderer ist rein deklarativ, keine direkten Node-Zugriffe

---

## 4. Fremde Assets

Keine fremden Assets erforderlich. Alle Abhaengigkeiten kommen via npm. Fonts (Outfit) sind lokal gebundelt. Cover-Bilder werden zur Laufzeit von SteamGridDB geladen und lokal gecacht.

---

## 5. Definition of Done

- [x] App startet lokal ohne Fehler
- [x] Keine Console-Errors im Build
- [x] Keine fremden Assets erforderlich (alles via npm/lokal)
- [x] Startbefehl dokumentiert
- [x] Build-Befehl dokumentiert
- [x] Test-Befehl dokumentiert
- [x] Keine Produkt-Features ueber den Startbildschirm hinaus (Controller-Shell ist separater Scope)
- [x] Sample Game Catalog erstellt (`desktop/content/games.sample.json`)

---

## 6. Naechste Schritte (Gate 4+)

- Gate 4: Controller-First Navigation Shell (Gamepad-Input, D-Pad Focus)
- Gate 5: Game Registry mit Kuratierungs-Workflow
- Gate 6: Launch-Engine Integration
