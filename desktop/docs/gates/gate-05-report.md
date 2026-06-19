# Gate 5 Report: Local Game Catalog Schema

**Status:** COMPLETE  
**Date:** 2026-06-19

---

## What was delivered

1. **`desktop/docs/schema/game-catalog.md`** - Menschenlesbare Schema-Dokumentation mit:
   - Erklaerung aller Felder (id, title, source, launchType, launchTarget, coverImage, trailerUrl, players, ratings, parent, profiles)
   - Erlaubte Enum-Werte fuer source, launchType und approval states
   - Klare Aussage zur Rolle von PEGI/USK vs. Elternentscheidung

2. **`desktop/docs/schema/game-catalog.schema.json`** - Formales JSON Schema (draft-07):
   - Validiert die Struktur aus `content/games.sample.json`
   - Pflichtfelder markiert: id, title, source, launchType
   - Optionale Felder klar als optional
   - Enum-Constraints fuer source, launchType, approval

3. **`desktop/scripts/validate-catalog.js`** - Validierungsscript:
   - Prueft `games.sample.json` gegen das JSON Schema
   - Nutzbar via `node scripts/validate-catalog.js`

4. **Validierung erfolgreich:**
   ```
   PASS: games.sample.json validates against game-catalog.schema.json
     7 games validated successfully.
   ```

---

## Designentscheidungen

| Entscheidung | Begruendung |
|--------------|-------------|
| PEGI/USK sind KEINE automatische Blockade | Eltern kennen ihre Kinder besser als pauschale Einstufungen |
| Elternentscheidung hat IMMER Vorrang | `parent.approval` und `profiles.*` sind die einzige Blockade-Quelle |
| `additionalProperties: false` | Strenge Validierung verhindert Typos und undokumentierte Felder |
| draft-07 Schema | Breiteste Tool-Unterstuetzung (ajv, VS Code, IDE-Plugins) |
| Approval States: 5 Stufen | unknown, needs-review, approved, blocked, hidden decken den gesamten Lebenszyklus ab |

---

## Kernaussage: Ratings vs. Elternentscheidung

> **PEGI und USK sind reine Informationsfelder. Sie blockieren NICHT automatisch.**
>
> Die Elternentscheidung (`parent.approval` und `profiles.*`) hat IMMER Vorrang
> gegenueber automatischen Ratings.

Ein PEGI-18-Spiel kann bewusst freigegeben werden. Ein PEGI-3-Spiel kann trotzdem
blockiert werden (z.B. wegen In-App-Kaeufen oder unmoderiertem Online-Chat).

Das System informiert die Eltern ueber Ratings, entscheidet aber nie selbststaendig.

---

## Erlaubte Werte

### Sources
`steam`, `epic`, `gog`, `local`, `xcloud`

### Launch Types
`steam`, `exe`, `uri`, `edge-xcloud`, `internal`, `local-stub`

### Approval States
`unknown`, `needs-review`, `approved`, `blocked`, `hidden`

---

## Verification

- `node scripts/validate-catalog.js` - PASS (7 games validated)
- `npm test` - 50/50 tests pass (keine Regression)
- `npm run build` - Vite build erfolgreich
- Keine bestehenden Dateien modifiziert (nur neue Dateien hinzugefuegt)

---

## Definition of Done

- [x] Schema-Dokumentation erstellt (`game-catalog.md`)
- [x] Formales JSON Schema erstellt (`game-catalog.schema.json`)
- [x] Sample-Daten validieren erfolgreich gegen das Schema
- [x] PEGI/USK als reine Information dokumentiert (keine automatische Blockade)
- [x] Elternentscheidung als vorrangig dokumentiert
- [x] Alle erlaubten Enum-Werte definiert und dokumentiert
- [x] Validierungsscript wiederverwendbar (`scripts/validate-catalog.js`)
- [x] Bestehende Tests bestehen weiterhin (50/50)
