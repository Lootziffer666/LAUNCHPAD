# Game Catalog Schema Documentation

> Version 1.0 -- Gate 5

Dieses Dokument beschreibt das Schema fuer den lokalen Spielekatalog (`content/games.sample.json`).
Der Katalog definiert alle Spiele, die im LAUNCHPAD sichtbar sind, inklusive Metadaten, Bewertungen
und elterliche Freigabeentscheidungen.

---

## Felder

### Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Eindeutige Kennung des Spiels (kebab-case, z.B. `minecraft-java`) |
| `title` | string | Anzeigename des Spiels |
| `source` | enum | Herkunftsplattform des Spiels (siehe erlaubte Werte unten) |
| `launchType` | enum | Startmethode des Spiels (siehe erlaubte Werte unten) |

### Optionale Felder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `launchTarget` | string | URI, Pfad oder Protokoll-Adresse zum Starten des Spiels |
| `coverImage` | string | Relativer Pfad zum Cover-Bild (z.B. `assets/covers/minecraft-java.jpg`) |
| `trailerUrl` | string | URL zum Trailer-Video (YouTube oder leer) |
| `players` | object | Spieler-Informationen (siehe unten) |
| `ratings` | object | Altersfreigabe-Informationen (siehe unten) |
| `parent` | object | Elterliche Entscheidung und Notizen (siehe unten) |
| `profiles` | object | Pro-Kind-Freigabestatus (Key = Profilname, Value = approval state) |

---

## Verschachtelte Objekte

### `players`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `min` | integer | Minimale Spielerzahl (>= 1) |
| `max` | integer | Maximale Spielerzahl (>= min) |
| `localCoop` | boolean | Lokaler Koop-Modus verfuegbar |
| `onlineCoop` | boolean | Online-Koop-Modus verfuegbar |
| `competitive` | boolean | Kompetitiver Modus verfuegbar |

### `ratings`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `pegi` | integer | PEGI-Altersfreigabe (3, 7, 12, 16, 18) |
| `usk` | integer | USK-Altersfreigabe (0, 6, 12, 16, 18) |
| `reasons` | array of string | Gruende fuer die Einstufung (z.B. "Milde Gewalt", "Online") |

### `parent`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `approval` | enum | Elterliche Freigabeentscheidung (siehe Approval States) |
| `notes` | string | Freitextnotiz der Eltern |
| `reviewedStorePage` | boolean | Ob die Store-Seite vom Elternteil geprueft wurde |

---

## Erlaubte Enum-Werte

### `source` (Herkunftsplattform)

| Wert | Beschreibung |
|------|--------------|
| `steam` | Steam-Bibliothek |
| `epic` | Epic Games Store |
| `gog` | GOG Galaxy |
| `local` | Lokal installiert (kein Store) |
| `xcloud` | Xbox Cloud Gaming |

### `launchType` (Startmethode)

| Wert | Beschreibung |
|------|--------------|
| `steam` | Start ueber Steam-Protokoll (steam://rungameid/...) |
| `exe` | Direkter Start einer ausfuehrbaren Datei |
| `uri` | Start ueber benutzerdefiniertes URI-Protokoll |
| `edge-xcloud` | Start im Edge-Browser fuer Xbox Cloud Gaming |
| `internal` | Internes LAUNCHPAD-Modul (z.B. phyphox-Experimente) |
| `local-stub` | Platzhalter fuer noch nicht konfigurierte lokale Spiele |

### Approval States (Freigabestatus)

| Wert | Beschreibung |
|------|--------------|
| `unknown` | Noch nicht bewertet |
| `needs-review` | Markiert zur Ueberpruefung durch Eltern |
| `approved` | Freigegeben |
| `blocked` | Gesperrt |
| `hidden` | Versteckt (nicht sichtbar fuer das Kind) |

---

## Wichtige Designentscheidung: Ratings vs. Elternentscheidung

> **PEGI und USK sind reine Informationsfelder. Sie blockieren NICHT automatisch.**
>
> Die Elternentscheidung (`parent.approval` und `profiles.*`) hat IMMER Vorrang
> gegenueber automatischen Ratings.

### Warum?

- Eltern kennen die Reife und Sensibilitaet ihrer Kinder besser als eine pauschale Alterseinstufung.
- Ein PEGI-18-Spiel kann von einem Elternteil bewusst fuer ein 14-jaehriges Kind freigegeben werden.
- Ein PEGI-3-Spiel kann trotzdem blockiert werden (z.B. wegen In-App-Kaeufen oder Online-Chat).
- Das System informiert die Eltern ueber Ratings, entscheidet aber nie selbststaendig.

### Ablauf

```
1. Spiel wird erkannt/hinzugefuegt -> approval = "unknown" oder "needs-review"
2. Eltern sehen PEGI/USK als Information in der Kurator-Ansicht
3. Eltern treffen bewusste Entscheidung -> setzen approval auf "approved" oder "blocked"
4. NUR die Elternentscheidung bestimmt, ob das Kind das Spiel sieht
```

---

## Validierung

Das formale JSON Schema befindet sich unter `game-catalog.schema.json` im selben Verzeichnis.
Sample-Daten koennen mit folgendem Befehl validiert werden:

```bash
cd desktop && node scripts/validate-catalog.js
```
