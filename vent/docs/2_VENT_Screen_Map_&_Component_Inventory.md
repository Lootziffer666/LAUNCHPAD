# VENT — Screen Map & Component Inventory

## Ziel

Diese Unterlage definiert die Navigationsstruktur, die Screen-Hierarchie und das wiederverwendbare UI-Bausteinsystem für **VENT**. Fokus: Wishlist + Families zuerst, mit einer Architektur, die später Sales, Inventory, Aktivierung, Events und weitere Steam-nahe Flows aufnehmen kann.

---

# 1. Produktlogik

## Primäre Module

1. **Wishlist**
2. **Families**

## Sekundäre spätere Module

3. Sales / Deals
4. Library / Inventory
5. Store Utilities
6. Account / Notifications / Settings

## Navigationsprinzip

VENT soll sich nicht wie eine "zweite Steam-App" anfühlen, sondern wie eine ruhigere, zielgerichtetere Steuerzentrale.

Daraus folgt:

* wenige Hauptbereiche
* schnelle Querfilterung
* listenzentrierte Screens statt tiefer Menühierarchien
* Bottom Navigation für Kernmodule
* Sheets für schnelle Aktionen
* Detailseiten nur dort, wo Kontext wirklich gebraucht wird

---

# 2. Globale Informationsarchitektur

## Hauptnavigation

**Bottom Bar**

1. Home
2. Wishlist
3. Families
4. Activity
5. Profile

## Globale sekundäre Einstiege

* Search
* Notifications Inbox
* Quick Actions
* Global Filter Sheet
* Command / Utility Sheet

## Navigationsmuster

* **Bottom Bar** = primäre Bereiche
* **Top App Bar** = Titel, Search, Overflow, optional Segment Control
* **Tabs / Segmented Controls** = Unteransichten innerhalb eines Moduls
* **Bottom Sheets** = Sortierung, Filter, Bulk Actions, Quick Compare, Invite Actions
* **Detail Screen** = tiefer Fokus auf ein Spiel, Familienmitglied oder Liste

---

# 3. Screen Map

## 3.1 Home

### Zweck

Startpunkt mit verdichtetem Überblick über relevante Änderungen, Wünsche, Familienaktivität und schnelle Wiedereinstiege.

### Screen: Home Dashboard

**Sektionen**

* Header mit Greeting / Account Context
* Global Search Entry
* Continue / Resume Row
* Wishlist Highlights
* Family Highlights
* Recent Activity
* Alerts / Action Needed
* Quick Actions Row

**Benötigte Komponenten**

* Top App Bar
* Search Trigger
* Horizontal Card Carousel
* Section Header
* Compact Game Cards
* Activity Feed Items
* Alert Banner / Inline Notice
* Quick Action Chips

---

## 3.2 Wishlist

### Zweck

Besseres Verwalten, Filtern, Gruppieren und Bewerten von Wunschlisten über das hinaus, was Steam nativ angenehm ermöglicht.

### Screen: Wishlist Overview

**Sektionen**

* Title Bar
* Search within Wishlist
* Active Filter / Sort Chip Row
* Saved Views / Wishlist Sets
* Wishlist List
* Bulk Selection State

**Benötigte Komponenten**

* Top App Bar
* Inline Search Field
* Filter Chips
* Sort Button
* Saved View Pills
* Game List Rows / Cards
* Selection Checkbox / Multi-select State Bar
* Floating Action Button oder Quick Add Trigger

### Screen: Wishlist Set / Smart View Detail

Beispiel: "Unter 10 €", "Freunde besitzen es", "Nur Coop", "Nur Singleplayer", "Warten auf starken Rabatt"

**Sektionen**

* View Header
* Definition / Rules Summary
* Results List
* Compare / Bulk Actions Area

**Benötigte Komponenten**

* Smart View Header Card
* Rule Chips
* Result List
* Bulk Action Bar
* Empty State

### Screen: Game Detail (Wishlist Context)

**Sektionen**

* Hero / Cover + Meta
* Price / Discount / Historic Relevance Block
* Personal Notes / Priority
* Friends / Family Ownership Signals
* Tags / Modes / Compatibility
* Actions

**Benötigte Komponenten**

* Hero Media Block
* Metadata Rows
* Price Card
* Friend Ownership Stack
* Tags / Category Chips
* Notes Card
* Action Button Group

### Screen: Wishlist Compare

**Sektionen**

* Compared Games Header
* Criteria Matrix
* Price / Discount / Mode / Review / Friend Match Rows
* Decision Aid Footer

**Benötigte Komponenten**

* Compare Table / Cards
* Sticky Compare Toolbar
* Highlight Badges
* Remove Item Controls

---

## 3.3 Families

### Zweck

Familienfreigabe, Personen, Bibliotheken, Spielbarkeit und Status klarer, ruhiger und handlungsorientierter machen.

### Screen: Families Overview

**Sektionen**

* Family Status Header
* Members Summary
* Shared Library Status
* Current Locks / Availability / Warnings
* Recent Family Activity
* Invite / Manage Actions

**Benötigte Komponenten**

* Status Hero Card
* Member Avatars Row
* Summary Cards
* Availability Indicators
* Warning Banners
* Activity Feed
* Action Buttons

### Screen: Family Member Detail

**Sektionen**

* Member Header
* Relationship / Role Info
* Owned / Shared / Recently Played Summary
* Wishlist Intersections
* Permissions / Restrictions
* Actions

**Benötigte Komponenten**

* Profile Header Card
* Stats Row
* Intersection Cards
* Permission Toggle Rows
* Action List

### Screen: Shared Library Detail

**Sektionen**

* Library Header
* Availability State
* Search / Filter / Sort
* Game List
* Conflict / Restriction Notices

**Benötigte Komponenten**

* Header Summary Card
* Inline Filter Row
* List Rows with availability badges
* Conflict Banner
* Empty / Error States

### Screen: Family Activity Timeline

**Sektionen**

* Activity Filter Chips
* Timeline Feed
* Event Groups by day

**Benötigte Komponenten**

* Filter Chips
* Timeline Items
* Day Dividers
* Compact Avatar + Action cells

### Screen: Invite / Join Flow

**Sektionen**

* Explanation Block
* Invitation State
* Input / Action
* Help / Troubleshooting

**Benötigte Komponenten**

* Info Card
* Invite Code / Email Input
* Primary CTA
* Secondary Help Links / Expanders

---

## 3.4 Activity

### Zweck

Alle relevanten Veränderungen bündeln: Preisbewegungen, Familienaktionen, Listenänderungen, Systemhinweise.

### Screen: Activity Feed

**Sektionen**

* Feed Header
* Feed Type Filters
* Chronological Activity List
* Expandable Event Details

**Benötigte Komponenten**

* Segmented Control / Filter Chips
* Feed Items
* Group Headers
* Event Detail Sheet

### Screen: Notifications Inbox

**Sektionen**

* Unread / All Toggle
* Notification List
* Batch Actions

**Benötigte Komponenten**

* Tab / Segment Switch
* Notification Rows
* Batch Action Toolbar

---

## 3.5 Profile

### Zweck

Account, Appearance, Connected Services, App-Verhalten, experimentelle Tools.

### Screen: Profile / Settings Hub

**Sektionen**

* User Header
* Appearance
* Notifications
* Connected Accounts
* Experimental Features
* About / Legal

**Benötigte Komponenten**

* Profile Summary Card
* Settings List Rows
* Toggle Rows
* Disclosure Rows
* Inline Status Labels

### Screen: Appearance Settings

**Sektionen**

* Theme Mode
* Accent / Visual Density
* Card Style / Layout Preference

### Screen: Notification Settings

**Sektionen**

* Price Alerts
* Family Alerts
* Wishlist Changes
* Digest Frequency

### Screen: Connected Accounts

**Sektionen**

* Steam Connection Status
* Permissions
* Reconnect / Troubleshooting

---

# 4. Overlay / Utility Surfaces

Diese Flächen sind keine vollständigen Screens, aber zentrale Interaktionsorte.

## Global Search Sheet

**Inhalte**

* Recent Searches
* Suggested Shortcuts
* Search Results grouped by type

## Global Filter Sheet

**Inhalte**

* Sort
* Tags
* Price ranges
* Ownership / Family relevance
* Modes (Coop / Singleplayer / etc.)

## Bulk Action Sheet

**Inhalte**

* Add to Set
* Remove
* Mark Priority
* Compare
* Share

## Quick Actions Sheet

**Inhalte**

* Neue Smart View
* Compare starten
* Family invite
* Notification prefs

## Game Quick Peek Sheet

**Inhalte**

* Box art
* Price snapshot
* ownership signals
* fast actions

---

# 5. Component Inventory

# 5.1 Globale Komponenten

## App Shell

* Bottom Navigation Bar
* Top App Bar
* Scroll Container
* Pull-to-Refresh Wrapper
* Floating Action Trigger
* Snackbar / Toast Surface
* Modal Bottom Sheet
* Full Screen Dialog

## Navigation / Orientation

* Section Header
* Breadcrumb / Path Label (optional sparsam)
* Tab Bar
* Segmented Control
* Horizontal Shortcut Rail

## Search / Filter / Sort

* Global Search Trigger
* Inline Search Field
* Filter Chip
* Removable Active Filter Chip
* Sort Selector
* Saved View Pill
* Range Selector
* Toggle Filter Row

## States / Feedback

* Empty State Block
* Error State Block
* Loading Skeleton
* Inline Notice
* Warning Banner
* Success Confirmation Strip
* Offline / Sync Status Indicator

## Data Presentation

* Compact List Row
* Standard Card
* Hero Card
* Stat Pill
* Badge
* Tag Chip
* Avatar Group
* Timeline Item
* Expandable Meta Row

## Actions

* Primary Button
* Secondary Button
* Tertiary Text Button
* Icon Button
* Overflow Menu
* Swipe Actions
* Multi-select Action Bar

---

# 5.2 Wishlist-spezifische Komponenten

* Game Wishlist Row
* Discount Badge Cluster
* Priority Marker
* Personal Note Snippet
* Friend Ownership Indicator
* Wishlist Set Card
* Smart Rule Builder Row
* Compare Slot Card
* Price History Teaser
* Deal Alert Card
* Bulk Selection Checkbox Cell

---

# 5.3 Families-spezifische Komponenten

* Family Status Hero
* Member Avatar Card
* Shared Access Badge
* Restriction / Lock Notice
* Availability State Row
* Invite Status Card
* Permission Toggle Item
* Shared Library Game Row
* Family Intersection Card
* Conflict Explanation Block

---

# 5.4 Activity-spezifische Komponenten

* Activity Event Row
* Event Type Badge
* Day Separator
* Inline Change Summary
* Notification Row
* Read / Unread Marker

---

# 5.5 Profile / Settings-spezifische Komponenten

* Account Summary Card
* Settings Group Header
* Toggle Setting Row
* Disclosure Setting Row
* Connection Status Row
* Danger Zone Action Row

---

# 6. Global vs. Modul-spezifisch

## Global

Diese Komponenten sollten im Design System zentral definiert werden:

* App Shell
* Bars
* Search
* Chips
* Buttons
* Sheets
* Standard Cards
* Empty/Error/Loading States
* Banner / Notices
* Base List Rows
* Avatar / Badge primitives
* Form controls

## Wishlist-spezifisch

* Preis- und Rabattdarstellung
* Wunschlistenregeln / Smart Views
* Vergleichsansicht
* Priorisierung / Wunschlogik
* Besitzsignale von Freunden / Familie in Kaufkontext

## Families-spezifisch

* Rollen / Mitglieder
* Freigabe-Status
* Restriktions- und Konfliktlogik
* geteilte Bibliotheksverfügbarkeit
* Einladungsfluss

## Activity-spezifisch

* Ereignistypen
* Zeitachse
* verdichtete Systemmeldungen

## Profile-spezifisch

* Konto / Verbindung / Präferenzverwaltung

---

# 7. Empfohlene Priorisierung für den Bau

## Phase 1 — Fundament

* App Shell
* Top / Bottom Bars
* Section Headers
* Base Cards
* Base List Rows
* Buttons
* Chips
* Sheets
* Loading / Empty / Error States

## Phase 2 — Wishlist Core

* Wishlist Overview
* Game Wishlist Row
* Filter / Sort / Saved Views
* Game Detail (Basis)
* Wishlist Set Screen

## Phase 3 — Families Core

* Families Overview
* Member Cards
* Shared Library Rows
* Status / Restriction UI
* Invite Flow

## Phase 4 — Activity + Polishing

* Activity Feed
* Notifications Inbox
* Compare Screen
* Quick Peek / Quick Actions

## Phase 5 — Advanced Intelligence

* Smart Views Rule Builder
* Bulk Actions
* Cross-module surfaces
* richer decision support

---

# 8. Empfohlene Nächstdokumente

Aus dieser Unterlage lassen sich direkt drei Folgeartefakte ableiten:

1. **Wireframe Outline pro Screen**
   Für jeden Screen: Layout-Hierarchie von oben nach unten.

2. **Component Spec Sheet**
   Jede Komponente mit Zweck, States, Inhalte, Aktionen, Varianten.

3. **Navigation Flow / User Journeys**
   Zum Beispiel: Spiel entdecken ? merken ? filtern ? vergleichen ? kaufen.

---

# 9. Entscheidende Leitlinie

VENT gewinnt nicht dadurch, dass es mehr zeigt als Steam, sondern dadurch, dass es **konsequenter vorsortiert, verdichtet und handlungsfähig macht**.

Darum gilt:

* Übersicht vor Deko
* klare Zustände statt versteckter Logik
* Filter und Smart Views als Machtzentrum
* modulübergreifende Wiederverwendung, wo immer möglich
* Detail nur dann, wenn eine Entscheidung wirklich davon profitiert

