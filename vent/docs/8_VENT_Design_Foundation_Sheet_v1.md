# VENT — Design Foundation Sheet v1.0

Dieses Sheet ist so aufgebaut, dass daraus direkt

* Figma-Screens,
* ein UI-Kit,
* ein Frontend-Design-System
* und später Build-Specs

abgeleitet werden können.

---

# 1. Produktmodus

## 1.1 Rolle von VENT

VENT ist ein **Utility Layer** für Steam-nahe Nutzung.

Nicht:

* Store-Ersatz
* Gaming-Showcase
* News-Hub
* „PC-Gamer“-Inszenierung

Sondern:

* Entscheidungsunterstützung
* Reibungsreduktion
* Ordnung
* Priorisierung
* Familien-/Wishlist-/Library-Koordination

## 1.2 Experience-Ziel

Die UI soll sich anfühlen wie:

* ruhig
* direkt
* vertrauenswürdig
* strukturiert
* effizient
* freundlich-modern

Nicht wie:

* ein Launcher mit Ad-Vibes
* ein überstyletes Dashboard
* ein Dark-Mode-Gaming-Cockpit
* ein Steam-Klon mit frischeren Ecken

## 1.3 Leitsatz

> **VENT macht Besitz, Wunsch, Preis und Zugriff schneller verständlich und leichter handhabbar.**

---

# 2. UX-Grundprinzipien

## 2.1 Erst Orientierung, dann Aktion

Jeder Screen muss in unter 3 Sekunden klären:

* Wo bin ich?
* Was ist wichtig?
* Was ist neu?
* Was kann ich als Nächstes tun?

## 2.2 Primäraktion klar, Sekundäraktionen ruhig

Pro Container nur eine visuell dominante Aktion.

## 2.3 Dichte ja, Chaos nein

VENT darf informationsreich sein, aber nie laut.

## 2.4 Verdeckte Komplexität

Komplexe Regeln sind okay, aber nicht alles gleichzeitig sichtbar.
Nutzer sieht:

* Ergebnis
* Grund
* optionale Tiefe

## 2.5 Vertraut, aber eigen

Bekannte Desktop-Muster:

* Sidebar
* Listen
* Detailpanels
* Filterleiste
* Sortierung
* Multi-Select

Aber:

* keine Steam-Detailkopie
* keine identische Farbdramaturgie
* keine identische Layoutsignatur

---

# 3. Visual Direction

## 3.1 Stilformel

**Light-first productivity UI**

* **soft industrial accent**
* **structured desktop utility**
* **subtle warmth**
* **clear comparison views**

## 3.2 Formensprache

* große ruhige Flächen
* moderat gerundete Container
* saubere Linien
* subtile Layer
* wenig überflüssige Tiefe
* klare Trennung von Daten- und Aktionszonen

## 3.3 Dichtecharakter

Die UI darf kompakter sein als Consumer-Lifestyle-Apps, aber luftiger als klassische Admin-Tools.

---

# 4. Color Foundation

## 4.1 Light Theme Core

### Canvas / Surfaces

* `Canvas` — warmes sehr helles Grau statt hartem Reinweiß
* `Surface 1` — Hauptkarten / Hauptflächen
* `Surface 2` — sekundäre Zonen / Listenhintergründe
* `Surface 3` — Panels / abgesetzte Steuerflächen

### Text

* `Text Primary` — dunkles Anthrazit
* `Text Secondary` — kühles Grau
* `Text Tertiary` — Meta / Nebentext
* `Text Inverse` — für dunkle Akzentflächen

### Lines

* `Stroke Subtle`
* `Stroke Default`
* `Stroke Strong`

## 4.2 Accent Strategy

Primärakzent soll **VENT** tragen, aber nicht nach Valve aussehen.

### Empfohlen

* `Primary Accent`: muted terracotta / warm industrial red
* `Secondary Accent`: steel blue / petrol
* `Info Accent`: kühles blau
* `Success`: gedämpftes grün
* `Warning`: amber
* `Danger`: kontrolliertes rot

## 4.3 Semantische Logik

Farben müssen statuslogisch konsistent sein.

### Beispiele

* Rabatt aktiv ? akzentuiert, aber nicht alarmrot
* Owned ? neutral positiv
* Family Shared ? eigene klare Kennung
* Target Price erreicht ? deutlich sichtbar
* Unsupported / Issue ? warnend
* Hidden / Archived ? visuell leiser

## 4.4 Beispielpalette

Nicht final, aber stark genug als Startpunkt:

* Canvas: `#F5F4F1`
* Surface 1: `#FFFFFF`
* Surface 2: `#F1F0EC`
* Surface 3: `#E9E7E1`
* Text Primary: `#1F2328`
* Text Secondary: `#58606B`
* Text Tertiary: `#7A838F`
* Stroke Subtle: `#E3E0D8`
* Stroke Default: `#D3CFC6`
* Primary Accent: `#C65A46`
* Primary Accent Hover: `#B24E3B`
* Secondary Accent: `#4E748B`
* Success: `#4F7A5A`
* Warning: `#C58B2A`
* Danger: `#B94A48`

---

# 5. Typography

## 5.1 Typografische Zielsetzung

* sehr gute Scanbarkeit
* stabile Preis-/Zahlendarstellung
* gutes Deutsch
* nüchtern-modern
* keine techige Härte
* keine gaminghafte Aggression

## 5.2 Rollen

### Display / Page

Für Seitentitel, große Übersichten

### Section

Für Screen-Sektionen

### Card Title

Für Spiele, Collections, Module

### Body

Für Standardtext

### Meta

Für Zusatzinformationen

### Numeric

Für Preise, Rabatte, Counts

## 5.3 Größenmodell

### Page Title

* 32 / 40
* Weight: 700

### Section Title

* 22 / 30
* Weight: 650–700

### Card Title

* 16 / 22 oder 18 / 24
* Weight: 600

### Body

* 14 / 20 oder 15 / 22
* Weight: 400–500

### Meta

* 12 / 16 oder 13 / 18
* Weight: 500

### Price / Numeric Highlight

* 20 / 24 oder 24 / 28
* Weight: 700

## 5.4 Typoregeln

* Nie zu viele Gewichtsstufen auf einem Screen
* Meta-Texte nicht zu hell
* Preise und Discounts immer mit klarer Hierarchie
* Titel dürfen 2 Zeilen nutzen, aber kontrolliert
* Kein All Caps für Fließ-Navigation außer winzige Overlines

---

# 6. Grid, Spacing, Radius, Elevation

## 6.1 Raster

8pt-System mit 4pt-Unterteilung.

### Kernwerte

* 4
* 8
* 12
* 16
* 24
* 32
* 40
* 48

## 6.2 Container-Padding

### Kleine Controls

* 8–12 horizontal
* 6–10 vertikal

### Standard Card

* 16 oder 20

### Große Summary-/Hero-Card

* 24 oder 32

### Screen-Padding Desktop

* 24–32

## 6.3 Radius

* Chips / Inputs klein: 10–12
* Buttons: 12–14
* Standard Cards: 18
* große Panels / Modals / Sheets: 24
* Hero Summary: 28

## 6.4 Elevation

VENT sollte eher mit Flächen und Borders arbeiten als mit fetten Schatten.

### Ebenen

* Level 0: Canvas
* Level 1: Standard Surface
* Level 2: Hover / fokusierte Card / Sidepanel
* Level 3: Modal / Sheet

### Schatten

Nur weich, breit, niedrig.
Keine harten Dropshadows.

---

# 7. Interaction Tokens

## 7.1 Hover

* subtile Surface-Verschiebung
* leichter Border-/Shadow-Shift
* keine krassen Farbwechsel

## 7.2 Active / Selected

* klarer Stroke
* ruhige Tönung
* ggf. Accent-Unterstreichung oder Accent-Background light

## 7.3 Focus

* sichtbarer Keyboard-Focus
* barrierearm
* nicht nur Farbe, sondern klarer Ring / Outline

## 7.4 Disabled

* reduzierte Kontraste
* keine komplett „toten“ Controls
* semantisch noch erkennbar

## 7.5 Loading

* Skeletons statt Spinner-Orgie
* bei Listen: Zeilen-Skeletons
* bei Cards: Shape-Skeletons
* bei Details: progressive reveal

---

# 8. Component Rules

## 8.1 Buttons

### Primary

Für Hauptaktion je Bereich
Beispiele:

* Target Price setzen
* In Collection speichern
* Kaufen / Öffnen
* Family verwalten

### Secondary

Für unterstützende Aktionen

### Tertiary / Ghost

Für ruhige Nebenaktionen

### Destructive

Selten und klar getrennt

### Button-Regeln

* nie zwei Primaries in direkter Konkurrenz
* Icon + Text nur wenn Aktion davon profitiert
* kleine Card-Aktionen eher sekundär/tertiär

---

## 8.2 Chips

### Filter Chips

zustandsbehaftet, toggelbar

### State Chips

z. B. Owned, Shared, Under Target

### Semantic Chips

z. B. Coop, Singleplayer, Family

### Action Chips

kleine Inline-Aktionen

Regel:
**Chips sind keine Mini-Buttons mit Identitätskrise.**
Jeder Chip-Typ braucht visuell eigene Logik.

---

## 8.3 Cards

### Summary Card

Metriken / Snapshot / Überblick

### Entity Card

Spiel, Collection, Mitglied

### Opportunity Card

Deal / Preisziel / Family-Relevanz

### Rule Card

Smart Filter, Preisregel, Set

### Activity Row/Card

Timeline / Änderungen / Events

---

## 8.4 Rows

VENT braucht starke Rows, nicht nur hübsche Cards.

Geeignet für:

* Wishlist
* Library
* Family-Aktivität
* Deal-Listen
* Suchergebnisse

Row-Aufbau typischerweise:

* Visual
* Hauptinfo
* relevante Meta
* Status
* Preis / Wert
* Quick Actions

---

## 8.5 Panels & Sheets

* Right Detail Panel auf Desktop
* Bottom/Full Sheet auf Mobile
* Modals nur für echte Entscheidungs- oder Editiermomente

---

# 9. Iconography & Illustration

## 9.1 Icons

* klar
* neutral
* modern
* nicht verspielt
* nicht ultra-technoid

## 9.2 Einsatz

* Status
* Kategorie
* Aktion
* Orientierung

## 9.3 Illustrationen

Sehr sparsam.
VENT ist utility-first, nicht mascot-first.

Leere Zustände dürfen leichte Illustrationen haben, aber nicht kindlich oder ornamental.

---

# 10. Motion

## 10.1 Grundsatz

Motion soll Orientierung verbessern, nicht beeindrucken.

## 10.2 Einsatz

* Panel ein-/ausfahren
* Filter anwenden
* Detail aufklappen
* Hover
* Sort / Reorder Feedback

## 10.3 Stil

* kurz
* weich
* präzise
* kein springiges Gaming-Feeling

---

# 11. Layout Framework

## 11.1 Desktop

Standard:

* Left Sidebar
* Top Bar
* Main Content
* optional Right Detail Panel

## 11.2 Tablet

* kompaktere Sidebar oder Rail
* Main Content mit stärker gestapelten Bereichen
* Details als Overlay/Sheet

## 11.3 Mobile

* Bottom Nav oder kompakte Tabs
* Filter als Full-height Sheet
* Detail als eigener Screen oder Sheet

---

# 12. Information Architecture Core

## 12.1 Hauptnavigation

* Home
* Wishlist
* Library
* Family
* Sales
* Collections
* Search
* Settings

## 12.2 Globale Elemente

* Suche
* Quick Action
* Filter
* Sort
* Profile / Session / Sync-State

---

# 13. Zustandslogik

Jeder Kernscreen muss mindestens diese Zustände definieren:

* default
* loading
* empty
* filtered empty
* partial content
* error
* selection mode
* detail open
* action confirmed

Das ist keine Kür. Das ist Pflicht, wenn das Produkt nicht später auseinanderfallen soll.

---

---

# VENT — High-Fidelity Screen Specs

Jetzt die 5 Schlüssel-Screens in produktionsnaher Tiefe.

---

# Screen 01 — Home / Overview

## 1. Zweck

Der Home-Screen ist **kein Newsfeed**, sondern ein **operativer Überblick**.

Er beantwortet sofort:

* Was ist heute relevant?
* Wo gibt es Handlungsbedarf?
* Welche Chancen sind konkret?
* Wo sollte ich reingehen?

## 2. Desktop Layout

### A. Sidebar links

Breite: 240–264
Inhalt:

* Logo / Wordmark oben
* Hauptnavigation
* optional unten Settings / Support / Collapse

### B. Top Bar

Höhe: 72–80
Inhalt:

* Global Search links
* Context pills / active account mittig oder linksbündig
* Quick actions rechts
* Profile / Settings / Sync-Status rechts

### C. Main Content

Max width: großzügig, aber nicht ultrabreit ungebremst
Empfohlene Struktur:

1. Hero Summary
2. Action Queue
3. Wishlist Opportunities
4. Family Snapshot
5. Continue / Recent
6. Collections Snapshot

## 3. Hero Summary

### Inhalt

* Wishlist total
* Titel unter Zielpreis
* relevante Deals
* Family-relevante Änderungen
* ggf. Freunde besitzen X Wunschtitel

### Aufbau

Große horizontale Card mit 4–5 Metrics.
Keine KPI-Hölle.

### Visual

* Surface 1
* starker, aber subtiler Radius
* einzelne Metrikblöcke
* kleine Labels oben
* große Zahlen
* optional kleine Trend-/Statushinweise

## 4. Action Queue

Eine kompakte Section:

* „3 Titel unter Zielpreis“
* „1 Family-Änderung prüfen“
* „2 Collections brauchen Aufmerksamkeit“

Jede Zeile:

* Titel
* knappe Begründung
* Primäraktion
* Chevron/Drilldown

## 5. Wishlist Opportunities

Horizontale Reihe oder vertikale kompakte Liste.
Nur relevante Einträge, nicht stumpf „neueste Rabatte“.

Jeder Eintrag:

* Cover
* Titel
* aktueller Preis
* Zielpreis
* Rabatt
* Grund der Relevanz
* Quick actions

## 6. Family Snapshot

Knapper Überblick:

* welche Mitglieder relevant aktiv sind
* neue Überschneidungen
* gemeinsame Chancen

Nicht sozial überinszenieren.

## 7. Continue / Recent

* zuletzt angesehen
* zuletzt geändert
* zuletzt bewertet oder organisiert

## 8. Collections Snapshot

2–4 Collections mit:

* Name
* Regel
* Anzahl
* kleine Cover-Vorschau

## 9. Interaktionen

* Klick auf Metric ? vorgefilterter Zielscreen
* Klick auf Opportunity ? Detailpanel oder Zielscreen
* Hover auf Card ? leichte Anhebung
* Quick action möglich ohne Screenwechsel

## 10. States

### Loading

* Skeleton Hero
* Skeleton action rows
* Skeleton opportunity cards

### Empty

Falls noch keine Daten:

* freundliche Startfläche
* CTA: Wishlist importieren / Library verbinden / Family einrichten

### Error

Inline Section Errors statt Vollbild-Absturz

## 11. Responsive Verhalten

### Tablet

* Hero untereinander aufbrechen
* Sections stärker stapeln
* Sidebar kompakt

### Mobile

* Hero als scrollbare Summary Cards
* Action Queue zuerst
* Opportunities darunter
* Bottom Nav statt persistenter Sidebar

---

# Screen 02 — Wishlist

## 1. Zweck

Die Wishlist ist ein **Entscheidungs- und Priorisierungstool**, keine passive Merkliste.

## 2. Screen-Struktur

### Header Zone

* Titel: Wishlist
* Count
* Search in Wishlist
* View Toggle
* Sort
* Filter
* Create Set / Smart Collection

### Secondary Control Bar

Segmented Control:

* All
* On Sale
* Under Target
* Friends Own
* Family Relevant

Optional zusätzliche Filterchips darunter.

## 3. Primäre Ansicht

Default: **List-first Hybrid**, nicht reine Kachelwand.

Empfohlene Spalten/Informationszonen:

* Cover
* Titel + Meta
* Tags / Sets
* Current Price
* Discount
* Target Status
* Friends/Family relevance
* Quick actions

## 4. Wishlist Row Spec

### Linke Zone

* Cover 56x80 oder ähnlich
* Titel
* Submeta: Genre/Tags/Added date

### Mitte

* Smart tags / Collection chips
* Friends own count
* Coop / Single / Family badges

### Rechte Zone

* Current price
* Discount badge
* Target threshold state
* action button / kebab / open detail

## 5. Target Price UI

Wichtiges Unterscheidungsmerkmal von VENT.

Visualisierung:

* aktueller Preis groß
* Zielpreis kleiner darunter
* State:

  * above target
  * close to target
  * under target

Nicht nur farblich, auch sprachlich erkennbar.

## 6. Smart Sets / Collections

Oberhalb oder links in Subpanel:

* Buy under X €
* Friends own this
* Coop candidates
* Wait for deeper discount
* Family candidates
* Singleplayer backlog

Diese Collections sollen wie echte Objekte wirken, nicht wie versteckte Filter.

## 7. Detail Panel

Beim Klick auf einen Eintrag öffnet rechts:

* großes Cover
* Titel
* Preisblock
* Zielpreisstatus
* Freunde besitzen es
* Family relevance
* Collections
* Notizen / letzter Status
* Aktionen

## 8. Primäraktionen

* Set target price
* Add to collection
* Move / tag
* Hide
* Open details / open store

## 9. Hi-Fi Prioritäten

* maximale Vergleichbarkeit
* Preisvisuals extrem sauber
* keine optische Überladung
* Bulk-Management klar möglich

## 10. States

### Empty

„Noch keine Wishlist“ oder „Filter liefert nichts“.

### Filtered Empty

Anderer Text als kompletter Empty State:
„Kein Titel erfüllt gerade diesen Filter.“

### Multi-select

Checkboxen oder Selection Mode
für:

* zu Collection hinzufügen
* ausblenden
* Preisziel setzen
* taggen

## 11. Responsive

### Tablet

* weniger Spalten
* Friends/Family zusammenfassen
* Detailpanel als Slide-over

### Mobile

* Row wird 2-stufig
* Preisblock unter Titel
* Detail in eigenem Screen oder Sheet
* Filter als Fullscreen Sheet

---

# Screen 03 — Library

## 1. Zweck

Library ist Besitzverwaltung mit Nutzwert.
Nicht bloß „alle Spiele, die du hast“.

## 2. Hauptnutzen

* finden
* filtern
* einordnen
* priorisieren
* Zugriff verstehen

## 3. Header

* Title
* Search
* Sort
* Filter
* View toggle

## 4. Segmented Subnav

* All
* Installed
* Recent
* Shared
* Hidden
* Needs Attention

## 5. Default View

List view standardmäßig.
Grid nur optional.

## 6. Library Row Spec

### Links

* Cover/Icon
* Title
* Subtitle / tags / platform info

### Mitte

* ownership state
* install state
* compatibility info
* source / family relation

### Rechts

* recent played / last active
* quick actions
* open detail

## 7. Besondere Statussysteme

### Ownership

* Owned
* Family Shared
* Restricted / unavailable
* Unknown / sync pending

### Install

* Installed
* Not installed
* Update relevant
* Device mismatch

### Usefulness

* Recently played
* Dormant
* Hidden
* Archived

## 8. Smart Utility Widgets

Über der Liste oder in Section:

* Continue Playing
* Forgotten Gems
* Shared But Unused
* Recently Added
* Needs Sorting

## 9. Detail Panel

* Cover / Artwork
* ownership / source
* install state
* recent activity
* related collection membership
* open actions
* notes / flags

## 10. Designcharakter

Library darf am dichtesten sein.
Aber:

* klare Rows
* ruhige Zustände
* hervorragende Filterbarkeit
* starke semantische Badges

## 11. States

### First-time empty

Noch nichts verbunden

### Real empty

Keine Library-Daten

### Filter empty

Kein Titel erfüllt diesen Modus

### Sync issue

Teilweise Daten fehlen

## 12. Responsive

### Tablet

* 2-stufige Row
* weniger Statusspalten

### Mobile

* Row mit:

  * Cover
  * Titel
  * 2–3 wichtigste Status
  * letzte Aktivität
* alles andere ins Detail

---

# Screen 04 — Family

## 1. Zweck

Family bekommt einen eigenen operativen Bereich, nicht nur einen Nebenschalter.

## 2. Leitfrage

* Wer hat worauf Zugriff?
* Was überschneidet sich?
* Was lohnt sich gemeinsam?
* Wo gibt es Konflikte oder Chancen?

## 3. Layout

### Header

* Family
* Member chips / selector
* shared mode toggle
* filter / sort

### Hauptbereiche

1. Family Summary
2. Member Access
3. Recent Activity
4. Overlap & Opportunities
5. Shared Wishlist / Coop potential

## 4. Family Summary Card

Metriken:

* aktive Mitglieder
* gemeinsame nutzbare Titel
* Wishlist-Überschneidungen
* neue relevante Änderungen

## 5. Member Chips

Jedes Mitglied als selektierbarer Chip / small card:

* Avatar
* Name
* Statuspunkt
* optional Anzahl relevanter Elemente

## 6. Overlap Cards

Kerninnovation:

* „3 Titel stehen bei 2 Personen auf der Wishlist“
* „2 Coop-Titel sind bei mehreren verfügbar“
* „1 Titel unter Zielpreis ist für mehrere relevant“

## 7. Activity Rows

Beispiele:

* Spiel hinzugefügt
* Zugriff geändert
* Family-Relevanz verändert
* Wunschlisten-Überschneidung entstanden

## 8. Shared Access View

Tabelle oder strukturierte Liste:

* Titel
* Besitzer / Quelle
* zugängliche Mitglieder
* Einschränkungen
* Notiz / Status

## 9. Tonality

Etwas wärmer und menschlicher als Library.
Aber weiterhin utilitarian, nicht social-media-artig.

## 10. Primäraktionen

* Mitglied filtern
* Shared access ansehen
* gemeinsame Kandidaten prüfen
* Spiel-Detail öffnen
* Family-relevante Collection anlegen

## 11. States

### No family configured

Onboarding-State

### Low data

Nur ein Mitglied / wenig Daten

### No overlap

Positiv-neutral formulieren, nicht wie Fehler

## 12. Responsive

### Tablet

* Chips in Wrap-Grid
* Sections vertikal

### Mobile

* Member switch oben sticky
* Summary kompakter
* Overlap Cards als Stack
* Tabellen in vereinfachte Rows umwandeln

---

# Screen 05 — Game Detail

## 1. Zweck

Der Detailscreen ist die **Entscheidungszentrale für einen Titel**.

## 2. Primärfragen

* Habe ich das?
* Sollte ich es kaufen?
* Ist der Preis gut?
* Für wen ist es relevant?
* Wo ist es eingeordnet?

## 3. Desktop Layout

### Hero Header

* Cover / Art links
* Titel, Untertitel, wichtige Tags mittig
* Preis-/Statusblock rechts
* Primäraktionen sichtbar

### Main Body

2- oder 3-Spalten-Layout:

* linke Hauptinfos
* mittlere Einordnung / Collections / Family
* rechte Utility-/Action-Spalte

## 4. Hero Inhalte

* Titel
* Genre / Tags
* ownership state
* current price
* discount
* target price state
* main CTA

## 5. Action Cluster

* Set target price
* Add to collection
* Add/remove wishlist
* Hide/archive
* Open in store / external action

Nur eine Action prominent.

## 6. Detail Sections

### A. Price & Purchase Logic

* aktueller Preis
* Rabatt
* Zielpreis
* evtl. Preisbewertung / Relevanzgrund

### B. Ownership & Access

* owned / not owned
* family shared
* playable / restricted
* source information

### C. Family & Friends Relevance

* wer hat es
* wer könnte es wollen
* coop relevance
* overlap logic

### D. Collections & Tags

* enthaltene Sets
* Smart Rules
* manuelle Zuordnung

### E. Notes / History / Activity

* hinzugefügt am
* zuletzt geändert
* user notes / flags

## 7. Visual Hierarchie

1. Titel
2. Preis / Status
3. Primäraktion
4. Besitz-/Zugriffslogik
5. Family-/Collection-Kontext
6. Meta

## 8. States

### Not owned

Stärkerer Fokus auf Kaufentscheidung

### Owned

Stärkerer Fokus auf Zugriff / Organisation

### Shared

Stärkerer Fokus auf Family-Kontext

### Unavailable / data incomplete

Sauberer Hinweis, keine kaputte UI

## 9. Responsive

### Tablet

* Hero untereinander
* Sections in 1 Spalte plus Akkordeons

### Mobile

* Cover oben
* Titel + Preis direkt darunter
* Sticky Action Bar
* Sections als Cards/Akkordeons

---

# 14. Global Component Inventory für diese 5 Screens

## Navigation

* Sidebar item
* Collapsed sidebar item
* Top bar search
* Account menu
* Quick action button

## Structure

* Screen header
* Section header
* Hero summary card
* Right detail panel
* Full sheet
* Empty state block
* Inline error block

## Data

* Metric tile
* List row
* Activity row
* Opportunity card
* Overlap card
* Collection card
* Price stack
* Status badge
* Filter chip
* Segment control

## Actions

* Primary button
* Secondary button
* Icon button
* Kebab menu
* Bulk action bar
* Inline action chip

---

# 15. Reihenfolge für Mockup-Bau

Die saubere Umsetzungsreihenfolge wäre:

## Phase 1 — UI Kit / Foundation

* Farben
* Typo
* Buttons
* Chips
* Cards
* Rows
* Inputs
* Panels
* Empty/Error States

## Phase 2 — 5 Kernscreens

* Home
* Wishlist
* Library
* Family
* Game Detail

## Phase 3 — Rest

* Sales
* Collections
* Search
* Settings

---


