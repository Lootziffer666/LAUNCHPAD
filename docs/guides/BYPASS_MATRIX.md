# LAUNCHPAD — Bypass-Matrix (Stand: Code-Audit)

Dieses Dokument listet bekannte Wege auf, mit denen ein Kind die Bildschirmzeit-
Durchsetzung umgehen könnte, was LAUNCHPAD aktuell dagegen tut, und das
Restrisiko. Es ist ein **Code-Audit**, kein Gerätetest — Punkte mit „auf Gerät
prüfen" brauchen noch manuelle Verifikation.

Schweregrade: 🟢 abgedeckt · 🟡 teilweise / Restrisiko · 🔴 offen (braucht Device Owner)

---

## 1. App-Start aus dem Launcher

| Vektor | Status | Absicherung |
|---|---|---|
| Home-Grid-Icon | 🟢 | `performItemClick` → `launchApp()` → `LaunchGate` |
| App-Drawer (AllAppsFragment) | 🟢 | `launchApp()` |
| App in geöffnetem Ordner | 🟢 | `isClickingGridItem` liefert Ordner-Item → `performItemClick` → Gate |
| Gepinnter Homescreen-Shortcut | 🟢 | `passesLaunchGateForShortcut()` vor `startShortcut` |
| Long-Press-Shortcut-Menü | 🟢 | `passesLaunchGateForShortcut()` vor `startShortcut` |

Alle In-Launcher-Startpfade laufen durch dasselbe Gate (Whitelist + Budget +
Cooldown + Wochenplan + Per-App-Tageslimit). Bei Blockade erscheint der
kontextbezogene Block-Screen.

## 2. App-Start über Seitenkanäle (außerhalb des Launchers)

| Vektor | Status | Absicherung / Restrisiko |
|---|---|---|
| Aus einer Benachrichtigung heraus | 🟡 | Nicht über das Gate. Backstop: `TimeTrackingService` pollt alle 10s den Vordergrund und wirft **ACTIVE_LEISURE**-Apps bei Cooldown/0-Budget/Tageslimit raus. |
| „In App öffnen"-Link aus Browser/anderer App | 🟡 | wie oben |
| Recents/Übersicht (zuletzt genutzte) | 🟡 | wie oben — eine pausierte 🪙-App wird binnen ~10s erneut geblockt |
| Nicht-Whitelist-App über Seitenkanal | 🟡 | **Restrisiko**: Der Service metert nur ACTIVE_LEISURE. Eine nicht freigegebene App, die über einen Seitenkanal in den Vordergrund kommt, wird vom laufenden Backstop NICHT geblockt (nur am Launcher-Startpunkt). |

**Empfehlung (offen):** Optionaler, per Default ausgeschalteter „strenger
Vordergrund-Block" im Service: blockt jede nicht freigegebene, startbare App im
Vordergrund — mit fester Allowlist (Launcher selbst, System-UI, Telefon/Notruf,
Berechtigungsdialoge, Tastatur) und **niemals während eines Anrufs**. Bewusst
noch nicht umgesetzt: ohne Gerätetest zu riskant (Notruf/Systemdialoge).

## 3. Zeit-/System-Manipulation

| Vektor | Status | Absicherung |
|---|---|---|
| Systemuhr vorstellen | 🟢 | `TamperClock` vergleicht Wall-Clock vs. monotone Uptime pro Tick → Lockdown |
| Zeitzone ändern | 🟢 | `ACTION_TIMEZONE_CHANGED`-Receiver → Lockdown |
| Usage-Access entziehen | 🟢 | erkannt (war-granted-Flag) → Lockdown |
| Service-Lücke (Doze/Kill) | 🟡 | als WARNING protokolliert; WorkManager-Neustart. Auf Gerät prüfen. |
| Reboot zum „Zeit zurücksetzen" | 🟢 | Budget liegt im immutablen Ledger (DB), nicht im Service-Speicher; `BootReceiver` protokolliert |

## 4. Geräteebene (braucht Device Owner / M3)

| Vektor | Status | Anmerkung |
|---|---|---|
| Safe Mode (bootet ohne Drittanbieter-Launcher) | 🔴 | Nur per Device Owner unterbindbar |
| Launcher deinstallieren | 🔴 | Device Admin/Owner verhindert Deinstallation |
| Standard-Launcher wechseln (Einstellungen) | 🔴 | Setzt voraus, dass Einstellungen erreichbar sind; mit Device Owner einschränkbar |
| ADB / Entwickleroptionen | 🔴 | Nur per Device Owner / deaktivierte Entwickleroptionen |
| App-Daten/Cache löschen (Einstellungen) | 🔴 | Device Owner |

M3 (Device-Owner-Setup) ist die Voraussetzung, um Kapitel 4 zu schließen. Siehe
`docs/guides/M3_DEVICE_OWNER_SETUP.md`.

## 5. Innerhalb erlaubter Apps

| Vektor | Status | Absicherung |
|---|---|---|
| Browser → gesperrte Seiten | 🟡 | Entdecken-Modus mit Hard-Blocklist (X, TikTok, Instagram, Reddit, .onion …). Nur im LAUNCHPAD-Browser; ein freigegebener Drittbrowser umgeht das. |
| 🪙-App-Shortcut umgeht Budget | 🟢 | geschlossen (Kapitel 1) |

---

## Zusammenfassung

- **Front door (Launcher-Starts): vollständig gegatet** inkl. aller Shortcut-Pfade.
- **Laufender Backstop**: deckt 🪙-Apps über Seitenkanäle ab; Restlücke bei
  nicht freigegebenen Apps über Seitenkanäle (Empfehlung in Kap. 2).
- **Zeit-Manipulation**: breit abgedeckt durch Tamper-Erkennung + Lockdown.
- **Geräteebene**: erfordert Device Owner (M3) — bewusst außerhalb des
  Soft-Mode-Scopes.
