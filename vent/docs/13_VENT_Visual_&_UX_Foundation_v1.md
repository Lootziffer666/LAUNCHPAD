# VENT Visual & UX Foundation v1

## Zweck

Dieses Dokument definiert die visuelle und UX-seitige Grundhaltung von VENT.

Es ist die verbindliche Übersetzung von:

* Produktstrategie
* Navigationslogik
* Companion-Layer-Prinzip
* Steam-Air-/Steam-Metro-Inspiration
* dem Ziel einer **hübschen, minimalistischen, ruhigen und hochwertigen** App

Dieses Dokument ist keine lose Stilbeschreibung.
Es dient als Grundlage für:

* Screen Design
* Component Specs
* Token-Systeme
* Figma-Aufbau
* Motion-Regeln
* Implementierungsentscheidungen

---

# 1. Design-Leitidee

## Kernformel

VENT ist:
**Steam Air × Steam Metro × Minimal Product Calm**

Das heißt:

* vertraute Steam-Nähe im Charakter
* klarere Struktur als Valve
* mehr Luft
* weniger Reizdichte
* weniger technische Unruhe
* weniger „Gamer-UI“-Lärm
* stärkere visuelle Ordnung
* hochwertigere Ruhe

VENT soll nicht steril wirken.
VENT soll nicht generisch nach Standard-B2B-App aussehen.
VENT soll nicht nach Billig-Redesign aussehen.
VENT soll sich anfühlen wie:

* elegant
* ruhig
* erwachsen
* klar
* modern
* unaufgeregt hochwertig

---

# 2. Visuelle Positionierung

## 2.1 Was von Steam Air übernommen wird

* Leichtigkeit
* Modernität
* transluzente oder atmosphärische Flächen nur sehr gezielt
* großzügigeres Raumgefühl
* weiche Übergänge
* moderne Flächenwirkung

## 2.2 Was von Steam Metro übernommen wird

* Klarheit der Blöcke
* starke Lesbarkeit
* strukturierte Informationshierarchie
* präzise Ausrichtung
* reduzierte Navigationslogik
* funktionale Strenge

## 2.3 Was bewusst entfernt oder abgeschwächt wird

* visuelle Schwere
* enge Informationspackung
* dunkle, gedrungene Tool-Atmosphäre
* aggressive Kontrastblöcke
* unnötige Zierlinien
* laute Badge-Inflation
* überfrachtete Kartenwände
* Feed-artige Reizkulisse

---

# 3. Atmosphärische Ziele

VENT soll sich anfühlen wie:

* ein ruhiges Kontrollzentrum
* ein intelligenter Filter über Steam-Komplexität
* ein schöner Entscheidungsraum
* ein aufgeräumtes mobiles Produkt

VENT soll sich **nicht** anfühlen wie:

* ein chaotischer Launcher
* ein überdekorierter Skin
* ein Dashboard-Friedhof
* ein gameriges Neon-Interface
* ein dichter Admin-Client
* ein Social-Media-Feed

---

# 4. Kernprinzipien der UX

## 4.1 Relevanz vor Vollständigkeit

Nicht alles gleichzeitig zeigen.
Nicht jede Datenquelle sichtbar machen.
Nicht jede Systemmöglichkeit gleichwertig behandeln.

Die Oberfläche zeigt bevorzugt:

* aktuell Relevantes
* handlungsnahe Informationen
* entscheidungsrelevante Zustände
* klar priorisierte Kontexte

## 4.2 Ruhe vor Dichte

Mehr Informationen sind nicht automatisch besser.
Whitespace ist kein Luxus, sondern ein funktionales Werkzeug.

Whitespace dient in VENT dazu:

* Gruppen ohne zusätzliche Boxen zu trennen
* Hierarchien sichtbar zu machen
* Scanbarkeit zu erhöhen
* Stress zu reduzieren
* Fokus zu führen

## 4.3 Kontext vor Klicktiefe

Wo möglich, soll der Nutzer zuerst verstehen:

* worum es geht
* warum es wichtig ist
* was der sinnvolle nächste Schritt ist

Erst danach folgt die tiefe Aktion.

## 4.4 Wenige Hauptpfade

Die Bottom Navigation bleibt stabil.
Sekundäre Komplexität wird über:

* Sheets
* Kontextmenüs
* Segmentierung
* Detailflächen
* Inline-Erweiterungen

aufgelöst, nicht über immer neue Root-Wege.

## 4.5 Schöne Funktionalität

Jede ästhetische Entscheidung muss mindestens eines verbessern:

* Orientierung
* Lesbarkeit
* Wertigkeit
* Ruhe
* Fokus
* Vertrauen

Dekoration ohne Funktion ist zu vermeiden.

## 4.6 Erklärte Zustände

VENT darf keine unkommentierten Rätselzustände zeigen.

Wenn etwas blockiert, reduziert, aktiv, kritisch oder empfohlen ist, muss die Oberfläche möglichst klar beantworten:

* was ist los?
* warum?
* wen betrifft es?
* was kann ich tun?

## 4.7 Reversible Aktionen bevorzugen

Für Schnellaktionen gilt:

* direkt
* klar
* ungefährlich
* rücknehmbar, wo sinnvoll

---

# 5. Informationsarchitektur im visuellen Verhalten

## 5.1 Primär, sekundär, tertiär

Jeder Screen braucht eine klar sichtbare Hierarchie aus:

### Primär

Das, worauf der Blick zuerst fallen soll.
Zum Beispiel:

* große Headline
* zentrale Zahl oder Statusaussage
* wichtigste Karte
* primäre CTA

### Sekundär

Kontext, der die primäre Aussage stützt.
Zum Beispiel:

* Subheadline
* Metadaten
* kleine Badges
* unterstützende Hinweise

### Tertiär

Details, die nur bei Bedarf relevant sind.
Zum Beispiel:

* Zeitstempel
* technische Hinweise
* tiefe Zusatzinformationen
* selten genutzte Tools

Regel:
Tertiäre Informationen dürfen die primäre Lesespur nie kapern.

## 5.2 Chunking statt Container-Inflation

Nicht jede Gruppe braucht eine eigene sichtbare Box.
Gruppierung darf auch entstehen durch:

* Abstand
* Typografie
* Ausrichtung
* Divider mit Maß
* Hintergrundwechsel in niedriger Intensität

## 5.3 Eine starke Aussage pro visueller Einheit

Jede Karte, Section oder Zeile braucht ein klares kommunikatives Zentrum.
Nicht mehrere gleich laute Botschaften in einem Container mischen.

---

# 6. Layout-System

## 6.1 Gesamtcharakter

* großzügig
* sauber ausgerichtet
* wenige harte Brüche
* ruhige vertikale Rhythmik
* klarer Scrollfluss

## 6.2 Spacing-Haltung

VENT soll visuell atmen.

Spacing wird genutzt, um:

* Sections sauber zu trennen
* Listen lesbar zu halten
* primäre Karten hervorzuheben
* Enge zu vermeiden
* Blickführung zu erzeugen

### Grundregel

Lieber eine Informationsebene weniger und dafür sauberer separiert als alles eng zusammenzuziehen.

## 6.3 Rasterlogik

* konsistentes Grundraster
* saubere linke/rechte Kanten
* klar definierte Inhaltsbreiten
* stabile Card-/List-Ausrichtung
* keine zufälligen Breitenwechsel

## 6.4 Vertikale Rhythmik

Sections folgen einem wiedererkennbaren Muster aus:

* Header
* Inhalt
* optionaler Aktionsebene
* definierter Abstand zur nächsten Section

Der Rhythmus darf variieren, aber nicht chaotisch wirken.

---

# 7. Screen-Aufbau

## 7.1 Standardaufbau eines Hauptscreens

1. Top Area / Safe Header
2. Screen Title + optionaler Kontext
3. Primary Highlight / Key Summary
4. Hauptinhalt
5. sekundäre Module / ergänzende Karten
6. Bottom Navigation

## 7.2 Sticky-Verhalten

Sticky-Elemente nur dort, wo sie echte Orientierung oder Aktionserleichterung bringen.
Geeignet für:

* aktive Filterleisten
* segmentierte Bereichswahl
* zentrale Such-/Sortierkontexte

Nicht geeignet für:

* unnötige Promo-Flächen
* redundante Titelwiederholung
* übermäßig viele Floating-Actions

## 7.3 Scroll-Verhalten

Scrollen soll sich ruhig und leicht anfühlen.
Nicht hektisch.
Nicht sprunghaft.
Nicht überanimiert.

---

# 8. Kartenprinzip

## 8.1 Rolle von Karten

Karten sind in VENT ein Strukturwerkzeug, kein Selbstzweck.

Karten dürfen verwendet werden, wenn sie mindestens eines leisten:

* eine wichtige Einheit klar abgrenzen
* Aktion und Kontext sinnvoll zusammenhalten
* Priorität sichtbar machen
* scannbare Modularität erzeugen

## 8.2 Karten nicht inflationär einsetzen

Nicht jede Liste braucht Karten.
Nicht jeder Status braucht eine Karte.
Nicht jede Zeile braucht Shadow, Radius und Rahmen.

Zu viele Karten erzeugen:

* Lautstärke
* Flächenmüll
* Blickzerstückelung
* billigere Wertigkeit

## 8.3 Kartentypen

### Hero Card

Für die wichtigste Aussage des Screens.
Selten, groß, präzise.

### Context Card

Für verdichtete Zusammenhänge.

### Action Card

Für klaren Handlungsfokus.

### Inline Card / Row Card

Für Listen oder modulare Zeilen mit leichter Trennung.

## 8.4 Kartenstil

* ruhige Eckenradien
* leichte Tiefenwirkung nur gezielt
* klare Innenabstände
* keine unnötig dicken Konturen
* Fokus auf Inhalt statt auf Rahmen

---

# 9. Listenprinzip

## 9.1 Listen vor Karten, wenn Vergleich wichtig ist

Sobald schnelle Vergleichbarkeit wichtig ist, sind Listen oder dichte Row-Layouts oft besser als isolierte Karten.

Geeignet für:

* Wishlist Rows
* Activity Items
* Family-Mitglieder
* Filterergebnisse

## 9.2 Zeilenstruktur

Jede wichtige Zeile sollte klar gegliedert sein in:

* primäre Bezeichnung
* sekundäre Metainformation
* relevanten Status
* mögliche Schnellaktion

## 9.3 Zeilen nicht überladen

Mehr als ein dominanter Statusindikator pro Zeile ist meist zu viel.

---

# 10. Typografie

## 10.1 Tonalität

Typografie in VENT ist:

* ruhig
* erwachsen
* modern
* schnörkellos
* lesbar
* präzise

## 10.2 Hierarchie

Die Hierarchie soll stärker über:

* Größe
* Gewicht
* Abstand
* Position

und weniger über aggressive Farbwechsel gelöst werden.

## 10.3 Headline-Verhalten

Headlines sollen:

* klar führen
* nicht schreien
* nicht dekorativ überinszeniert sein
* gut mit Metadaten zusammenspielen

## 10.4 Metadaten

Metadaten bleiben sichtbar, aber sekundär.
Sie dürfen nicht so schwach sein, dass sie verschwinden, aber auch nicht die Hauptinformation konkurrenzieren.

## 10.5 Zahlen und Preise

Zahlen, Prozentwerte und Preise sind in VENT häufig wichtig.
Sie müssen deshalb:

* schnell scanbar sein
* konsistent platziert werden
* in visueller Gewichtung berechenbar bleiben

---

# 11. Farbe

## 11.1 Farbfunktion

Farbe dient in VENT primär dazu:

* Bedeutung zu markieren
* Hierarchie zu unterstützen
* Orientierung zu geben
* Akzente zu setzen

Nicht dazu:

* Mangel an Struktur zu kaschieren
* jede Ebene bunt zu markieren
* Aufmerksamkeit künstlich zu erzwingen

## 11.2 Farbcharakter

* hellere, ruhige Grundflächen bevorzugt
* dunkle Modi optional, aber nicht führend
* wenige Akzentfarben
* semantische Farben klar dosiert
* neutrale Flächen sollen hochwertig statt leblos wirken

## 11.3 Semantische Farbe

Farbe mit Bedeutung nur dort, wo echte Semantik vorliegt:

* positiv
* Warnung
* kritisch
* aktiv
* hervorgehoben

Nicht jede Rabattzahl, jeder Badge und jeder Filterchip braucht maximale Signalwirkung.

## 11.4 Kontrastphilosophie

Kontrast soll klar genug für gute Lesbarkeit sein, aber nicht brutal hart, wenn es die Gesamtatmosphäre unnötig verschlechtert.

---

# 12. Iconografie

## 12.1 Stil

* reduziert
* konsistent
* funktional
* nicht verspielt
* nicht pseudo-futuristisch

## 12.2 Einsatz

Icons unterstützen schnelle Orientierung, sollen aber selten allein bedeutungstragend sein.
Text bleibt wichtig.

## 12.3 Gewichtung

Icons dürfen nie lauter sein als die Hauptinformation.

---

# 13. Badges, Chips, Status

## 13.1 Badge-Disziplin

Badges und Chips nur dort, wo sie echte Orientierung bieten.
Keine inflationäre Kennzeichnungsorgie.

## 13.2 Priorisierung

Wenn mehrere Status gleichzeitig existieren, braucht es eine Prioritätslogik.
Nicht alles darf gleich alarmiert aussehen.

## 13.3 Chips

Chips sind besonders geeignet für:

* aktive Filter
* Saved View-Kontext
* leichte Statuszusammenfassungen
* segmentierte Steuerung

Sie sollen kompakt, lesbar und ruhig bleiben.

---

# 14. Interaktionsmuster

## 14.1 Sheets vor neuen Seiten

Wo sinnvoll, bevorzugt VENT:

* Bottom Sheets
* Action Sheets
* Quick Peek Sheets
* kleine Kontextoberflächen

statt Nutzer unnötig tief in neue Seiten zu schicken.

## 14.2 Detailseiten nur bei echtem Tiefenbedarf

Eine eigene Detailseite ist gerechtfertigt, wenn:

* Erklärungskomplexität steigt
* mehrere Aktionen zusammenkommen
* Kontext für Vertrauen wichtig ist
* die Aufgabe Fokus braucht

## 14.3 Inline-Erweiterung

Für leichte Zusatzinfos oder sekundäre Zustände kann Inline-Expansion sinnvoller sein als Seitenwechsel.

## 14.4 Undo und Rücknahme

Sofortaktionen sollen, wo möglich, mit Undo oder klarer Rückführung arbeiten.

---

# 15. Motion

## 15.1 Funktion von Motion

Bewegung dient in VENT dazu:

* Übergänge verständlich zu machen
* Fokus zu führen
* Ursache und Wirkung sichtbar zu machen
* Leichtigkeit zu erzeugen

Nicht dazu:

* Oberflächen spektakulär zu inszenieren
* Inhalte zu verzögern
* Reiz zu produzieren

## 15.2 Charakter

* weich
* kurz
* präzise
* ruhig
* nicht überfedernd
* nicht showy

## 15.3 Geeignete Motion-Fälle

* Sheet-Ein- und Ausblendung
* Segment-/Filterwechsel
* Card-Expansion
* Listenaktualisierung
* Erfolg / Undo-Feedback
* kleine Fokusverschiebungen

---

# 16. Helligkeit und Theme-Haltung

## 16.1 Leitmodus

Der bevorzugte Charakter von VENT ist **hell, luftig und ruhig**.

Dark Mode kann unterstützt werden, ist aber **nicht** die ästhetische Leitidentität.

## 16.2 Light Mode Ziel

Light Mode soll nicht klinisch wirken.
Er soll:

* weich
* hochwertig
* modern
* etwas atmosphärisch
* aber sehr lesbar

sein.

## 16.3 Dark Mode Ziel

Falls vorhanden:

* gedämpft statt pechschwarz
* ruhig statt aggressiv
* mit gleich guter Hierarchie
* ohne neonhafte Übertreibung

---

# 17. Modulspezifische UX-Haltung

## 17.1 Home

* wenige starke Highlights statt vieler gleich lauter Cards
* Fokus auf Priorität und nächste Handlung
* klare modulübergreifende Orientierung

## 17.2 Wishlist

* scannbar
* filterstark
* vergleichsfreundlich
* mehr Listenlogik als Card-Zoo
* Smart Views klar, aber nicht technisch trocken

## 17.3 Families

* Status verständlich
* Konflikte erklärt
* Personen- und Besitzlogik klar trennbar
* Warnungen ruhig, aber unmissverständlich

## 17.4 Activity

* Feed nur mit echter Relevanz
* Gruppierung statt Ereignisrauschen
* klare Typisierung
* starke Rücksprungmöglichkeiten in die betroffenen Kontexte

## 17.5 Profile

* nüchterner, aber nicht langweilig
* Utility-Hub mit sauberer Struktur
* klare Trennung von Darstellung, Verhalten, Verbindungen und Meta

---

# 18. Anti-Patterns

Folgendes ist für VENT explizit zu vermeiden:

* zu viele gleich aussehende Karten
* überladene Dashboard-Screens
* aggressive Gamer-Farbwelten
* stark dekorative Glassmorphism-Spielerei ohne Funktion
* zu viele Floating Buttons
* unruhige Shadow-Landschaften
* zu kleine Tap-Ziele
* zu viele Badges gleichzeitig
* semantisch unklare Icons
* zu starke visuelle Dichte
* dunkle, schwere Tool-Anmutung als Standard
* Feature-Friedhof unter „More"

---

# 19. Qualitätskriterien

Ein Screen ist in VENT visuell gelungen, wenn:

* die wichtigste Aussage in unter 2 Sekunden erkennbar ist
* die Blickführung klar ist
* keine unnötige Enge entsteht
* primäre und sekundäre Ebenen sauber getrennt sind
* Status verständlich bleiben
* der Screen ruhig, aber nicht leer wirkt
* die Oberfläche hochwertig statt generisch wirkt
* Aktionen ohne Sucharbeit auffindbar sind

---

# 20. Schlussformel

Die visuelle und UX-seitige Essenz von VENT lautet:

**Ruhige Eleganz statt UI-Lärm.**

**Steam-nah im Charakter, aber klarer, schöner und luftiger.**

**Minimalistisch, ohne kalt zu werden.**

**Produktiv, ohne trocken zu wirken.**

**Hochwertig, ohne sich aufzudrängen.**

