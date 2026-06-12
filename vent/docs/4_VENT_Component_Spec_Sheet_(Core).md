# VENT — Component Spec Sheet (Core)

## Zweck

Dieses Dokument definiert die wichtigsten UI-Komponenten für VENT auf Systemebene. Ziel ist nicht nur visuelle Konsistenz, sondern **vorhersagbares Verhalten, Wiederverwendbarkeit und klare Einsatzgrenzen**.

Jede Komponente beschreibt:

* Zweck
* Inhalte
* Varianten
* States
* Interaktionen
* Regeln
* Einsatzorte

---

# 1. Top App Bar

## Zweck

Primäre Orientierungs- und Aktionsleiste eines Screens. Sie soll Titel, Navigation und 1–3 hochrelevante Aktionen sichtbar machen, ohne den Screen zu überladen.

## Inhalte

* Screen-Titel
* optional Back-Button
* optional Search-Trigger
* optional Notifications / Overflow / Sort
* optional kollabierende Titelform bei Detailscreens

## Varianten

1. **Root Bar**

   * für Home, Wishlist, Families, Activity, Profile
2. **Child Bar**

   * mit Back-Button
3. **Detail Bar**

   * kollabierbar, Titel wird beim Scrollen kompakter
4. **Selection Bar**

   * ersetzt Standardtitel im Multi-select-Modus

## States

* default
* scrolled / elevated
* search-expanded (wenn inline integrierbar)
* selection-active
* disabled actions (bei fehlenden Daten)

## Interaktionen

* Tap auf Back
* Tap auf Actions
* Scroll-abhängige Elevation / Verdichtung

## Regeln

* maximal 3 sichtbare Actions rechts
* alles Weitere ins Overflow
* Titel darf nicht mit sekundären Statusinfos überladen werden
* Suchfelder nur dann direkt integrieren, wenn Suche Kernfunktion des Screens ist

## Einsatzorte

* alle Haupt- und Detailscreens

---

# 2. Bottom Navigation Bar

## Zweck

Persistente Primärnavigation zwischen den Kernmodulen.

## Inhalte

* 4–5 Hauptziele
* optional Badge für Activity / Notifications
* aktiver Zustand klar erkennbar

## Varianten

1. standard
2. badge-enabled
3. hidden-on-deep-flow (selten, nur wenn Fullscreen-Fokus nötig)

## States

* active tab
* inactive tabs
* badge present
* temporarily hidden

## Interaktionen

* Tab-Wechsel
* optional Re-tap = Scroll-to-top / Reset filter context später

## Regeln

* nicht für sekundäre Navigation missbrauchen
* max. 5 Ziele
* Label immer sichtbar

## Einsatzorte

* alle Root Screens

---

# 3. Inline Search Field

## Zweck

Suche innerhalb eines Moduls oder einer Liste. Muss sofort verständlich sein und darf das Layout nicht unnötig dominieren.

## Inhalte

* Placeholder
* Search icon
* Clear action
* optional result count hint

## Varianten

1. collapsed trigger
2. expanded inline field
3. sticky search row

## States

* idle
* focused
* typing
* populated
* no results
* disabled / unavailable

## Interaktionen

* Fokus
* Texteingabe
* Clear
* optional Submit / instant filtering

## Regeln

* Suche innerhalb des aktuellen Kontexts, nicht global, außer explizit als globale Suche markiert
* bei kurzen Listen nicht unnötig prominent

## Einsatzorte

* Wishlist Overview
* Shared Library Detail
* Activity / Notifications
* optional Families Overview

---

# 4. Filter Chip

## Zweck

Schnelle, sichtbare Einschränkung oder Markierung eines Datensatzes / Listenfilters.

## Inhalte

* Label
* optional leading icon
* optional close/remove icon
* optional count

## Varianten

1. inactive filter chip
2. active filter chip
3. removable active chip
4. tonal info chip

## States

* inactive
* active
* disabled
* removable

## Interaktionen

* Tap aktiviert / deaktiviert
* Tap auf X entfernt aktiven Filter
* Long press optional für Details später

## Regeln

* aktivierte Chips müssen sofort visuell erkennbar sein
* bei komplexen Filtern nicht zu viel Logik in einen einzelnen Chip pressen

## Einsatzorte

* Wishlist Overview
* Shared Library Detail
* Activity Feed
* Smart View Rule Summary

---

# 5. Saved View Pill

## Zweck

Repräsentiert gespeicherte Ansichten oder Smart Views und bietet einen ultraschnellen Kontextwechsel.

## Inhalte

* View-Name
* optional icon / smart marker
* optional result count

## Varianten

1. default
2. active
3. editable / manageable
4. add-new pill

## States

* inactive
* active
* overflowed / truncated text
* empty system (nur Add-New sichtbar)

## Interaktionen

* Tap öffnet View
* Long press oder Overflow = bearbeiten / umbenennen / löschen

## Regeln

* kurz benennen
* horizontal scrollbar statt mehrzeiligem Chaos
* Add-New immer klar von echten Views unterscheiden

## Einsatzorte

* Wishlist Overview
* optional Home Quick Access

---

# 6. Standard Card

## Zweck

Universelle Container-Komponente für segmentierte Informationen. Soll Inhalte bündeln, ohne wie ein schwerer Kasten zu wirken.

## Inhalte

* optional Titel
* Hauptinhalt
* optional Secondary Text
* optional Actions / Footer

## Varianten

1. plain info card
2. actionable card
3. status card
4. compact card

## States

* default
* highlighted
* disabled
* loading skeleton equivalent

## Interaktionen

* optional whole-card tap
* optional footer action

## Regeln

* nicht zu viele Hierarchieebenen in einer Card verschachteln
* Karten nutzen, um Kontext zu segmentieren, nicht um alles in Boxen zu zwingen

## Einsatzorte

* fast überall

---

# 7. Hero Card

## Zweck

Prominente Status- oder Zusammenfassungsfläche am Beginn eines Screens.

## Inhalte

* Titel / Hauptstatus
* kurze Erklärung
* 1–3 Kennzahlen oder Zustände
* primäre Aktion optional

## Varianten

1. summary hero
2. warning hero
3. family status hero
4. home highlight hero

## States

* positive / healthy
* neutral
* warning
* critical
* loading

## Interaktionen

* CTA-Tap
* optional Expand

## Regeln

* nur einmal prominent pro Screen
* kein Werbebanner-Eindruck
* auf Home/Families besonders nützlich

## Einsatzorte

* Home
* Families Overview
* Shared Library Summary
* Set Header in verstärkter Form

---

# 8. Game Row

## Zweck

Standardisierte Zeile für ein Spiel in Listen. Muss sehr scanbar sein und trotzdem genug Entscheidungssubstanz tragen.

## Inhalte

* Cover / Thumbnail
* Titel
* sekundäre Metadaten
* Preis / Rabatt
* Tags / Modes kurz
* Ownership / Family signal
* optional Priority marker
* optional Selection control

## Varianten

1. wishlist row
2. shared library row
3. compact home row
4. selectable compare row

## States

* default
* discounted
* owned by family
* restricted / unavailable
* selected
* loading

## Interaktionen

* Tap öffnet Game Detail
* optional swipe actions
* Tap auf checkbox / compare marker
* long press = selection mode starten

## Regeln

* Preis und Status müssen mit einem schnellen Blick erfassbar sein
* sekundäre Infos nie so umfangreich, dass die Zeile kippt
* bei verdichteten Listen lieber priorisieren als alles zeigen

## Einsatzorte

* Wishlist Overview
* Wishlist Set Detail
* Shared Library Detail
* Home previews

---

# 9. Member Card

## Zweck

Repräsentiert eine Person im Familienkontext kompakt und handlungsfähig.

## Inhalte

* Avatar
* Name
* Rolle / Status
* 1–2 Kennzahlen oder Statushinweise
* optional quick action

## Varianten

1. compact avatar card
2. detailed member card
3. pending invite card
4. restricted member card

## States

* active
* pending
* restricted
* issue state
* loading

## Interaktionen

* Tap öffnet Member Detail
* optional inline action (manage / remind / info)

## Regeln

* Status muss sofort sichtbar sein
* Avatare allein reichen nicht; Namen / Status nicht verstecken

## Einsatzorte

* Families Overview
* Member lists
* Invite / Join contexts

---

# 10. Activity Row

## Zweck

Verdichtete Darstellung eines relevanten Ereignisses im System.

## Inhalte

* Event type icon / badge
* Haupttext
* optionale sekundäre Erklärung
* Zeitangabe
* optional related entity (game/member/view)

## Varianten

1. price change event
2. family event
3. wishlist change event
4. system notice event

## States

* unread / highlighted
* read
* warning
* grouped in timeline

## Interaktionen

* Tap öffnet Detail oder Kontext
* optional expand inline

## Regeln

* Ereignistext klar und konkret
* keine rätselhaften Formulierungen
* Zeitangabe immer vorhanden

## Einsatzorte

* Home activity preview
* Activity Feed
* Family activity sections

---

# 11. Warning Banner

## Zweck

Kurz und direkt auf einen problematischen oder handlungsrelevanten Zustand hinweisen.

## Inhalte

* Warnsymbol optional
* prägnante Meldung
* optional kurze Erklärung
* CTA oder dismiss action

## Varianten

1. inline warning
2. persistent critical banner
3. soft info banner

## States

* info
* warning
* critical
* dismissed

## Interaktionen

* CTA tap
* dismiss tap wenn nicht kritisch

## Regeln

* nur nutzen, wenn Handlung oder Verständnisgewinn entsteht
* nicht dieselbe Information parallel in Hero und Banner doppeln
* kritische Banner dürfen sticky sein, normale nicht

## Einsatzorte

* Home
* Families Overview
* Shared Library Detail
* connection / sync problems global

---

# 12. Modal Bottom Sheet

## Zweck

Sekundäre Entscheidungen, Filter, Bulk Actions und Erklärungen ohne harten Screen-Wechsel.

## Inhalte

Je nach Kontext:

* Filteroptionen
* Sortieroptionen
* Bulk Actions
* Quick Peek
* Erklärung / Troubleshooting

## Varianten

1. action sheet
2. filter sheet
3. explanation sheet
4. quick peek sheet

## States

* collapsed trigger only
* open partial height
* expanded full height
* disabled options inside

## Interaktionen

* swipe up/down
* tap option
* tap outside / dismiss

## Regeln

* keine endlosen Formulare in Sheets
* für schnelle Entscheidungen und sekundäre Tiefe ideal
* Primärflow nicht verstecken, sondern ergänzen

## Einsatzorte

* global utility
* Wishlist filters
* bulk actions
* Shared Library explanations
* quick actions across modules

---

# 13. Multi-select Action Bar

## Zweck

Kontextuelle Aktionsleiste für Listen mit Mehrfachauswahl.

## Inhalte

* Anzahl ausgewählter Elemente
* Compare
* Add to Set
* Mark Priority
* Remove / Deselect

## Varianten

1. bottom contextual bar
2. top replacement selection bar
3. combined top+bottom on tablets später optional

## States

* hidden
* active with 1 item
* active with multiple items
* action partially disabled

## Interaktionen

* appears on select
* disappears on clear
* direct batch actions

## Regeln

* nur anzeigen, wenn Auswahl aktiv
* destruktive Aktionen klar markieren
* mindestens eine schnelle Exit-Möglichkeit

## Einsatzorte

* Wishlist Overview
* Wishlist Set Detail
* Compare preparation flows

---

# 14. Empty State Block

## Zweck

Leere Zustände nützlich machen, statt nur Leere zu zeigen.

## Inhalte

* klare Aussage, warum nichts da ist
* optional Illustration / icon sparsam
* primäre CTA
* optionale Sekundärerklärung

## Varianten

1. no data yet
2. no search results
3. no filtered matches
4. no family configured

## States

* neutral
* encouraging / onboarding-like
* issue-related

## Interaktionen

* CTA tap
* optional secondary help

## Regeln

* Ursache klar benennen: leer, gefiltert, Fehler oder keine Verbindung sind nicht dasselbe
* nicht zu verspielt

## Einsatzorte

* alle datengetriebenen Screens

---

# 15. Loading Skeleton

## Zweck

Wartezeit strukturell vorbereiten, ohne hektische Spinnerscreens.

## Inhalte

* Platzhalterformen passend zum Zielscreen
* List skeletons
* card skeletons
* header skeletons

## Varianten

1. list skeleton
2. card skeleton
3. detail skeleton
4. dashboard skeleton

## States

* initial load
* incremental load
* refresh subtle

## Interaktionen

* keine direkte Interaktion

## Regeln

* soll die spätere Layoutstruktur widerspiegeln
* keine übertriebenen Effekte
* bei sehr kurzem Laden sparsam nutzen

## Einsatzorte

* Home
* Wishlist
* Families
* Shared Library
* Detailscreens

---

# 16. Einsatz-Matrix (Kurzform)

| Komponente              | Global | Wishlist | Families | Activity | Profile  |
| ----------------------- | ------ | -------- | -------- | -------- | -------- |
| Top App Bar             | Ja     | Ja       | Ja       | Ja       | Ja       |
| Bottom Navigation       | Ja     | Ja       | Ja       | Ja       | Ja       |
| Inline Search Field     | Ja     | Ja       | Ja       | Ja       | optional |
| Filter Chip             | Ja     | Ja       | Ja       | Ja       | selten   |
| Saved View Pill         | Nein   | Ja       | Nein     | Nein     | Nein     |
| Standard Card           | Ja     | Ja       | Ja       | Ja       | Ja       |
| Hero Card               | Ja     | Ja       | Ja       | selten   | selten   |
| Game Row                | Nein   | Ja       | Ja       | optional | Nein     |
| Member Card             | Nein   | Nein     | Ja       | optional | Nein     |
| Activity Row            | Nein   | optional | Ja       | Ja       | Nein     |
| Warning Banner          | Ja     | Ja       | Ja       | Ja       | Ja       |
| Modal Bottom Sheet      | Ja     | Ja       | Ja       | Ja       | Ja       |
| Multi-select Action Bar | Nein   | Ja       | selten   | selten   | Nein     |
| Empty State Block       | Ja     | Ja       | Ja       | Ja       | Ja       |
| Loading Skeleton        | Ja     | Ja       | Ja       | Ja       | Ja       |

---

# 17. Priorisierte Implementierungsreihenfolge

## Stufe A — absoluter Kern

1. Top App Bar
2. Bottom Navigation
3. Standard Card
4. Game Row
5. Filter Chip
6. Modal Bottom Sheet
7. Empty State Block
8. Loading Skeleton

## Stufe B — modulprägend

9. Hero Card
10. Saved View Pill
11. Member Card
12. Warning Banner
13. Activity Row

## Stufe C — erweiterte Interaktion

14. Inline Search Field
15. Multi-select Action Bar

---

# 18. Architekturregel für das System

Eine VENT-Komponente ist dann gut, wenn sie drei Dinge gleichzeitig schafft:

1. **schnell scanbar**
2. **klar zustandsfähig**
3. **modulübergreifend wiederverwendbar, ohne generisch-seelenlos zu werden**

Wenn ein Baustein zwar schön ist, aber keine klaren Zustände oder Einsatzgrenzen hat, ist er noch keine Systemkomponente.

