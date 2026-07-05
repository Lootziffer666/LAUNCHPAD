// File: app/src/main/kotlin/org/fossify/home/activities/UpdateActivity.kt
// LAUNCHPAD auto-update UI (parent side, reached from Eltern-Modus). Check the release feed,
// show what's available, and download + install a pushed update. Silent install on a device-owner
// device; otherwise the system's install confirmation. UI is built programmatically.

package org.fossify.home.activities

import android.os.Bundle
import android.widget.Button
import android.widget.CompoundButton
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.helpers.UpdateChecker

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class UpdateActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var statusView: TextView
    private lateinit var actionButton: Button
    private var latest: UpdateChecker.Release? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 40, 40, 40)
        }
        setContentView(ScrollView(this).apply { addView(content) })

        content.addView(heading("App-Update"))
        content.addView(TextView(this).apply {
            text = "Installierte Version: ${org.fossify.home.BuildConfig.VERSION_NAME} " +
                "(Code ${UpdateChecker.currentVersionCode()})"
            textSize = 14f
            setPadding(0, 4, 0, 12)
        })

        statusView = TextView(this).apply { textSize = 15f; setPadding(0, 8, 0, 12) }
        content.addView(statusView)

        content.addView(button("🔍 Jetzt nach Update suchen") { checkNow() })

        actionButton = button("⬇️ Herunterladen & installieren") { downloadAndInstall() }
        actionButton.isEnabled = false
        content.addView(actionButton)

        // Auto-check toggle
        content.addView(TextView(this).apply {
            text = "Automatisch täglich prüfen"
            textSize = 15f
            setPadding(0, 20, 0, 0)
        })
        content.addView(SwitchCompat(this).apply {
            isChecked = UpdateChecker.isAutoCheckEnabled(this@UpdateActivity)
            setOnCheckedChangeListener { _: CompoundButton, checked: Boolean ->
                UpdateChecker.setAutoCheckEnabled(this@UpdateActivity, checked)
            }
        })

        content.addView(TextView(this).apply {
            text = "Quelle: ${UpdateChecker.feedUrl(this@UpdateActivity)}"
            textSize = 11f
            setPadding(0, 20, 0, 0)
            setTextColor(0xFF888888.toInt())
        })

        statusView.text = "Noch nicht geprüft."
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun checkNow() {
        statusView.text = "Suche…"
        actionButton.isEnabled = false
        scope.launch {
            val release = withContext(Dispatchers.IO) { UpdateChecker.fetchLatest(this@UpdateActivity) }
            if (release == null) {
                statusView.text = "Konnte den Update-Server nicht erreichen."
                return@launch
            }
            latest = release
            val newer = UpdateChecker.isNewer(UpdateChecker.currentVersionCode(), release.versionCode)
            if (newer && release.installable) {
                statusView.text = "Neue Version verfügbar: ${release.versionName} " +
                    "(Code ${release.versionCode})\n\n${release.notes.take(400)}"
                actionButton.isEnabled = true
            } else {
                statusView.text = "Alles aktuell — du hast die neueste Version. " +
                    "(Neueste: ${release.versionName})"
                actionButton.isEnabled = false
            }
        }
    }

    private fun downloadAndInstall() {
        val release = latest ?: return
        if (!UpdateChecker.canInstall(this)) {
            statusView.text = "Bitte erlaube das Installieren von Apps aus dieser Quelle."
            UpdateChecker.openInstallPermissionSettings(this)
            return
        }
        statusView.text = "Lade herunter…"
        actionButton.isEnabled = false
        scope.launch {
            val apk = withContext(Dispatchers.IO) { UpdateChecker.downloadApk(this@UpdateActivity, release) }
            if (apk == null) {
                statusView.text = "Download fehlgeschlagen."
                actionButton.isEnabled = true
                return@launch
            }
            statusView.text = "Starte Installation…"
            val started = UpdateChecker.installApk(this@UpdateActivity, apk)
            if (!started) {
                statusView.text = "Installation konnte nicht gestartet werden."
                actionButton.isEnabled = true
            } else {
                toast("Installation gestartet")
            }
        }
    }

    private fun heading(text: String) = TextView(this).apply {
        this.text = text
        textSize = 22f
        setPadding(0, 8, 0, 8)
    }

    private fun button(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 8, 0, 8) }
        setOnClickListener { onClick() }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
