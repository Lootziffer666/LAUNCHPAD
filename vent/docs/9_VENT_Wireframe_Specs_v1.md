# VENT — Wireframe Specs v1.0

## 5 Key Screens, figma-tauglich

Format je Screen:

1. Zweck
2. Layout-Zonen
3. Komponenten je Zone
4. Priorität / visuelle Hierarchie
5. Interaktionen
6. States
7. Responsive Verhalten

---

# 1) Home / Overview

## Zweck

Der Home-Screen ist der **operative Einstieg**.
Er soll in einem Blick zeigen:

* Was ist gerade wichtig?
* Wo gibt es konkrete Chancen?
* Was braucht Aufmerksamkeit?
* Wo lohnt sich der nächste Klick?

Kein Feed. Kein Store-Frontpage-Ersatz.
Eher: **Dashboard mit Relevanz statt mit Analytics-Eitelkeit**.

---

## Desktop-Wireframe

### Zone A — App Frame

**Persistente Sidebar links**
**Top Bar oben**
**Main Content mittig**
optional **Detail Panel rechts**, aber standardmäßig geschlossen

---

## Zone B — Sidebar

### Inhalt von oben nach unten

1. Wordmark / Logo
2. Main Nav
3. Spacer
4. Utility / Secondary Nav

### Main Nav Items

* Home
* Wishlist
* Library
* Family
* Sales
* Collections

### Utility unten

* Search
* Settings
* optional Sync/Status

### Komponenten

* nav item default
* nav item active
* nav item hover
* collapsed tooltip state

### Verhalten

* aktiver Punkt klar markiert
* optional einklappbar
* keine lauten Badges überall; nur dort, wo es relevant ist

---

## Zone C — Top Bar

### Aufbau

**links:** Global Search
**mitte/links:** Context / active account / connected source
**rechts:** Quick Action, Notifications/Status, Profile

### Komponenten

* search field
* quick action button
* icon buttons
* profile menu trigger
* sync status indicator

### Wireframe-Regel

Top Bar bleibt ruhig.
Sie ist Werkzeugleiste, nicht Header-Bühne.

---

## Zone D — Main Header

### Inhalt

* Page title: `Overview`
* kleine Meta-Zeile darunter: z. B. „5 relevante Änderungen heute“

### Komponenten

* page title
* helper text / overview meta

### Regel

Nicht überfrachten. Kein riesiger Hero mit Marketingtext.

---

## Zone E — Hero Summary Row

Erste sichtbare Hauptsektion.

### Struktur

Horizontale Reihe mit **4–5 Metric Tiles** oder eine große Summary Card mit 4–5 inneren Metrics.

### Inhalte

* Wishlist total
* Under target
* Relevant deals
* Family changes
* Recent actions / unresolved items

### Komponenten

* summary card shell
* metric tile
* delta/meta line
* optional tiny icon

### Priorität

Sehr hoch. Das ist der erste Scanpunkt.

### Visuelle Regel

* große Zahl
* kleine Bezeichnung
* noch kleinere Kontextzeile
* keine Mini-Charts nötig, außer sie bringen wirklich etwas

---

## Zone F — Action Queue

Direkt unter Hero Summary.

### Ziel

Konkrete Handlungen priorisieren.

### Aufbau

Vertikale Liste mit 3–6 Einträgen.

### Eintrag besteht aus

* kurzer Titel
* Begründung / Kontext
* Status / Priorität
* Primäraktion
* optional sekundärer Chevron

### Beispiele

* `3 Titel unter Zielpreis`
* `1 Family-Freigabe geändert`
* `2 neue Überschneidungen in Collections`

### Komponenten

* action row
* inline badge
* CTA button small
* chevron

### Regel

Action Queue vor „nice to know“-Modulen.

---

## Zone G — Wishlist Opportunities

### Ziel

Nicht alle Deals, sondern nur **lohnende** oder **naheliegende**.

### Aufbau

Je nach Dichte:

* horizontale Card-Reihe
  oder
* kompakte vertikale Opportunity-Liste

### Jede Opportunity enthält

* kleines Cover
* Titel
* Preis jetzt
* Zielpreis
* Rabatt
* Relevanzgrund
* Quick action

### Komponenten

* opportunity card
* price stack
* reason badge
* quick action button

---

## Zone H — Family Snapshot

### Ziel

Kurzer Überblick über Relevanz im Familienkontext.

### Inhalte

* relevante Mitglieder
* gemeinsame Chancen
* neue Überschneidungen
* Zugriff/Änderungen

### Aufbau

2–3 kompakte Cards oder eine Section mit 3–4 Rows

### Komponenten

* avatar chip
* member mini-card
* overlap summary row
* access change row

---

## Zone I — Continue / Recent

### Ziel

Schnelle Wiedereinstiege.

### Inhalte

* zuletzt geöffnete Spiele
* zuletzt geänderte Collections
* zuletzt geprüfte Wishlist-Titel

### Komponenten

* recent entity row
* timestamp/meta
* open action

---

## Zone J — Collections Snapshot

### Ziel

Nützliche Sets sichtbar machen.

### Inhalte

* 2–4 wichtigste Collections
* Name
* Logik / Kurzregel
* Anzahl
* kleine Cover-Vorschau

### Komponenten

* collection preview card
* tiny cover strip
* count badge

---

## Visuelle Hierarchie

1. Summary
2. Action Queue
3. Wishlist Opportunities
4. Family Snapshot
5. Continue / Recent
6. Collections Snapshot

---

## Interaktionen

* Klick auf Metric ? Zielscreen mit aktivem Filter
* Klick auf Action Row ? direkt in relevanten Flow
* Hover auf Opportunity ? Quick Actions erscheinen stärker
* Klick auf Spiel ? Detail Panel rechts oder Full Screen
* Quick action ohne Kontextverlust möglich

---

## States

### Loading

* Summary skeletons
* 3–4 action row skeletons
* 2–4 opportunity skeletons

### Empty

* freundlicher Utility-Empty-State
* CTA: import / connect / add wishlist

### Partial

* einzelne Module können unabhängig leer sein

### Error

* modulare Inline-Fehler, nicht Fullscreen-Drama

---

## Responsive

### Tablet

* Summary 2x2 Grid
* Action Queue full width
* rest stacked

### Mobile

Reihenfolge:

1. Summary horizontal scroll
2. Action Queue
3. Opportunities
4. Family
5. Recent

Sidebar fällt weg ? Bottom Nav

---

---

# 2) Wishlist

## Zweck

Wishlist ist **VENTs Kernmodul**.
Nicht Merkliste, sondern **Preis-/Prioritäts-/Entscheidungsmaschine**.

---

## Desktop-Wireframe

## Zone A — Screen Header

### Inhalte

* Page title: `Wishlist`
* Count
* optional Submeta: „12 Titel, 3 unter Zielpreis“

### Rechts im Header

* Search in Wishlist
* View toggle
* Sort
* Filter
* Create Set

### Komponenten

* page title
* count label
* search field
* icon/segmented view toggle
* sort dropdown
* filter button
* primary or secondary create button

---

## Zone B — Segment Control Bar

Direkt unter dem Header.

### Tabs / Segmente

* All
* On Sale
* Under Target
* Friends Own
* Family Relevant

### Optional zweite Zeile darunter

Filter Chips:

* Coop
* Singleplayer
* < 10 €
* Hidden excluded
* Waitlist only
* Priority

### Komponenten

* segmented control
* filter chips
* reset filters link/button

---

## Zone C — Smart Sets Rail / Side Module

Optional links als schmale Spalte oder oben als horizontale Liste.

### Inhalt

* Buy under X €
* Friends own this
* Family candidates
* Wait for deeper discount
* Coop picks
* Singleplayer backlog

### Komponenten

* smart set card small
* rule summary
* count badge

### Regel

Diese Sets wirken wie echte Objekte, nicht bloß wie abgespeicherte Filter im Nirwana.

---

## Zone D — Main Wishlist List

**Default = Liste, nicht Grid.**

### Listenaufbau

Jede Row in 6 Funktionszonen:

1. Cover
2. Title block
3. Context block
4. Social / Family block
5. Price block
6. Actions

---

## Wishlist Row im Detail

### 1. Cover Zone

* vertikales Mini-Cover
* klickbar

### 2. Title Block

* Spieltitel
* darunter Meta-Zeile: Genre / Added date / platform tags

### 3. Context Block

* Collection chips
* semantic tags
* ggf. short notes

### 4. Social / Family Block

* Freunde besitzen: Anzahl
* Family relevant: ja/nein
* Coop / shared relevance badge

### 5. Price Block

Kernstück.

#### Enthält

* current price
* discount %
* target price
* target state label

#### State Labels

* Above target
* Near target
* Under target

### 6. Action Block

* quick set target
* add to collection
* hide
* more menu
* open detail

---

## Zone E — Right Detail Panel

Öffnet bei Klick auf eine Row.

### Inhalte

1. größeres Cover
2. Titel
3. Price block prominent
4. Zielpreis-Editor
5. Friends/Family relevance
6. Collections
7. Notes / Status
8. Actions

### Komponenten

* side panel shell
* large price stack
* editable target field
* chip groups
* action buttons

---

## Visuelle Priorität

1. Preis + Zielpreisstatus
2. Titel
3. Relevanzgrund
4. Friends/Family-Kontext
5. Meta / Tags

---

## Interaktionen

* Klick auf Segment ? List refresh
* Klick auf Filter Chip ? Multi-filter
* Hover auf Row ? Quick Actions sichtbar
* Klick auf Preisblock ? Zielpreis bearbeiten
* Multi-select möglich
* Bulk bar erscheint bei Auswahl

---

## Bulk Mode

### Aktionen

* Add to collection
* Set target price
* Hide
* Remove tag
* Mark priority

### Komponenten

* sticky bulk action bar
* selected count
* clear selection action

---

## States

### Empty total

Noch keine Wishlist

### Filtered Empty

Filter aktiv, aber kein Ergebnis

### Loading

list skeleton rows

### Detail loading

Panel skeleton unabhängig von Liste

---

## Responsive

### Tablet

* Smart Sets horizontal oben
* Liste mit reduzierten Spalten
* Detail als Slide-over

### Mobile

* Rows werden 2-zeilig
* Preisblock direkt unter Titel
* Friends/Family als kleine Badge-Zeile
* Detail als eigener Screen oder Bottom Sheet
* Filter und Sort als Fullscreen Sheet

---

---

# 3) Library

## Zweck

Library organisiert Besitz nach Nutzwert.
Frage nicht nur: „Was habe ich?“
Sondern: **„Was davon ist relevant, zugänglich, installierbar, sinnvoll?“**

---

## Desktop-Wireframe

## Zone A — Header

### Inhalte

* Title: `Library`
* Count / short meta

### Rechts

* Search
* Sort
* Filter
* View toggle

---

## Zone B — Segmented Navigation

* All
* Installed
* Recent
* Shared
* Hidden
* Needs Attention

### Komponenten

* segmented control
* optional active filter chips below

---

## Zone C — Utility Strip

Oberhalb der Liste eine Reihe kleiner Utility Cards.

### Inhalte

* Continue Playing
* Recently Added
* Shared But Unused
* Needs Sorting
* Dormant Titles

### Komponenten

* utility card
* short count/summary
* action chevron

---

## Zone D — Main Library List

Default wieder: **list-first**.

### Row-Aufbau

1. cover/icon
2. title/meta
3. ownership state
4. install/playability state
5. recent activity
6. action cluster

---

## Library Row im Detail

### 1. Visual Zone

* cover oder icon

### 2. Title + Meta

* title
* genre/platform/tags
* optional source meta

### 3. Ownership Zone

* Owned
* Shared
* Restricted
* Sync pending

### 4. Install / Access Zone

* Installed
* Not installed
* Playable here
* Update relevant
* Unsupported

### 5. Activity Zone

* last played
* recently added
* dormant status

### 6. Actions

* open detail
* organize
* hide/archive
* more menu

---

## Zone E — Optional Right Detail Panel

### Inhalte

* artwork / cover
* ownership source
* install/access info
* recent history
* collections
* notes
* actions

---

## Zone F — Secondary Insight Modules

Unter der Liste oder neben ihr, je nach Platz:

* Forgotten Gems
* Family shared but unused
* Hidden backlog clusters
* Install candidates

### Komponenten

* insight card
* list preview rows

---

## Visuelle Priorität

1. Titel
2. Ownership / access
3. install state
4. last played / recent
5. actions

---

## Interaktionen

* Segmente filtern hart
* Filter Chips verfeinern
* Klick auf Ownership Badge ? Shared/Owned drilldown
* Klick auf Install State ? passende Aktion / Erklärung
* Multi-select für hide/archive/tag

---

## States

### Empty onboarding

Noch keine Datenquelle

### Empty real

Library leer

### Filtered empty

Kein Spiel passt

### Partial sync

Teilweise Status fehlen, Liste bleibt nutzbar

### Needs attention state

Spezielle Filteransicht für Probleme

---

## Responsive

### Tablet

* Utility Cards in 2x2
* Liste kompakter
* Ownership + Install zusammengelegt

### Mobile

* Row: Cover + Title + 2 Kernstatus + last active
* Rest in Detail Screen
* Utility Cards horizontale Scrollstrecke

---

---

# 4) Family

## Zweck

Family ist ein **eigenständiges Steuerungsmodul**.
Nicht irgendein Tab mit ein bisschen Teilen-Info.

---

## Desktop-Wireframe

## Zone A — Header

### Inhalte

* Title: `Family`
* Subtitle / short summary

### Rechts

* member filter
* shared mode toggle
* sort/filter

---

## Zone B — Family Summary

Große obere Zusammenfassung.

### Inhalte

* aktive Mitglieder
* gemeinsame verfügbare Titel
* Wishlist overlaps
* neue relevante Änderungen

### Aufbau

Eine große Summary Card oder 4 Metric Cards in Reihe.

---

## Zone C — Member Rail

Horizontale Reihe selektierbarer Member Cards / Chips.

### Pro Mitglied

* Avatar
* Name
* short stat
* active indicator

### Verhalten

* Klick filtert oder fokussiert Family-Daten
* Mehrfachselektion optional, aber erstmal eher Single focus + All

---

## Zone D — Overlap & Opportunities

Kernbereich.

### Inhalte

* gleiche Wishlist-Titel
* gemeinsame Coop-Chancen
* Titel unter Zielpreis für mehrere
* Überschneidungen von Besitz und Wunsch

### Aufbau

Grid aus Opportunity Cards

### Jede Card enthält

* Titel / Kurzaussage
* beteiligte Personen
* Relevanzgrund
* Action

---

## Zone E — Shared Access Matrix / List

### Ziel

Sichtbar machen, wer worauf Zugriff hat.

### Aufbau

Listenform oder vereinfachte Matrix

#### Je Zeile

* Spiel
* owner/source
* accessible by
* restriction/status
* quick open

### Komponenten

* access row
* avatar stack
* source badge
* state chip

---

## Zone F — Recent Activity

### Inhalte

* game added
* shared access changed
* wishlist overlap created
* priority changed

### Komponenten

* activity row
* timestamp
* member avatar
* linked entity

---

## Zone G — Shared Wishlist / Coop Candidates

### Inhalte

* family relevant candidates
* multiple-interest titles
* coop-ready groups

### Aufbau

Horizontale Card-Leiste oder vertikale kompakte Liste

---

## Visuelle Priorität

1. Summary
2. Overlap opportunities
3. Member context
4. Shared access
5. Recent activity

---

## Interaktionen

* Klick auf Member ? Filter auf ihn
* Klick auf Opportunity ? Game Detail oder Family-relevantes Detail Panel
* Klick auf Access Row ? Drill into game/access detail
* Hover auf Avatar Stack ? Namen auflösen
* Toggle zwischen:

  * All members
  * Selected member
  * Shared only

---

## States

### No family configured

klarer Setup-State

### Single member / weak data

nicht wie Fehler behandeln

### No overlap

positiv-neutral:
„Derzeit keine Überschneidungen“

### Loading

summary + cards + rows separat skeletonisieren

---

## Responsive

### Tablet

* Member Rail wrapped
* Overlap Cards 2-spaltig
* Access Matrix wird Liste

### Mobile

Reihenfolge:

1. Summary
2. Member selector sticky
3. Opportunities
4. Shared access rows
5. Activity

Keine Matrix auf Mobile. Nur vereinfachte Rows.

---

---

# 5) Game Detail

## Zweck

Das ist die **Entscheidungszentrale pro Titel**.
Kauf, Besitz, Zugriff, Einordnung, Family-Relevanz laufen hier zusammen.

---

## Desktop-Wireframe

## Zone A — Top Context Bar

optional schmal:

* back
* breadcrumb / origin context
* quick pin / favorite / share-like utility

---

## Zone B — Hero Section

### Drei Spalten

#### Links

* großes Cover / Artwork

#### Mitte

* Title
* subtitle / genre tags
* core badges

#### Rechts

* price block
* main action
* secondary actions

---

## Hero links

### Komponenten

* media card
* optional background artwork

---

## Hero mitte

### Inhalte

* Spieltitel
* Tags
* status chips:

  * owned
  * family shared
  * in wishlist
  * coop
  * singleplayer

### Komponenten

* title
* chip row
* meta block

---

## Hero rechts — Price & Action Stack

### Inhalte

* current price
* discount
* target price
* target state
* primary CTA
* secondary actions

### CTA-Beispiele

* Set target price
* Add to wishlist
* Open in store
* Manage in collection

### Regel

Nur **eine** visuell dominierende Aktion.

---

## Zone C — Main Detail Grid

Darunter 2 oder 3 Spalten.

### Linke Hauptspalte

* Purchase logic
* ownership/access
* game meta

### Mittlere Spalte

* Family & friends relevance
* collections
* rule memberships

### Rechte Utility-Spalte

* notes
* recent activity
* quick actions
* related items

---

## Section 1 — Price & Purchase Logic

### Inhalte

* current price
* target price
* difference
* target reached?
* why shown / why relevant
* optional historical note

### Komponenten

* price stack large
* reason card
* target editor

---

## Section 2 — Ownership & Access

### Inhalte

* owned / not owned
* shared / restricted
* source
* install / playable status

### Komponenten

* status rows
* access source badge
* install state chips

---

## Section 3 — Family & Friends Relevance

### Inhalte

* wer besitzt es
* wer könnte Interesse haben
* coop relevance
* overlap info

### Komponenten

* avatar rows / stacks
* overlap card small
* relation chips

---

## Section 4 — Collections & Rules

### Inhalte

* Mitglied in Smart Sets
* manuelle Collections
* quick add/remove

### Komponenten

* collection chips
* rule card mini
* add button

---

## Section 5 — Notes / Activity

### Inhalte

* added on
* last changed
* optional note
* action log snippets

### Komponenten

* activity rows
* note block
* meta list

---

## Visuelle Hierarchie

1. Titel
2. Preisblock
3. Primäraktion
4. Besitz-/Zugriffsstatus
5. Family/Friends-Kontext
6. Collections
7. Meta/History

---

## Interaktionen

* Klick auf Target ? Inline edit
* Klick auf Collection ? gefilterte Collection-Ansicht
* Klick auf Besitzstatus ? Erklärung/Access Detail
* Klick auf Member/Avatar ? Family Drilldown
* Action Buttons ohne Layoutsprung

---

## States

### Not owned

Kauffokus

### Owned

Nutzungs-/Ordnungsfokus

### Shared

Access-/Family-Fokus

### Data incomplete

ruhiger Hinweis, kein kaputter Screen

### Loading

Hero skeleton + section skeletons separat

---

## Responsive

### Tablet

* Hero untereinander
* Detailsektionen in 1-Spalten-Stack
* Utility-Spalte integriert

### Mobile

Reihenfolge:

1. Cover
2. Title + key chips
3. Price block
4. Sticky CTA bar
5. Sections als Cards/Akkordeons

Sehr wichtig:
Preis und Kernaktion müssen ohne Scrollen sichtbar sein.

---

# Global Wireframe-Regeln für alle 5 Screens

## 1. Listen vor Kachelwänden, wenn Vergleich wichtig ist

Gilt besonders für:

* Wishlist
* Library
* Shared access

## 2. Cards nur dort, wo Gruppierung oder Opportunity nützt

Gilt für:

* Home modules
* Overlap opportunities
* Collections previews

## 3. Detailkontext möglichst in Panels, nicht immer in Screenwechseln

Desktop:

* Right Detail Panel bevorzugen

Mobile:

* Sheet oder eigener Detailscreen

## 4. Preise und Status semantisch trennen

Preis ist nicht dasselbe wie:

* Besitz
* Family access
* Relevanz
* Tagging

## 5. Nicht jede Information muss permanent sichtbar sein

Immer trennen zwischen:

* sofort wichtig
* hilfreich
* tiefere Erklärung

---

# Global Component Inventory, jetzt konkret nach Baupriorität

## Tier 1 — Muss zuerst ins UI-Kit

* Sidebar
* Top Bar
* Search Field
* Page Header
* Section Header
* Primary / Secondary / Ghost Button
* Segmented Control
* Filter Chip
* Status Chip
* Metric Tile
* List Row Base
* Card Base
* Right Detail Panel
* Empty State
* Skeletons

## Tier 2 — Für diese 5 Screens direkt nötig

* Price Stack
* Opportunity Card
* Collection Preview Card
* Member Chip/Card
* Activity Row
* Avatar Stack
* Bulk Action Bar
* Rule Chip
* Access Row

## Tier 3 — Danach

* comparison micro-chart
* advanced rule editor
* import/setup flows
* full search results model

---

# Reihenfolge für die visuelle Umsetzung in Figma

## Schritt 1

UI-Kit Basis:

* colors
* type
* spacing
* 10–12 Kernkomponenten

## Schritt 2

Wishlist zuerst mocken
Warum?
Weil dort die meiste Produktlogik steckt.

## Schritt 3

Library und Game Detail
Damit Status-, Preis- und Ownership-Logik stabil werden.

## Schritt 4

Home und Family
Dann lassen sich Summary- und Opportunity-Komponenten aus dem Bestehenden sauber ableiten.

---



