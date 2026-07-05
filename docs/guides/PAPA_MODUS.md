# Papa-Modus — betreuter Override per NFC / QR

> **Ziel:** Wenn Jake bei Papa ist, soll er einen NFC-Tag antippen oder einen QR-Code scannen
> können, der seine Regeln vorübergehend aufhebt — betreutes Nutzen ist wichtiger als striktes
> PIN-Gating. Der Override verbraucht **keine** Krypto-Cash-Zeit und erscheint **nicht** im
> geteilten Verlauf (Tagesbericht / Audit / Companion-Sync), der auf der Mama-Seite sichtbar ist.

## Wie es funktioniert

- Der Launcher hat ein geheimes HMAC-Schlüsselwort (`SupervisedOverride`-Secret), das nur er und
  Papas Tag/QR kennen. Ein Tag/QR trägt ein **signiertes, zeitlich begrenztes Token**
  (`launchpad://papa?t=…`). Ohne gültige Signatur passiert nichts — Jake kann sich also nicht
  selbst freischalten.
- Ein gültiger Scan hebt **alle** Sperren auf (Whitelist, Zeitbudget, Cooldown, Wochenplan,
  Schulmodus) für ein einstellbares Fenster (Standard **180 Min**). Danach greifen die Regeln
  automatisch wieder — es gibt kein „Aus-Tippen", nur Ablauf oder „jetzt beenden".
- Während der Override aktiv ist:
  - `LaunchGate` lässt jede App direkt starten (`app/.../helpers/LaunchGate.kt`, Check 0),
  - der `TimeTrackingService` **pausiert** die Zeitmessung (kein SPEND, kein Cooldown-Relaunch),
  - der App-Drawer zeigt auch sonst versteckte Apps.
  Es wird **nichts** in Ledger/Audit geschrieben; nur ein lokaler „zuletzt genutzt"-Zeitstempel,
  den ausschließlich Papa im Setup sieht.

## Einrichten (einmalig, auf Jakes Telefon)

1. **Eltern-Modus → Papa-Modus** öffnen (PIN-geschützt).
2. **„Dauer pro Scan"** festlegen (z. B. 120–240 Min).
3. **„Dauer-Code erzeugen"** tippen → ein QR erscheint. Dieser Code gilt für einen festen Tag.
4. **NFC-Tag beschreiben:** „Link teilen" → in einer NFC-Writer-App (z. B. *NFC Tools*) als
   **URI/URL-Record** auf einen NTAG-Sticker schreiben. Fertig — Tag bei Papa platzieren.
   *Alternativ* einfach den QR ausdrucken/anzeigen; Jake scannt ihn mit der Kamera.

## Nutzen (Jake)

- **NFC:** Telefon an den Tag halten → Bestätigung „Papa-Modus ist an … frei bis HH:MM".
- **QR:** Mit der Kamera/Lens scannen → derselbe Ablauf.

## WLAN-Geofence (optional, empfohlen)

Damit Papa-Modus **nur bei dir** gilt und nicht bei der Mutter:

1. In **Eltern-Modus → Papa-Modus → WLAN-Geofence**: *„Dieses WLAN als zuhause merken"* (einmalig
   pro Netz; du kannst mehrere merken). Beim ersten Mal fragt Android die **Standort-Berechtigung**
   ab — das ist eine Android-Vorgabe zum Auslesen des WLAN-Namens; **Standort muss dabei an sein**.
2. *„WLAN-Bindung an"* schalten.

Danach gilt:
- Ein Scan wird **abgelehnt**, wenn das Telefon nicht in einem gemerkten WLAN ist.
- Verlässt Jake das WLAN (zu weit weg), **endet Papa-Modus automatisch** beim nächsten Tick des
  Zeitdienstes — die normalen Regeln greifen sofort wieder, ohne aufs Zeitfenster zu warten.
- Die maximale Dauer bleibt zusätzlich durch *„Dauer pro Scan"* begrenzt (gegen „zu lange").

**Grenzen ehrlich:** Das ist ein WLAN-Geofence, keine metergenaue Entfernung zu deinem Handy.
„Nähe zu deinem Handy" per Bluetooth (BLE) wäre ein größeres Feature (die Eltern-App müsste
senden) — sag Bescheid, wenn du das zusätzlich willst. Der WLAN-Geofence deckt „bei Papa /
zu weit weg" für den Alltag zuverlässig ab.

## Sicherheits-Ehrlichkeit (Scope)

- Das Token ist HMAC-SHA256-signiert und zeitlich begrenzt → Jake kann keinen eigenen Code bauen,
  und jeder Scan läuft ab.
- Es ist **nicht** gegen das physische Klonen des Tags gehärtet (jemand mit Papas Tag könnte ihn
  kopieren). Das ist bewusst so — der Modus setzt Betreuung voraus, keine Festung.
- „Neu absichern" im Setup erzeugt ein neues Secret und macht **alle** alten Tags/QRs ungültig.

## Wichtige Dateien

| Zweck | Datei |
|---|---|
| Token-/Fenster-Logik (+ Unit-Tests) | `helpers/SupervisedOverride.kt`, `test/.../SupervisedOverrideTest.kt` |
| Trigger (NFC-NDEF + QR-Deeplink) | `activities/SupervisedOverrideActivity.kt` |
| Eltern-Setup (QR/Tag/Fenster) | `activities/PapaModusActivity.kt` |
| Durchsetzungs-Bypass | `helpers/LaunchGate.kt`, `services/TimeTrackingService.kt`, `activities/MainActivity.kt` |
| Manifest (Permission, Intent-Filter) | `AndroidManifest.xml` |

## Auf dem Gerät testen (noch offen)

Der Kern ist unit-getestet; **auf dem Gerät zu prüfen**: NFC-Dispatch (Tag-Tippen öffnet die
Activity), QR-Scan über die Kamera, und dass während des Fensters wirklich keine Zeit abgezogen
wird und nichts im Tagesbericht auftaucht.
