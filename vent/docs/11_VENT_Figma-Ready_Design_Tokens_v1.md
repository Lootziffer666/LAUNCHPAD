**Figma-Ready Design Tokens + Komponenten-Maßen als Tabellen-Spec**

---

# VENT — Figma-Ready Design Tokens v1.0

## 1) Color Tokens

## 1.1 Neutrals

| Token                     |      Wert | Einsatz                               |
| ------------------------- | --------: | ------------------------------------- |
| `color.canvas.default`    | `#F5F4F1` | App-Hintergrund                       |
| `color.surface.primary`   | `#FFFFFF` | Hauptkarten, Hauptflächen             |
| `color.surface.secondary` | `#F1F0EC` | sekundäre Flächen, Listenhintergründe |
| `color.surface.tertiary`  | `#E9E7E1` | Panels, Controls, abgesetzte Bereiche |
| `color.stroke.subtle`     | `#E3E0D8` | dezente Border, Divider               |
| `color.stroke.default`    | `#D3CFC6` | Standard-Border                       |
| `color.stroke.strong`     | `#B8B2A7` | aktive Umrandung, stärkere Trennung   |
| `color.text.primary`      | `#1F2328` | Haupttext                             |
| `color.text.secondary`    | `#58606B` | sekundärer Text                       |
| `color.text.tertiary`     | `#7A838F` | Meta, Hilfstext                       |
| `color.text.inverse`      | `#FFFFFF` | Text auf dunklem Accent               |

## 1.2 Accent & Semantic

| Token                         |      Wert | Einsatz                         |
| ----------------------------- | --------: | ------------------------------- |
| `color.accent.primary`        | `#C65A46` | primäre Aktionen, Key States    |
| `color.accent.primary.hover`  | `#B24E3B` | Hover auf Primary               |
| `color.accent.primary.soft`   | `#F3E1DC` | sanfte Accent-Hintergründe      |
| `color.accent.secondary`      | `#4E748B` | sekundäre Akzente, Info-Kontext |
| `color.accent.secondary.soft` | `#E3EDF2` | sekundäre Soft-Flächen          |
| `color.semantic.success`      | `#4F7A5A` | positiver Status                |
| `color.semantic.success.soft` | `#E4EEE6` | positive Hintergrundfläche      |
| `color.semantic.warning`      | `#C58B2A` | Warnung                         |
| `color.semantic.warning.soft` | `#F5ECD7` | Warn-Hintergrund                |
| `color.semantic.danger`       | `#B94A48` | Fehler, destruktiv              |
| `color.semantic.danger.soft`  | `#F4DEDD` | Fehler-Hintergrund              |
| `color.semantic.info`         | `#4E748B` | Info-Status                     |
| `color.semantic.info.soft`    | `#E3EDF2` | Info-Hintergrund                |

## 1.3 Produktlogik / Status

| Token                     |      Wert | Einsatz                   |
| ------------------------- | --------: | ------------------------- |
| `color.state.owned`       | `#4F7A5A` | Owned                     |
| `color.state.shared`      | `#4E748B` | Family Shared             |
| `color.state.hidden`      | `#7A838F` | Hidden / archived         |
| `color.state.target.hit`  | `#4F7A5A` | Zielpreis erreicht        |
| `color.state.target.near` | `#C58B2A` | nahe am Zielpreis         |
| `color.state.target.miss` | `#58606B` | über Zielpreis            |
| `color.state.discount`    | `#C65A46` | Discount-Label            |
| `color.state.installed`   | `#4F7A5A` | Installed                 |
| `color.state.unavailable` | `#B94A48` | nicht verfügbar / Problem |

---

# 2) Typography Tokens

## 2.1 Font Roles

| Token                | Größe | Line Height | Weight | Einsatz                  |
| -------------------- | ----: | ----------: | -----: | ------------------------ |
| `type.display.lg`    |    32 |          40 |    700 | große Seitentitel        |
| `type.display.md`    |    28 |          36 |    700 | Seitentitel kompakter    |
| `type.section.title` |    22 |          30 |    700 | Sektionstitel            |
| `type.card.title.lg` |    18 |          24 |    600 | große Card-Titel         |
| `type.card.title.md` |    16 |          22 |    600 | Standard-Card-Titel      |
| `type.body.lg`       |    15 |          22 |    400 | längere Standardtexte    |
| `type.body.md`       |    14 |          20 |    400 | Standard-UI-Text         |
| `type.body.strong`   |    14 |          20 |    600 | betonter UI-Text         |
| `type.meta.md`       |    13 |          18 |    500 | Meta-Text                |
| `type.meta.sm`       |    12 |          16 |    500 | sehr kompakte Labels     |
| `type.numeric.lg`    |    24 |          28 |    700 | Hero-Zahlen, Price Large |
| `type.numeric.md`    |    20 |          24 |    700 | Summary, Price Standard  |
| `type.numeric.sm`    |    16 |          20 |    700 | Price Compact, Badges    |

## 2.2 Typoregeln

| Regel                                                | Vorgabe |
| ---------------------------------------------------- | ------- |
| Maximal 3 prominente Schriftgrößen pro Screenbereich | Ja      |
| Meta nie heller als `color.text.tertiary`            | Ja      |
| Preise immer mit `numeric`-Style                     | Ja      |
| Titel max. 2 Zeilen in Rows/Cards                    | Ja      |
| All Caps nur für Micro Labels / Overlines            | sparsam |

---

# 3) Spacing Tokens

| Token      | Wert |
| ---------- | ---: |
| `space.0`  |    0 |
| `space.1`  |    4 |
| `space.2`  |    8 |
| `space.3`  |   12 |
| `space.4`  |   16 |
| `space.5`  |   20 |
| `space.6`  |   24 |
| `space.8`  |   32 |
| `space.10` |   40 |
| `space.12` |   48 |

## 3.1 Layout-Anwendung

| Einsatz                           | Token                 |
| --------------------------------- | --------------------- |
| Icon zu Label                     | `space.2`             |
| kleine Inline-Gaps                | `space.2` / `space.3` |
| Standard-Komponenten-Innenabstand | `space.4`             |
| Card Padding kompakt              | `space.4`             |
| Card Padding Standard             | `space.5`             |
| Panel Padding                     | `space.6`             |
| Hero / Summary Padding            | `space.8`             |
| Screen Gutter Desktop             | `space.6` / `space.8` |

---

# 4) Radius Tokens

| Token         | Wert | Einsatz                     |
| ------------- | ---: | --------------------------- |
| `radius.sm`   |   10 | kleine Controls             |
| `radius.md`   |   12 | Buttons, Inputs             |
| `radius.lg`   |   18 | Standard Cards              |
| `radius.xl`   |   24 | Panels, Sheets, große Cards |
| `radius.2xl`  |   28 | Hero Summary                |
| `radius.pill` |  999 | Filter Chips, Segment Pills |

---

# 5) Border & Shadow Tokens

## 5.1 Border

| Token                  | Wert                   |
| ---------------------- | ---------------------- |
| `border.width.default` | `1px`                  |
| `border.width.strong`  | `1.5px`                |
| `border.color.subtle`  | `color.stroke.subtle`  |
| `border.color.default` | `color.stroke.default` |
| `border.color.strong`  | `color.stroke.strong`  |

## 5.2 Shadows

| Token       | Wert                              | Einsatz                 |
| ----------- | --------------------------------- | ----------------------- |
| `shadow.sm` | `0 1px 2px rgba(31,35,40,0.04)`   | sehr leichte Trennung   |
| `shadow.md` | `0 6px 18px rgba(31,35,40,0.06)`  | Hover Cards, Panels     |
| `shadow.lg` | `0 12px 28px rgba(31,35,40,0.08)` | Modal / starkes Overlay |

---

# 6) Layout Tokens

## 6.1 App Frame

| Token                            | Wert |
| -------------------------------- | ---: |
| `layout.sidebar.width.expanded`  |  248 |
| `layout.sidebar.width.collapsed` |   80 |
| `layout.topbar.height`           |   72 |
| `layout.panel.width.right`       |  400 |
| `layout.content.maxWidth`        | 1440 |
| `layout.screen.padding.x`        |   32 |
| `layout.screen.padding.y`        |   24 |

## 6.2 Grid

| Token                  | Wert |
| ---------------------- | ---: |
| `grid.desktop.columns` |   12 |
| `grid.desktop.gutter`  |   24 |
| `grid.desktop.margin`  |   32 |
| `grid.tablet.columns`  |    8 |
| `grid.tablet.gutter`   |   20 |
| `grid.tablet.margin`   |   24 |
| `grid.mobile.columns`  |    4 |
| `grid.mobile.gutter`   |   16 |
| `grid.mobile.margin`   |   16 |

---

# 7) Interaction Tokens

| Token               | Wert             | Einsatz                  |
| ------------------- | ---------------- | ------------------------ |
| `motion.fast`       | `120ms ease-out` | kleine Hover-Reaktionen  |
| `motion.base`       | `180ms ease-out` | Standardtransitions      |
| `motion.panel`      | `220ms ease-out` | Panel / Sheet            |
| `focus.ring.color`  | `#4E748B`        | Keyboard Focus           |
| `focus.ring.width`  | `2px`            | Focus Ring               |
| `focus.ring.offset` | `2px`            | Abstand zum Element      |
| `opacity.disabled`  | `0.48`           | disabled controls        |
| `opacity.soft`      | `0.72`           | weiche sekundäre Inhalte |

---

# 8) Komponenten-Maße als Tabellen-Spec

---

# 8.1 Buttons

| Komponente      | Höhe | Padding X | Gap Icon/Text | Radius | Textstil           | Icon |
| --------------- | ---: | --------: | ------------: | -----: | ------------------ | ---: |
| Button / S      |   32 |        12 |             8 |     12 | `type.meta.md`     |   14 |
| Button / M      |   40 |        16 |             8 |     12 | `type.body.strong` |   16 |
| Button / L      |   48 |        20 |             8 |     14 | `type.body.strong` |   18 |
| Icon Button / S |   32 |         0 |             0 |     12 | —                  |   16 |
| Icon Button / M |   40 |         0 |             0 |     12 | —                  |   16 |
| Icon Button / L |   48 |         0 |             0 |     14 | —                  |   18 |

## Button-Varianten

| Variante  | Fill                              | Border                 | Text                   |
| --------- | --------------------------------- | ---------------------- | ---------------------- |
| Primary   | `color.accent.primary`            | none                   | `color.text.inverse`   |
| Secondary | `color.surface.primary`           | `border.color.default` | `color.text.primary`   |
| Ghost     | transparent                       | none                   | `color.text.secondary` |
| Danger    | `color.semantic.danger` oder soft | optional               | inverse oder primary   |

---

# 8.2 Chips

| Komponente        | Höhe | Padding X | Gap | Radius | Textstil       |
| ----------------- | ---: | --------: | --: | -----: | -------------- |
| Filter Chip / S   |   28 |        10 |   6 |   pill | `type.meta.md` |
| Filter Chip / M   |   32 |        12 |   6 |   pill | `type.meta.md` |
| State Chip / S    |   24 |         8 |   6 |     12 | `type.meta.sm` |
| State Chip / M    |   28 |        10 |   6 |     12 | `type.meta.md` |
| Semantic Chip / S |   24 |         8 |   6 |     12 | `type.meta.sm` |
| Action Chip / S   |   28 |        10 |   6 |     12 | `type.meta.md` |

## Chip-Farblogik

| Typ      | Default                              | Selected                               |
| -------- | ------------------------------------ | -------------------------------------- |
| Filter   | `surface.secondary + stroke.default` | `accent.primary.soft + accent.primary` |
| State    | statusabhängig soft                  | statusabhängig stärker                 |
| Semantic | `surface.tertiary`                   | optional accent/semantic               |
| Action   | `surface.primary + stroke.default`   | hover nur leicht betonen               |

---

# 8.3 Badges

| Komponente       | Höhe | Padding X | Radius | Textstil       |
| ---------------- | ---: | --------: | -----: | -------------- |
| Badge / Count    |   20 |         8 |    999 | `type.meta.sm` |
| Badge / Discount |   22 |         8 |    999 | `type.meta.sm` |
| Badge / New      |   20 |         8 |    999 | `type.meta.sm` |

---

# 8.4 Inputs

| Komponente                   | Höhe | Padding X | Radius | Textstil          |     Icon |
| ---------------------------- | ---: | --------: | -----: | ----------------- | -------: |
| Global Search                |   48 |        16 |     12 | `type.body.md`    |       16 |
| Local Search                 |   40 |        12 |     12 | `type.body.md`    |       16 |
| Numeric Input / Target Price |   40 |        12 |     12 | `type.numeric.sm` | optional |
| Select / Dropdown            |   40 |        12 |     12 | `type.body.md`    |       16 |

## Input-Zustände

| Zustand  | Fill                | Border                          |
| -------- | ------------------- | ------------------------------- |
| Default  | `surface.primary`   | `stroke.default`                |
| Hover    | `surface.primary`   | `stroke.strong`                 |
| Focus    | `surface.primary`   | `accent.secondary` + focus ring |
| Error    | `surface.primary`   | `semantic.danger`               |
| Disabled | `surface.secondary` | `stroke.subtle`                 |

---

# 8.5 Segmented Control

| Komponente    | Höhe | Innenpadding Track | Segment Padding X | Radius | Textstil       |
| ------------- | ---: | -----------------: | ----------------: | -----: | -------------- |
| Segmented / M |   36 |                  4 |                12 |   pill | `type.meta.md` |
| Segmented / L |   40 |                  4 |                14 |   pill | `type.body.md` |

## Segment-Logik

| Teil           | Stil                              |
| -------------- | --------------------------------- |
| Track          | `surface.secondary`               |
| Active Segment | `surface.primary` + subtle shadow |
| Inactive Text  | `text.secondary`                  |
| Active Text    | `text.primary`                    |

---

# 8.6 Sidebar

| Komponente                  | Maß |
| --------------------------- | --: |
| Sidebar expanded width      | 248 |
| Sidebar collapsed width     |  80 |
| Nav item height             |  44 |
| Nav item horizontal padding |  12 |
| Nav item icon size          |  18 |
| Nav item radius             |  12 |
| Section gap                 |  12 |
| Sidebar inner padding       |  16 |

## Sidebar-Zonen

| Zone             | Höhe / Verhalten     |
| ---------------- | -------------------- |
| Brand / Wordmark | 56                   |
| Main Nav         | flexibel             |
| Utility Bottom   | auto anchored bottom |

---

# 8.7 Top Bar

| Komponente           | Maß |
| -------------------- | --: |
| Höhe                 |  72 |
| Padding X            |  24 |
| Padding Y            |  16 |
| Search width default | 320 |
| Search width max     | 420 |
| Right actions gap    |  12 |

---

# 8.8 Page Header

| Komponente                | Maß |
| ------------------------- | --: |
| Gap Title zu Meta         |   4 |
| Gap Header zu Controls    |  16 |
| Bottom spacing zu Content |  24 |

| Inhalt | Stil              |
| ------ | ----------------- |
| Title  | `type.display.md` |
| Meta   | `type.meta.md`    |

---

# 8.9 Metric Tile

| Komponente             | Höhe min | Padding | Radius | Zahlstil          | Labelstil      |
| ---------------------- | -------: | ------: | -----: | ----------------- | -------------- |
| Metric Tile / Compact  |       96 |      16 |     18 | `type.numeric.md` | `type.meta.md` |
| Metric Tile / Standard |      112 |      20 |     18 | `type.numeric.lg` | `type.meta.md` |

## Aufbau

| Element         | Abstand |
| --------------- | ------: |
| Label zu Zahl   |       8 |
| Zahl zu Kontext |       4 |

---

# 8.10 Summary Card

| Komponente              | Padding | Radius | Gap intern |
| ----------------------- | ------: | -----: | ---------: |
| Summary Card / Standard |      24 |     24 |         16 |
| Summary Card / Hero     |      32 |     28 |         20 |

---

# 8.11 Entity Row

Das ist die Kernkomponente.

| Variante             | Höhe | Padding X | Padding Y | Gap Spalten | Radius |
| -------------------- | ---: | --------: | --------: | ----------: | -----: |
| Entity Row / Compact |   72 |        16 |        12 |          12 |     18 |
| Entity Row / Media   |   92 |        16 |        12 |          16 |     18 |

## Spaltenlogik Entity Row

| Zone                |   Breite |
| ------------------- | -------: |
| Cover               |       56 |
| Title Block         | flexibel |
| Context Block       |      180 |
| Status Block        |      140 |
| Price / Value Block |      120 |
| Actions             |       88 |

## Cover-Maße

| Typ                  | Breite | Höhe | Radius |
| -------------------- | -----: | ---: | -----: |
| Mini cover           |     56 |   80 |     12 |
| Square icon fallback |     40 |   40 |     10 |

## Row-Typostile

| Teil   | Stil                 |
| ------ | -------------------- |
| Titel  | `type.card.title.md` |
| Meta   | `type.meta.md`       |
| Status | `type.meta.sm`       |
| Preis  | `type.numeric.sm`    |

---

# 8.12 Activity Row

| Komponente              | Höhe | Padding | Gap | Radius |
| ----------------------- | ---: | ------: | --: | -----: |
| Activity Row / Standard |   56 |      12 |  12 |     16 |

| Teil                | Maß |
| ------------------- | --: |
| Leading avatar/icon |  24 |
| Timestamp block     |  72 |

---

# 8.13 Access Row

| Komponente | Höhe | Padding | Radius |
| ---------- | ---: | ------: | -----: |
| Access Row |   64 |      16 |     16 |

## Spalten

| Zone           |   Breite |
| -------------- | -------: |
| Game           | flexibel |
| Owner / Source |      120 |
| Accessible By  |      120 |
| Restriction    |      100 |
| Action         |       56 |

---

# 8.14 Opportunity Card

| Komponente           | Min Height | Padding | Radius | Gap |
| -------------------- | ---------: | ------: | -----: | --: |
| Opportunity Card / S |        120 |      16 |     18 |  12 |
| Opportunity Card / M |        156 |      20 |     18 |  12 |

## Aufbau

| Element          | Stil                 |
| ---------------- | -------------------- |
| Title            | `type.card.title.md` |
| Reason / Subtext | `type.body.md`       |
| Value / Price    | `type.numeric.sm`    |
| Meta             | `type.meta.md`       |

---

# 8.15 Collection Preview Card

| Komponente         | Min Height | Padding | Radius |
| ------------------ | ---------: | ------: | -----: |
| Collection Preview |        132 |      16 |     18 |

| Teil                    | Maß |
| ----------------------- | --: |
| Tiny cover strip height |  40 |
| Count badge height      |  20 |

---

# 8.16 Member Components

## Member Chip

| Komponente  | Höhe | Padding X | Radius | Avatar |
| ----------- | ---: | --------: | -----: | -----: |
| Member Chip |   32 |        10 |   pill |     20 |

## Member Card Small

| Komponente      | Min Width | Height | Padding | Radius | Avatar |
| --------------- | --------: | -----: | ------: | -----: | -----: |
| Member Card / S |       140 |     72 |      12 |     18 |     32 |

## Avatar Stack

| Komponente       | Avatar | Overlap |
| ---------------- | -----: | ------: |
| Avatar Stack / S |     24 |       8 |
| Avatar Stack / M |     28 |      10 |

---

# 8.17 Price Stack

Die Signature-Komponente.

## Compact

| Element        | Maß / Stil        |
| -------------- | ----------------- |
| Current Price  | `type.numeric.sm` |
| Discount Badge | Höhe 22           |
| Target Price   | `type.meta.md`    |
| State Label    | `type.meta.sm`    |
| Gap intern     | 4 / 6             |

## Standard

| Element        | Maß / Stil        |
| -------------- | ----------------- |
| Current Price  | `type.numeric.md` |
| Discount Badge | Höhe 22           |
| Target Price   | `type.meta.md`    |
| State Label    | `type.meta.md`    |
| Gap intern     | 6 / 8             |

## Large

| Element        | Maß / Stil        |
| -------------- | ----------------- |
| Current Price  | `type.numeric.lg` |
| Discount Badge | Höhe 24           |
| Target Price   | `type.body.md`    |
| State Label    | `type.meta.md`    |
| Gap intern     | 8 / 10            |

## Price Stack Farbzustände

| Zustand      | Label      | Farbe               |
| ------------ | ---------- | ------------------- |
| Under Target | erreicht   | `state.target.hit`  |
| Near Target  | knapp dran | `state.target.near` |
| Above Target | drüber     | `state.target.miss` |

---

# 8.18 Bulk Action Bar

| Komponente      | Höhe | Padding X | Radius |
| --------------- | ---: | --------: | -----: |
| Bulk Action Bar |   56 |        16 |     18 |

| Teil                 | Maß |
| -------------------- | --: |
| Selected Count Block |  72 |
| Actions Gap          |   8 |

---

# 8.19 Right Detail Panel

| Komponente           | Maß |
| -------------------- | --: |
| Width                | 400 |
| Padding              |  24 |
| Header Height        |  56 |
| Section Gap          |  24 |
| Internal Content Gap |  12 |
| Radius inner cards   |  18 |

## Panel-Struktur

| Zone           | Verhalten       |
| -------------- | --------------- |
| Header         | sticky optional |
| Content        | scrollable      |
| Footer actions | optional sticky |

---

# 8.20 Empty State Block

| Komponente             | Max Width | Padding Y | Gap |
| ---------------------- | --------: | --------: | --: |
| Empty State / Standard |       420 |        32 |  12 |

| Teil     | Stil                 |
| -------- | -------------------- |
| Headline | `type.section.title` |
| Body     | `type.body.md`       |
| CTA      | Button M             |

---

# 8.21 Skeletons

| Skeleton              | Höhe / Maß              |
| --------------------- | ----------------------- |
| Row skeleton          | entsprechend Entity Row |
| Metric skeleton       | 96–112                  |
| Card skeleton         | 120–156                 |
| Panel header skeleton | 56                      |
| Text line short       | 40% width               |
| Text line medium      | 60% width               |
| Text line long        | 80% width               |

---

# 9) Screen-spezifische Startgrößen

## 9.1 Home

| Bereich                |     Maß |
| ---------------------- | ------: |
| Hero Summary Höhe      | 180–220 |
| Metric Grid Columns    |       4 |
| Action Queue Row Höhe  |      64 |
| Opportunity Card Width | 280–320 |

## 9.2 Wishlist

| Bereich               |   Maß |
| --------------------- | ----: |
| Header Controls Gap   |    12 |
| Segment Bar Height    | 36–40 |
| Smart Sets Card Width |   220 |
| List Row Height       |    92 |
| Detail Panel Width    |   400 |

## 9.3 Library

| Bereich              |   Maß |
| -------------------- | ----: |
| Utility Cards Height |    96 |
| List Row Height      | 72–92 |
| Filter Bar Gap       |     8 |

## 9.4 Family

| Bereich                 |     Maß |
| ----------------------- | ------: |
| Summary Height          | 160–200 |
| Member Rail Card Width  |     140 |
| Overlap Card Min Height |     140 |
| Access Row Height       |      64 |

## 9.5 Game Detail

| Bereich           |     Maß |
| ----------------- | ------: |
| Hero Cover Width  |     220 |
| Hero Cover Height |     300 |
| Hero Section Gap  |      24 |
| Price Block Width | 220–260 |
| Main Section Gap  |      24 |

---

# 10) Figma Setup-Empfehlung

## Seitenstruktur

| Seite            | Inhalt                                               |
| ---------------- | ---------------------------------------------------- |
| `00 Foundations` | Farben, Type, Space, Radius, Shadow                  |
| `01 Atoms`       | Buttons, Chips, Inputs, Badges                       |
| `02 Molecules`   | Price Stack, Metric Tile, Member Chip, Status Groups |
| `03 Organisms`   | Rows, Cards, Panels, Bulk Bar, Empty States          |
| `04 Templates`   | App Frame, Header Patterns, List Layouts             |
| `05 Screens`     | Home, Wishlist, Library, Family, Game Detail         |

## Variants zuerst anlegen für

* Button
* Chip
* Input
* Entity Row
* Price Stack
* Panel

---

