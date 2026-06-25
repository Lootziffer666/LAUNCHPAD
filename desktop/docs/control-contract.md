# Control Contract -- LAUNCHPAD Desktop

## Interne Aktionen

Die Steuerung basiert auf vier internen Aktionen. Diese sind plattform- und controller-unabhaengig. Die interne Aktion bleibt immer gleich -- nur die angezeigte Glyphe aendert sich je nach erkanntem Controller-Typ.

| Interne Aktion | Beschreibung |
|---|---|
| `confirm` | Auswahl bestaetigen, Spiel starten |
| `back` | Zurueck, abbrechen, schliessen |
| `info` | Spielinfo anzeigen (Details-Overlay) |
| `trailer` | Trailer abspielen |

## Glyph Profile

| Aktion | Xbox | PlayStation | Nintendo |
|---|---|---|---|
| confirm | A | Cross | B |
| back | B | Circle | A |
| info | X | Square | Y |
| trailer | Y | Triangle | X |

## Prinzip: Glyphen sind Anzeigeprofile

Glyphen sind **Anzeigeprofile**, nicht neue Steuerungslogik. Der Code reagiert immer auf die gleiche interne Aktion (`confirm`, `back`, `info`, `trailer`). Das Glyph Profile bestimmt lediglich, welches Symbol dem Kind im UI angezeigt wird.

### Ablauf

```
Controller erkannt (Xbox/PS/Nintendo)
  -> Glyph Profile geladen
  -> UI zeigt passende Button-Symbole
  -> Interne Aktion bleibt identisch
```

## Erweiterbarkeit

Neue Controller-Typen (z.B. Steam Deck, Generic HID) erhalten ein eigenes Glyph Profile. Die internen Aktionen aendern sich nie -- nur die Zuordnung "Aktion -> angezeigte Glyphe" wird ergaenzt.

## Tastatur-Fallback

| Aktion | Taste |
|---|---|
| confirm | Enter |
| back | Escape |
| info | Tab |
| trailer | Space |
