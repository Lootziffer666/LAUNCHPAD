# LAUNCH_STATE_MACHINE_V1 — Spec (aus dem ursprünglichen Windows-Launcher-Plan)

> Zieldefinition für die Launch-Orchestrierung. Teilweise implementiert (Phasen + Fehlerklassen);
> der Rest ist die verbindliche Richtung für den Ausbau. Kernsatz:
>
> **„Nicht das Spiel wird gestartet. Eine kontrollierte Spiel-Session wird orchestriert,
> bis echte Spielbereitschaft bestätigt ist.“**
>
> Stand: 2026-06-12 · Implementierungsstand jeweils markiert.

---

## 1. Top-Level-States (v1)

```
Idle → LaunchRequested → PreflightChecking → (PreflightBlocked | PreflightPassed)
     → PreparingEnvironment → EnvironmentReady → StartingLaunchTarget
     → LaunchPending → VerifyingReady → (Recovering ↺) → Running
                                       ↘ Failed / Cancelled
```

**Regel für jeden State** (Pflichtfelder, sobald ein State implementiert wird):

| Feld | Bedeutung |
|---|---|
| Entry Action | Was wird beim Eintritt getan? |
| Success Condition | Woran gilt der State als erfolgreich? |
| Failure Condition | Woran gilt er als gescheitert? |
| Timeout | Maximale Laufzeit |
| Retry Budget | Wie oft automatisch wiederholen? |
| Visible Phase | Was sieht das Kind? |
| Parent Diagnosis | Was sehen Eltern im Debug-/Elternmodus? |
| Allowed Next States | Erlaubte Übergänge |

**Implementierungsstand:** Heute kollabieren `LaunchRequested…StartingLaunchTarget` in den
`lp:games:launch`-Handler (Gate in `parental.canLaunch`, Auflösung in `launcher.resolveLaunch`,
Start in `launcher.launchGame`). `VerifyingReady`/`Recovering` existieren noch nicht — ein
abgeschickter Start gilt als Erfolg. Der Ausbau ersetzt das durch echte Ready-Verifikation.

---

## 2. Sichtbare Kind-Phasen ✅ implementiert

Intern darf die Maschine granular sein; das Kind sieht maximal:

| Sichtbare Phase | Interne States | Copy (implementiert) |
|---|---|---|
| Startklar machen | LaunchRequested, PreflightChecking, PreparingEnvironment | „Startklar machen — Wir prüfen kurz alles“ |
| Spiel wird geöffnet | StartingLaunchTarget, LaunchPending | „Spiel wird geöffnet — Das dauert nur einen Moment“ |
| Fast geschafft | VerifyingReady, ggf. Recovering | (folgt mit Ready-Verifikation) |
| Hat nicht geklappt | Failed | „Das hat gerade nicht geklappt“ + ggf. „Nochmal versuchen“ |
| Abgebrochen | Cancelled | (Splash schließt) |

Regeln: Die Transition-UI darf beruhigen, aber nicht lügen. Keine Fake-Balken, kein endloser
Spinner, kein „fast geschafft“ bei unbekanntem Zielzustand. Das Kind sieht nie HTTP-Fehler,
App-IDs, Prozessnamen, Timeout-Rohdaten.

---

## 3. Fehlerklassen ✅ implementiert (`launcher.classifyFailure`)

| Klasse | Bedeutung | Beispiele (reason) | Kind-UI |
|---|---|---|---|
| `recoverable` | kurzfristiger Hänger | Laufzeit-Exception beim Start | „Nochmal versuchen“ wird angeboten |
| `blocked` | Start gerade nicht sinnvoll | `not_installed`, `time_limit` | ruhige Erklärung, kein Retry |
| `parent_required` | Kind kann es nicht lösen | `not_approved`, Altersfreigabe, fehlende AppID/Pfad/Schema (Konfig) | ruhige Erklärung; Diagnose gehört in die Familienzentrale |
| `fatal` | automatisch nicht behebbar | `not_found`, kein Startweg, falsche Plattform | ruhige Erklärung, kein Retry |

Harte Regel aus dem Plan: **Ein falsch gestartetes Spiel ist schlimmer als ein fehlgeschlagener
Start** — im Zweifel Failed, nie „irgendwas“ starten.

---

## 4. Recovery-Regeln (Spec — ab VerifyingReady relevant)

Global: keine Endlos-Retries, keine Mehrfachstarts, kein Wegklicken unbekannter Dialoge,
Login-/Account-Probleme niemals automatisiert „lösen“ (→ `parent_required`).

Lokales Spiel — erlaubt: Fokus erneut setzen · einmal neu starten · Fenster in den Vordergrund.
Nicht erlaubt: unbekannte Dialoge wegklicken · mehrere Instanzen · Updater-Probleme kaschieren.

---

## 5. xCloud-Verifikationspipeline (Spec, v1.5+; Plan-Referenzfall)

Cloud-Spiele können über Steam-/Edge-Shortcuts gestartet werden — der **Start** wird dadurch
normalisiert, die **Laufzeit-Verifikation** bleibt Sonderfall:

```
StartingLaunchTarget → WaitingForBrowserSurface → VerifyingTargetTitle
                     → WaitingForSessionStart → VerifyingPlayableState → Running
```

- `VerifyingTargetTitle`: Der Spielname steht im HTML **vor** der Session (Wahrheitsanker).
  Matching-Level: `EXACT | NORMALIZED_EXACT | ALIAS_MATCH | FUZZY_ACCEPTED | MISMATCH`.
  v1 akzeptiert nur die ersten drei; `MISMATCH` ist ein harter Fehler (`fatal`).
- Normalisierung: lowercase, trim, Mehrfach-Leerzeichen, kuratierte Suffixe („Standard Edition“,
  „for Xbox“) — nur kuratiert, nie heuristisch locker.
- Datenmodell-Erweiterung dafür: `launchTransport` / `runtimeType` / `verificationProfile` /
  `expectedTitle` + `titleAliases` (siehe WINDOWS-PLAN-ADOPTION.md §3).

Offene Prüffragen (vor Implementierung klären): Steht der Titel zuverlässig im DOM, vor/nach
Login? Reicht DOM-Zugriff oder braucht es UI-Automation? Wie stabil sind Steam-Shortcut-App-IDs?

---

## 6. Merksätze (verbindlich)

1. Ein Launch ist erst erfolgreich, wenn Spielbereitschaft bestätigt ist.
2. Ein richtiger Startpfad ist nicht dasselbe wie ein sicherer Spielraum (→ Containment-Spec).
3. Falscher Titel ist ein harter Fehler, kein tolerierbarer Edge Case.
4. Kinder sehen Zustände, Eltern sehen Diagnosen.
5. Direktstart ist Komfort, keine Kindersicherung.
