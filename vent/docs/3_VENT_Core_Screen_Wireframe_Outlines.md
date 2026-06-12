# VENT — Core Screen Wireframe Outlines

## Zweck

Diese Unterlage übersetzt die Screen Map in konkrete, wireframe-taugliche Screen-Strukturen. Fokus: **Informationshierarchie, Scrolllogik, Sticky-Zonen, Zustände und Primäraktionen**. Keine visuelle Ausgestaltung, sondern belastbare Layout-Architektur.

---

# 1. Home Dashboard

## Ziel

Sofortiger Überblick über alles Relevante ohne UI-Lärm: Was hat sich geändert? Was ist kaufreif? Wo gibt es Familien-Reibung? Wo sollte der Nutzer weitermachen?

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky)*

   * VENT wordmark / title
   * Search trigger
   * Notifications trigger
   * Overflow / utility action

2. **Account / Context Header** *(scrollt mit Inhalt)*

   * optional greeting
   * account identity / active profile
   * short contextual line (z. B. offene Preisalarme, Familienstatus)

3. **Quick Actions Row** *(horizontal scroll, scrollt mit Inhalt)*

   * Compare
   * Neue Smart View
   * Family Invite
   * Deals öffnen

4. **Continue / Resume Section** *(scrollt)*

   * zuletzt genutzte Ansicht
   * letzter Vergleich
   * letzte Familienaktion

5. **Wishlist Highlights** *(scrollt)*

   * 3–5 priorisierte Spiele / Preisbewegungen
   * CTA: gesamte Wishlist öffnen

6. **Families Highlights** *(scrollt)*

   * Statuskarte
   * Mitgliederaktivität / Konflikte / Verfügbarkeit
   * CTA: Families öffnen

7. **Recent Activity Feed Preview** *(scrollt)*

   * letzte relevante Ereignisse, stark verdichtet
   * CTA: gesamte Activity öffnen

8. **Alerts / Action Needed** *(scrollt, nur wenn nötig sichtbar)*

   * Warnungen, Konflikte, Verbindungsprobleme

## Sticky / Fixed

* Top App Bar
* Bottom Navigation

## Scrollt

* gesamter Screen-Body als eine vertikale Fläche

## Primäraktionen

* Search
* Notifications
* Continue zuletzt genutzten Flow
* Wishlist öffnen
* Families öffnen

## Zustände

* **Default**: alle Kernsektionen sichtbar
* **Sparse**: wenige Daten, Fokus auf CTA und leere States
* **Alert-heavy**: Alerts rücken direkt unter den Header
* **Offline / Sync delayed**: globaler Statusbanner oberhalb des Contents

---

# 2. Wishlist Overview

## Ziel

Die Wishlist als steuerbares Entscheidungssystem statt bloßer langer Liste.

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky)*

   * Titel: Wishlist
   * Search icon oder expandierende Suche
   * Sort action
   * Overflow

2. **Inline Search Field** *(sticky oder semisticky unter App Bar)*

   * Suche innerhalb der Wishlist

3. **Filter / Sort Chip Row** *(sticky horizontal rail)*

   * aktive Filter
   * Preisbereich
   * Modi
   * Ownership / Family relevance
   * Rabatt

4. **Saved Views / Wishlist Sets Rail** *(horizontal, scrollt oder semisticky je nach Dichte)*

   * All
   * Unter 10 €
   * Coop
   * Friends own it
   * Waiting for deep discount

5. **Result Summary Bar** *(sticky unter Filterebene möglich)*

   * Anzahl Treffer
   * aktuelle Sortierung
   * Bulk Select trigger

6. **Wishlist List** *(primäre Scrollfläche)*

   * Game Rows oder Cards
   * Preis, Rabatt, Tags, Priorität, Notiz, Ownership signal

7. **Selection Mode Bar** *(erscheint nur im Multi-select-Modus, sticky unten oberhalb Nav)*

   * Compare
   * Add to Set
   * Mark Priority
   * Remove

## Sticky / Fixed

* Top App Bar
* Bottom Navigation
* idealerweise Search + Filterebene
* Selection Mode Bar nur wenn aktiv

## Scrollt

* Saved Views Rail optional mit dem Inhalt
* Ergebnisliste definitiv

## Primäraktionen

* filtern
* sortieren
* Saved View öffnen
* Spiel öffnen
* Multi-select starten

## Zustände

* **Default list**
* **Filtered state**
* **Search active**
* **Selection mode**
* **Empty result**
* **Initial empty wishlist**
* **Error / sync issue**

---

# 3. Wishlist Set Detail

## Ziel

Eine einzelne Smart View / ein Set als klare Entscheidungslinse darstellen.

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky)*

   * Back
   * View name
   * Edit / Overflow

2. **Set Header Card** *(scrollt)*

   * Name
   * Kurzbeschreibung
   * optional Icon / type marker
   * Trefferanzahl

3. **Rules Summary Row** *(scrollt, horizontal wraps möglich)*

   * Rule Chips
   * z. B. Price < 10, Coop, Friends own it

4. **Action Row** *(sticky oder direkt unter Header)*

   * Sort
   * Compare selected
   * Edit rules
   * Share / export optional später

5. **Results List** *(primäre Scrollfläche)*

   * gleiche Game Rows wie Wishlist Overview, evtl. mit stärkerem Fokus auf Relevanzindikatoren

6. **Context Footer / Explanation** *(optional, nur wenn sinnvoll)*

   * warum Elemente in dieser View erscheinen

## Sticky / Fixed

* Top App Bar
* Bottom Navigation
* Action Row optional sticky

## Scrollt

* Header Card
* Rules Summary
* Result List

## Primäraktionen

* Regeln verstehen
* Regeln bearbeiten
* Ergebnisse vergleichen
* Spiel öffnen

## Zustände

* **Populated**
* **No matches**
* **Broken rule / unavailable source**
* **Selection mode**

---

# 4. Game Detail

## Ziel

Ein Spiel im VENT-Kontext bewertbar machen: kaufen, warten, vergleichen, zur Familie/Freundeslage in Bezug setzen.

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky / collapsible)*

   * Back
   * Title / collapsed title
   * Share / Overflow

2. **Hero Block** *(scrollt, kann collapsen)*

   * Cover art / header media
   * Spieltitel
   * Core metadata (genre, modes, platform markers)

3. **Action Cluster** *(früh sichtbar, ideal oberhalb Fold)*

   * In Wishlist / Entfernen
   * Priority setzen
   * Compare
   * Open in Steam / external action später

4. **Price & Discount Card** *(scrollt)*

   * aktueller Preis
   * Rabatt
   * Preisbewertung / historic hint
   * optional buy-later signal

5. **Ownership / Social Context** *(scrollt)*

   * Freunde besitzen es
   * Family access / shared library relevance
   * gemeinsam spielbar / Wunschlistenüberschneidungen

6. **Tags / Compatibility / Modes** *(scrollt)*

   * Coop
   * Singleplayer
   * Controller
   * Deck / compatibility markers falls später relevant

7. **Personal Context Card** *(scrollt)*

   * Notes
   * Priority reason
   * Zugehörige Sets / Smart Views

8. **Related Views / Compare Entry** *(scrollt)*

   * ähnliche Spiele im System
   * CTA: mit X vergleichen

9. **Extended Metadata / Description** *(scrollt)*

   * nur soweit nötig, nicht Store-Kopie dominieren lassen

## Sticky / Fixed

* Top App Bar
* Bottom Navigation
* optional floating compare / action trigger

## Scrollt

* fast alles außer der oberen Navigation

## Primäraktionen

* priorisieren
* vergleichen
* zur Wishlist hinzufügen/entfernen
* Familien-/Besitzkontext prüfen

## Zustände

* **Wishlisted**
* **Not wishlisted**
* **Discount active**
* **Owned by family / shared accessible**
* **Unavailable / metadata incomplete**

---

# 5. Families Overview

## Ziel

Sofort zeigen: Wer ist drin, was ist verfügbar, wo gibt es Konflikte, welche Aktion ist gerade relevant?

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky)*

   * Titel: Families
   * Search / manage / overflow

2. **Family Status Hero** *(scrollt, prominent)*

   * Familienstatus
   * Anzahl Mitglieder
   * Shared Library summary
   * offene Probleme / Locks

3. **Primary Actions Row** *(scrollt oder semisticky)*

   * Invite
   * Manage members
   * Shared library öffnen
   * Help

4. **Members Section** *(scrollt)*

   * horizontale Avatare oder kompakte Member Cards
   * CTA zu Detailansichten

5. **Shared Library Snapshot** *(scrollt)*

   * Anzahl verfügbarer Titel
   * aktive Restriktionen
   * CTA zur Vollansicht

6. **Conflict / Warning Section** *(nur wenn nötig)*

   * Locks
   * eligibility issues
   * connection / sharing issues

7. **Recent Family Activity** *(scrollt)*

   * joined / played / changed / invite updates

8. **Help / Troubleshooting Entry** *(scrollt, sekundär)*

   * Erklärung komplexer Zustände

## Sticky / Fixed

* Top App Bar
* Bottom Navigation

## Scrollt

* gesamter Inhalt

## Primäraktionen

* Mitglied öffnen
* Shared Library öffnen
* Invite Flow starten
* Konflikt verstehen / lösen

## Zustände

* **Healthy family state**
* **Needs attention**
* **No family configured**
* **Partial access / restriction state**
* **Error / unable to sync**

---

# 6. Family Member Detail

## Ziel

Eine Person im Familienkontext handlungsfähig machen: Rolle, geteilte Inhalte, Überschneidungen, Berechtigungen.

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky)*

   * Back
   * Member name
   * Overflow

2. **Member Header Card** *(scrollt)*

   * Avatar
   * Name
   * Role / status
   * membership state

3. **Stats / Summary Row** *(scrollt)*

   * shared games
   * recent activity
   * overlaps with your wishlist

4. **Intersection Section** *(scrollt)*

   * Spiele, die beide relevant finden
   * Spiele, die die Person besitzt / du willst

5. **Shared Access Section** *(scrollt)*

   * welche Inhalte durch diese Person / für diese Person relevant sind

6. **Permissions / Restrictions Section** *(scrollt)*

   * toggles / status rows
   * Info-Text bei gesperrten Dingen

7. **Recent Activity by Member** *(scrollt)*

   * Timeline preview

8. **Actions Section** *(am Ende oder als sticky bottom sheet trigger)*

   * Manage
   * Message / invite-related actions später
   * Remove / leave / restriction help je nach Rolle

## Sticky / Fixed

* Top App Bar
* Bottom Navigation

## Scrollt

* gesamter Inhalt

## Primäraktionen

* Überschneidungen prüfen
* Berechtigungen verstehen
* Rolle / Status verwalten

## Zustände

* **Standard member**
* **Restricted member**
* **Pending / invited**
* **Unavailable data**

---

# 7. Shared Library Detail

## Ziel

Die geteilte Bibliothek wie eine verständliche, filterbare Nutzfläche darstellen — nicht wie ein undurchsichtiger Berechtigungsraum.

## Layout-Struktur (oben nach unten)

1. **Top App Bar** *(sticky)*

   * Back
   * Shared Library
   * Search
   * Overflow

2. **Library Summary Header** *(scrollt)*

   * Titelanzahl
   * derzeit verfügbar
   * active restrictions / locks

3. **Inline Search** *(sticky oder semisticky)*

   * Suche in der Shared Library

4. **Filter / Sort Rail** *(sticky horizontal)*

   * verfügbar
   * gesperrt
   * coop
   * recently used
   * owned by X

5. **Conflict / Restriction Banner** *(nur wenn nötig, sticky direkt unter Filter möglich)*

   * kurze Erklärung des wichtigsten Problems
   * CTA: mehr erfahren

6. **Game List** *(primäre Scrollfläche)*

   * Shared Library Game Rows
   * availability badge
   * owner/member context
   * restriction indicator

7. **Explanation Sheet Trigger** *(persistent secondary affordance)*

   * „Warum ist das gesperrt?“

## Sticky / Fixed

* Top App Bar
* Bottom Navigation
* Search + Filter-Ebene idealerweise sticky

## Scrollt

* Summary Header
* Game List

## Primäraktionen

* suchen
* filtern
* Spiel öffnen
* Restriktion verstehen

## Zustände

* **All available**
* **Mixed availability**
* **Restriction-heavy**
* **No titles**
* **Search empty**
* **Sync error**

---

# 8. Screenübergreifende Zustände

## Pflichtzustände für fast alle datengetriebenen Screens

* Loading Skeleton
* Empty State
* Error State
* Offline / stale data indicator
* Pull-to-refresh / manual refresh

## Interaktive Spezialzustände

* Search active
* Filter active
* Multi-select mode
* Sheet open
* Banner active

---

# 9. Screenübergreifende Layout-Regeln

## Vertikale Logik

* wichtigste Entscheidung immer oberhalb oder knapp unterhalb des Folds
* Filter nie tief vergraben
* Listen dominieren dort, wo wiederkehrende Verwaltung passiert
* Detailblöcke in modulare Karten trennen statt als Textwand

## Sticky-Regeln

* Navigation immer stabil
* Such-/Filterebenen sticky, wenn der Screen listenzentriert ist
* Selection Bars nur kontextuell einblenden
* Warnungen nur sticky, wenn sie wirklich handlungsrelevant sind

## Dichte-Regeln

* Home: verdichtet, aber nicht überfüllt
* Wishlist / Shared Library: informationsreich, scanbar
* Detailscreens: kontextreich, aber in Karten segmentiert
* Families: status- und handlungsorientiert statt technisch

---

# 10. Empfohlene nächste Ableitung

Aus diesen Wireframe Outlines folgt sinnvoll als nächstes:

1. **Component Spec Sheet**

   * jede Komponente mit Varianten, Inhalt, States, Aktionen

2. **Low-Fidelity Wireframe Pack**

   * ASCII / Markdown / Figma-ready Layoutblöcke pro Screen

3. **Interaction Model**

   * Tap, Long Press, Swipe, Selection Mode, Sheet-Verhalten

---

# 11. Entscheidender Architekturpunkt

VENT sollte auf Screen-Ebene immer drei Fragen beantworten:

1. **Was ist hier relevant?**
2. **Was kann ich jetzt tun?**
3. **Warum ist dieser Zustand so?**

Wenn ein Screen diese drei Fragen nicht sichtbar beantwortet, ist er noch nicht fertig.

