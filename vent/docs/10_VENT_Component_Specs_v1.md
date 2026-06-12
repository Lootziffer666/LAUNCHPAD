# VENT — Component Specs v1.0

1. globale Regeln
2. Kernkomponenten
3. screenkritische Spezialkomponenten
4. States & Verhalten
5. Bau-Reihenfolge

---

# 1) Globale Komponentenregeln

## 1.1 Prinzip: eine Komponente = eine Hauptaufgabe

Nicht:

* Chip, der eigentlich Button ist
* Card, die eigentlich Tabelle ist
* Badge, die eigentlich Filter ist

Sondern klar getrennt:

* **Button** löst Aktion aus
* **Chip** zeigt Zustand oder toggelt Filter
* **Badge** markiert Status
* **Row** dient Vergleich und Dichte
* **Card** bündelt Inhalt oder Opportunity
* **Panel** zeigt Detailkontext

---

## 1.2 Größenlogik

Komponenten sollen nicht wild eigene Maße erfinden.

### Größenfamilien

* **S** = dicht, sekundär, inline
* **M** = Standard
* **L** = prominent, summary/detail
* **XL** = hero/spezielle Fokuskomponenten

---

## 1.3 Radiuslogik

* kleine Controls: `12`
* Standard-Container: `18`
* große Panels/Cards: `24`
* Hero/Summary: `28`

Nicht jede Komponente eigener Radius. Sonst wirkt das System zusammengewürfelt.

---

## 1.4 Abstände

Standardisierte Innenabstände:

* tight: `8`
* compact: `12`
* standard: `16`
* roomy: `20`
* large: `24`
* hero: `32`

---

## 1.5 Zustände immer mitdenken

Jede interaktive Komponente braucht mindestens:

* default
* hover
* active/pressed
* focus
* disabled

Datenkomponenten zusätzlich:

* loading
* empty
* error
* selected, falls relevant

---

# 2) Core Components

---

# 2.1 Button

## Rolle

Löst eine direkte Aktion aus.

## Varianten

* **Primary**
* **Secondary**
* **Ghost / Tertiary**
* **Danger**
* **Icon Button**

---

## 2.1.1 Primary Button

### Einsatz

Genau eine dominante Aktion pro Kontext.

### Typische Einsätze

* Target Price setzen
* Collection erstellen
* Family verwalten
* Öffnen / Kaufen, wenn wirklich Hauptaktion

### Anatomie

* optional Leading Icon
* Label
* optional Trailing Icon sehr sparsam

### Größen

* S: kompakt in dichten Toolbars
* M: Standard
* L: Hero / Detail Actions

### Visuelle Logik

* gefüllte Accent-Fläche
* hoher Kontrast
* klarer Fokuszustand

### Nicht verwenden für

* jede zweite Card-Aktion
* nebeneinander mit zwei anderen Primaries
* rein dekorative Klickfläche

---

## 2.1.2 Secondary Button

### Einsatz

Unterstützende Aktion mit klarer Sichtbarkeit, aber weniger Dominanz.

### Typische Einsätze

* Filter öffnen
* Sortieren
* Detail öffnen
* Zu Collection hinzufügen

### Visuelle Logik

* Surface / Outline / leichte Tönung
* weniger laut als Primary

---

## 2.1.3 Ghost / Tertiary Button

### Einsatz

Ruhige Nebenaktion.

### Typische Einsätze

* Mehr anzeigen
* Zurücksetzen
* Nebendialog öffnen
* kleine Kontextaktion in Cards

### Gefahr

Nicht zu unsichtbar machen.
„Ruhig“ heißt nicht „kaum bedienbar“.

---

## 2.1.4 Danger Button

### Einsatz

Nur für echte destruktive Aktionen.

* entfernen
* ausblenden mit Konsequenz
* löschen

Nicht für Warnhinweise ohne echte Destruktion.

---

## 2.1.5 Icon Button

### Einsatz

Nur wenn die Aktion extrem geläufig oder sekundär ist.

### Beispiele

* More menu
* Close panel
* Favorite / pin
* Compact quick action

### Regel

Wenn Bedeutung nicht glasklar ist ? Textbutton statt Icon-only.

---

## Button-Spec kompakt

### Heights

* S: `32`
* M: `40`
* L: `48`

### Horizontal padding

* S: `12`
* M: `16`
* L: `20`

### Radius

* `12` bis `14`

### Icon size

* S: `14–16`
* M: `16`
* L: `18`

---

# 2.2 Chip

## Rolle

Chips sind für kompakte Zustände, Filter oder kleine semantische Marker.

## Chip-Typen

* **Filter Chip**
* **State Chip**
* **Semantic Chip**
* **Action Chip**

Die vier dürfen nicht identisch aussehen.

---

## 2.2.1 Filter Chip

### Einsatz

Toggelbarer Filter.

### Verhalten

* off
* hover
* selected
* disabled

### Inhalt

* Label
* optional leading icon
* optional count

### Beispiele

* On Sale
* Coop
* Under 10 €
* Shared only

### Regel

Filter Chips dürfen klickbar wirken.
Nicht mit Status Chips verwechseln.

---

## 2.2.2 State Chip

### Einsatz

Status anzeigen, nicht primär klicken.

### Beispiele

* Owned
* Shared
* Under Target
* Installed
* Needs Attention

### Verhalten

* standardmäßig nicht interaktiv
* optional klickbar für Drilldown, dann klar kennzeichnen

---

## 2.2.3 Semantic Chip

### Einsatz

inhaltliche Eigenschaften

### Beispiele

* Coop
* Singleplayer
* Family
* Priority
* Hidden

### Regel

Semantisch, nicht funktional.

---

## 2.2.4 Action Chip

### Einsatz

Kleine Inline-Aktion in dichten Kontexten

### Beispiele

* Add note
* Set target
* Tag
* Open rule

### Regel

Nur sparsam. Sonst werden Chips wieder Mini-Buttons.

---

## Chip-Spec kompakt

### Heights

* S: `24`
* M: `28`
* L: `32` nur selten

### Padding

* `8–12` horizontal

### Radius

* `999` pill oder `12` soft rounded
  Für VENT eher pillig bei Filterchips, softer rounded bei State Chips denkbar.

---

# 2.3 Badge

## Rolle

Kompakte Markierung ohne Button-Anmutung.

## Einsatz

* Count
* Delta
* Alert marker
* numeric highlight in klein

## Beispiele

* `3`
* `-45%`
* `Neu`
* `2 Änderungen`

## Regel

Badge ist kein Chip und kein Button.
Mehr Anzeige als Interaktion.

---

# 2.4 Input / Search Field

## Rolle

Texteingabe, Suche, Filterwert, Preisziel.

## Varianten

* **Global Search**
* **Local Search**
* **Inline Numeric Input**
* **Rule/Tag Input**

---

## 2.4.1 Global Search

### Einsatz

Top Bar, appweit

### Anatomie

* leading search icon
* placeholder
* optional hotkey hint
* optional clear button

### Verhalten

* focus stark sichtbar
* Ergebnisse als Overlay / Dropdown
* keine riesige Eingabe, eher kontrolliert breit

---

## 2.4.2 Local Search

### Einsatz

z. B. nur innerhalb Wishlist / Library

### Unterschied zu global

* kleiner
* näher an Sort/Filter
* enger auf den Screenkontext bezogen

---

## 2.4.3 Inline Numeric Input

### Einsatz

Target Price

### Anforderungen

* gut lesbar
* numerisch stabil
* Währung eindeutig
* kleine Plus/Minus- oder Shortcut-Optionen möglich

### Regel

Nicht als generisches Textfeld behandeln.
Preislogik ist in VENT ein Kernfeature.

---

## Input-Spec kompakt

### Heights

* Standard: `40`
* Prominent: `48`

### Padding

* `12–16`

### Radius

* `12`

---

# 2.5 Segmented Control

## Rolle

Wechselt schnell zwischen wenigen, klaren Modi.

## Beispiele

* All / On Sale / Under Target / Friends Own / Family Relevant
* All / Installed / Recent / Shared

## Regel

Für **exklusive Modi**, nicht für additive Filter.
Additiv = Chips.
Exklusiv = Segment Control.

## Anzahl

Ideal: `3–5`
Maximal: `6`, sonst kippt es.

## States

* default
* hover
* active
* focus
* disabled

## Anatomie

* outer track
* segment items
* active pill / active fill

---

# 2.6 Tabs

## Rolle

Gröbere inhaltliche Teilbereiche, stärker als Segmentwechsel.

Für VENT eher sparsam einsetzen.
Oft ist Segment Control oder Sidebar besser.

---

# 2.7 Dropdown / Select

## Rolle

Sortierung, Moduswahl, seltene Optionen.

## Typische Einsätze

* Sort by price
* Sort by relevance
* Source selection
* Family member selection

## Regel

Nicht für Dinge verwenden, die besser sichtbar als Chips/Segmente lösbar wären.

---

# 2.8 Kebab / Overflow Menu

## Rolle

Sekundäre oder seltene Aktionen bündeln.

## Typische Inhalte

* Hide
* Archive
* Remove tag
* Copy info
* Open externally

## Regel

Nicht Hauptaktionen verstecken.

---

# 3) Container Components

---

# 3.1 Card Base

## Rolle

Gebündelte Informationseinheit oder Opportunity.

## Varianten

* **Summary Card**
* **Entity Card**
* **Opportunity Card**
* **Rule Card**
* **Mini Card**

---

## 3.1.1 Summary Card

### Einsatz

Home Hero, Family Summary, Utility Summary

### Anatomie

* label / overline
* metric / headline
* context line
* optional mini action

### Regel

Keine Textwüste.
Summary = schnelle Erfassbarkeit.

---

## 3.1.2 Entity Card

### Einsatz

Spiel, Collection, Member

### Anatomie

* visual
* title
* metadata
* status
* actions

### Regel

Nicht überall statt Rows verwenden.
Entity Cards sind gut für Gruppierung, schlechter für dichte Vergleiche.

---

## 3.1.3 Opportunity Card

### Einsatz

Deal, Overlap, relevante Chance

### Anatomie

* prägnanter Titel
* Grund der Relevanz
* 1–2 Datenpunkte
* klare Action

### Beispiele

* unter Zielpreis
* von mehreren Familienmitgliedern gewünscht
* Shared but unused

### Regel

Opportunity Cards sollen handlungsorientiert sein, nicht bloß informativ.

---

## 3.1.4 Rule Card

### Einsatz

Smart Sets, gespeicherte Logiken, Preisregeln

### Anatomie

* Rule name
* Kurzbeschreibung
* Count
* optional last changed
* quick action

---

## Card-Spec kompakt

### Padding

* standard: `16–20`
* large: `24`

### Radius

* standard: `18`
* large: `24`

### Min height

nur dort definieren, wo für Grid-Stabilität nötig

---

# 3.2 Row Base

## Rolle

Die wichtigste Vergleichskomponente in VENT.

Wishlist und Library stehen und fallen mit guten Rows.

## Varianten

* **Entity Row**
* **Activity Row**
* **Access Row**
* **Action Row**

---

## 3.2.1 Entity Row

### Einsatz

Wishlist, Library, Search, Collections content

### Anatomie

1. leading visual
2. primary text block
3. secondary context
4. status block
5. value block
6. actions

### Regel

Row muss auch ohne alle Zusatzdaten stabil bleiben.

---

## 3.2.2 Activity Row

### Einsatz

Recent activity, timeline, updates

### Anatomie

* small icon/avatar
* event text
* related entity
* timestamp
* optional action

### Regel

Activity Rows müssen lesbar bleiben, nicht wie Logfiles.

---

## 3.2.3 Access Row

### Einsatz

Family Shared Access

### Anatomie

* game
* owner/source
* accessible by
* restriction/status
* open action

---

## 3.2.4 Action Row

### Einsatz

Home Action Queue

### Anatomie

* action title
* reason/subtext
* urgency/status
* CTA
* optional chevron

---

## Row-Spec kompakt

### Heights

* compact: `56`
* standard: `72`
* media row: `88–96`

### Padding

* `12–16`

### Divider

subtil, nicht hart tabellarisch

---

# 3.3 Panel

## Rolle

Detailkontext ohne kompletten Navigationsbruch.

## Varianten

* **Right Detail Panel**
* **Bottom Sheet**
* **Full Sheet**
* **Modal**

---

## 3.3.1 Right Detail Panel

### Einsatz

Desktop-Detail für Wishlist, Library, Game

### Breite

ca. `360–440`

### Anatomie

* header with title / close
* scrollable content
* sticky actions optional
* sections mit klaren Abständen

### Regel

Panel darf vollwertig sein, aber den Hauptscreen nicht erschlagen.

---

## 3.3.2 Bottom Sheet

### Einsatz

Mobile / Tablet für Detail, Filter, Sort

### Größen

* partial
* medium
* full height

### Regel

Filter/Sort oft full height; Quick actions eher partial/medium.

---

## 3.3.3 Modal

### Einsatz

Nur für echte Entscheidungen oder Form-Editing.

### Beispiele

* Collection erstellen
* Regel anlegen
* destruktive Bestätigung

### Regel

Kein Modal für reine Information, wenn Panel/Sheet reicht.

---

# 4) Screen-Critical Specialized Components

---

# 4.1 Price Stack

## Rolle

Eine der wichtigsten Spezialkomponenten in VENT.

## Einsatz

Wishlist, Game Detail, Opportunities, Deals

## Anatomie

* current price
* discount badge
* target price
* target state label
* optional delta / difference

## Priorität

Der Blick muss sofort verstehen:

* wie teuer jetzt
* wie stark reduziert
* wie steht es zum Zielpreis

## Varianten

* **Compact** für Rows
* **Standard** für Cards
* **Large** für Game Detail

## State Labels

* Above Target
* Near Target
* Under Target

## Regel

Nicht nur Farbe verwenden. Immer Text-/Icon-Unterstützung.

---

## Price Stack Größen

### Compact

* price prominent
* target als zweite Zeile
* badge klein

### Standard

* price + discount in einer Ebene
* target state separat sichtbar

### Large

* price hero
* target comparison sehr klar
* primäre Kauf-/Set-Action direkt daneben

---

# 4.2 Metric Tile

## Rolle

Zahl + Bedeutung + Kontext in sehr kurzer Form

## Einsatz

Home, Family Summary, Utilities

## Anatomie

* label
* large number/value
* tiny context line
* optional icon

## Beispiele

* `12` Under Target
* `3` Family Changes
* `7` Relevant Deals

## Regel

Keine kleinen Dashboard-Diagramm-Monster draus machen.

---

# 4.3 Member Chip / Member Card

## Rolle

Personenbezug im Family-Modul

## Varianten

* **Member Chip**
* **Member Card Small**
* **Avatar Stack**

---

## Member Chip

### Einsatz

Filter / Selector

### Inhalt

* avatar
* name
* optional status dot

---

## Member Card Small

### Einsatz

Member Rail / Family Overview

### Inhalt

* avatar
* name
* short stat
* selected state

---

## Avatar Stack

### Einsatz

Mehrere relevante Personen in engem Raum

### Regel

Bei Hover/Click müssen Namen auflösbar sein.

---

# 4.4 Collection Preview Card

## Rolle

Smart Sets / Collections anteasern

## Anatomie

* name
* short rule
* count
* tiny cover strip
* open action

## Einsatz

Home, Collections, Wishlist rail

---

# 4.5 Bulk Action Bar

## Rolle

Massenoperationen bei Listen

## Einsatz

Wishlist, Library

## Anatomie

* selected count
* primary bulk action
* secondary actions
* clear selection

## Verhalten

* erscheint sticky
* verschwindet sauber bei zero selection

## Regel

Bulk-Aktionen nur anbieten, wenn sinnvoll.

---

# 4.6 Status Badge Group

## Rolle

Mehrere Statuswerte kompakt darstellen

## Einsatz

Library, Game Detail, Wishlist secondary info

## Beispiele

* Owned
* Shared
* Installed
* Coop
* Hidden

## Regel

Maximal 3–4 prominent sichtbare gleichzeitig, Rest bündeln oder sekundär machen.

---

# 4.7 Empty State Block

## Rolle

Leere Zustände freundlich und zielführend machen

## Anatomie

* klare Überschrift
* kurze Erklärung
* 1 Haupt-CTA
* optional 1 Neben-CTA
* kleine Illustration optional

## Varianten

* first-use empty
* no results empty
* filtered empty
* disconnected empty

## Regel

Filtered empty ? onboarding empty.
Das muss sprachlich und visuell unterschieden werden.

---

# 4.8 Skeleton Set

## Rolle

Loading ohne Chaos

## Varianten

* summary skeleton
* row skeleton
* card skeleton
* panel skeleton

## Regel

Skeletons sollen Form der echten Komponente spiegeln, nicht beliebige graue Balken sein.

---

# 5) Verhalten & States je Komponentengruppe

---

# 5.1 Interactive State Model

## Minimum

* default
* hover
* pressed
* focus
* disabled

## Optional

* selected
* loading
* destructive
* success-confirmed

---

# 5.2 Data Component State Model

## Minimum

* default
* loading
* empty
* partial
* error

### Beispiele

* List loaded, panel loading
* Summary loaded, family module empty
* partial sync in library

---

# 5.3 Selection State Model

Für Rows und Cards relevant.

## Zustände

* unselected
* hover
* selected
* selected + focus
* selected + bulk mode active

---

# 6) Konkrete Komponentensets für die 5 Kernscreens

---

# 6.1 Home braucht

* Sidebar
* Top Bar
* Page Header
* Summary Card
* Metric Tile
* Action Row
* Opportunity Card
* Member Mini Card
* Collection Preview Card
* Empty State
* Skeletons

---

# 6.2 Wishlist braucht

* Page Header
* Local Search
* Segmented Control
* Filter Chips
* Smart Set Card
* Entity Row
* Price Stack
* Status Badge Group
* Bulk Action Bar
* Right Detail Panel
* Inline Numeric Input
* Empty / Filtered Empty / Skeletons

---

# 6.3 Library braucht

* Page Header
* Local Search
* Segmented Control
* Utility Summary Card
* Entity Row
* Status Badge Group
* Detail Panel
* Bulk Action Bar
* Empty States
* Skeletons

---

# 6.4 Family braucht

* Page Header
* Summary Card
* Metric Tile
* Member Chip/Card
* Avatar Stack
* Opportunity Card
* Access Row
* Activity Row
* Empty State
* Skeletons

---

# 6.5 Game Detail braucht

* Hero media card
* Title/meta block
* Price Stack large
* Action button cluster
* Status badge group
* Collection chips
* Activity rows
* Notes block
* section containers
* loading skeletons

---

# 7) Was zuerst in Figma gebaut werden sollte

In genau dieser Reihenfolge:

## Phase 1 — primitives

* colors
* text styles
* spacing
* radius
* shadows

## Phase 2 — atoms

* buttons
* chips
* badges
* inputs
* icons

## Phase 3 — molecules

* price stack
* metric tile
* status badge group
* member chip
* collection preview
* action row

## Phase 4 — organisms

* entity row
* summary card
* opportunity card
* right detail panel
* bulk action bar
* empty state block

## Phase 5 — screens

* Wishlist
* Library
* Game Detail
* Home
* Family

---

# 8) Die kritischen Komponenten, bei denen VENT gewinnt oder verliert

Die wichtigsten drei sind glasklar:

## 1. Entity Row

Wenn die nicht sitzt, werden Wishlist und Library mühsam.

## 2. Price Stack

Das ist Produktkern.
Wenn Preis, Rabatt und Zielpreis nicht sofort verständlich sind, verschenkt VENT seinen Hebel.

## 3. Opportunity Card

Damit unterscheidet sich VENT von bloßer Datensammlung.
Sie macht aus Information Handlung.

Dahinter direkt:

* Right Detail Panel
* Member/Family-Komponenten
* Bulk Action Bar

---

