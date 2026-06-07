# LAUNCHPAD — Roadmap

> **Eine** verlässliche Quelle. Diese Datei führt die bisher verstreuten Roadmap-Stände
> zusammen (`README.md`, `STATUS_REPORT.md`, `docs/guides/15_m1_implementation_summary.md`,
> `M2_IMPLEMENTATION_SUMMARY.md`, `M3_DEVICE_OWNER_SETUP.md`) und gleicht sie **ehrlich mit dem
> tatsächlichen Code** ab.
>
> Stand: 2026-06-07. Bitte bei größeren Features mitpflegen.

**Legende:** ✅ erledigt · 🔄 teilweise / Grundgerüst · 📋 geplant

---

## Überblick

| Meilenstein | Thema | Status |
|---|---|---|
| **M1** | Core (Ledger, Launch-Gate, PIN, Eltern-Modus, Cooldown, Entdecken) | ✅ |
| **M2** | Core-Features (Zusagen, Doge-Coins, Cooldown-Regeln, Time-Tracking) | ✅ |
| **M3** | Hardening (Device-Owner, Kiosk, Safe-Browsing, Allow-/Blocklist) | ✅ |
| **M4** | Eltern-Companion-App (Pairing, LAN-Sync, Dashboard) | 🔄 |
| **M5** | Device-Owner-Hardening (Hard-Lock, Escape-Route, Telemetrie, Multi-User) | 🔄 |

> Hinweis: Die ursprüngliche Roadmap war ein Schnappschuss aus der M1-Zeit. Der Code ist seitdem
> deutlich weiter — etliches aus M2–M5 ist bereits gebaut, und es gibt viele Features, die in
> **keiner** Roadmap-Stufe standen (siehe „Über die Roadmap hinaus").

---

## M1 — Core ✅

| Punkt | Status | Wo im Code |
|---|---|---|
| Krypto-Cash-Ledger (No-Regression) | ✅ | `models/KryptoCashModels.kt`, `cryptoCashDao` |
| Launch-Gate + Whitelist (Default-Deny) | ✅ | `helpers/LaunchGate.kt`, `helpers/AppWhitelistFilter.kt` |
| PIN-Gating | ✅ | `helpers/PinGateHelper.kt` |
| Eltern-Modus | ✅ | `activities/ElternModusActivity.kt` |
| Cooldown / Bildschirmpause | ✅ | `activities/CooldownActivity.kt` |
| Entdecken-Modus (sicheres WebView) | ✅ | `activities/EntdeckenActivity.kt`, `fragments/EntdeckenFragment.kt` |
| QR-Pairing (Skelett) | ✅ | `helpers/QrPairingProtocol.kt` |

---

## M2 — Core-Features ✅

| Punkt | Status | Wo im Code |
|---|---|---|
| Zusagen (Versprechen) UI + Logik | ✅ | `activities/ZusagenActivity.kt`, `zusageDao` |
| Doge-Coins (Medien-Freigaben) | ✅ | `activities/DogeRequestsActivity.kt`, `models/DogeModels.kt` |
| Cooldown-Regeln per JSON | ✅ | `helpers/CooldownRules.kt` |
| Time-Tracking-Hintergrunddienst | ✅ | `services/TimeTrackingService.kt` |
| Minecraft-Integration *(„falls Scope")* | 🔄 | nur Kategorisierung in `helpers/CategorySuggester.kt` — keine echte Integration |

---

## M3 — Hardening ✅

| Punkt | Status | Wo im Code |
|---|---|---|
| Device-Owner-Registrierung | ✅ | `receivers/LockDeviceAdminReceiver.kt`, Anleitung: `docs/guides/M3_DEVICE_OWNER_SETUP.md` |
| Lock-Task-Kiosk | ✅ | `helpers/KioskManager.kt` |
| Safe-Browsing | 🔄 | `fragments/EntdeckenFragment.kt` (`safeBrowsingEnabled = true`) — WebView-Flag, nicht die volle Safe-Browsing-API |
| Erweitertes Allow-/Blocklisting | ✅ | `activities/AppsManagementActivity.kt`, `helpers/CategorySuggester.kt` |

---

## M4 — Eltern-Companion-App 🔄

| Punkt | Status | Wo im Code |
|---|---|---|
| QR-Pairing-Flow (vollständig) | ✅ | `helpers/PairingManager.kt`, `helpers/QrPairingProtocol.kt`, `activities/PairingActivity.kt` |
| LAN-Command-Sync | ✅ | `helpers/LaunchpadServer.kt`, `helpers/CommandProcessor.kt`, `helpers/CompanionSerializer.kt` |
| Companion-App | ✅ | funktional + abgesichert: Pairing/Auth (Bearer-Token), Genehmigen/Ablehnen, Zeit geben, Apps verwalten, Export/Import, Widget. Offen: optionale UI-Politur |
| Eltern-Dashboard / Analytics | 🔄 | Basis vorhanden: `activities/DailyReportActivity.kt`, `activities/AuditLogActivity.kt` — keine tiefergehende Analytics |

---

## M5 — Device-Owner-Hardening 🔄

| Punkt | Status | Wo im Code |
|---|---|---|
| Hard-Lock-Durchsetzung (Lock-Task) | ✅ | `helpers/KioskManager.kt` |
| Telemetrie via PACKAGE_USAGE_STATS | ✅ | `helpers/UsageTracker.kt` („M5 hook — now live") |
| Lückenlose Escape-Route-Sperre | 🔄 | `helpers/ForegroundPolicy.kt` — **bekannte Lücken dokumentiert in** `docs/guides/BYPASS_MATRIX.md` |
| Multi-User-Management | 🔄 | nur Restriction `DISALLOW_ADD_USER` in `helpers/KioskManager.kt` — keine echte Verwaltung |

---

## Über die Roadmap hinaus gebaut ✅

Diese Features stehen in **keiner** M1–M5-Stufe, sind aber fertig:

- **Per-App-Tageslimit + Wochenplan** (Schultag/Wochenende) — `activities/WeekScheduleActivity.kt`, `helpers/AppLimitBonus.kt`
- **Kind-seitige „Mehr Zeit anfragen"** — `activities/AppTimeRequestsActivity.kt`
- **Tagesbericht** — `activities/DailyReportActivity.kt`
- **Audit-Verlauf (teilbar)** — `activities/AuditLogActivity.kt`
- **Impulsbremse** — `activities/ImpulseDelayActivity.kt`, `helpers/ImpulseTracker.kt`
- **Setup-Wizard** — `activities/SetupActivity.kt`
- **Berechtigungs-Check** — `activities/PermissionHealthActivity.kt`
- **Verschlüsseltes Backup (AES-256-GCM)** — `helpers/BackupCrypto.kt`
- **Tamper-/Uhr-Manipulationserkennung** — `helpers/TamperClock.kt`, `helpers/TamperMonitor.kt`
- **Konfigurierbarer Kindname** — `helpers/ChildProfile.kt`
- **Neu-installiert-Review**: erkennt neue Apps (Snapshot-Diff), Companion erlaubt/lehnt ab — `helpers/NewAppsTracker.kt`
- **Ein-Tipp-Schulmodus**: pausiert Freizeit-Apps, Lernen/Kommunikation bleiben offen — `helpers/SchoolMode.kt`

### UX-Politur (diese Session, PR #6)
- **„Verspielt & bunt"**: warme Kind-Oberfläche statt dunklem „Fort-Knox"-Look, Raketen-Maskottchen — `helpers/Playful.kt`, `drawable/mascot_rocket*.xml`
- **Wallpaper-adaptive Farben**: Farbschema folgt dem Hintergrundbild, mit Lesbarkeits-Garantie (Unit-getestet) — `helpers/Playful.kt` (`palette`/`derive`), `helpers/PlayfulPaletteTest.kt`
- **Eltern-Bereich entschärft**: warme Hero-Card + freundliches Wording statt Sicherheitskonsole — `activities/ElternModusActivity.kt`
- **Companion abgesichert + erweitert**: Sitzungsschlüssel als Bearer-Token, Anfragen ablehnen, Zeit geben — `helpers/LaunchpadServer.kt`, `helpers/CommandProcessor.kt`, `companion/…/CompanionActivity.kt`
- **Fern-Zugriff-Entscheidung**: Family-Link-Hybrid, Device Owner optional — `docs/guides/REMOTE_AND_DEVICE_OWNER.md`

---

## Bekannte Schulden / offene Punkte

- **Escape-Route-Lücken** sind real und dokumentiert → `docs/guides/BYPASS_MATRIX.md`. Vor „kindersicher genug" abarbeiten.
- **Companion-App** ist funktional und abgesichert (Auth, Ablehnen, Zeit geben). Offen: optionale UI-Politur.
- **Safe-Browsing** nutzt nur das WebView-Flag, nicht die Google-Safe-Browsing-API.
- **detekt-Baseline** enthält vorbestehende LAUNCHPAD-Altlasten (`canLaunch`, `renderReport`, `tick`, `BackupCrypto` …), die beim ersten PR-Gate sichtbar wurden — bei Gelegenheit refaktorieren statt nur baselinen.
- **Fern-Zugriff** (außerhalb WLAN): bewusst via **Google Family Link** (Hybrid), kein eigener Relay; **Device Owner ist optional** → `docs/guides/REMOTE_AND_DEVICE_OWNER.md`.

---

## Kandidaten für als Nächstes

1. `BYPASS_MATRIX.md`-Lücken systematisch schließen (Richtung M5 „lückenlos").
2. Companion-UI / Eltern-Dashboard-Analytics ausbauen (M4 vervollständigen).
3. Schulmodus optional zeitgesteuert (auto an/aus zu Schulzeiten) + „neu installiert"-Stups remote.
4. Vorbestehende detekt-Komplexität abbauen statt baselinen.

---

*Quellen, die diese Datei zusammenführt: `README.md` (M2-M5 Roadmap), `STATUS_REPORT.md`,
`docs/guides/15_m1_implementation_summary.md`, `docs/guides/M2_IMPLEMENTATION_SUMMARY.md`,
`docs/guides/M3_DEVICE_OWNER_SETUP.md`, `docs/guides/BYPASS_MATRIX.md`.*
