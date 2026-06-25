# LAUNCHPAD

**Ein privater, kindersicherer Android-Family-Launcher für Jake** — ein Fork des
Fossify Launchers mit Krypto-Cash-Zeitkonto, Zeitbudgets, Eltern-Steuerung,
sicherem Entdecken-Modus und einer warmen, kindgerechten Oberfläche.

> **Jake wird geliebt. Nicht optimiert.** ❤️

Aus dem ursprünglichen M1-Scaffold ist eine vollständige Plattform geworden:
ein produktiv integrierter Launcher (echte Fossify-Fork-Codebasis), eine
Eltern-Companion-App, eine kindersichere Desktop-Shell für Windows und ein
lokaler On-Device-KI-Assistent.

---

## Aktueller Stand

Die einzige verlässliche, **ehrlich mit dem Code abgeglichene** Statusübersicht ist
**[ROADMAP.md](ROADMAP.md)**. Kurzfassung:

| Meilenstein | Thema | Status |
| --- | --- | --- |
| **M1** | Core (Ledger, Launch-Gate, PIN, Eltern-Modus, Cooldown, Entdecken) | ✅ |
| **M2** | Core-Features (Zusagen, Doge-Coins, Cooldown-Regeln, Time-Tracking) | ✅ |
| **M3** | Hardening (Device-Owner, Kiosk, Safe-Browsing, Allow-/Blocklist) | ✅ |
| **M4** | Eltern-Companion-App (Pairing, LAN-Sync, Dashboard) | 🔄 funktional, UI-Politur offen |
| **M5** | Device-Owner-Hardening (Hard-Lock, Escape-Route, Telemetrie, Multi-User) | 🔄 teilweise |

Darüber hinaus sind viele Features fertig, die in keiner M1–M5-Stufe standen
(Per-App-Tageslimit + Wochenplan, „Mehr Zeit anfragen", Tagesbericht,
Audit-Verlauf, Impulsbremse, Setup-Wizard, verschlüsseltes Backup,
Tamper-Erkennung, Schulmodus u. a.) — siehe ROADMAP, Abschnitt
„Über die Roadmap hinaus gebaut".

**Legende:** ✅ erledigt · 🔄 teilweise / Grundgerüst · 📋 geplant

---

## Schnell-Links

- **Roadmap & ehrlicher Codestand**: [ROADMAP.md](ROADMAP.md)
- **Statusbericht**: [STATUS_REPORT.md](STATUS_REPORT.md)
- **Fern-Zugriff & Device Owner**: [docs/guides/REMOTE_AND_DEVICE_OWNER.md](docs/guides/REMOTE_AND_DEVICE_OWNER.md) — Family-Link-Hybrid, Device Owner optional
- **Bekannte Umgehungswege**: [docs/guides/BYPASS_MATRIX.md](docs/guides/BYPASS_MATRIX.md)
- **Device-Owner-Einrichtung**: [docs/guides/M3_DEVICE_OWNER_SETUP.md](docs/guides/M3_DEVICE_OWNER_SETUP.md)
- **Verifikation / Tests**: [docs/guides/VERIFICATION_CHECKLIST.md](docs/guides/VERIFICATION_CHECKLIST.md)
- **Desktop-Shell**: [desktop/README.md](desktop/README.md)

---

## Teilprojekte

| Verzeichnis | Was es ist |
| --- | --- |
| **`app/`** | Der Android-Family-Launcher — direkt in einen Fossify-Launcher-Fork (`org.fossify.home`) integriert. Hier lebt der gesamte Launcher-Code (M1–M5). |
| **`companion/`** | Eltern-Companion-App (eigenes APK fürs Elternhandy). Eigenständiges Gradle-Projekt: `cd companion && ./gradlew assembleDebug`. |
| **`desktop/`** | Kindersichere Windows-Desktop-Shell (Electron + React + Vite): ruhige Kind-Oberfläche plus „Familienzentrale" (Eltern-Kurator) inkl. Steam-Wunschliste/Angebote. |
| **`jake-ki/`** | **SPACE-JAKE** — lokaler On-Device-KI-Entdecker-Assistent (llama.cpp via JNI, läuft komplett offline). Frühes, eigenständiges Android-Projekt. |
| **`impl/`** | Historisches M1/M2-Scaffold (lose Quelldateien vor der Integration). Wird nicht mehr gebaut; nur als Referenz behalten. |
| **`docs/guides/`** | Detail-Guides (Device-Owner-Setup, Bypass-Matrix, Verifikation, Integrations-Historie). |

---

## Funktionsumfang

### Kernsystem (M1)
- ✅ **Krypto-Cash-Ledger**: unveränderliches Transaktionsprotokoll (EARN, SPEND, EXPIRE, CORRECTION)
- ✅ **No-Regression-Prinzip**: verdiente Zeit wird nie gelöscht, entwertet oder zurückgenommen
- ✅ **Zeitbudget**: Wochen-Cap, durchgesetzt beim App-Start + Cooldown-Mechanismus
- ✅ **App-Whitelist**: DEFAULT-DENY (nur freigegebene Apps sind sichtbar)
- ✅ **Launch-Gate**: Whitelist- + Zeitbudget-Prüfung bei jedem App-Start
- ✅ **Cooldown / Bildschirmpause**: ruhige Erholungsphase nach Zeitablauf

### Eltern-Steuerung (M2/M4)
- ✅ **Eltern-Modus**: PIN-geschütztes Menü (Zeit anpassen, Apps freigeben, Audit-Trail)
- ✅ **Zusagen** (Familien-Versprechen) mit 24-h-Auto-Freigabe
- ✅ **Doge-Coins** (anfragebasierte Medien-Freigaben) mit Dauerbegrenzung und Muster-Analyse
- ✅ **Cooldown-Regeln** per JSON konfigurierbar
- ✅ **Companion-App**: Pairing/Auth (Bearer-Token), Genehmigen/Ablehnen, Zeit geben, Apps verwalten, Export/Import, Widget
- 🔄 **Eltern-Dashboard**: Tagesbericht + Audit-Verlauf vorhanden; tiefere Analytics offen

### Kindersicherheit
- ✅ **Entdecken-Modus**: sicheres WebView mit Domain-Allowlist + harter Blocklist
- ✅ **Time-Tracking-Dienst**: überwacht aktive App im Hintergrund, bucht Budget ab, löst Cooldown aus
- ✅ **PIN-Gating & Escape-Route-Sperren** (Settings, App-Info, Deinstallation PIN-geschützt)
- ✅ **Per-App-Tageslimit + Wochenplan** (Schultag/Wochenende), **Schulmodus** (ein Tipp)
- ✅ **Impulsbremse**, **„Mehr Zeit anfragen"** (kind-seitig)
- 🔄 **Safe-Browsing**: WebView-Flag aktiv; volle Google-Safe-Browsing-API noch offen

### Hardening (M3/M5)
- ✅ **Device-Owner-Registrierung** + **Lock-Task-Kiosk**
- ✅ **Telemetrie via PACKAGE_USAGE_STATS**
- ✅ **Verschlüsseltes Backup** (AES-256-GCM), **Tamper-/Uhr-Manipulationserkennung**
- ✅ **QR-Pairing**: RSA-2048 + AES-256-GCM
- 🔄 **Lückenlose Escape-Route-Sperre**: bekannte Lücken dokumentiert in [BYPASS_MATRIX.md](docs/guides/BYPASS_MATRIX.md)
- 🔄 **Multi-User-Management**: nur Basis-Restriktionen

### KI-Assistent
- ✅ **SPACE-JAKE** (`jake-ki/`): lokaler, internetfreier Wissenschafts-/Entdecker-Assistent
  (llama.cpp via JNI). Läuft komplett auf dem Gerät — keine Cloud, kein Server.

---

## Technologie-Stack

**Launcher (`app/`)**
- Basis: Fossify Launcher (Fork, `org.fossify.home`), Kotlin, Android `minSdk 26`
- Datenbank: Room (mit Migrationen)
- Build: Gradle (Kotlin DSL) · Produkt-Flavors `foss` / `gplay`
- Bibliotheken: `fossify-commons` (PIN-Gating), `androidx.room`, `androidx.work`,
  `kotlinx.coroutines`, `zxing` (QR), `lottie`

**Companion-App (`companion/`)** — eigenständiges Android-/Gradle-Projekt

**Desktop-Shell (`desktop/`)** — Electron + React + Vite

**SPACE-JAKE (`jake-ki/`)** — Android + nativer `llama.cpp`-JNI-Layer

---

## Bauen & Starten

### Launcher (Android)
```bash
./gradlew :app:assembleDebug      # Debug-APK
./gradlew :app:installDebug       # auf verbundenem Gerät installieren
```

### Companion-App (eigenes APK)
```bash
cd companion
./gradlew assembleDebug
```

### Desktop-Shell (Windows)
```bash
cd desktop
npm install
npm run dev      # Vite-Renderer + Electron, Hot-Reload (Kind-Fenster)
npm run build    # Produktions-Bundles (Kind + Kurator) → dist/
npm test         # Unit-Tests (Launch-Resolver, Kurations-Modell, Wunschliste/Angebote)
```
Die Familienzentrale (Eltern-Kurator) öffnet aus der Kind-Shell über die Kachel
**Elternbereich** → PIN (Demo: `1234`). Details: [desktop/README.md](desktop/README.md).

---

## Ethische Grundlage

> **Jake wird geliebt. Nicht optimiert.** ❤️

- **Kein Zwang**: Zeit wird nie als Strafe abgezogen — nur verdient oder läuft natürlich ab.
- **Transparenz**: alle Transaktionen sind fürs Kind sichtbar, Entscheidungen werden erklärt.
- **Fairness**: Werkzeuge für Gerechtigkeit, nicht für Kontrolle.
- **Kind-Handlungsfähigkeit**: Anfragen sind echt, Zusagen sind echt, Freigaben sind real.

---

## Lizenz

- **LAUNCHPAD**: proprietär. Fossify-Launcher-Fork für die private Familiennutzung.
- **Fossify Commons / Launcher**: Apache 2.0 ([fossifyorg](https://github.com/fossifyorg)).

Siehe [LICENSE](LICENSE).

---

**Loslegen?** → Stand & nächste Schritte in [ROADMAP.md](ROADMAP.md),
Eltern-Setup-Entscheidungen in [docs/guides/REMOTE_AND_DEVICE_OWNER.md](docs/guides/REMOTE_AND_DEVICE_OWNER.md).
