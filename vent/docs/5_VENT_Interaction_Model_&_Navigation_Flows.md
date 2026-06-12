# VENT — Interaction Model & Navigation Flows

## Zweck

Dieses Dokument definiert, **wie** sich VENT verhält: Welche Interaktionen es gibt, wie Zustände wechseln, wie Navigation gedacht ist und welche Kern-Journeys das Produkt tragen.

Die Leitfrage lautet nicht nur: **Was ist auf dem Screen?** sondern vor allem: **Was passiert, wenn ich etwas tue?**

---

# 1. Interaktionsprinzipien

## 1.1 Grundsatz

VENT soll sich anfühlen wie eine **ruhige, hochgradig fokussierte Steueroberfläche**, nicht wie ein überladenes Steam-Frontend und nicht wie eine generische Settings-App.

Daraus folgen fünf Verhaltensregeln:

1. **Primäraktionen müssen sichtbar sein**
   Der Nutzer soll wichtige Aktionen nicht erraten müssen.

2. **Sekundärtiefe gehört in Sheets oder Detailseiten**
   Nicht jede Entscheidung braucht einen Vollbildwechsel.

3. **Listen sind Arbeitsflächen**
   Wishlist und Shared Library sind keine statischen Ansichten, sondern steuerbare Räume.

4. **Zustände müssen sofort verständlich sein**
   Gesperrt, verfügbar, rabattiert, gefiltert, ausgewählt: alles muss direkt erkennbar sein.

5. **Navigation darf Tiefe haben, aber keine Reibung**
   Back-Verhalten, Crosslinks und Wechsel zwischen Modulen müssen konsistent sein.

---

# 2. Globale Interaktionsmuster

# 2.1 Tap

## Zweck

Standardinteraktion für Öffnen, Auswählen, Umschalten, Aktivieren.

## Regeln

* Tap auf eine Row oder Card öffnet deren primären Kontext.
* Tap auf Chips toggelt Filter oder öffnet den zugehörigen Zustand.
* Tap auf CTAs löst direkt die benannte Aktion aus.
* Tap darf nie mehrere Bedeutungen zugleich haben.

## Beispiele

* Tap auf **Game Row** ? Game Detail
* Tap auf **Member Card** ? Member Detail
* Tap auf **Saved View Pill** ? Wunschlistenansicht wechseln
* Tap auf **Warning Banner CTA** ? Problemkontext öffnen

---

# 2.2 Long Press

## Zweck

Kontextaktivierung für fortgeschrittene Verwaltung, ohne die Standardbedienung zu überladen.

## Regeln

* Long Press nur dort einsetzen, wo Power-User-Mehrwert entsteht.
* Long Press darf nie die einzige Möglichkeit für Kernfunktionen sein.
* Long Press startet primär **Selection Mode** oder öffnet ein **Context Menu**.

## Beispiele

* Long Press auf **Game Row** ? Selection Mode starten
* Long Press auf **Saved View Pill** ? Rename / Edit / Delete Menü
* Long Press auf **Activity Row** ? Quick actions / mute similar später optional

---

# 2.3 Swipe

## Zweck

Schnelle Sekundäraktionen in listenzentrierten Bereichen.

## Regeln

* Swipe nur für häufige, reversible oder klar verständliche Aktionen.
* Swipe-Aktionen müssen visuell angekündigt oder erlernbar sein.
* Destruktive Swipes nie ohne Undo oder klare Sicherheitslogik.

## Beispiele

* Swipe auf **Game Row** nach rechts ? Priorität setzen / merken
* Swipe auf **Game Row** nach links ? aus View entfernen / Quick Compare / optional später
* Swipe auf **Notification Row** ? als gelesen markieren
* Swipe auf **Activity Row** ? ausblenden / stummschalten später optional

## Empfehlung

Swipe nur in Version 2 oder später umfassend aktivieren. Erst wenn das Basissystem stabil ist.

---

# 2.4 Scroll

## Zweck

Primäre Navigation innerhalb inhaltsreicher Screens.

## Regeln

* Listenbasierte Screens bekommen sticky Filter- oder Suchzonen.
* Scroll verändert Dichte und Fokus, nicht die Verständlichkeit.
* Hero-Bereiche dürfen beim Scrollen verdichten, aber keine Kerninfo verlieren.

## Beispiele

* **Wishlist Overview**: Search + Filter sticky, Liste scrollt
* **Game Detail**: Hero kollabiert, Titel wandert in App Bar
* **Shared Library**: Summary scrollt weg, Filter bleibt

---

# 2.5 Pull to Refresh

## Zweck

Manueller Re-Sync bei datengetriebenen Screens.

## Regeln

* Nur auf Listen- oder Dashboard-Screens.
* Während Refresh soll der Screen benutzbar bleiben, wenn möglich.
* Refresh ersetzt nicht den permanenten Sync-Status.

## Einsatzorte

* Home
* Wishlist Overview
* Families Overview
* Shared Library Detail
* Activity Feed

---

# 3. Kontextuelle Interaktionsmuster

# 3.1 Selection Mode

## Zweck

Mehrfachauswahl für Compare, Batch-Organisation und schnelle Listenpflege.

## Einstieg

* Long Press auf Game Row
* Checkbox / Select trigger
* optional "Auswählen" aus Overflow

## Verhalten

* Selection Mode ersetzt oder ergänzt die normale Toolbar
* ausgewählte Elemente werden visuell markiert
* Multi-select Action Bar erscheint
* Taps auf weitere Elemente erweitern oder reduzieren die Auswahl

## Beenden

* explizit "Abbrechen"
* Back
* alle Selektionen entfernen
* nach abgeschlossener Aktion optional automatisch

## Primäraktionen im Modus

* Compare
* Add to Set
* Mark Priority
* Remove / Clear

## Regeln

* Selection Mode ist immer ein klarer Modus, kein versteckter Zwischenzustand
* Nutzer muss jederzeit sehen, wie viele Elemente gewählt sind

---

# 3.2 Filter Activation

## Zweck

Listen aktiv einengen, ohne den Nutzer in Menüs zu verlieren.

## Verhalten

* Tap auf Filter Chip toggelt einfache Filter direkt
* komplexe Filter öffnen Filter Sheet
* aktive Filter erscheinen als sichtbare Active Chips
* Ergebnisanzahl aktualisiert sich sofort

## Regeln

* Filtereffekte müssen direkt sichtbar sein
* "Keine Treffer" ist ein normaler Zustand, kein Fehler
* globale Suche und lokale Filter dürfen sich nicht widersprechen, sondern additiv verhalten

---

# 3.3 Bottom Sheets

## Zweck

Sekundäre Optionen nahe am Kontext anbieten.

## Typen

1. Filter Sheet
2. Sort Sheet
3. Quick Actions Sheet
4. Explanation Sheet
5. Quick Peek Sheet
6. Bulk Action Sheet

## Verhalten

* vom unteren Rand kommend
* partial oder expanded
* Dismiss per swipe down, close tap oder Hintergrundtap
* kritische Aufgaben nicht ausschließlich in kleine partial Sheets packen

## Regeln

* Sheets für schnelle Entscheidungen, nicht für komplexe Mehrseiten-Flows
* nach Action Rückkehr in den bestehenden Kontext
* Sheet-Inhalte klar gruppieren, nicht als unendliche Liste

---

# 3.4 Inline vs. Dedicated Detail

## Entscheidungskriterium

VENT unterscheidet strikt zwischen:

* **Inline-Entscheidungen** = schnell, reversibel, sekundär
* **Dedicated Detail** = kontextreich, erklärungsbedürftig, entscheidungsrelevant

## Inline

* Filter an/aus
* Sortierung
* kurze Erklärungen
* Quick Peek
* Batch Actions

## Dedicated Detail

* Game Detail
* Family Member Detail
* Shared Library mit Konfliktkontext
* Smart View Bearbeitung

---

# 4. Navigation Model

# 4.1 Primäre Navigation

## Bottom Navigation

Root-Level Wechsel zwischen:

* Home
* Wishlist
* Families
* Activity
* Profile

## Regeln

* Tab-Wechsel bewahrt möglichst den letzten Zustand des Moduls
* Re-Tap auf aktiven Tab kann später Scroll-to-top oder Reset auslösen
* Root-Wechsel ist kein „Back“-Stapel, sondern Modulwechsel

---

# 4.2 Sekundäre Navigation

## Von Listen zu Details

* Wishlist Overview ? Game Detail
* Families Overview ? Member Detail
* Families Overview ? Shared Library Detail
* Activity Feed ? relevanter Zielscreen

## Regeln

* Child Screens haben Back in der Top Bar
* Back kehrt in den vorherigen Kontext zurück, inklusive Filter-/Scrollzustand wenn sinnvoll

---

# 4.3 Tertiäre Kontexte

## Sheets, Menüs, Quick Peek

Diese bilden **keine vollwertigen Navigationsschichten**, sondern temporäre Überlagerungen.

## Regeln

* Dismiss = zurück in denselben Zustand
* keine wichtige Datenänderung ohne sichtbare Bestätigung
* Sheet darf den Nutzer nicht „entführen"

---

# 4.4 Deep Links / Crosslinks

## Zweck

Kontextsprünge zwischen Modulen, ohne Orientierung zu verlieren.

## Beispiele

* Home Alert ? Shared Library Restriction
* Activity Price Alert ? Game Detail
* Game Detail ? passende Saved View
* Member Detail ? relevante Shared Library Items

## Regeln

* Zielscreen muss sichtbar machen, warum man dort gelandet ist
* optional durch Inline-Hinweis wie "geöffnet aus Preisalarm"

---

# 5. Back-Verhalten

## Grundregel

Back bedeutet immer: **eine Ebene Kontext zurück**, nicht „irgendwo hin verschwinden“.

## Reihenfolge

1. Offenes Sheet schließen
2. Selection Mode beenden
3. Suche schließen / Suchtext verwerfen je nach Zustand
4. Child Screen verlassen
5. Root Tab verlassen nur nach Plattformkonvention, nicht unvorhersehbar

## Detailregeln

* Wenn Selection Mode aktiv ist, beendet Back zuerst den Modus.
* Wenn ein Filter Sheet offen ist, schließt Back zuerst das Sheet.
* Bei Child Screens kehrt Back in den letzten Listen- oder Übersichtsstatus zurück.
* Bei Root Screens gilt Android-typische Logik.

---

# 6. Zustandswechsel-Modell

# 6.1 Wishlist

## Kernzustände

* unfiltered
* filtered
* search active
* selection mode
* empty results
* sync stale

## Wechselbeispiele

* Tap auf Filter Chip ? filtered
* Clear all filters ? unfiltered
* Long Press auf Row ? selection mode
* Back ? selection mode off

---

# 6.2 Families

## Kernzustände

* healthy
* needs attention
* invite pending
* restriction active
* sync error

## Wechselbeispiele

* Invite senden ? invite pending
* Restriction erkannt ? warning state sichtbar
* Sync erfolgreich ? status normalisiert

---

# 6.3 Game Detail

## Kernzustände

* wishlisted
* not wishlisted
* discounted
* owned by family
* restricted / unavailable

## Wechselbeispiele

* Add to Wishlist ? wishlisted
* Mark priority ? updated personal context
* Compare starten ? compare flow trigger

---

# 7. Kern-Journeys

# 7.1 Spiel entdecken ? merken ? filtern ? vergleichen ? entscheiden

## Ausgangspunkt

Home, Activity oder externe Entdeckung später

## Flow

1. Nutzer sieht relevantes Spiel auf Home / Activity / Wishlist
2. Tap ? **Game Detail**
3. Nutzer prüft Preis, Family Ownership, Tags, Relevanz
4. Aktion: **zur Wishlist hinzufügen** oder **Priorität setzen**
5. Zurück zu **Wishlist Overview** oder direkte Navigation in passende **Saved View**
6. Filter nach Preis / Coop / Besitz / Rabatt
7. Long Press oder Select ? mehrere Spiele wählen
8. **Compare** starten
9. Entscheidung: kaufen, warten, priorisieren, in Set verschieben

## Kritische UX-Punkte

* Preis und Relevanz müssen früh sichtbar sein
* Compare darf kein versteckter Expertentrick sein
* Rückweg zur Wishlist muss Kontext behalten

---

# 7.2 Preisalarm sehen ? passende Ansicht öffnen ? Kaufreife prüfen

## Flow

1. Nutzer sieht Alert auf Home oder Activity
2. Tap auf Alert ? **Game Detail** oder passende **Wishlist Set Detail**
3. System zeigt Preis, Rabatt, historische Einordnung, Besitzsignale
4. Nutzer springt optional in **Saved View „Unter X €“** oder **„Warten auf starken Rabatt“**
5. Nutzer priorisiert, vergleicht oder belässt den Titel auf Beobachtung

## UX-Ziel

Nicht bloß „Rabatt gesehen“, sondern **in Entscheidungslogik überführt**.

---

# 7.3 Familienkonflikt sehen ? verstehen ? lösen

## Flow

1. Nutzer sieht Warning auf Home oder Families Overview
2. Tap ? **Families Overview** oder direkt **Shared Library Detail**
3. Konfliktbanner erklärt knapp das Problem
4. CTA öffnet **Explanation Sheet** oder relevanten Detailkontext
5. Nutzer erkennt: gesperrt, nicht verfügbar, Rolle ungeeignet, Invite offen etc.
6. Nutzer geht weiter zu **Member Detail** oder **Invite / Manage Action**
7. Zustand wird aufgelöst oder bewusst akzeptiert

## UX-Ziel

Technische Steam-Logik in **verständliche Handlungsschritte** übersetzen.

---

# 7.4 Wishlist strukturieren ? Smart View nutzen ? Liste entlasten

## Flow

1. Nutzer öffnet Wishlist Overview
2. Viele Einträge, geringe Übersicht
3. Filter + Search + Saved Views werden genutzt
4. Nutzer öffnet oder erstellt **Saved View**
5. In der View werden nur relevante Titel gezeigt
6. optional Multi-select ? Add to Set / Mark Priority
7. Liste wird fokussierter, statt nur länger

## UX-Ziel

VENT soll Wunschlisten **verdichten**, nicht nur schöner darstellen.

---

# 7.5 Family Member prüfen ? Überschneidung sehen ? gemeinsame Relevanz erkennen

## Flow

1. Nutzer öffnet Families Overview
2. Tap auf Member Card ? **Family Member Detail**
3. Nutzer sieht gemeinsame Interessen / Besitzüberschneidungen
4. Sprung zu relevanten Spielen oder Shared Library
5. optional Rücksprung in Wishlist-Kontext

## UX-Ziel

Families nicht nur administrativ, sondern **spielerisch relevant** machen.

---

# 8. Navigation Flow Map (vereinfacht)

## Root

* Home
* Wishlist
* Families
* Activity
* Profile

## Von Home

* ? Wishlist Overview
* ? Families Overview
* ? Activity Feed
* ? Game Detail
* ? Shared Library Detail
* ? Quick Sheets

## Von Wishlist

* ? Wishlist Set Detail
* ? Game Detail
* ? Compare Flow
* ? Filter / Sort / Bulk Sheets

## Von Families

* ? Family Member Detail
* ? Shared Library Detail
* ? Invite / Manage Flow
* ? Explanation Sheet

## Von Activity

* ? Game Detail
* ? Families Overview
* ? Shared Library Detail
* ? Wishlist Set Detail

---

# 9. Mikrointeraktionsregeln

## Feedback

* Jede spürbare Aktion bekommt direkt sichtbares Feedback.
* Batch Actions brauchen klare Bestätigung.
* Reversible Aktionen bekommen Undo, wenn sinnvoll.

## Animation

* ruhig, kurz, funktional
* kein dekoratives Gezappel
* Sheets und Zustandswechsel dürfen weich sein, aber nie träge

## Fokus

* Search-Fokus klar
* Selection Mode klar
* offene Sheets klar
* aktive Filter klar

---

# 10. Fehler- und Ausnahmeverhalten

## Regeln

* Fehler erklären, nicht nur anzeigen
* stale data als Zustand kenntlich machen
* Restriktionen als nachvollziehbare Logik formulieren
* leere Zustände, Fehlerzustände und gefilterte Nulltreffer klar unterscheiden

## Beispiele

* "Keine Treffer für diesen Filter" ? "Daten konnten nicht geladen werden"
* "Aktuell gesperrt" braucht eine Begründung oder einen Erklärungslink

---

# 11. Priorisierte Interaktionen für die erste Version

## Sofort einplanen

* Tap
* Scroll
* Search
* Filter toggling
* Bottom Sheets
* Back-Handling
* Selection Mode via long press

## Später sinnvoll ergänzen

* Swipe actions
* Re-tap on tab = scroll to top
* Quick mute / advanced activity controls
* rich crosslinks mit Herkunftshinweisen

---

# 12. Entscheidender Produktpunkt

VENT gewinnt UX-seitig nicht durch spektakuläre Gesten, sondern durch **glasklare Zustandswechsel und saubere Arbeitsflüsse**.

Das heißt:

* jede Interaktion braucht einen sichtbaren Effekt
* jeder Sprung braucht einen verständlichen Grund
* jeder problematische Zustand braucht einen lesbaren Pfad zur Erklärung

Wenn diese drei Dinge stimmen, fühlt sich VENT sofort überlegen an — auch ohne visuelles Feuerwerk.

