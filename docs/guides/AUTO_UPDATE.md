# Auto-Update — Updates, die du pushen kannst

> **Ziel:** Papa veröffentlicht eine neue Version, Jakes Telefon holt sie sich selbst.

## Mechanik

- Der Launcher fragt einmal täglich (gedrosselt, eigener Thread) einen **Release-Feed** ab —
  standardmäßig `https://api.github.com/repos/lootziffer666/launchpad/releases/latest`.
- Ist der `versionCode` im Release **höher** als der installierte, erscheint eine Benachrichtigung
  „⬆️ Update verfügbar". Ein Tipp öffnet **Eltern-Modus → App-Update**.
- Dort: **Herunterladen & installieren**.
  - **Device-Owner-Gerät:** stille Installation via `PackageInstaller` (kein Antippen nötig).
  - **Sonst:** normale System-Installationsabfrage (einmalig „Installieren aus dieser Quelle
    erlauben").

Der `versionCode` wird aus dem APK-Asset-Namen gelesen (`launcher-<code>…apk` — genau so benennt
die CI das Artefakt, siehe `app/build.gradle.kts` `archivesName`). Fallback: `versionCode: <n>`
in den Release-Notes.

## Ein Update pushen

1. `VERSION_CODE` (und `VERSION_NAME`) in `gradle.properties` erhöhen, committen.
2. Ein **GitHub Release** erstellen, an das die signierte APK (`launcher-<code>-…-release.apk`)
   angehängt ist. (Die CI in `.github/workflows/build-apk.yml` baut die APK bereits; für die
   Auto-Update-Verteilung muss die **release**-Variante signiert an ein Release gehängt werden.)
3. Jakes Telefon zeigt innerhalb eines Tages (oder sofort über „Jetzt suchen") das Update an.

> **Signierung:** Auto-Update ersetzt eine App nur, wenn die neue APK mit **demselben Keystore**
> signiert ist wie die installierte. Keystore aus `keystore.properties` / den `SIGNING_*`-Secrets
> stabil halten.

## Einstellungen

- **Automatisch täglich prüfen:** Schalter in *App-Update* (Standard **an**).
- **Quelle:** überschreibbar via Pref `update_feed_url` (z. B. ein eigenes Repo/Mirror).

## Wichtige Dateien

| Zweck | Datei |
|---|---|
| Feed-Parsing + Vergleich (+ Tests) | `helpers/UpdateChecker.kt`, `test/.../UpdateCheckerTest.kt` |
| UI (suchen/installieren) | `activities/UpdateActivity.kt` |
| Täglicher Auto-Check | `activities/MainActivity.kt` (`onResume`) |
| Benachrichtigung | `helpers/NotificationHelper.kt` (`notifyUpdateAvailable`) |
| Installer-Freigabe | `AndroidManifest.xml` (`REQUEST_INSTALL_PACKAGES`, FileProvider), `res/xml/file_paths.xml` |

## Auf dem Gerät testen (noch offen)

Kern (JSON-Parsing/Vergleich) ist unit-getestet. **Auf dem Gerät zu prüfen:** echter Feed-Abruf,
Download, und beide Installationswege (Device-Owner still vs. Bestätigungsdialog).
