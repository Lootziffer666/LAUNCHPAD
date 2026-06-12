# VENT MVP Execution Board

Stand: 2026-03-19

> Ziel: Dieses Board ist **umsetzungsnah** (engineering-first), nicht nur planerisch.  
> Jede Story ist so formuliert, dass sie innerhalb eines Sprints abschließbar und reviewbar ist.

---

## 1) Scope & Release Guardrails

### MVP-In-Scope (Release v1)
- Wishlist Core Workflows (Suche, Filter, Saved Views, Selection, Compare-Entry)
- Families Core Workflows (Overview, Member-Kontext, Status/Warnungen)
- Navigations- und Komponentenfundament (Top/Bottom Bar, Sheets, States)
- QA-Baseline (Navigation, Interaktionsregeln, Accessibility pass)

### V1 Out-of-Scope (explizit später)
- Umfangreiche Swipe-Gesten-Logik über Basisfälle hinaus
- Sekundärmodule wie Sales/Inventory/Store Utilities als vollwertige Flows
- Fortgeschrittene Automatisierungen / Recommendation-Systeme

### Release-Kriterien (Go/No-Go)
1. Alle P0-Tickets sind `Done`.
2. Keine offenen P0-Bugs in Kernflows Wishlist/Families.
3. Navigation/Back-Verhalten ist konsistent in Root + Detail.
4. Empty/Error/Loading States sind für alle MVP-Screens implementiert.

---

## 2) Working Agreements

### Statusmodell
- `Todo` → `In Progress` → `In Review` → `Done`

### Definition of Ready (DoR)
Ein Ticket darf erst auf `In Progress`, wenn:
- UI-Ziel und Interaktion klar sind
- Abhängigkeiten benannt sind
- Test-/Abnahmehinweise vorhanden sind

### Definition of Done (global)
Ein Ticket ist nur `Done`, wenn:
- Implementierung abgeschlossen
- Akzeptanzkriterien erfüllt
- Regression-Check im betroffenen Flow durchgeführt
- Dokumentation/Notizen aktualisiert (falls Verhalten sichtbar geändert)

---

## 3) Priorisierte Epics & Tickets

Legende: **Prio** P0 (kritisch), P1 (wichtig), P2 (später) · **Aufwand** S/M/L

## EPIC A — App Shell & Navigation

- [ ] **A-01 Projektstruktur + Feature-Module**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** — · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Feature-Ordner: `home`, `wishlist`, `families`, `activity`, `profile`, `core/ui`
  - Build/Run lokal ohne Fehler

- [ ] **A-02 Root Navigation (5 Tabs)**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Tabs: Home, Wishlist, Families, Activity, Profile
  - Wechsel zwischen Tabs ohne Crash/Inkonsistenz

- [ ] **A-03 Bottom Navigation v1**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - max. 5 Ziele, Label sichtbar
  - Active/Inactive klar unterscheidbar

- [ ] **A-04 Top App Bar v1 (Root + Child + Selection)**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Varianten Root/Child/Selection vorhanden
  - max. 3 sichtbare Actions, Rest Overflow

- [ ] **A-05 Shared Screen States (Loading/Empty/Error/Content)**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Ein gemeinsames State-Pattern ist in mind. Wishlist + Families aktiv

- [ ] **A-06 Pull-to-Refresh Foundation**  
  **Prio:** P1 · **Aufwand:** S · **Dep:** A-05 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Wiederverwendbar für Listen-/Dashboard-Screens
  - UI-Feedback für laufenden Refresh vorhanden

---

## EPIC B — Core UI Components

- [ ] **B-01 Inline Search Field (collapsed/expanded)**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-04 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Zustände: idle, focused, typing, populated, no-results
  - Clear Action vorhanden

- [ ] **B-02 Filter Chip (inactive/active/removable)**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Toggle- und Remove-Interaktion funktionieren
  - Active State eindeutig

- [ ] **B-03 Saved View Pill (default/active/add-new)**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - View-Wechsel per Tap
  - Truncation/Overflow robust

- [ ] **B-04 Game List Row Component**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-05 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - States: normal, selected, disabled
  - Primärtap öffnet Detailkontext

- [ ] **B-05 Multi-Select Action/Selection Bar**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-04, B-04 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Selektion-Count sichtbar
  - Compare/Add/Remove Actions integrierbar

- [ ] **B-06 Bottom Sheets Framework (Filter/Sort/Quick Actions)**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** A-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - partial + expanded
  - dismiss via swipe/tap/back

---

## EPIC C — Wishlist MVP

- [ ] **C-01 Wishlist Overview Skeleton**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-02, B-01, B-02, B-03 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Search, Filter Chips, Saved Views, Liste, Selection-Einstieg sichtbar

- [ ] **C-02 Wishlist Local Search Behavior**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Suche wirkt nur auf Wishlist-Kontext
  - No-result Zustand eindeutig

- [ ] **C-03 Filter Toggle + Immediate Result Update**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** C-01, B-02 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Filtereffekt sofort in Liste sichtbar

- [ ] **C-04 Sort Sheet + Persistenz (Session)**  
  **Prio:** P1 · **Aufwand:** S · **Dep:** B-06, C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Sortoption auswählbar
  - zuletzt gewählte Sortierung pro Session gespeichert

- [ ] **C-05 Saved View Switching**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** C-01, B-03 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - schneller Kontextwechsel via Pills
  - aktive View visuell markiert

- [ ] **C-06 Selection Mode per Long Press**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** B-05, C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Long Press aktiviert Selection Mode
  - klarer Moduswechsel + Anzahl selektierter Items

- [ ] **C-07 Multi-Select Actions (Compare / Add to Set / Remove)**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** C-06 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Aktionen funktionieren mit >1 Item
  - destruktive Aktionen mit Safety-Mechanismus

- [ ] **C-08 Wishlist Pull-to-Refresh**  
  **Prio:** P1 · **Aufwand:** S · **Dep:** A-06, C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - visuelles Refresh-Feedback
  - Interaktion bleibt soweit möglich verfügbar

- [ ] **C-09 Empty vs No-Match States**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - „keine Elemente“ von „keine Treffer“ klar getrennt

- [ ] **C-10 Wishlist Performance Pass (100+ rows)**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - flüssiges Scrollen ohne spürbare Lags

---

## EPIC D — Families MVP

- [ ] **D-01 Families Overview Skeleton**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** A-02, A-04 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Statusheader, Members Summary, Shared Library Status, Warnungen vorhanden

- [ ] **D-02 Family Status Hero + Warning Actions**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** D-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - klare Zustände (ok/warn/blocked)
  - Warning CTA öffnet den passenden Kontext

- [ ] **D-03 Members Summary + Avatars**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** D-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Member Cards klickbar
  - Rolleninfos sichtbar

- [ ] **D-04 Shared Library Status Panel**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** D-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Besitz-/Verfügbarkeitsstatus klar
  - Konflikt-/Lock-Hinweise sichtbar

- [ ] **D-05 Family Member Detail (v1)**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** D-03 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Member Header + Role/Context vorhanden
  - Back-Verhalten konsistent

- [ ] **D-06 Families Refresh + Error/Empty Handling**  
  **Prio:** P1 · **Aufwand:** S · **Dep:** A-06, D-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Pull-to-Refresh integriert
  - Error/Empty konsistent zum globalen State-Pattern

---

## EPIC E — Decision Layer (V1-klein)

- [ ] **E-01 Game Detail (Wishlist Context) v1**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** C-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Preis/Discount, Notes, Ownership Signals dargestellt

- [ ] **E-02 Wishlist Compare Screen v1 (2–4 items)**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** C-07 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Kriterienvergleich + Remove Controls + Decision Footer

- [ ] **E-03 Compare Entry from Selection Mode**  
  **Prio:** P1 · **Aufwand:** S · **Dep:** E-02, C-06 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Übergabe selektierter Games funktioniert
  - Rückweg in Ursprungskontext sauber

---

## EPIC F — QA, UX, Stabilisierung

- [ ] **F-01 Navigation Consistency Audit**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** A-02, C-01, D-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Back-Verhalten in Root/Detail konsistent

- [ ] **F-02 Interaction Rules Audit**  
  **Prio:** P0 · **Aufwand:** M · **Dep:** C-06, B-06 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Tap-Verhalten eindeutig
  - Long Press nicht exklusiv für Kernfunktionen

- [ ] **F-03 Accessibility Baseline Pass**  
  **Prio:** P1 · **Aufwand:** M · **Dep:** C-01, D-01 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - Fokus-Reihenfolge, Labels, Touch-Targets in Kernflows ok

- [ ] **F-04 MVP Freeze + Release Checklist**  
  **Prio:** P0 · **Aufwand:** S · **Dep:** alle P0 · **Status:** Todo  
  **Akzeptanzkriterien:**
  - P0 vollständig abgeschlossen
  - offene P1/P2 sauber als Post-MVP markiert

---

## 4) Sprint-Plan (empfohlen)

### Sprint 1 (Woche 1)
- Ziel: Fundament + Wishlist lauffähig
- Fokus: A, B, C (P0)

### Sprint 2 (Woche 2)
- Ziel: Families + Stabilisierung + Release Readiness
- Fokus: D (P0/P1), E (P1), F (P0)

---

## 5) Top-10 Startreihenfolge

1. A-01
2. A-02
3. A-03
4. A-04
5. B-01
6. B-02
7. B-03
8. C-01
9. C-06
10. D-01
