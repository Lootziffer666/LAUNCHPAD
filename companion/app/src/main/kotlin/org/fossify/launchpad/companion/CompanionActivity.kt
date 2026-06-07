// File: companion/app/src/main/kotlin/org/fossify/launchpad/companion/CompanionActivity.kt
// Companion app for LAUNCHPAD. Scans parent QR code, establishes encrypted session, displays
// pending approvals/commands, sends approval/denial responses.

package org.fossify.launchpad.companion

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyFactory
import java.security.PublicKey
import java.security.SecureRandom
import java.security.spec.X509EncodedKeySpec
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator

// ─── Test Mode Manager (inline for companion) ──────────────────────────────
@Suppress("TooGenericExceptionCaught")
object TestModeManager {
    private const val TAG = "TestModeManager"
    private const val TEST_PAIR_URL = "http://127.0.0.1:7391/api/test-pair"

    fun readTestQrPayload(): String? {
        return try {
            val conn = URL(TEST_PAIR_URL).openConnection() as HttpURLConnection
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            if (conn.responseCode == 200) {
                conn.inputStream.bufferedReader().readText()
            } else {
                Log.w(TAG, "No test QR available (${conn.responseCode})")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch test QR via HTTP", e)
            null
        }
    }

    fun writeTestSessionKey(encryptedKeyBase64: String): Boolean {
        return try {
            val conn = URL(TEST_PAIR_URL).openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            conn.outputStream.use { it.write(encryptedKeyBase64.toByteArray()) }
            val ok = conn.responseCode == 200
            Log.d(TAG, "Session key POST → ${conn.responseCode}")
            ok
        } catch (e: Exception) {
            Log.e(TAG, "Failed to POST test session key", e)
            false
        }
    }
}

@Suppress("MagicNumber", "TooGenericExceptionCaught", "TooManyFunctions", "LongMethod")
class CompanionActivity : AppCompatActivity() {
    private lateinit var prefs: SharedPreferences
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    companion object {
        private const val LAUNCHER_PORT = 7391
        private const val HW_NAVY = "#0D2847"
        private const val HW_ORANGE = "#F2994A"
        private const val HW_DANGER = "#D32F2F"
        private const val HW_CARD_BG = "#F7F9FC"
        private const val HW_GREY = "#828282"
        private const val HW_LINE = "#E0E0E0"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = getSharedPreferences("LAUNCHPAD_COMPANION", Context.MODE_PRIVATE)

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
        }
        setContentView(ScrollView(this).apply { addView(content) })

        content.addView(heading("LAUNCHPAD Companion"))
        content.addView(spacer(8))

        val launcherIp = prefs.getString("launcher_ip", null)
        if (launcherIp != null && launcherIp.isNotBlank()) {
            content.addView(statusText("Verbunden mit: $launcherIp"))
            loadData()
        } else {
            showPairingScreen(content)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun showPairingScreen(content: LinearLayout) {
        content.removeAllViews()
        content.addView(heading("Gerät koppeln"))
        content.addView(spacer(16))

        val scanQrLauncher = registerForActivityResult(ScanContract()) { result ->
            if (result.contents != null) handleQrResult(result.contents)
        }

        content.addView(primaryButton("QR-Code scannen") {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                scanQrLauncher.launch(ScanOptions())
            } else {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 1)
            }
        })
        content.addView(secondaryButton("IP manuell eingeben") { promptForIpFallback() })
        content.addView(secondaryButton("🧪 Test auf diesem Gerät") {
            scope.launch { activateTestMode() }
        })

        content.addView(spacer(32))
        content.addView(TextView(this).apply {
            text = "Tipp: Titel lang gedrückt halten → Demo-Modus (kein Gerät nötig)"
            textSize = 12f
            setTextColor(Color.parseColor(HW_GREY))
        })
    }

    private fun handleQrResult(qrContent: String) {
        try {
            val json = JSONObject(qrContent)
            val identity = json.optString("identity", "")
            val publicKeyB64 = json.optString("publicKeyB64", "")
            val ip = json.optString("ip", "").takeIf { it.isNotBlank() }
                ?: if (BuildConfig.DEBUG) "127.0.0.1" else null
            when {
                identity != "launchpad" -> toast("Kein LAUNCHPAD-QR-Code")
                ip == null -> {
                    toast("QR enthält keine IP — bitte manuell eingeben")
                    promptForIpFallback()
                }
                publicKeyB64.isNotBlank() -> pairThenConnect(normalizeBaseUrl(ip), publicKeyB64)
                else -> connectTo(normalizeBaseUrl(ip))
            }
        } catch (e: Exception) {
            toast("QR-Code konnte nicht gelesen werden: ${e.message?.take(40)}")
        }
    }

    private fun normalizeBaseUrl(raw: String): String {
        var s = raw.trim().removeSuffix("/")
        if (!s.startsWith("http://") && !s.startsWith("https://")) s = "http://$s"
        val afterScheme = s.substringAfter("://")
        if (!afterScheme.contains(":")) s = "$s:$LAUNCHER_PORT"
        return s
    }

    private fun connectTo(baseUrl: String) {
        prefs.edit().putString("launcher_ip", baseUrl).apply()
        toast("Verbunden mit $baseUrl ✓")
        loadData()
    }

    /** Generate an AES session key; return (sessionKeyB64, rsaEncryptedKeyB64) for [publicKeyB64]. */
    private fun makeEncryptedSessionKey(publicKeyB64: String): Pair<String, String> {
        val keyGen = KeyGenerator.getInstance("AES")
        keyGen.init(256, SecureRandom())
        val sessionKeyBytes = keyGen.generateKey().encoded
        val publicKey: PublicKey = KeyFactory.getInstance("RSA")
            .generatePublic(X509EncodedKeySpec(Base64.getDecoder().decode(publicKeyB64)))
        val cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding")
        cipher.init(Cipher.ENCRYPT_MODE, publicKey)
        val encryptedKeyB64 = Base64.getEncoder().encodeToString(cipher.doFinal(sessionKeyBytes))
        val sessionKeyB64 = Base64.getEncoder().encodeToString(sessionKeyBytes)
        return sessionKeyB64 to encryptedKeyB64
    }

    /** Real-device pairing: hand the launcher our RSA-encrypted session key, store it, then connect.
     *  After this the launcher only accepts commands carrying this key (Authorization: Bearer …). */
    private fun pairThenConnect(baseUrl: String, publicKeyB64: String) {
        scope.launch {
            val sessionKeyB64 = withContext(Dispatchers.IO) {
                try {
                    val (keyB64, encB64) = makeEncryptedSessionKey(publicKeyB64)
                    if (postRaw("$baseUrl/api/pair", encB64) != null) keyB64 else null
                } catch (e: Exception) {
                    Log.e("Pair", "pairing failed", e); null
                }
            }
            if (sessionKeyB64 != null) {
                prefs.edit().putString("session_key", sessionKeyB64).apply()
                toast("Sicher gekoppelt ✓")
            } else {
                toast("Sichere Kopplung fehlgeschlagen — verbinde unverschlüsselt")
            }
            connectTo(baseUrl)
        }
    }

    private fun postRaw(url: String, body: String): String? {
        return try {
            val c = URL(url).openConnection() as HttpURLConnection
            c.requestMethod = "POST"
            c.doOutput = true
            c.connectTimeout = 5000
            c.readTimeout = 5000
            c.outputStream.use { it.write(body.toByteArray()) }
            if (c.responseCode in 200..299) c.inputStream.bufferedReader().readText() else null
        } catch (e: Exception) {
            Log.e("postRaw", "POST $url failed", e); null
        }
    }

    @Suppress("TooGenericExceptionCaught")
    private suspend fun activateTestMode() {
        val testQrJson = withContext(Dispatchers.IO) {
            try { TestModeManager.readTestQrPayload() } catch (e: Exception) {
                Log.e("TestMode", "Failed to read test QR", e)
                null
            }
        }
        if (testQrJson == null) {
            toast("Test-QR nicht gefunden.\nMain-App: Test-Modus aktivieren")
            return
        }
        try {
            val publicKeyB64 = JSONObject(testQrJson).optString("publicKeyB64", "")
            if (publicKeyB64.isEmpty()) {
                toast("Test QR enthält keinen Public Key")
                return
            }
            val (sessionKeyB64, encryptedKeyB64) = makeEncryptedSessionKey(publicKeyB64)
            val posted = withContext(Dispatchers.IO) {
                TestModeManager.writeTestSessionKey(encryptedKeyB64)
            }
            if (posted) {
                prefs.edit().putString("session_key", sessionKeyB64).apply()
                connectTo("http://127.0.0.1:$LAUNCHER_PORT")
                toast("🧪 Test-Modus aktiv — verbunden via 127.0.0.1:$LAUNCHER_PORT")
            } else {
                toast("⚠️ Session Key abgelehnt (Entschlüsselung fehlgeschlagen)")
            }
        } catch (e: Exception) {
            Log.e("TestMode", "Session key encryption failed", e)
            toast("Test QR ungültig: ${e.message?.take(40)}")
        }
    }

    private fun promptForIpFallback() {
        val input = EditText(this).apply {
            hint = "z.B. 192.168.1.100"
            inputType = android.text.InputType.TYPE_CLASS_TEXT
        }
        AlertDialog.Builder(this)
            .setTitle("Gerät-IP eingeben")
            .setView(input)
            .setPositiveButton("Verbinden") { _, _ ->
                val ip = input.text.toString().trim()
                if (ip.isNotBlank()) connectTo(normalizeBaseUrl(ip))
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun loadData() {
        scope.launch {
            val statusJson = withContext(Dispatchers.IO) {
                try { fetchApi("/api/status") } catch (e: Exception) {
                    Log.e("API", "Status fetch failed", e)
                    null
                }
            }

            if (statusJson != null) {
                val content = LinearLayout(this@CompanionActivity).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(24, 24, 24, 24)
                }
                setContentView(ScrollView(this@CompanionActivity).apply { addView(content) })

                content.addView(heading("Geräte-Status"))
                renderStatus(content, statusJson)

                content.addView(divider())
                renderGrantTimeSection(content)

                content.addView(divider())
                content.addView(heading("Ausstehende Anfragen", 18f))
                val pendingJson = withContext(Dispatchers.IO) {
                    try { fetchApi("/api/pending") } catch (e: Exception) {
                        Log.e("API", "Pending fetch failed", e)
                        null
                    }
                }
                renderPending(content, pendingJson)

                content.addView(divider())
                content.addView(heading("Apps verwalten", 18f))
                val appsJson = withContext(Dispatchers.IO) {
                    try { fetchApi("/api/apps") } catch (e: Exception) {
                        Log.e("API", "Apps fetch failed", e)
                        null
                    }
                }
                renderAppsSection(content, appsJson)

                content.addView(divider())
                content.addView(heading("Einstellungen", 18f))
                renderSettingsSection(content)
            }
        }
    }

    private fun renderStatus(content: LinearLayout, statusJson: String) {
        try {
            val json = JSONObject(statusJson)
            val balance = json.optInt("balance", 0)
            val enforcement = json.optBoolean("enforcement", false)
            val cooldown = json.optBoolean("cooldown", false)
            content.addView(statusText("Guthaben: $balance Min"))
            content.addView(statusText("Kontrolle aktiv: ${if (enforcement) "ja" else "nein"}"))
            content.addView(statusText("Ruhezeit aktiv: ${if (cooldown) "ja" else "nein"}"))
        } catch (e: Exception) {
            Log.e("API", "Status parse failed", e)
            content.addView(statusText("Status: OK"))
        }
    }

    @Suppress("NestedBlockDepth")
    private fun renderPending(content: LinearLayout, pendingJson: String?) {
        if (pendingJson == null) {
            content.addView(statusText("Anfragen konnten nicht geladen werden"))
            return
        }
        try {
            val json = JSONObject(pendingJson)
            val doge = json.optJSONArray("doge") ?: JSONArray()
            val zusagen = json.optJSONArray("zusagen") ?: JSONArray()
            val newApps = json.optJSONArray("pendingApps") ?: JSONArray()
            if (doge.length() == 0 && zusagen.length() == 0 && newApps.length() == 0) {
                content.addView(statusText("Keine ausstehenden Anfragen"))
                return
            }
            for (i in 0 until newApps.length()) {
                val item = newApps.getJSONObject(i)
                val pkg = item.optString("packageName")
                val name = item.optString("displayName", pkg)
                content.addView(
                    renderApprovalItem("📦 Neue App: $name", pkg,
                        """{"type":"allow_new_app","package":"$pkg"}""",
                        """{"type":"dismiss_new_app","package":"$pkg"}""")
                )
            }
            for (i in 0 until doge.length()) {
                val item = doge.getJSONObject(i)
                val id = item.optString("id")
                val desc = item.optString("description", "Medien-Anfrage")
                content.addView(renderDogeApprovalItem("📺 Medien-Anfrage", desc, id))
            }
            for (i in 0 until zusagen.length()) {
                val item = zusagen.getJSONObject(i)
                val id = item.optString("id")
                val text = item.optString("text", "Zusage")
                content.addView(
                    renderApprovalItem("🤝 Zusage", text,
                        """{"type":"approve_zusage","id":"$id"}""",
                        """{"type":"deny_zusage","id":"$id"}""")
                )
            }
        } catch (e: Exception) {
            Log.e("API", "Pending parse failed", e)
            content.addView(statusText("Keine ausstehenden Anfragen"))
        }
    }

    @Suppress("NestedBlockDepth")
    private fun renderAppsSection(content: LinearLayout, appsJson: String?) {
        if (appsJson == null) {
            content.addView(statusText("Apps konnten nicht geladen werden"))
            return
        }
        try {
            val json = JSONObject(appsJson)
            val apps = json.optJSONArray("apps") ?: JSONArray()
            if (apps.length() == 0) {
                content.addView(statusText("Keine Apps in der Whitelist"))
                return
            }
            content.addView(statusText("${apps.length()} Apps in der Whitelist"))
            for (i in 0 until apps.length()) {
                content.addView(renderAppCard(apps.getJSONObject(i)))
            }
        } catch (e: Exception) {
            Log.e("API", "Apps parse failed", e)
            content.addView(statusText("Fehler beim Laden der Apps"))
        }
    }

    private fun renderAppCard(app: JSONObject): LinearLayout {
        val pkg = app.optString("packageName")
        val displayName = app.optString("displayName", pkg)
        val category = app.optString("category", "NEUTRAL")
        val enabled = app.optBoolean("enabled", true)
        val addedAt = app.optLong("addedAt", 0)
        val addedBy = app.optString("addedBy", "parent")
        val dailyMinutes = app.optInt("dailyMinutes", 0)

        return card().apply {
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL

                addView(TextView(this@CompanionActivity).apply {
                    text = displayName
                    textSize = 15f
                    setTypeface(null, Typeface.BOLD)
                    setTextColor(Color.parseColor(HW_NAVY))
                    layoutParams = LinearLayout.LayoutParams(0,
                        LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                })
                addView(categoryBadge(category))
            })

            addView(TextView(this@CompanionActivity).apply {
                text = pkg
                textSize = 11f
                setTextColor(Color.parseColor(HW_GREY))
                setPadding(0, 2, 0, 0)
            })
            addView(TextView(this@CompanionActivity).apply {
                text = "Hinzugefügt ${relativeTime(addedAt)} · von $addedBy"
                textSize = 11f
                setTextColor(Color.parseColor(HW_GREY))
                setPadding(0, 2, 0, 8)
            })

            // Time limit row
            val limitField = EditText(this@CompanionActivity).apply {
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
                setText(if (dailyMinutes > 0) dailyMinutes.toString() else "0")
                textSize = 15f
                gravity = android.view.Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(100,
                    LinearLayout.LayoutParams.WRAP_CONTENT)
            }
            val limitRow = LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 8 }
                addView(TextView(this@CompanionActivity).apply {
                    text = "Tageslimit: "
                    textSize = 13f
                    setTextColor(Color.parseColor(HW_NAVY))
                })
                addView(compactButton("−") {
                    val v = limitField.text.toString().toIntOrNull() ?: 0
                    if (v >= 5) limitField.setText((v - 5).toString())
                })
                addView(limitField)
                addView(compactButton("+") {
                    val v = limitField.text.toString().toIntOrNull() ?: 0
                    limitField.setText((v + 5).toString())
                })
                addView(TextView(this@CompanionActivity).apply {
                    text = " Min/Tag"
                    textSize = 13f
                    setTextColor(Color.parseColor(HW_GREY))
                    gravity = android.view.Gravity.CENTER_VERTICAL
                })
            }
            addView(limitRow)

            // Action row
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL

                addView(secondaryButton(if (enabled) "Deaktivieren" else "Aktivieren") {
                    val newEnabled = !enabled
                    scope.launch {
                        withContext(Dispatchers.IO) {
                            try {
                                fetchApi("/api/apps/toggle", "POST",
                                    """{"packageName":"$pkg","enabled":$newEnabled}""")
                            } catch (e: Exception) { null }
                        }
                        loadData()
                    }
                }.apply {
                    layoutParams = LinearLayout.LayoutParams(0,
                        LinearLayout.LayoutParams.WRAP_CONTENT, 1f
                    ).apply { setMargins(0, 0, 4, 0) }
                })

                addView(primaryButton("Setzen") {
                    val mins = limitField.text.toString().toIntOrNull() ?: 0
                    scope.launch {
                        withContext(Dispatchers.IO) {
                            try {
                                fetchApi("/api/limits", "POST",
                                    """{"packageName":"$pkg","dailyMinutes":$mins}""")
                            } catch (e: Exception) { null }
                        }
                        toast(if (mins > 0) "Limit auf $mins Min/Tag gesetzt" else "Limit entfernt")
                    }
                }.apply {
                    layoutParams = LinearLayout.LayoutParams(0,
                        LinearLayout.LayoutParams.WRAP_CONTENT, 1f
                    ).apply { setMargins(4, 0, 4, 0) }
                })

                addView(dangerButton("Entfernen") {
                    AlertDialog.Builder(this@CompanionActivity)
                        .setTitle("App entfernen?")
                        .setMessage("$displayName wird aus der Whitelist entfernt. Jake kann sie nicht mehr starten.")
                        .setPositiveButton("Entfernen") { _, _ ->
                            scope.launch {
                                withContext(Dispatchers.IO) {
                                    try {
                                        fetchApi("/api/apps/remove", "POST",
                                            """{"packageName":"$pkg"}""")
                                    } catch (e: Exception) { null }
                                }
                                loadData()
                            }
                        }
                        .setNegativeButton("Abbrechen", null)
                        .show()
                }.apply {
                    layoutParams = LinearLayout.LayoutParams(0,
                        LinearLayout.LayoutParams.WRAP_CONTENT, 1f
                    ).apply { setMargins(4, 0, 0, 0) }
                })
            })
        }
    }

    private fun renderSettingsSection(content: LinearLayout) {
        val exportRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        exportRow.addView(primaryButton("📤 Exportieren") {
            scope.launch {
                val json = withContext(Dispatchers.IO) {
                    try { fetchApi("/api/export") } catch (e: Exception) { null }
                }
                if (json != null) {
                    showExportDialog(json)
                } else {
                    toast("Export fehlgeschlagen")
                }
            }
        }.apply {
            layoutParams = LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f
            ).apply { setMargins(0, 0, 4, 0) }
        })
        exportRow.addView(secondaryButton("📥 Importieren") {
            showImportDialog()
        }.apply {
            layoutParams = LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f
            ).apply { setMargins(4, 0, 0, 0) }
        })
        content.addView(exportRow)

        content.addView(spacer(8))
        content.addView(primaryButton("🔄 Neu laden") { loadData() })
        content.addView(secondaryButton("Zurück zur Kopplung") {
            prefs.edit().remove("launcher_ip").remove("session_key").apply()
            val newContent = LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(24, 24, 24, 24)
            }
            setContentView(ScrollView(this@CompanionActivity).apply { addView(newContent) })
            showPairingScreen(newContent)
        })
    }

    private fun showExportDialog(json: String) {
        val formatted = try { JSONObject(json).toString(2) } catch (e: Exception) { json }
        val scrollView = ScrollView(this)
        val textView = TextView(this).apply {
            text = formatted
            textSize = 11f
            setTextColor(Color.parseColor(HW_NAVY))
            setPadding(24, 16, 24, 16)
            setTypeface(Typeface.MONOSPACE)
        }
        scrollView.addView(textView)
        AlertDialog.Builder(this)
            .setTitle("Export-Daten")
            .setView(scrollView)
            .setPositiveButton("In Zwischenablage kopieren") { _, _ ->
                val clipboard = getSystemService(ClipboardManager::class.java)
                clipboard.setPrimaryClip(ClipData.newPlainText("LAUNCHPAD Export", formatted))
                toast("In Zwischenablage kopiert")
            }
            .setNegativeButton("Schließen", null)
            .show()
    }

    private fun showImportDialog() {
        val input = EditText(this).apply {
            hint = "JSON hier einfügen…"
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
            minLines = 4
        }
        AlertDialog.Builder(this)
            .setTitle("Einstellungen importieren")
            .setMessage("Füge den Export-JSON ein. Alle bestehenden Apps und Limits werden ersetzt.")
            .setView(input)
            .setPositiveButton("Importieren") { _, _ ->
                val body = input.text.toString().trim()
                if (body.isBlank()) {
                    toast("Kein JSON eingefügt")
                    return@setPositiveButton
                }
                scope.launch {
                    val result = withContext(Dispatchers.IO) {
                        try { fetchApi("/api/import", "POST", body) } catch (e: Exception) { null }
                    }
                    if (result != null) {
                        val msg = try { JSONObject(result).optString("message", "Import OK") }
                        catch (e: Exception) { "Import OK" }
                        toast(msg)
                        loadData()
                    } else {
                        toast("Import fehlgeschlagen")
                    }
                }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun renderGrantTimeSection(content: LinearLayout) {
        content.addView(heading("Zeit geben", 18f))
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        listOf(15, 30, 60).forEachIndexed { i, m ->
            row.addView(primaryButton("+$m Min") {
                sendCommand("""{"type":"adjust_time","minutes":$m,"reason":"Eltern-Bonus"}""")
            }.apply {
                layoutParams = LinearLayout.LayoutParams(0,
                    LinearLayout.LayoutParams.WRAP_CONTENT, 1f
                ).apply { setMargins(if (i == 0) 0 else 4, 0, if (i == 2) 0 else 4, 0) }
            })
        }
        content.addView(row)
        content.addView(secondaryButton("Eigene Minuten…") { showGrantTimeDialog() })
    }

    private fun showGrantTimeDialog() {
        val input = EditText(this).apply {
            hint = "Minuten (z. B. 20, auch −10)"
            inputType = android.text.InputType.TYPE_CLASS_NUMBER or
                android.text.InputType.TYPE_NUMBER_FLAG_SIGNED
        }
        AlertDialog.Builder(this)
            .setTitle("Zeit geben")
            .setMessage("Plus schreibt gut, Minus zieht ab (nie unter 0).")
            .setView(input)
            .setPositiveButton("Geben") { _, _ ->
                val m = input.text.toString().toIntOrNull()
                if (m == null || m == 0) {
                    toast("Ungültige Minutenzahl")
                    return@setPositiveButton
                }
                sendCommand("""{"type":"adjust_time","minutes":$m,"reason":"Eltern-Bonus"}""")
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun renderDogeApprovalItem(title: String, subtitle: String, id: String): LinearLayout {
        return card().apply {
            addView(TextView(this@CompanionActivity).apply {
                text = title
                textSize = 16f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor(HW_NAVY))
            })
            addView(TextView(this@CompanionActivity).apply {
                text = subtitle
                textSize = 14f
                setTextColor(Color.parseColor(HW_GREY))
                setPadding(0, 4, 0, 8)
            })

            val minutesField = EditText(this@CompanionActivity).apply {
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
                setText("20")
                textSize = 18f
                gravity = android.view.Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(120,
                    LinearLayout.LayoutParams.WRAP_CONTENT)
            }
            val minutesRow = LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 8 }
                addView(compactButton("−") {
                    val v = minutesField.text.toString().toIntOrNull() ?: 20
                    if (v > 5) minutesField.setText((v - 5).toString())
                })
                addView(minutesField)
                addView(compactButton("+") {
                    val v = minutesField.text.toString().toIntOrNull() ?: 20
                    minutesField.setText((v + 5).toString())
                })
                addView(TextView(this@CompanionActivity).apply {
                    text = " Min."
                    textSize = 14f
                    gravity = android.view.Gravity.CENTER_VERTICAL
                })
            }
            addView(minutesRow)
            addView(primaryButton("✓ Genehmigen") {
                val mins = minutesField.text.toString().toIntOrNull() ?: 20
                sendCommand("""{"type":"approve_doge","id":"$id","minutes":$mins}""")
            })
            addView(dangerButton("✗ Ablehnen") {
                sendCommand("""{"type":"deny_doge","id":"$id"}""")
            })
        }
    }

    private fun renderApprovalItem(
        title: String,
        subtitle: String,
        approveJson: String,
        denyJson: String
    ): LinearLayout {
        return card().apply {
            addView(TextView(this@CompanionActivity).apply {
                text = title
                textSize = 16f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor(HW_NAVY))
            })
            addView(TextView(this@CompanionActivity).apply {
                text = subtitle
                textSize = 14f
                setTextColor(Color.parseColor(HW_GREY))
                setPadding(0, 4, 0, 8)
            })
            addView(primaryButton("✓ Genehmigen") { sendCommand(approveJson) })
            addView(dangerButton("✗ Ablehnen") { sendCommand(denyJson) })
        }
    }

    private fun sendCommand(commandJson: String) {
        scope.launch {
            val response = withContext(Dispatchers.IO) {
                try { fetchApi("/api/command", method = "POST", body = commandJson) }
                catch (e: Exception) {
                    Log.e("API", "Command failed", e)
                    null
                }
            }
            val message = if (response != null) {
                try { JSONObject(response).optString("message", "OK") } catch (e: Exception) { "OK" }
            } else {
                "Befehl fehlgeschlagen"
            }
            toast(message)
            loadData()
        }
    }

    private fun fetchApi(path: String, method: String = "GET", body: String = ""): String {
        val base = prefs.getString("launcher_ip", null)
            ?: throw java.io.IOException("Keine Geräte-IP gespeichert")
        val connection = URL("$base$path").openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 5000
        connection.readTimeout = 5000

        // Authenticate with the paired session key, if we have one.
        val token = prefs.getString("session_key", null)
        if (!token.isNullOrBlank()) {
            connection.setRequestProperty("Authorization", "Bearer $token")
        }

        if (method == "POST" && body.isNotBlank()) {
            connection.doOutput = true
            connection.outputStream.use { it.write(body.toByteArray()) }
        }

        val reader = BufferedReader(InputStreamReader(connection.inputStream))
        val response = reader.readText()
        reader.close()
        return response
    }

    // ─── Layout helpers ───────────────────────────────────────────────────────

    private fun heading(text: String, size: Float = 20f) = TextView(this).apply {
        this.text = text
        textSize = size
        setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor(HW_NAVY))
        setPadding(0, 12, 0, 8)
    }

    private fun statusText(text: String) = TextView(this).apply {
        this.text = text
        textSize = 14f
        setTextColor(Color.parseColor(HW_GREY))
        setPadding(0, 6, 0, 6)
    }

    private fun divider() = android.view.View(this).apply {
        setBackgroundColor(Color.parseColor(HW_LINE))
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 1
        ).apply { setMargins(0, 16, 0, 16) }
    }

    private fun card() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(16, 16, 16, 12)
        background = GradientDrawable().apply {
            setColor(Color.parseColor(HW_CARD_BG))
            cornerRadius = 8f
        }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 8, 0, 8) }
        elevation = 2f
    }

    private fun categoryBadge(category: String): TextView {
        val color = when (category) {
            "ACTIVE_LEISURE" -> "#F2994A"
            "CREATIVE" -> "#9B51E0"
            "LEARNING" -> "#27AE60"
            "COOLDOWN" -> "#2F80ED"
            "COMMUNICATION" -> "#56CCF2"
            else -> "#828282"
        }
        val label = when (category) {
            "ACTIVE_LEISURE" -> "Coins"
            "CREATIVE" -> "Kreativ"
            "LEARNING" -> "Lernen"
            "COOLDOWN" -> "Pause"
            "COMMUNICATION" -> "Komm."
            else -> "Neutral"
        }
        return TextView(this).apply {
            text = label
            textSize = 10f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor(color))
                cornerRadius = 4f
            }
            setPadding(8, 4, 8, 4)
            setTypeface(null, Typeface.BOLD)
        }
    }

    private fun primaryButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        setTextColor(Color.WHITE)
        background = GradientDrawable().apply {
            setColor(Color.parseColor(HW_ORANGE))
            cornerRadius = 8f
        }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 8, 0, 4) }
        setOnClickListener { onClick() }
    }

    private fun secondaryButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        setTextColor(Color.parseColor(HW_NAVY))
        background = GradientDrawable().apply {
            setColor(Color.WHITE)
            cornerRadius = 8f
            setStroke(1, Color.parseColor(HW_LINE))
        }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 4, 0, 4) }
        setOnClickListener { onClick() }
    }

    private fun dangerButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        setTextColor(Color.WHITE)
        background = GradientDrawable().apply {
            setColor(Color.parseColor(HW_DANGER))
            cornerRadius = 8f
        }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 4, 0, 4) }
        setOnClickListener { onClick() }
    }

    private fun compactButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        textSize = 16f
        setTextColor(Color.parseColor(HW_NAVY))
        background = GradientDrawable().apply {
            setColor(Color.parseColor(HW_LINE))
            cornerRadius = 4f
        }
        layoutParams = LinearLayout.LayoutParams(72, LinearLayout.LayoutParams.WRAP_CONTENT)
            .apply { setMargins(4, 0, 4, 0) }
        setOnClickListener { onClick() }
    }

    private fun spacer(height: Int) = android.view.View(this).apply {
        layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, height)
    }

    private fun relativeTime(epochMs: Long): String {
        if (epochMs <= 0) return "unbekannt"
        val diff = System.currentTimeMillis() - epochMs
        val minutes = diff / 60_000
        val hours = diff / 3_600_000
        val days = diff / 86_400_000
        return when {
            minutes < 2 -> "gerade eben"
            minutes < 60 -> "vor $minutes Min"
            hours < 24 -> "vor $hours Std"
            days == 1L -> "gestern"
            days < 30 -> "vor $days Tagen"
            else -> "vor ${days / 30} Monaten"
        }
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
