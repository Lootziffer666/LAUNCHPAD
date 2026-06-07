# Fern-Zugriff & Device Owner — Architektur-Entscheidung

> Status: entschieden (2026-06). Hält fest, wie Fern-Zugriff gelöst wird und warum
> Device Owner **optional** ist — damit das nicht immer wieder neu aufkommt.

## Kurzfassung

- **App-Installations-Genehmigungen → Google Family Link** (Cloud; funktioniert auch
  außerhalb des Heimnetzes).
- **Alles andere → LAUNCHPAD** (lokal / LAN): kuratierter Launcher, Zeitbudget
  (Krypto-Cash), Zusagen, Doge-Medienanfragen, Cooldown, Impulsbremse,
  Wochenplan/Schulmodus, Eltern-App.
- **Device Owner ist optional.** Standard ist der Soft-Modus.

## Warum dieser Schnitt

Family Link hat **keine offizielle API** — man kann LAUNCHPADs eigene Anfragen
(Doge-Medienanfrage, „+15 Min", Zusagen) nicht einschleusen. Aber Family Links
*eigene* Fern-Funktionen laufen schon über Googles Cloud:

- App-Installationen freigeben (remote, mit Push)
- „Mehr Zeit"-Bitte von unterwegs genehmigen
- Remote-Sperre, Tageslimit-Backstop, Standort

→ Das **generische** Fern-Stück lagern wir an Family Link aus; das **maßgeschneiderte**
bleibt lokal in LAUNCHPAD. So müssen wir keinen eigenen Cloud-Relay bauen.

## Device Owner: optional — und warum nicht zusammen mit Family Link

- Der **harte Kiosk** (Lock-Task, Deinstallationsschutz, Status-Bar-Sperre) braucht
  **Device Owner**. Den kann man nur auf einem Gerät **ohne Konten** provisionieren.
- Family Link braucht das **Google-Kinderkonto** auf dem Gerät.
- → Auf **einem** Gerät schließen sich beide aus. Deshalb zwei saubere Varianten:

  - **Variante A — Hybrid (empfohlen):** Soft-Modus (kein Device Owner) **+** Family Link.
    LAUNCHPAD erzwingt lokal per PIN-Gate, Launch-Gate, Zeitbudget, Cooldown;
    Family Link übernimmt App-Freigabe + Fern-Backstop.
  - **Variante B — Maximale lokale Härtung:** Device-Owner-Kiosk **ohne** Family Link
    (kein Google-Konto). Kein Cloud-Fern-Zugriff.

LAUNCHPAD läuft **standardmäßig im Soft-Modus**. Der Kiosk ist ein Opt-in-Schalter in
Eltern-Modus; ohne Device Owner bleibt er sauber aus — **kein Zwang, kein Crash, keine
Health-Warnung** (`SetupActivity`/`PermissionHealthActivity` erwähnen Device Owner nicht;
`KioskManager` ist komplett hinter `isDeviceOwner()` abgesichert).

## Wichtige Wechselwirkung: Family-Link-Installation ↔ LAUNCHPAD-Whitelist

- Family Link entscheidet, **ob** eine App aufs Gerät darf (Installation).
- LAUNCHPAD entscheidet, **ob** sie im Kinder-Launcher **startbar/sichtbar** ist (Whitelist).
- Nach einer Family-Link-Freigabe muss die App also noch in
  **Eltern-Modus → Apps verwalten** freigegeben werden, damit dein Sohn sie sieht.
  (Bewusst zwei Stufen: „darf existieren" vs. „gehört auf den Startbildschirm".)

## Family Link einrichten (Kurz)

1. Auf dem Kind-Handy ein **Google-Kinderkonto** einrichten/anmelden (Family Link).
2. Eltern-App **Family Link** aufs Eltern-Handy, mit dem Kinderkonto verbinden.
3. Dort: App-Freigaben, Tageslimit als Backstop, „mehr Zeit"-Anfragen, Remote-Lock.
4. In LAUNCHPAD den **Kiosk/Device-Owner-Modus AUS lassen** (Variante A).

Mehr: https://families.google/familylink/
