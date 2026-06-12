# WINDOWS-PLAN-ADOPTION — was aus dem ursprünglichen Windows-Launcher-Plan übernommen wurde

> Quelle: die fünf Chat-Extrakte des ursprünglichen Kids-Launcher-/Family-Console-Shell-Plans
> (Stand 05.05.2026). Dieses Dokument hält fest, **was** davon in LAUNCHPAD Desktop übernommen
> wurde, **wie** es hier heißt, und was bewusst als Spec bzw. später geparkt ist.
> Stand: 2026-06-12.

---

## 1. Übernommen & implementiert

### Trennung in zwei Apps (Kernentscheidung)

> „Keine Parent-Menüs im Child Shell. Elternverwaltung gehört in eine klassische Desktop-GUI.“

| Plan | Hier |
|---|---|
| **Child Shell** — fullscreen, ruhig, controller-/kindgerecht, approved-only, kein Shop/keine Verwaltung | Kind-Fenster (`index.html` + `src/`), gesperrtes Electron-Fenster wie gehabt. „+ Spiele“ und das Elternpanel wurden **entfernt**. |
| **Parent Curator** — klassische Desktop-GUI: Review, Freigaben, Tags, Einstellungen | **Familienzentrale** (`curator.html` + `src/curator/`), eigenes normales Fenster mit eigener Bridge (`electron/preload-curator.js`). Erreichbar nur über das PIN-Gate (`lp:curator:open`, PIN wird in main verifiziert). |

Sicherheitsmodell: Die Kind-Bridge exponiert nur die Kind-Oberfläche (list/launch/install/
favorite/PIN). Eltern-Kanäle (upsert/remove/covers/settings) beantwortet main **nur** für den
Sender des Curator-Fensters — Defense-in-Depth, nicht nur Bridge-Hygiene.

### Approval ≠ Surfacing („Genehmigung und Sichtbarkeit sind nicht dasselbe“)

Zwei getrennte Achsen am Spielobjekt (`electron/services/curation.js`):

- `curation`: `new | viewed | undecided | approved | forLater | hidden` — nur `approved` ist
  kind-sichtbar. Neue Einträge starten als `new` („Automation proposes. Parent curates. Shell
  displays.“). Alt-Einträge von vor dem Modell bleiben `approved` (Back-Compat).
- `surfacing`: `featured | normal | low` — Prominenz im Kind-Raster (featured zuerst, low
  zuletzt), unabhängig von der Freigabe. Comfort Games werden nicht verboten, nur dosiert.

### Anlass-/Zukunfts-Tags

`tags: string[]` mit Vorschlägen aus dem Plan (Winter, Weihnachten, Ferien, Cousins da,
mit Bruder, mit Papa, kurze Session, ruhige Session, wenn älter, Geheimtipp) + Freitext.
„Curation ist auch Bewahrung zukünftiger guter Erfahrungen, nicht nur Schutz.“

### Containment-Klassifikation (Kurzform)

`containment: strong | soft | weak | open | unknown` + `parentWarning` pro Titel — Eltern-Info,
kein Kind-Feature, keine Laufzeit-Durchsetzung. Volle Spec: `CONTAINMENT_CLASSIFICATION_V1.md`.

### Sichtbare Launch-Phasen + Fehlerklassen

Kind sieht ehrliche, wenige Phasen („Die Transition-UI darf beruhigen, aber nicht lügen“):
**Startklar machen → Spiel wird geöffnet → (Fehler:) Das hat gerade nicht geklappt**, mit
„Nochmal versuchen“ nur bei `errorClass: recoverable`. Klassen: `recoverable | blocked |
parent_required | fatal` (`electron/services/launcher.js`). Volle Ziel-Spec:
`LAUNCH_STATE_MACHINE_V1.md`.

### Review-Inbox im Curator

Filter-Chips (Alle/Neu/Ungeklärt/Freigegeben/Für später/Versteckt) mit Zählern + Hinweis,
wie viele Titel auf Entscheidung warten. Altersfreigabe (6/9/12) pro Titel im selben Panel.

---

## 2. Übernommen als Leitplanken (gelten ab jetzt für alle Desktop-Arbeit)

- **Parent Curation First:** PEGI/USK sind Hinweise, keine Regeln. Das System entscheidet nicht
  für Eltern; es macht Eltern-Entscheidungen leicht umsetzbar.
- **Automation proposes. Parent curates. Shell displays.** Automatische Listen/Importe sind
  Arbeitsmaterial, nie Kinderbibliothek.
- **Keine Fake-Systemfehler, keine Frustfallen, keine Scheinsicherheit:** Die Shell darf Charakter
  haben, aber nie unzuverlässig wirken. Elternsicht muss „Startpfad kuratiert“ von „sicher
  eingezäunt“ unterscheiden (Containment).
- **Stabilität vor Geschwindigkeit:** lieber kontrollierte Sequenz + ruhige Animation als
  schneller, fragiler Start. Animation kaschiert echte Vorbereitung, nie Fehler.
- **Kinder sehen Zustände, Eltern sehen Diagnosen.** Kein technischer Müll in der Kind-UI.
- **Insights nur informativ:** Muster zeigen („Spiel X 9× gespielt“), keine Pseudo-Psychologie.
- **Monetarisierungskompass** (falls je relevant): One-Time-Purchase, keine Ads, keine
  child-facing Upsells, kein Paywall auf dem Kern-Trust-Loop.

**Kill-Kriterien aus dem Plan** (Projekt schneiden/stoppen, wenn): Kind kann nicht allein
starten · Kurator fühlt sich wie Arbeit an · Return-to-Shell unzuverlässig · Unterschied zu
Playnite/Steam ist nur Optik · Recovery nicht idiotensicher · Erst-Setup dauert zu lang.

---

## 3. Als Spec festgehalten, noch nicht gebaut

| Thema | Spec |
|---|---|
| Volle Launch-State-Machine (Preflight → … → VerifyingReady → Running, Timeouts/Retry-Budgets pro State) | `LAUNCH_STATE_MACHINE_V1.md` |
| Containment-Matrix inkl. Fortnite-Referenzfall („kuratierter Einstieg in einen porösen Container“) | `CONTAINMENT_CLASSIFICATION_V1.md` |
| xCloud-Verifikationspipeline (Titel im DOM vor Session, Title-Matching-Level EXACT/NORMALIZED/ALIAS/FUZZY/MISMATCH) | `LAUNCH_STATE_MACHINE_V1.md` §xCloud |

---

## 4. Bewusst später / nicht jetzt (aus dem Plan, Reihenfolge ≈ Plannähe)

- **Positionsbasierte Controller-Semantik** (South=Start, East=Zurück, West=Info, North=Trailer;
  Glyphen-Toggle Xbox/PlayStation/Nintendo) — erst relevant, wenn die Shell Controller-Input bekommt.
- **Trailer-Overlay** (One-Button-Trailer im Launcher, kein YouTube/Browser-Leck) und das kleine
  **Faktenfenster** (min/max Spieler, lokal Koop, gemeinsam spielbar) statt Detailseite.
- **Kanonisches Spielobjekt v2**: `contentSource` / `launchTransport` / `runtimeType` /
  `verificationProfile` / `expectedTitle`+`titleAliases` als getrennte Ebenen (heute: `source` +
  `launch.kind`).
- **Xbox Cloud via Edge** als disposable Fullscreen-Runtime (eine Session = ein Prozess; am Ende
  Edge beenden, Return-to-Shell). Luna: gestrichen für MVP.
- **Controller-Setup-Wizard (ELI5)**, Akkuwarnungen, Session-Ende-Vorbereitung („noch eine Runde“),
  Zeitfenster-Übergänge — Zeit-Limit + Ruhezeit existieren, Transition-Support fehlt.
- **Weekly Checks / Review-Inbox-Feeds**, Companion-/Mobile-Approval (nice-to-have, Scope-Gefahr).
- **Bewohnbarer Launcher** (Maskottchen-Habitat, Gäste, Hidden Gem Days, Bootsequenzen, Rituale) —
  eigene Ideenfamilie aus dem „bewohnbare Interfaces“-Chat. Guardrails stehen fest: Seltenheit
  schlägt Lautstärke · Streiche, keine Fallen · keine Fake-Defekte · Skip/Entschärfung immer.
- **Multi-Profil** (Jake/Luke getrennt sichtbar) — `profileVisibility` ist im Plan-Datenmodell
  vorgesehen; v1 hier bleibt Single-Child (Scope-Guard Entscheidung 4).

---

## 5. Bewusst NICHT übernommen

- Steam-Skin/CSSLoader-Ansatz (der Desktop-Launcher ist bereits ein eigener Electron-Build).
- Steam-Store-Positionierung/Review-Strategie (kein Store-Release geplant).
- Alles aus den Chats, was nicht produktrelevant war (Memoiren-/Ton-Notizen).
