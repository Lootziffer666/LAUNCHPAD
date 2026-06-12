# CONTAINMENT_CLASSIFICATION_V1 — Einzäunungsbewertung (aus dem Windows-Launcher-Plan)

> **„Launch-Erfolg und Spielraum-Sicherheit sind zwei verschiedene Wahrheiten.“**
>
> Die Launch-State-Machine garantiert, dass der richtige Startpfad erreicht wurde und das Spiel
> spielbereit ist. Sie garantiert NICHT, dass das Kind danach im gewünschten Raum bleibt. Dafür
> gibt es diese separate Klassifikation. Stand: 2026-06-12 · Felder implementiert
> (`curation.js`: `containment`, `parentWarning`), Kurator-UI vorhanden; Laufzeit-Beobachtung
> ist bewusst NICHT Teil von v1.

---

## 1. Kategorien (`containment`)

| Wert | Kurator-Label | Bedeutung | Typische Beispiele |
|---|---|---|---|
| `strong` | Stark eingezäunt | Kind bleibt im gewünschten Spielraum | lokales Einzelspiel, normales Couch-Koop |
| `soft` | Weich eingezäunt | Wechsel möglich, aber mit Reibung | Cloud-Spiel mit Plattform-Lobby |
| `weak` | Durchlässig | Wechsel in ungeeignete Bereiche leicht möglich | Fortnite/LEGO Fortnite |
| `open` | Offener Hub | Store/Community/User-Content direkt erreichbar | Roblox-artige Hubs |
| `unknown` | Ungeprüft | noch nicht bewertet (Default) | jeder neue Titel |

Risiken offener Container: user-generated content, Modi-/Weltenwechsel, In-App-Hubs, soziale
Bereiche, schwer kuratierbare Abzweigungen.

## 2. Referenzfall Fortnite / LEGO Fortnite

LEGO Fortnite ist **kein** „safe locked game“, sondern ein **kuratierter Einstieg in einen
porösen Container**: Der Direktstart funktioniert, aber Fortnite bleibt das Hauptspiel —
Rückkehr in die Lobby und Moduswechsel (Battle Royale) können möglich bleiben. Modellierung:

```json
{
  "title": "LEGO Fortnite Odyssey",
  "containment": "weak",
  "parentWarning": "Wechsel in andere Fortnite-Bereiche kann möglich bleiben."
}
```

## 3. Regeln

1. **Keine falsche Sicherheit:** Eltern darf nie suggeriert werden, ein Spiel sei sicher
   eingezäunt, nur weil der Einstiegspunkt kuratiert ist. Die Elternsicht unterscheidet:
   Direktstart verfügbar · Start verifiziert · Containment stark/weich/durchlässig/offen/ungeprüft.
2. **Eltern-Feature, kein Kind-Feature:** `parentWarning` erscheint nur im Kurator. Das Kind
   sieht den Hinweis nicht zwingend; Eltern müssen ihn sehen (im Kurator: Warnzeile + markiertes
   Auswahlfeld bei `weak`/`open`).
3. **Kein Launch-Block:** Containment beeinflusst den Start nicht automatisch — Eltern
   entscheiden (Kuration statt Scheinsicherheit). Eine spätere Option „nur gemeinsam“ ist denkbar,
   aber nicht v1.
4. **Wer kuratiert:** Eltern setzen die Stufe manuell; automatische Erkennung wäre höchstens
   Vorschlag (Automation proposes).

## 4. Mögliche spätere Felder (aus dem Plan, nicht implementiert)

```json
{
  "containerGame": "Fortnite",
  "entryMode": "LEGO_FORTNITE_ODYSSEY",
  "modeSwitchRisk": "NONE | LOW | MEDIUM | HIGH | UNKNOWN",
  "requiresParentReview": true
}
```

Plus offene Fragen für später: Beobachtung nach Start? Erkennung von Rücksprung in offene
Lobbys? Beides bewusst außerhalb v1 (Stabilität vor Feature-Tiefe).
