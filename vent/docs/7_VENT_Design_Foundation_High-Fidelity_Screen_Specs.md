# VENT — Design Foundation ? High-Fidelity Screen Specs

---

# 1) Design Foundation

## 1.1 Produktcharakter

VENT ist nicht „noch ein Steam-Skin“.
VENT soll sich anfühlen wie:

* **ruhiger**
* **klarer**
* **zielgerichteter**
* **weniger reibend**
* **mehr Familien-/Wishlist-/Library-Utility**
* **weniger Sale-Chaos, weniger UI-Lärm**

Tonality:

* **kompetent**
* **sachlich**
* **leicht modern**
* **nicht nerdig-verspielt**
* **nicht corporate steril**
* **nicht gamer-edgy**

Leitbild in einem Satz:

> **VENT reduziert Reibung zwischen Wunsch, Besitz, Familie, Angebot und Aktion.**

---

## 1.2 UX-Prinzipien

### A. Information vor Deko

Alles, was auf dem Screen erscheint, muss eine Funktion haben:

* Orientierung
* Priorisierung
* Entscheidung
* Aktion

### B. Eine Hauptaktion pro Bereich

Jede Card, Section oder Sheet braucht eine klare Primärfunktion.
Nicht fünf gleich laute Buttons.

### C. Schnell scannbar

Der Nutzer soll in 2–3 Sekunden erkennen:

* Wo bin ich?
* Was ist relevant?
* Was ist neu?
* Was kann ich tun?

### D. Layer statt Überfrachtung

Nicht alles gleichzeitig sichtbar.
Progressive disclosure:

* erst Überblick
* dann Drilldown
* dann Detail
* dann Aktion

### E. Familiar, aber eigenständig

Muster dürfen vertraut wirken:

* Sidebar
* Library-Listen
* Sale-Kacheln
* Wishlist-Listen
* Detail-Panels

Aber:

* keine 1:1 Steam-Kopie
* keine identische Farbdramaturgie
* keine identischen Formensprache-Signaturen
* keine „Valve in sauber“

### F. Light Mode zuerst

Du hast klar gesagt: **kein Dark-Mode-Fetisch**.
Also:

* **Light Mode ist Primärmodus**
* Dark Mode ist systematische Ableitung, nicht Ausgangspunkt

---

## 1.3 Visual Positioning

VENT liegt visuell zwischen:

* **Steam Metro** ? strukturiert, funktional, grid-orientiert
* **Steam Air** ? luftiger, klarer, moderner
* **deinen Vorlieben** ? hell, smooth, frictionless, weniger düster

Also nicht:

* brutalistisch
* neon
* gamer-grunge
* frosted-glass-overkill
* heavy gradients everywhere

Sondern:

* weiche Flächen
* klare Hierarchien
* kontrollierte Dichte
* subtile Tiefe
* gute Lesbarkeit
* Desktop-first Produktivität, aber modern

---

# 2) Core Design Tokens

## 2.1 Color System

## Base Neutrals

**Light Theme**

* `bg/canvas`: sehr helles Off-White
* `bg/surface-1`: Weiß
* `bg/surface-2`: helles Grau
* `bg/surface-3`: etwas tieferes Grau für Panels
* `stroke/subtle`: sehr helles Grau
* `stroke/strong`: mittleres Grau
* `text/primary`: fast Anthrazit
* `text/secondary`: gedämpftes Schiefergrau
* `text/tertiary`: kühleres Grau

Ziel: nicht klinisch reinweiß, sondern leicht weich.

## Accent System

VENT braucht einen Akzent, der zur Namenslogik passt:

* Ventil
* Druck
* Dampf
* Release
* Steuerung

Empfehlung:

* **Primary Accent:** warmes gedämpftes Rot-Orange oder Ziegelrot
* **Secondary Accent:** petrol-/stahlblau für Info/Systemflächen
* **Success:** gedämpftes Grün
* **Warning:** amber
* **Danger:** kontrolliertes Rot

Wichtig:
Das Primärrot darf nicht „Valve-rot“ schreien.
Also weniger Signalrot, eher:

* burnt coral
* muted terracotta red
* warm industrial red

## Functional Colors

* Rabatt / Deal
* Owned
* In Wishlist
* Family Shared
* Playable on Device
* Unsupported / Region / Restriction

Diese Zustände brauchen semantisch stabile Farben.

---

## 2.2 Typography

Typografisches Ziel:

* sachlich
* modern
* UI-stark
* gut scanbar
* klare Zahlen
* gute Tabellen-/Listenlesbarkeit

### Rollen

* **Display / Page Title**
* **Section Title**
* **Card Title**
* **Body**
* **Meta / Caption**
* **Numeric / Price / Discount / Badge**

### Stil

* Headlines: kräftig, aber nicht aggressiv
* Body: neutral, hoch lesbar
* Meta: kompakt, ruhig
* Zahlen/Preise: besonders sauber

### Empfehlung

Eine moderne Sans mit:

* guter UI-Lesbarkeit
* stabilen Ziffern
* gutem deutschem Schriftsatz
* klarem Unterschied zwischen Regular / Medium / Semibold

Wichtig ist weniger die konkrete Font als diese Logik:

* **Page Title:** 28–34
* **Section Header:** 20–24
* **Card Title:** 16–18
* **Body:** 14–16
* **Meta:** 12–13
* **Badge / Tiny:** 11–12

---

## 2.3 Spacing & Layout

## 8pt-System

Alles sauber im 8er- oder 4er-Raster:

* 4
* 8
* 12
* 16
* 24
* 32
* 40
* 48

## Radius

VENT sollte nicht scharfkantig sein.

Empfehlung:

* Small controls: 10–12
* Cards: 16–20
* Modals / Sheets: 24
* Hero containers: 24–28

## Shadows / Elevation

Sehr zurückhaltend.
Lieber:

* subtile Borders
* zarte Layer-Differenz
* wenig schwere Schatten

Das Produkt soll modern wirken, nicht wie ein Dashboard aus 2018.

---

## 2.4 Component Philosophy

Globale Komponenten sollen überall gleich funktionieren.

### Global

* Top Bar
* Sidebar / Nav Rail
* Search Field
* Section Header
* Card Shell
* Status Chip
* Filter Chip
* Segmented Control
* List Row
* Game Cover Tile
* Price Stack
* Empty State
* Bottom Sheet / Side Sheet
* Modal
* Toast / Inline Feedback

### Modul-spezifisch

* Family activity rows
* Wishlist threshold controls
* Sale comparison cards
* Bundle/relevance cards
* Friends-own-this clusters
* “Buy when under X€” logic tiles

---

# 3) Interaction Foundation

## 3.1 Navigation Model

Für Desktop / große Flächen:

* **Left Sidebar** persistent
* **Top Bar** für global search, account, context actions
* **Main Content**
* optional **Right Detail Panel** für Drill-in ohne Full-Screen-Wechsel

Für Mobile:

* Bottom Nav oder kompakte Sections
* Details als Push Screen / Bottom Sheet
* Filter als Full-height Sheet

---

## 3.2 State Model

Jeder Hauptscreen braucht definierte Zustände:

* Default
* Loading
* Empty
* Partial data
* Error
* Success feedback
* Multi-select mode
* Filter active
* Sorted state
* Drilldown open

Wenn diese States nicht früh definiert werden, zerfällt die Hi-Fi-Phase.

---

## 3.3 Content Priority Rules

VENT darf nie alle Daten gleich laut anzeigen.

Beispiel Wishlist:

1. wichtigste Einsicht
2. relevanteste Deals
3. soziale/familiäre Relevanz
4. Detailmetadaten

Beispiel Library:

1. weiterspielen / zuletzt aktiv
2. installierbar / kompatibel
3. Family / shared / owned logic
4. Tags / Meta

---

# 4) High-Fidelity Screen Specs

Jetzt die konkrete Screen-Ebene.
Ich schreibe sie so, dass daraus direkt UI-Mockups oder später ein PRD gebaut werden kann.

---

# Screen 01 — Home / Overview

## Ziel

Zentraler Kontrollraum.
Nicht „News Feed“, sondern **relevanzsortierter Überblick**.

## Hauptfragen des Users

* Was ist heute wichtig?
* Gibt es Deals, die mich betreffen?
* Hat sich in Family/Wishlist/Library etwas geändert?
* Wo sollte ich als Nächstes rein?

## Layout

### Top Bar

* Global Search
* Quick Add / Quick Action
* Profile / Settings
* optional Notifications

### Sidebar

* Home
* Wishlist
* Library
* Family
* Sales
* Collections / Sets
* Activity
* Settings

### Main Content Sections

1. **Hero Summary**
2. **Urgent / Relevant Actions**
3. **Wishlist Opportunities**
4. **Family Activity / Shared Context**
5. **Continue / Recent**
6. **Collections Snapshot**

## Hero Summary

Eine breite, ruhige Card:

* Anzahl Wishlist Titles
* aktuelle gute Deals
* Spiele unter Preisziel
* Family-relevante Änderungen
* evtl. “X Freunde besitzen Y”

Keine überladene Analytics-Wand.
Nur 3–5 Kernmetriken.

## Komponenten

* Summary metric cards
* action chips
* deal rows
* cover clusters
* mini status pills

## Hi-Fi Verhalten

* erste Ebene sehr ruhig
* wichtige Aktionen visuell priorisiert
* Rabatt/Aktion nicht komplett rot anschreien
* Zahlen groß genug für schnellen Scan

---

# Screen 02 — Wishlist

## Ziel

Wishlist nicht als dumme Liste, sondern als **Entscheidungswerkzeug**.

## Hauptfragen

* Was lohnt sich gerade?
* Was ist unter meinem Zielpreis?
* Was ist relevant wegen Freunden/Familie?
* Was kann ich priorisieren oder gruppieren?

## Layout

### Header

* Titel + Count
* Segmented Control:

  * All
  * On Sale
  * Under Target
  * Friends Own
  * Family Relevant
* Sort
* Filter
* Create Set

### Main Area

* optional pinned insight strip
* list/grid toggle
* wishlist entries

### Right Panel / Sheet

Beim Klick auf ein Spiel:

* Cover
* current price
* target price
* historical context
* friends own
* family relevance
* tags/sets
* actions

## Wishlist Row / Card Inhalte

* Cover
* Title
* Tags
* Current Price
* Discount %
* Target Price Status
* Friends own count
* Family / coop / single icons
* “Added on” Meta
* Quick actions

## Sets / Smart Grouping

Das ist wichtig, weil du das selbst erwähnt hast.

Beispiele:

* Kaufen unter X €
* Coop mit Freunden
* Nur Singleplayer
* Freunde besitzen es
* Warten auf stärkeren Rabatt
* Kandidaten für Geschenk / Family

Diese Sets sollten als:

* chips
* saved filters
* smart collections
  funktionieren.

## Hi-Fi Fokus

Wishlist ist ein Kernscreen.
Also:

* sehr gute Vergleichbarkeit
* Preise und Thresholds extrem sauber
* schnelle Bulk-Aktionen
* kein Card-Chaos

---

# Screen 03 — Library

## Ziel

Besitz in nutzbare Ordnung bringen.

## Hauptfragen

* Was besitze ich?
* Was ist installiert / spielbar?
* Was habe ich ewig nicht gespielt?
* Was ist über Family zugänglich?
* Was soll sichtbar gefiltert werden?

## Layout

### Header

* Title
* Search
* Filter
* Sort
* View toggle

### Subnav / Segments

* All
* Installed
* Recent
* Family Shared
* Hidden / Archived
* Unsupported / Needs attention

### Content

* list view default
* optional cover grid
* detail panel

## Key Components

* game rows
* install/play status badges
* device compatibility chips
* storage/info tags
* source ownership tags

## Besondere UX-Chancen

Hier kann VENT besser als Steam werden durch:

* bessere Filterlogik
* bessere Mehrfachauswahl
* klare Sicht auf Shared/Owned
* smartere “was lohnt sich jetzt”-Ordnung

---

# Screen 04 — Family

## Ziel

Family/Families endlich auf Augenhöhe behandeln.

## Hauptfragen

* Wer teilt was?
* Was ist für wen relevant?
* Wer besitzt ein Spiel?
* Was ist gemeinsam nutzbar?
* Wo gibt es Konflikte / Überschneidungen / Chancen?

## Layout

### Header

* Family Overview
* Member switch / chips
* Shared collections toggle

### Main Sections

1. **Family Summary**
2. **Recent Activity**
3. **Shared Access**
4. **Relevant Wishlist Overlap**
5. **Recommendations / Opportunities**

## Family Summary Card

* Members
* Shared libraries
* games relevant to multiple people
* overlaps in wishlists / ownership

## Komponenten

* avatar chips
* member cards
* shared ownership rows
* overlap cards
* coop opportunity tiles
* conflict/status indicators

## Hi-Fi Besonderheit

Dieser Bereich darf emotional etwas wärmer wirken als Library/Wishlist, aber bleibt sachlich.
Mehr Personenbezug, etwas weichere Flächen, aber kein Social Feed.

---

# Screen 05 — Sales / Deals

## Ziel

Sales nicht als chaotisches Banner-Geballer, sondern als **entscheidungsrelevante Übersicht**.

## Hauptfragen

* Was ist wirklich ein guter Deal?
* Was betrifft mich konkret?
* Was ist unter Preisziel?
* Was ist relevant für Family/Friends/Wishlist?

## Layout

### Header

* Current Sales
* Event / period label
* Sort / Filter / Source / relevance model

### Sections

1. Featured but relevant
2. Wishlist deals
3. Under target
4. Friends own / family relevant
5. Hidden gems / low-noise picks

## Komponenten

* sale cards
* price history mini bar
* threshold badge
* relevance score indicator
* “why shown” meta label

## Hi-Fi Fokus

Weniger Store-Schreierei.
Mehr:

* Vergleich
* Klarheit
* Priorisierung

---

# Screen 06 — Collections / Sets

## Ziel

Vom User definierte oder smarte Gruppierungen nutzbar machen.

## Hauptfragen

* Wie organisiere ich meine Wunsch- und Besitzlogik?
* Welche Sets helfen mir beim Entscheiden?
* Welche Smart Collections sind nützlich?

## Layout

### Header

* Collections
* Create Collection
* Smart / Manual Toggle

### Grid/List

Collections als ruhige große Kacheln oder Rows:

* Name
* rule summary
* count
* last changed
* quick preview covers

## Detail View

* collection title
* logic description
* included items
* actions / edit rule

## Smart Collection Beispiele

* Unter 10 €
* Couch Coop
* Spiele, die Freunde besitzen
* Family geeignet
* Auf Rabatt warten
* Kaufen wenn vollständig / Bundle-ready

---

# Screen 07 — Game Detail

## Ziel

Alle relevanten Infos zu einem Spiel in einer klaren, aktionsfähigen Ansicht.

## Hauptfragen

* Soll ich das kaufen?
* Besitze ich das?
* Hat Familie/Freunde es?
* Ist der Preis gut?
* Wo gehört es hin?

## Layout

### Hero Section

* Cover / artwork
* title
* key tags
* ownership status
* current price / discount
* primary action

### Info Columns

* meta
* friends/family relevance
* wishlist logic
* collections
* notes / activity / related

## Primary Actions

* Add to wishlist
* Set target price
* Add to set
* Mark hidden / archive
* Open in store / activate / etc.

## Hi-Fi Prinzip

Spiel-Detail darf etwas atmosphärischer sein, aber immer funktional.
Nicht zur Promo-Seite werden.

---

# Screen 08 — Search / Universal Search

## Ziel

Nicht nur Suche, sondern schneller Sprung in Handlung.

## Modi

* Games
* Collections
* Members
* Deals
* Commands / quick actions

## Komponenten

* command-search field
* categorized results
* recent searches
* smart suggestions
* inline actions

Beispiel:
Suche nach Spiel ? direkt:

* öffnen
* zu Wishlist
* in Set packen
* Target Price setzen

---

# Screen 09 — Settings

## Ziel

Unaufgeregt, klar, nicht überdesignt.

## Bereiche

* Account / Connection
* Appearance
* Wishlist defaults
* Family handling
* Notifications
* Sales / relevance rules
* Data / sync / import

Hi-Fi hier eher utilitarian.
Keine Showbühne.

---

# 5) Cross-Screen Component Specs

## 5.1 Card Types

VENT braucht nicht „eine Card für alles“.

### A. Summary Card

Für Metriken / Snapshot

### B. Entity Card

Für Spiel / Collection / Member

### C. Opportunity Card

Für Deal / relevante Aktion

### D. Feed Row

Für Aktivität / Verlauf

### E. Rule Card

Für Smart Set / gespeicherte Logik

---

## 5.2 Chips

Es gibt mindestens vier Chip-Arten:

* **Filter Chip**
* **State Chip**
* **Semantic Chip**
* **Action Chip**

Nicht dieselbe Chip-Optik für alles.
Sonst wird die UI matschig.

---

## 5.3 Tables vs Cards

Wichtige Regel:

* **Vergleich und Dichte** ? Listen / Tabellenlogik
* **Entdeckung und Gruppierung** ? Cards
* **Drilldown und Fokus** ? Panel / Detail view

Wishlist und Library sollten daher nicht komplett card-lastig werden.

---

# 6) Responsive Strategy

## Desktop first

VENT gewinnt vor allem auf größeren Flächen.

### Breakpoints logisch gedacht

* **Wide desktop**: Sidebar + Main + Detail panel
* **Normal desktop**: Sidebar + Main
* **Tablet**: Nav rail / compact sidebar + stacked sections
* **Mobile**: Bottom nav + sheets + stacked cards/rows

## Wichtig

Nicht einfach Desktop schrumpfen.
Die Informationsdichte muss pro Breakpoint neu priorisiert werden.

---

# 7) Was jetzt als Nächstes konkret gebaut werden sollte

Jetzt nicht direkt „alle finalen Mockups“.
Sondern in dieser Reihenfolge:

## Phase A — Design Foundation dokumentieren

Ein Sheet mit:

* colors
* typography
* spacing
* radii
* shadows
* core components
* interaction states

## Phase B — 5 Schlüssel-Screens als Hi-Fi

Zuerst diese:

1. Home
2. Wishlist
3. Library
4. Family
5. Game Detail

## Phase C — System komplettieren

Danach:

* Sales
* Collections
* Search
* Settings

---

# 8) Meine klare Empfehlung

Für VENT würde ich den Stil so setzen:

## Stilformel

**Light-first productivity UI**

* **soft industrial accent**
* **Steam-adjacent information architecture**
* **modern frictionless cards and panels**
* **wishlist/family utility over store theatrics**

Das ist in sich schlüssig, marktfähig und deutlich eigenständiger als bloß „Steam, aber hübscher“.

---


