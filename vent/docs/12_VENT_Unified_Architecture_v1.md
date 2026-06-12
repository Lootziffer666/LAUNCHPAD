# VENT Unified Architecture v1

## Produktleitbild

VENT ist kein alternativer Steam-Client und kein Versuch, alle offiziellen Valve-Apps vollständig zu ersetzen.

VENT ist ein **Companion Layer** für mobile Steam-Nutzung:

* es **verdichtet Informationen**
* es **ordnet Relevanz**
* es **reduziert Reibung**
* es **führt Nutzer schneller zur richtigen Entscheidung**
* es **übergibt sensible oder tiefe Plattformaktionen sicher an offizielle Flows**

VENT soll sich anfühlen wie eine **stilistisch veredelte, deutlich ruhigere Mischung aus Steam Air und Steam Metro**:

* klar
* elegant
* modern
* leicht
* reduziert
* hochwertig
* mit viel Whitespace
* mit sauberen Hierarchien
* mit visueller Ruhe statt UI-Lärm

Nicht maximal verspielt.
Nicht brutal nüchtern.
Nicht überladen.
Nicht klonhaft.

Die App ist **hübsch, minimalistisch und produktnah**.

---

## Designhaltung

### Visuelle Richtung

**Steam Air × Steam Metro — aber entschlackt.**

Das bedeutet:

* großzügige Flächen
* klare Raster
* wenige, starke Akzente
* präzise Typografie
* zurückhaltende Tiefenwirkung
* reduzierte Kartenlogik
* wenig visuelles Rauschen
* hohe Scanbarkeit
* starke Trennung zwischen primären und sekundären Informationen

### Atmosphärische Ziele

VENT soll nicht wie ein chaotischer Feed wirken.
VENT soll nicht wie ein utilitaristisches Settings-Tool wirken.
VENT soll sich anfühlen wie:

* ein ruhiges Kontrollzentrum
* ein intelligenter Filter über komplexen Steam-Kontexten
* eine Oberfläche, die Entscheidungen erleichtert, statt Aufmerksamkeit zu fressen

### UX-Haltung

* wenige Hauptpfade
* kurze Wege
* klare nächste Schritte
* reversible Schnellaktionen
* erklärende statt kryptische Zustände
* Kontext vor Klicktiefe
* Relevanz vor Vollständigkeit

---

## Kernthese

Valve trennt mobile Nutzung heute funktional in mehrere Welten, etwa:

* Store / Wishlist / Account
* Chat / soziale Präsenz
* Remote Play / Link / Geräteübergänge
* Family-Management / Zugriffslogik

Nutzer denken jedoch nicht in App-Grenzen, sondern in Vorhaben:

* Soll ich das kaufen?
* Ist es gerade sinnvoll?
* Hat das jemand in der Family schon?
* Kann ich das jetzt spielen?
* Warum ist etwas blockiert?
* Was hat sich verändert, das relevant für mich ist?

VENT bündelt genau diese Vorhaben in einer ruhigeren, verständlicheren und schöneren Oberfläche.

---

## Architekturprinzip

VENT basiert auf drei Schichten:

### 1. Decision Layer

Die App hilft bei Entscheidungen.

Beispiele:

* Was ist kaufwürdig?
* Was ist gerade reduziert und tatsächlich relevant?
* Welche Wishlist-Einträge sind aktuell interessant?
* Welche Titel sind für die Family redundant?
* Welche Aktion bringt gerade den größten Nutzen?

### 2. Context Layer

Die App erklärt, **warum** etwas gerade relevant ist.

Beispiele:

* Preisziel erreicht
* Family-Mitglied besitzt das Spiel bereits
* Shared Library ist blockiert
* Ein bestimmtes Set ist betroffen
* Ein Alert braucht Handlung
* Ein Profilwechsel ist sinnvoll

### 3. Safe Handoff Layer

VENT versucht nicht, jede tiefe Plattformfunktion selbst zu imitieren.

Stattdessen:

* sammeln
* verdichten
* erklären
* vorbereiten
* dann sicher in den offiziellen passenden Flow übergeben

Das schützt Vertrauen, reduziert Wartungsrisiken und hält den Kernfokus klar.

---

## Produktrolle von VENT

VENT ist:

* **kein Vollklon**
* **kein zweiter Store**
* **kein vollwertiger Chat-Ersatz in v1**
* **kein vollständiger Streaming-Client in v1**

VENT ist:

* Entscheidungsmaschine
* Relevanzfilter
* Kontext-Hub
* Familien-/Wishlist-Optimierer
* intelligenter Launcher in offizielle Folgeaktionen

---

## Verbindliche Primärnavigation v1

### Root Navigation

* **Home**
* **Wishlist**
* **Families**
* **Activity**
* **Profile**

Diese Struktur ist für v1 verbindlich.

### Nicht als Root-Tab in v1

* Sales
* Accounts
* More
* Chat
* Link

### Begründung

#### Sales

Sales ist kein eigenständiges Produktmodul, sondern eine Perspektive auf:

* Wishlist
* Activity
* Home

#### Accounts

Accounts ist keine gleichwertige Hauptaufgabe im Alltag, sondern Teil von:

* Profil
* Einstellungen
* Identität
* Verbindungen

#### More

Ein generischer Restetab erzeugt Unschärfe und wirkt nach Utility-App statt nach fokussiertem Produkt.

#### Chat

Chat ist in v1 nicht die stärkste Differenzierung von VENT. Der Mehrwert liegt zunächst in Entscheidungsverdichtung, nicht in Messaging.

#### Link

Link/Streaming soll in v1 kontextuell andocken, nicht als eigener Hauptbereich aufgeblasen werden.

---

# Moduldefinitionen

## 1. Home

### Rolle

Home ist das ruhige Lagebild der App.

Home beantwortet:
**Was ist gerade wichtig, was ist neu, was lohnt sich als Nächstes?**

### Primäre Aufgaben

* Relevanz bündeln
* wichtige Veränderungen hervorheben
* schnelle Einstiege bieten
* modulübergreifende Zusammenhänge sichtbar machen
* Handlung priorisieren

### Inhalte

* Greeting / aktiver Profilkontext
* Quick Actions
* Wishlist Highlights
* Family Highlights
* Action Needed / Alerts
* Recent Activity Summary
* Continue / Resume / zuletzt relevante Kontexte

### Was Home nicht sein darf

* kein überladener Feed
* kein Dashboard-Friedhof
* keine Kachelwüste
* kein Ort für jede Kleinigkeit

### Native in VENT

* Informationskomposition
* Priorisierung
* Quick Actions
* Cross-Module Cards
* Handlungseinstiege

### Aggregiert / erklärt

* warum ein Rabatt jetzt relevant ist
* warum ein Family-Thema jetzt sichtbar sein sollte
* warum eine View oder Liste Aufmerksamkeit verdient

### Safe Handoff

* tiefe Produktseiten
* tiefe offizielle Aktionspfade
* sensible Account- oder Plattformflüsse

---

## 2. Wishlist

### Rolle

Wishlist ist das stärkste Kernmodul von VENT.

Sie beantwortet:
**Was davon ist jetzt wirklich relevant, kaufwürdig oder sortierungswürdig?**

### Primäre Aufgaben

* filtern
* sortieren
* priorisieren
* gruppieren
* vergleichen
* markieren
* Bulk-Aktionen auslösen

### Inhalte

* Wishlist Overview
* Search
* Filter / Sort
* Saved Views / Sets
* Active Filter Chips
* Bulk Selection
* Game Rows / Cards
* Compare
* Tag / Set Management

### Native in VENT

* Sets / Saved Views
* Compare
* Bulk Actions
* Relevanzsortierung
* Zielpreis-Logik
* Organisationslogik
* lokale Entscheidungswerkzeuge

### Aggregiert / erklärt

* Preis unter Zielwert
* Family besitzt Titel bereits
* Titel passt in bestimmtes Set
* Titel ist durch Event oder Aktivität gerade relevanter
* Titel ist Koop-/Solo-/Genre-bezogen in einer Saved View priorisiert

### Safe Handoff

* finaler Kauf
* tiefe Produktdetails
* bestimmte offizielle Store-Aktionen

### Produktregel

Wishlist ist kein halber Store.
Wishlist ist die **Entscheidungsschicht vor dem Store**.

---

## 3. Families

### Rolle

Families macht Family-Logik verständlich, sichtbar und handhabbar.

Families beantwortet:
**Wer kann was nutzen, warum gerade nicht, und was bedeutet das für mich?**

### Primäre Aufgaben

* Family-Kontext erklären
* Besitz sichtbar machen
* Konflikte einordnen
* Verfügbarkeit darstellen
* relevante Aktionen anbieten

### Inhalte

* Family Status Header
* Members Summary
* Shared Library Status
* Locks / Availability / Warnings
* Recent Family Activity
* Invite / Manage Actions
* Member Detail
* Shared Library Detail

### Native in VENT

* Family-Übersicht
* Konfliktdarstellung
* Besitz-/Verfügbarkeitskontext
* Warnungen mit Erklärung
* zusammengefasste Family-Aktivität

### Aggregiert / erklärt

* warum etwas blockiert ist
* wer gerade eine Ressource belegt
* ob ein Kauf redundant wäre
* welche Alternative näherliegt
* welche Person oder Bibliothek betroffen ist

### Safe Handoff

* sensible Family-Verwaltung
* offizielle Einladungs-/Rechte-Flows
* tiefe Plattformlogik

### Produktregel

Families ist kein trockenes Admin-Modul.
Families ist spielrelevanter Entscheidungs- und Verfügbarkeitskontext.

---

## 4. Activity

### Rolle

Activity ist der Relevanzfeed der App.

Nicht sozialer Lärm.
Nicht irrelevante Chronik.

Activity beantwortet:
**Was hat sich verändert, das für mich tatsächlich Bedeutung hat?**

### Primäre Aufgaben

* relevante Ereignisse sammeln
* nach Typ ordnen
* Änderungen verständlich machen
* schnellen Rücksprung in die betroffenen Kontexte erlauben

### Inhalte

* Activity Feed
* Event Groups
* Feed Filters
* Notifications Inbox
* eventbezogene Detail-Sheets

### Native in VENT

* Feed-Struktur
* Gruppierung
* Event-Typisierung
* Filterung
* Notification Handling
* Verdichtung statt Rohchronik

### Aggregiert / erklärt

* Preisbewegungen
* Family-Ereignisse
* Listenänderungen
* Statusänderungen
* Systemhinweise
* Alerts mit Handlungsvorschlag

### Safe Handoff

* tiefe Zielansichten in offiziellen Flows
* Kontextsprünge zu externen Detailaktionen

### Produktregel

Activity darf niemals zum irrelevanten Dauerstrom verkommen.
Jeder Eintrag braucht eine klare Begründung für seine Existenz.

---

## 5. Profile

### Rolle

Profile bündelt Identität, Einstellungen, Verbindungen und Verhaltenspräferenzen.

Profile beantwortet:
**Wer bin ich hier gerade, wie verhält sich die App, und welche Verbindungen sind aktiv?**

### Primäre Aufgaben

* aktives Profil erklären
* Verbindungen verwalten
* App-Verhalten konfigurieren
* Darstellung steuern
* Hilfs- und Meta-Bereiche bündeln

### Inhalte

* Profile Overview
* Connected Accounts
* Appearance Settings
* Notifications Settings
* App Behavior
* Experimental Features
* Help / About
* Legal / Support
* Utilities wie ggf. Redeem / Activate Entry

### Native in VENT

* Profilhub
* lokale Präferenzen
* Darstellung
* Dichte / UI-Verhalten
* Notification-Einstellungen
* experimentelle Schalter

### Aggregiert / erklärt

* welcher Account aktiv ist
* warum ein Kontext account-sensitiv ist
* welche Verbindung intakt / fehlerhaft ist
* welche Präferenz aktuelle Darstellung beeinflusst

### Safe Handoff

* tiefe Authentifizierung
* sensible Kontoaktionen
* externe Kontoverknüpfungen
* offizielle Aktivierungs- oder Rechtepfade

---

# Querschnittssysteme

## Quick Actions

Quick Actions existieren modulübergreifend.

Ziele:

* kürzere Wege
* reversible Aktionen
* weniger Kontextwechsel
* lokale Produktivität

Beispiele:

* zu Saved View springen
* Filter zurücksetzen
* Family-Kontext öffnen
* relevante Alerts prüfen
* Compare starten
* Store-/Produkt-Handoff öffnen

Quick Actions sollen bevorzugt in Sheets, Menüs oder kleine kontextuelle Oberflächen ausgelagert werden — nicht als dauerhafte Übermöblierung der Oberfläche.

---

## Compare

Compare ist ein Kern-Feature der Entscheidungslogik.

Es gehört primär zu Wishlist, kann aber aus Home oder Activity angesprungen werden.

Ziele:

* Kaufentscheidung beschleunigen
* redundante Favoriten besser ordnen
* Alternativen sichtbar machen
* Preis-/Set-/Family-Kontext nebeneinander legen

---

## Saved Views / Sets

Saved Views sind ein zentrales Differenzierungsmerkmal.

Beispiele:

* unter Zielpreis
* Koop mit Freunden
* Family-relevant
* Singleplayer backlog
* Kindergeeignet
* Kaufen wenn Rabatt > x

Saved Views sollen sich nicht wie technische Filterpresets anfühlen, sondern wie **persönliche, hilfreiche Entscheidungsräume**.

---

## Notifications / Alerts

Alerts und Benachrichtigungen sind nur dann wertvoll, wenn sie:

* relevant sind
* erklärt werden
* in Handlung überführen
* nicht nerven

Regeln:

* keine belanglosen Pushs
* klare Priorisierung
* gute Gruppierung
* verständliche Sprache
* sichtbarer Zusammenhang mit Wishlist, Family oder Profilkontext

---

# Native vs. Handoff

## Native in VENT

VENT soll in v1 nativ stark sein bei:

* Relevanzdarstellung
* Priorisierung
* Vergleich
* Filtern / Sortieren
* Sets / Saved Views
* Bulk Actions
* Family-Kontext
* Activity-Verdichtung
* Profil- und Darstellungslogik
* Quick Actions

## Aggregiert / erklärt in VENT

VENT soll stark sein bei:

* Preisbedeutung
* Family-Bedeutung
* Verfügbarkeitsgründen
* Besitzüberschneidungen
* Handlungspriorisierung
* Kontextzusammenführung

## Offizieller Safe Handoff

VENT soll in v1 nicht künstlich vollnativ erzwingen bei:

* finalem Checkout
* tiefen Kontoprozessen
* sensibler Family-Verwaltung
* vollem Streaming / Remote-Play
* vollwertigem Messaging
* komplexen Plattform-Rechtepfaden

---

# Rolle von Steam, Chat und Link

## Steam

Primäre Quelle für:

* Produktkontext
* Wishlist-Kontext
* Preis-/Store-Kontext
* Account-/Profilkontext
* Family-nahe Verwaltungslogik

## Chat

In v1 sekundär.
Potenzielle spätere Quelle für:

* Presence
* soziale Relevanz
* Einladungen
* Freundes-/Koop-Kontext

Nicht Root-Modul in v1.

## Link

In v1 kontextuell.
Potenzielle spätere Quelle für:

* Spielbarkeit jetzt
* Gerätebezug
* Launch-/Streaming-Handoffs

Nicht Root-Modul in v1.

---

# UX-Regeln

## 1. Relevanz vor Vollständigkeit

Nicht alles zeigen.
Nur das, was jetzt hilft.

## 2. Ruhe vor Dichte

Lieber Luft, klare Gruppen und saubere Hierarchie als Informationsteppich.

## 3. Schöne Funktionalität

Die App soll hübsch sein, aber nie rein dekorativ.
Jede visuelle Entscheidung muss Nutzwert, Lesbarkeit oder Orientierung verbessern.

## 4. Wenige Hauptpfade

Root-Navigation stabil halten.
Mehr Tiefe lieber über Sheets, Detailflächen und sekundäre Einstiege lösen.

## 5. Erklärte Zustände

Keine kryptischen Sperren, keine dumpfen Warnungen, keine unkommentierten Konflikte.

## 6. Reversible Schnellaktionen

Wo sinnvoll: Undo, Rücknahme, ungefährliche Sofortaktion.

## 7. Kein Feed-Lärm

Activity, Home und Alerts dürfen nie wie beliebige Content-Feeds wirken.

---

# Visuelle Systemregeln

## Grundcharakter

* hell und luftig bevorzugt
* dark mode optional, aber nicht leitend
* viel Whitespace
* präzise Ausrichtung
* klare Raster
* typografische Hierarchie statt aggressiver Farben
* wenige Akzentfarben
* ruhige Karten
* reduzierte Icons

## Kartenprinzip

* Karten nur dort, wo sie Struktur schaffen
* nicht jede Information in eigene Box zwingen
* Gruppen dürfen auch über Whitespace und Typografie entstehen
* Karten mit klarer Primäraktion und klarer sekundärer Meta-Ebene

## Typografie

* ruhig
* erwachsen
* klar
* wenig verspielte Ausreißer
* hohe Lesbarkeit
* Headlines deutlich, aber nicht brüllend
* Metadaten sekundär, aber nicht versteckt

## Bewegung

* weich
* kurz
* funktional
* kein Effektfeuerwerk
* Übergänge als Orientierungshilfe

---

# Abgrenzung v1 / später

## v1

* Home
* Wishlist
* Families
* Activity
* Profile
* Sets / Saved Views Basis
* Compare Basis
* Quick Actions Basis
* Safe Handoff in offizielle Folgeaktionen

## v1.5

* stärkere Smart Views
* bessere Relevanz-Logik
* tiefere Compare-Flows
* reichere Family-Konflikterklärung
* kontextuelle Link-/Playability-Hinweise
* erste soziale Kontextsignale aus Chat

## später

* feinere Presence-/Invite-Logik
* stärker integrierte Play-/Device-Kontexte
* fortgeschrittene Automationen
* tiefere Cross-Module-Intelligenz

---

# Nicht-Ziele

VENT v1 ist nicht:

* vollständiger Store-Ersatz
* vollständiger Chat-Client
* vollständiger Link-/Streaming-Client
* maximale Feature-Sammlung
* klonhafte Reproduktion offizieller Oberflächen
* laute Gamer-UI mit visuellem Dauerbeschuss

---

# Schlussdefinition

VENT v1 ist eine **ruhige, schöne, minimalistische Decision-and-Context-App für Steam-Nutzung**.

Sie verbindet:

* die Eleganz einer verfeinerten Steam-Air-/Steam-Metro-Richtung
* mit klarer Informationsarchitektur
* mit starkem Wishlist- und Family-Fokus
* mit Activity als Relevanzraum
* mit Profile als Identitäts- und Utility-Hub
* und mit sicheren Handoffs dort, wo offizielle Flows sinnvoller oder vertrauenswürdiger sind

Die Kernformel lautet:

**VENT entscheidet und erklärt. Valve führt aus, wo Tiefe oder Sicherheit wichtiger sind.**

