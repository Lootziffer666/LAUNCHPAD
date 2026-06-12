# VENT — Handover-Dokument

## Design Foundation > UI Kit > First Screen Build

Dieses Dokument ist der saubere Übergabestand, mit dem direkt in **Figma** oder in ein **Frontend/UI-Kit** gestartet werden kann.

Ziel dieses Handover-Dokuments:

* Scope einfrieren
* Entscheidungen bündeln
* unnötige Grundsatzdiskussionen vermeiden
* einen klaren Startpunkt für Umsetzung schaffen

---

# 1. Projektziel

VENT ist ein **Utility Layer** für Steam-nahe Nutzung.

Es soll nicht primär wie ein Store, Launcher oder Newsfeed wirken, sondern wie ein **ruhiges, produktives Organisations- und Entscheidungswerkzeug** für:

* Wishlist
* Library
* Family
* Sales
* Collections

Kernversprechen:

> **VENT reduziert Reibung zwischen Wunsch, Besitz, Preis, Zugriff und Handlung.**

---

# 2. Produktpositionierung

VENT ist **nicht**:

* ein Steam-Klon
* ein reines Visual Redesign
* ein Gaming-Showcase
* ein ad-lastiger Sales-Hub

VENT ist:

* strukturierter
* ruhiger
* light-first
* entscheidungsorientiert
* utility-first
* familien- und wishlist-stärker
* klarer in Preis-/Zugriffslogik

---

# 3. Design-Leitbild

## Stilformel

**Light-first productivity UI**

* **soft industrial accent**
* **structured desktop utility**
* **subtle warmth**
* **high scanability**
* **Steam-adjacent IA, aber eigenständige visuelle Sprache**

## Tonalität der UI

* ruhig
* kompetent
* direkt
* modern
* freundlich-nüchtern

Nicht:

* edgy
* neon
* gamer-dunkel
* ornamental
* überinszeniert

---

# 4. UX-Prinzipien

## 4.1 Orientierung vor Aktion

Jeder Screen muss schnell beantworten:

* Wo bin ich?
* Was ist wichtig?
* Was ist neu?
* Was kann ich tun?

## 4.2 Eine dominante Aktion pro Kontext

Pro Bereich nur eine visuell führende Primäraktion.

## 4.3 Vergleich dort, wo Vergleich wichtig ist

Listen und Rows vor Card-Wänden bei:

* Wishlist
* Library
* Shared Access

## 4.4 Cards nur dort, wo Gruppierung oder Opportunity sinnvoll ist

Cards vor allem für:

* Summary
* Opportunities
* Collections
* Family Overlaps

## 4.5 Tiefe über Panels statt harte Screenwechsel

Desktop bevorzugt:

* Right Detail Panel

Mobile bevorzugt:

* Sheet oder eigener Detailscreen

## 4.6 Light Mode ist Primärmodus

Dark Mode später als systematische Ableitung, nicht als Ausgangspunkt.

---

# 5. Informationsarchitektur

## Hauptnavigation

* Home
* Wishlist
* Library
* Family
* Sales
* Collections
* Search
* Settings

## Globale Rahmenstruktur

* persistente Sidebar links
* ruhige Top Bar oben
* Main Content
* optional Right Detail Panel

---

# 6. Wichtigste Produkthebel

VENT gewinnt oder verliert vor allem über diese Bereiche:

## 6.1 Wishlist als Entscheidungsmaschine

Nicht nur Liste, sondern:

* Zielpreise
* Relevanz
* soziale/familiäre Einordnung
* Smart Sets
* Bulk-Aktionen

## 6.2 Library als Nutzwert-Ansicht

Nicht nur Besitz, sondern:

* Zugriff
* Installationsstatus
* Relevanz
* Shared / Owned / Hidden
* „was lohnt sich jetzt“

## 6.3 Family als First-Class-Modul

Nicht versteckte Kontologik, sondern echter Produktbereich:

* gemeinsame Zugriffe
* Überschneidungen
* Coop-Chancen
* gemeinsame Wishlist-Relevanz

## 6.4 Preislogik als Signature

VENT braucht eine sehr starke Preis-Kommunikation:

* aktueller Preis
* Rabatt
* Zielpreis
* Preisstatus
* Relevanzgrund

---

# 7. Design Tokens — Kurzfassung

## Farben

### Neutrals

* Canvas: `#F5F4F1`
* Surface Primary: `#FFFFFF`
* Surface Secondary: `#F1F0EC`
* Surface Tertiary: `#E9E7E1`
* Text Primary: `#1F2328`
* Text Secondary: `#58606B`
* Text Tertiary: `#7A838F`
* Stroke Subtle: `#E3E0D8`
* Stroke Default: `#D3CFC6`

### Accent

* Primary Accent: `#C65A46`
* Primary Hover: `#B24E3B`
* Secondary Accent: `#4E748B`

### Semantic

* Success: `#4F7A5A`
* Warning: `#C58B2A`
* Danger: `#B94A48`

## Typography

* Display LG: `32/40/700`
* Display MD: `28/36/700`
* Section Title: `22/30/700`
* Card Title MD: `16/22/600`
* Body MD: `14/20/400`
* Meta MD: `13/18/500`
* Numeric LG: `24/28/700`
* Numeric MD: `20/24/700`
* Numeric SM: `16/20/700`

## Spacing

* 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48

## Radius

* SM: `10`
* MD: `12`
* LG: `18`
* XL: `24`
* 2XL: `28`
* Pill: `999`

---

# 8. Kernkomponenten

## Primitives

* Button
* Icon Button
* Chip
* Badge
* Input
* Search Field
* Segmented Control
* Dropdown
* Divider

## Daten-/Strukturkomponenten

* Metric Tile
* Summary Card
* Entity Row
* Opportunity Card
* Activity Row
* Access Row
* Collection Preview Card
* Member Chip / Member Card
* Avatar Stack
* Status Badge Group
* Price Stack
* Bulk Action Bar
* Right Detail Panel
* Empty State
* Skeleton Set

---

# 9. Kritischste Komponenten

Diese Komponenten sind besonders wichtig und sollten zuerst sauber gebaut werden:

## 9.1 Entity Row

Kern für Wishlist und Library.
Wenn die Row nicht sitzt, wird das Produkt mühsam.

## 9.2 Price Stack

Signature-Komponente.
Sie muss sofort verständlich machen:

* aktueller Preis
* Rabatt
* Zielpreis
* Status gegenüber Zielpreis

## 9.3 Opportunity Card

Macht aus Daten Handlung.
Wichtig für:

* Home
* Sales
* Family Overlap
* Wishlist Opportunities

## 9.4 Right Detail Panel

Zentrale Desktop-Tiefe ohne Kontextverlust.

## 9.5 Bulk Action Bar

Pflicht für effiziente Wishlist-/Library-Verwaltung.

---

# 10. Kernscreens im ersten Umsetzungsblock

## Reihenfolge

1. Wishlist
2. Library
3. Game Detail
4. Home
5. Family

## Warum diese Reihenfolge

Wishlist enthält die meiste Kernlogik.
Library und Game Detail stabilisieren Preis-, Besitz- und Statussystem.
Home und Family lassen sich danach sauber aus bestehenden Komponenten zusammensetzen.

---

# 11. Screen-Ziele in Kurzform

## Home

Operativer Überblick.
Kein Feed. Keine Banner-Bühne.
Enthält:

* Summary
* Action Queue
* Opportunities
* Family Snapshot
* Recent
* Collections Snapshot

## Wishlist

Entscheidungs- und Preislogikscreen.
Default list-first.
Stark in:

* Vergleich
* Zielpreise
* Smart Sets
* Bulk Handling
* Detail Panel

## Library

Besitz mit Nutzwert.
Stark in:

* Zugriff
* Installationsstatus
* Shared/Owned
* Filterbarkeit
* Relevanzsortierung

## Family

Eigenständiger Bereich für:

* Overlaps
* Shared Access
* Member-Kontext
* gemeinsame Chancen

## Game Detail

Entscheidungszentrale pro Titel:

* Preis
* Zielpreis
* Besitz
* Zugriff
* Family/Friends-Kontext
* Collections

---

# 12. Zustände, die auf keinen Fall vergessen werden dürfen

Für jede datenrelevante Hauptkomponente und jeden Hauptscreen definieren:

* default
* hover
* focus
* selected
* disabled
* loading
* empty
* filtered empty
* partial data
* error

Besonders wichtig:

* List loaded, panel loading
* summary loaded, section empty
* partial sync in library
* no family overlap ist **kein Fehlerzustand**

---

# 13. Figma-Set-up

## Seitenstruktur

* `00 Foundations`
* `01 Atoms`
* `02 Molecules`
* `03 Organisms`
* `04 Templates`
* `05 Screens`

## Foundations

* color styles
* text styles
* spacing tokens
* radius tokens
* shadow tokens

## Atoms

* buttons
* chips
* inputs
* badges
* icon buttons

## Molecules

* price stack
* metric tile
* member chip
* status badge group
* collection preview

## Organisms

* entity row
* summary card
* opportunity card
* bulk action bar
* detail panel
* empty states

## Templates

* app shell
* page header layouts
* list layouts
* card grids
* panel layouts

## Screens

* first full fidelity screen: Wishlist

---

# 14. Figma-Arbeitsregeln

## Komponenten zuerst, Screens danach

Nicht direkt wild Screens malen.

## Varianten sauber anlegen

Mindestens für:

* Button
* Chip
* Input
* Price Stack
* Entity Row
* Panel

## Auto Layout konsequent nutzen

Besonders für:

* Rows
* Header
* Cards
* Panels
* Filterleisten

## Tokens vor Hardcodes

Farben, Radius, Spacing und Textstile nicht lokal zusammenbasteln.

## Keine Sonderlösungen zu früh

Erst Standardsystem stabil bauen. Spezialfälle später.

---

# 15. Technische Übersetzung in Frontend-Logik

Die spätere Implementierung sollte diese Struktur leicht widerspiegeln:

## Tokens

* colors
* typography
* spacing
* radius
* shadow
* motion

## Base components

* buttons
* chips
* inputs
* badges

## Composite components

* price stack
* rows
* cards
* panel
* bulk bar

## Screen compositions

* Wishlist
* Library
* Game Detail
* Home
* Family

Wichtig:
Die UI sollte als **System von Kompositionen** gedacht werden, nicht als Einzelscreen-Sammlung.

---

# 16. Was vorerst bewusst nicht finalisiert ist

Diese Punkte dürfen später konkretisiert werden, ohne das Foundation-System zu zerstören:

* exakte Icon-Bibliothek
* finaler Font
* Dark Mode Ableitung
* Animationstiefe
* Preis-Historienvisualisierung
* Import-/Setup-Flows
* Search-Overlay-Logik im Detail
* Sales-Screen im Full Scope
* Settings-Screen im Full Scope

Das Fundament dafür ist aber bereits gelegt.

---

# 17. Definition of Done für diesen Abschnitt

Dieser Design-Foundation-Block ist abgeschlossen, wenn:

* Tokens in Figma angelegt sind
* Kernkomponenten als Varianten existieren
* Wishlist als erster Hi-Fi-Screen sauber aus Komponenten gebaut wurde
* beim Bau nur noch Detailfragen auftauchen, keine Grundsatzfragen mehr

---

# 18. Nächster praktischer Schritt

Der direkt sinnvolle nächste Schritt nach diesem Handover ist:

## **Figma UI Kit bauen**

in dieser Reihenfolge:

1. Foundations
2. Atoms
3. Molecules
4. Organisms
5. Wishlist Screen

Erst danach:

* Library
* Game Detail
* Home
* Family

---

