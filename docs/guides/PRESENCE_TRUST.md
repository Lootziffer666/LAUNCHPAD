# Presence Trust — vom „Papa-Modus" zum kontextsensitiven Vertrauen

> **Leitidee:** Das Gerät reagiert auf **Vertrauen**, nicht auf Personen. Statt harter Modi
> („Kind" ⟷ „Papa") berechnet LAUNCHPAD laufend einen **Trust Score** aus mehreren schwachen
> Signalen. Kein einzelnes Signal ist entscheidend → das System bleibt robust.

Dies ist die **Roadmap/Architektur**. Der reine Scoring-Kern existiert bereits als
`helpers/PresenceTrust.kt` (unit-getestet); der heutige **Papa-Modus ist der erste Spezialfall**.

## Signale → Score

| Signal | Standardgewicht | Quelle heute |
|---|---|---|
| Signierter Papa-Tag frisch eingelöst | 60 | `SupervisedOverride` (NFC/QR) ✅ |
| Bekanntes Heim-WLAN | 40 | `SupervisedOverride.currentSsid` ✅ |
| Papas Handy in der Nähe (BT/NFC) | 35 | *geplant (Companion sendet BLE)* |
| Zuhause laut GPS-Geofence | 15 | *geplant* |
| Passende Uhrzeit | 10 | *geplant* |
| Kind anwesend (Kamera-Check) | 30 | *geplant (Lukes Idee)* |

`score = Σ Gewichte der aktiven Signale` (0..100). **Trusted**, wenn `score ≥ Schwelle`
(Default 55, pro Familie einstellbar).

**Robustheit:** WLAN weg = −40, aber ein frisch eingelöster Tag (60) oder Papas Handy (35) +
Geofence (15) können weiter über der Schwelle bleiben. Genau deshalb kein „ein Signal weg → alles
kaputt". Der heutige Papa-Modus setzt das bereits teilweise um: der signierte Tag aktiviert, der
WLAN-Geofence hält aktiv, und eine **Karenzzeit** (`OVERRIDE_GEOFENCE_GRACE_MS`) überbrückt
kurze WLAN-Aussetzer.

## Profile (Zielbild)

Aus dem Score + Kontext ergeben sich Umgebungs-Profile statt Einzelschalter:

- **Home** — hoher Score: mehr Zeit, mehr Apps, Browser freier; Käufe bleiben gesperrt.
- **School** — GPS+Uhrzeit: Messenger/Spiele aus, Stundenplan sichtbar (heute: `SchoolMode`).
- **Car** — Auto-Bluetooth: große Buttons, Hörspiele, Navigation, keine Popups.
- **Night** — ab 22 Uhr: warmes Display, Benachrichtigungen aus (heute: Ruhezeit im Desktop).
- **Unknown** — nichts erkannt: strengstes Profil (= heutiges Default-Deny).

## Per-App-Vertrauensschwellen (Zielbild)

Statt „zeige App X" → **„erlaube alles mit Trust-Bedarf ≤ aktuellem Score"**:

| App | Benötigt |
|---|---|
| Taschenlampe / Rechner | 0–5 |
| Kamera | 20 |
| Browser | 40 |
| Spiele | 70 |
| Play Store / Käufe | 95 |

Das ist der große Umbau: die App-Kategorien in `LaunchGate` bekommen eine `trustRequired`-Zahl,
und `canLaunch` vergleicht sie mit dem aktuellen Score statt mit festen Kategorien.

## Migrationsplan (inkrementell, jeweils testbar)

1. ✅ **Kern**: `PresenceTrust` Scorer + Tests (erledigt).
2. ✅ **Papa-Modus als Spezialfall**: signierter Tag + WLAN-Geofence + Karenz (erledigt).
3. **Signale ausbauen**: GPS-Geofence, Uhrzeitfenster, BLE-Nähe (Companion sendet, Launcher scannt).
4. **Score sichtbar machen**: Eltern-Dashboard zeigt aktuellen Score + aktive Signale.
5. **`LaunchGate` auf Score umstellen**: `trustRequired` pro App/Kategorie; alte Kategorien als
   Defaults abbilden (kein Bruch).
6. **Profile**: Home/School/Car/Night/Unknown als benannte Schwellen-/Regel-Sets.

## „Kind anwesend" als Signal (Lukes Idee, 6 Jahre)

Statt zu prüfen, ob ein Kind *ausgesperrt* wird, prüft das Gerät **positiv**, dass gerade ein Kind
davorsitzt: ein **gelegentlicher, sichtbarer Kamera-Check** (kein heimliches Mitschneiden — eine
kurze, angekündigte Aufnahme, on-device ausgewertet, nichts wird gespeichert/hochgeladen). Das ist
elegant, weil es die Blickrichtung dreht:

- Kind erkannt → **Kind-Profil** greift (das strengere/geschützte Set) — „sicherer", nicht „mehr Kontrolle".
- Kein Kind / Erwachsener erkannt → höherer Trust möglich (Eltern-Kontext).

Passt sauber ins Modell als Signal `WEIGHT_CHILD_PRESENT` (30). Wichtig für die Umsetzung:
**Transparenz** (LED/Hinweis bei jeder Aufnahme), **on-device only** (keine Cloud, keine
Speicherung), **opt-in**, und robuste Fallbacks (Kamera aus/verdeckt → Signal fehlt einfach, nichts
„kaputt"). Braucht ein On-Device-Modell (z. B. face/child-Classifier) + Berechtigungen + Gerätetest
→ eigener Schritt, aber konzeptionell schon verankert.

## Ehrliche Grenzen

- Signale sind heuristisch, nicht fälschungssicher gegen einen entschlossenen Angreifer — bewusst
  so (betreutes Lernen > Festung). Käufe/kritisches bleiben immer hart gesperrt.
- BLE-Nähe braucht Companion-Änderungen + Berechtigungen und ein Gerätetest — separater Schritt.
