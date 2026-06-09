// File: companion/app/src/main/kotlin/org/fossify/launchpad/companion/CompanionActivity.kt
// Companion app for LAUNCHPAD. Scans the launcher QR code, establishes an encrypted session,
// and lets a parent see status, grant time, answer requests and manage apps over the LAN.
//
// UI goals (this revision): clear & friendly for non-technical parents — a decluttered Home
// (status hero + give-time + requests) with separate Apps / Settings screens, a first-run
// welcome wizard, ⓘ explanations on every concept, dp-correct sizing, and a calm palette.
// All networking/endpoints are unchanged from before — this is a presentation redesign.

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
import android.view.Gravity
import android.view.View
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

@Suppress("MagicNumber", "TooGenericExceptionCaught", "TooManyFunctions", "LargeClass")
class CompanionActivity : AppCompatActivity() {
    private lateinit var prefs: SharedPreferences
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val mp = LinearLayout.LayoutParams.MATCH_PARENT
    private val wc = LinearLayout.LayoutParams.WRAP_CONTENT

    companion object {
        private const val LAUNCHER_PORT = 7391

        // Palette — calm navy brand, warm orange action, soft surfaces.
        private const val NAVY = "#16263F"
        private const val NAVY2 = "#2A5083"
        private const val ORANGE = "#F2994A"
        private const val GREEN = "#27AE60"
        private const val BLUE = "#2F80ED"
        private const val PURPLE = "#9B51E0"
        private const val DANGER = "#E0563E"
        private const val BG = "#F2F4F9"
        private const val CARD = "#FFFFFF"
        private const val INK = "#1B2A41"
        private const val INK_SOFT = "#5B6B82"
        private const val INK_MUTE = "#97A3B4"
        private const val LINE = "#E6EAF1"
        private const val HERO_SUB = "#AEC4E6"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = getSharedPreferences("LAUNCHPAD_COMPANION", Context.MODE_PRIVATE)

        val launcherIp = prefs.getString("launcher_ip", null)
        if (launcherIp != null && launcherIp.isNotBlank()) {
            showLoading()
            loadData()
        } else {
            showPairingScreen(newScreen())
        }

        if (!prefs.getBoolean("welcomed", false)) showWelcome(0)
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    // ─────────────────────────── Pairing ───────────────────────────

    private fun showPairingScreen(content: LinearLayout) {
        appHeader(content, "Mit Jakes Gerät koppeln")

        content.addView(card().apply {
            addView(bodyText("So koppelst du in 3 Schritten:", bold = true, color = INK))
            addView(stepLine("1", "Öffne LAUNCHPAD auf Jakes Gerät"))
            addView(stepLine("2", "Tippe dort auf „Eltern koppeln“ (Eltern-PIN)"))
            addView(stepLine("3", "Scanne den angezeigten QR-Code hier"))
        })

        val scanQrLauncher = registerForActivityResult(ScanContract()) { result ->
            if (result.contents != null) handleQrResult(result.contents)
        }

        content.addView(primaryButton("📷  QR-Code scannen") {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                scanQrLauncher.launch(ScanOptions())
            } else {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 1)
            }
        })
        content.addView(secondaryButton("IP-Adresse manuell eingeben") { promptForIpFallback() })
        content.addView(ghostButton("🧪  Test auf diesem Gerät") { scope.launch { activateTestMode() } })

        content.addView(spacer(12))
        content.addView(centerHint("Kein Gerät zur Hand? Tippe oben auf „Hilfe“ für eine Erklärung."))
        content.addView(ghostButton("❔  Wie funktioniert das?") { showWelcome(0) })
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
        toast("Verbunden ✓")
        showLoading()
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

    /** Real-device pairing: hand the launcher our RSA-encrypted session key, store it, then connect. */
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
            hint = "z. B. 192.168.1.100"
            inputType = android.text.InputType.TYPE_CLASS_TEXT
        }
        AlertDialog.Builder(this)
            .setTitle("Geräte-IP eingeben")
            .setMessage("Die IP siehst du in LAUNCHPAD auf Jakes Gerät, im Kopplungs-Fenster.")
            .setView(input)
            .setPositiveButton("Verbinden") { _, _ ->
                val ip = input.text.toString().trim()
                if (ip.isNotBlank()) connectTo(normalizeBaseUrl(ip))
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    // ─────────────────────────── Home (dashboard) ───────────────────────────

    private fun loadData() {
        scope.launch {
            var failure: String? = null
            val statusJson = withContext(Dispatchers.IO) {
                try { fetchApi("/api/status") } catch (e: Exception) {
                    Log.e("API", "Status fetch failed", e)
                    failure = e.message ?: e.javaClass.simpleName
                    null
                }
            }
            if (statusJson != null) {
                val pendingJson = withContext(Dispatchers.IO) {
                    try { fetchApi("/api/pending") } catch (e: Exception) {
                        Log.e("API", "Pending fetch failed", e); null
                    }
                }
                renderHome(statusJson, pendingJson)
            } else {
                showConnectionError(failure)
            }
        }
    }

    private fun renderHome(statusJson: String, pendingJson: String?) {
        val content = newScreen()
        appHeader(content, "Übersicht", showHelp = true)
        renderStatusHero(content, statusJson)
        renderGiveTime(content)
        renderRequests(content, pendingJson)

        content.addView(spacer(4))
        content.addView(navButton("📱  Apps verwalten", "Erlaubte Apps & Tageslimits") { openAppsScreen() })
        content.addView(navButton("⚙️  Einstellungen", "Sichern, übertragen, neu koppeln") { openSettingsScreen() })
        content.addView(spacer(4))
        content.addView(ghostButton("🔄  Aktualisieren") { showLoading(); loadData() })
    }

    private fun renderStatusHero(content: LinearLayout, statusJson: String) {
        val json = try { JSONObject(statusJson) } catch (e: Exception) { JSONObject() }
        val balance = json.optInt("balance", 0)
        val enforcement = json.optBoolean("enforcement", false)
        val cooldown = json.optBoolean("cooldown", false)
        val schoolMode = json.optBoolean("schoolMode", false)
        val schoolUntil = json.optLong("schoolUntil", 0L)

        val hero = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(18), dp(20), dp(18))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor(NAVY2), Color.parseColor(NAVY))
            ).apply { cornerRadius = dpf(20f) }
            layoutParams = lp(mp, wc, top = 8, bottom = 12)
            elevation = dpf(3f)
        }
        hero.addView(LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(TextView(this@CompanionActivity).apply {
                text = "Verfügbare Zeit heute"
                textSize = 13f
                setTextColor(Color.parseColor(HERO_SUB))
                layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
            })
            addView(infoBadge(HERO_SUB) {
                infoDialog("Guthaben", "So viele Minuten darf Jake heute noch spielen/nutzen. " +
                    "Es zählt herunter, während er erlaubte Apps benutzt. Mit „Zeit geben“ kannst du " +
                    "Bonus-Minuten schenken.")
            })
        })
        hero.addView(TextView(this).apply {
            text = "$balance Min"
            textSize = 44f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            setPadding(0, dp(2), 0, dp(2))
        })

        val chips = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(8), 0, 0)
        }
        chips.addView(statusChip(if (enforcement) "Kontrolle aktiv" else "Kontrolle aus", if (enforcement) GREEN else INK_MUTE))
        if (cooldown) chips.addView(statusChip("🌙 Ruhezeit", BLUE))
        if (schoolMode) {
            val mins = ((schoolUntil - System.currentTimeMillis()) / 60000L).coerceAtLeast(0)
            chips.addView(statusChip(if (schoolUntil == Long.MAX_VALUE) "📚 Schule" else "📚 Schule $mins′", PURPLE))
        }
        hero.addView(chips)
        content.addView(hero)

        content.addView(
            if (schoolMode) {
                secondaryButton("Schulmodus beenden") {
                    confirm("Schulmodus beenden?", "Jake kann dann wieder normal Apps nutzen.") {
                        sendCommand("""{"type":"set_school_mode","on":false}""")
                    }
                }
            } else {
                rowWithInfo(
                    ghostButton("📚  Schulmodus 60 Min starten") {
                        confirm("Schulmodus starten?", "Für 60 Minuten sind nur Lern-Apps erlaubt — gut für Hausaufgaben.") {
                            sendCommand("""{"type":"set_school_mode","on":true,"minutes":60}""")
                        }
                    },
                    "Schulmodus", "Sperrt für eine Weile Spiele & Unterhaltung und lässt nur Lern-Apps zu."
                )
            }
        )
    }

    private fun renderGiveTime(content: LinearLayout) {
        content.addView(card().apply {
            addView(sectionTitleRow("Zeit geben", "Zeit geben",
                "Schenke Jake Bonus-Minuten (z. B. als Belohnung). Minus zieht Zeit ab — nie unter 0."))
            val row = LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = lp(mp, wc, top = 4)
            }
            listOf(15, 30, 60).forEachIndexed { i, m ->
                row.addView(primaryButton("+$m") {
                    sendCommand("""{"type":"adjust_time","minutes":$m,"reason":"Eltern-Bonus"}""")
                }.apply {
                    layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply {
                        setMargins(if (i == 0) 0 else dp(4), 0, if (i == 2) 0 else dp(4), 0)
                    }
                })
            }
            addView(row)
            addView(ghostButton("Andere Minutenzahl…") { showGrantTimeDialog() })
        })
    }

    @Suppress("NestedBlockDepth")
    private fun renderRequests(content: LinearLayout, pendingJson: String?) {
        val cardView = card()
        cardView.addView(sectionTitleRow("Anfragen", "Anfragen",
            "Wenn Jake etwas möchte (Video, neue App, eine Zusage einlösen), erscheint es hier. " +
                "Du erlaubst oder lehnst mit einem Tipp ab."))

        if (pendingJson == null) {
            cardView.addView(bodyText("Anfragen konnten nicht geladen werden.", color = INK_MUTE))
            content.addView(cardView); return
        }
        try {
            val json = JSONObject(pendingJson)
            val doge = json.optJSONArray("doge") ?: JSONArray()
            val zusagen = json.optJSONArray("zusagen") ?: JSONArray()
            val newApps = json.optJSONArray("pendingApps") ?: JSONArray()
            if (doge.length() == 0 && zusagen.length() == 0 && newApps.length() == 0) {
                cardView.addView(emptyState("🎉", "Keine offenen Anfragen", "Alles erledigt!"))
                content.addView(cardView); return
            }
            for (i in 0 until newApps.length()) {
                val item = newApps.getJSONObject(i)
                val pkg = item.optString("packageName")
                val name = item.optString("displayName", pkg)
                cardView.addView(approvalItem("📦 Neue App: $name", pkg,
                    """{"type":"allow_new_app","package":"$pkg"}""",
                    """{"type":"dismiss_new_app","package":"$pkg"}"""))
            }
            for (i in 0 until doge.length()) {
                val item = doge.getJSONObject(i)
                val id = item.optString("id")
                val desc = item.optString("description", "Medien-Anfrage")
                cardView.addView(dogeApprovalItem("📺 Medien-Anfrage", desc, id))
            }
            for (i in 0 until zusagen.length()) {
                val item = zusagen.getJSONObject(i)
                val id = item.optString("id")
                val text = item.optString("text", "Zusage")
                cardView.addView(approvalItem("🤝 Zusage", text,
                    """{"type":"approve_zusage","id":"$id"}""",
                    """{"type":"deny_zusage","id":"$id"}"""))
            }
        } catch (e: Exception) {
            Log.e("API", "Pending parse failed", e)
            cardView.addView(emptyState("🎉", "Keine offenen Anfragen", "Alles erledigt!"))
        }
        content.addView(cardView)
    }

    // ─────────────────────────── Apps screen ───────────────────────────

    private fun openAppsScreen() {
        showLoading()
        scope.launch {
            val appsJson = withContext(Dispatchers.IO) {
                try { fetchApi("/api/apps") } catch (e: Exception) {
                    Log.e("API", "Apps fetch failed", e); null
                }
            }
            val content = newScreen()
            backHeader("Apps verwalten") { showLoading(); loadData() }
                .also { content.addView(it) }
            content.addView(card().apply {
                addView(bodyText("Hier legst du fest, welche Apps Jake öffnen darf und wie lange pro Tag.",
                    color = INK_SOFT))
            })
            renderAppsList(content, appsJson)
        }
    }

    @Suppress("NestedBlockDepth")
    private fun renderAppsList(content: LinearLayout, appsJson: String?) {
        if (appsJson == null) {
            content.addView(card().apply { addView(bodyText("Apps konnten nicht geladen werden.", color = INK_MUTE)) })
            return
        }
        try {
            val json = JSONObject(appsJson)
            val apps = json.optJSONArray("apps") ?: JSONArray()
            if (apps.length() == 0) {
                content.addView(card().apply { addView(emptyState("📭", "Keine Apps freigegeben", "Noch nichts auf der Liste.")) })
                return
            }
            content.addView(sectionLabel("${apps.length()} Apps freigegeben"))
            for (i in 0 until apps.length()) content.addView(renderAppCard(apps.getJSONObject(i)))
        } catch (e: Exception) {
            Log.e("API", "Apps parse failed", e)
            content.addView(card().apply { addView(bodyText("Fehler beim Laden der Apps.", color = INK_MUTE)) })
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
                gravity = Gravity.CENTER_VERTICAL
                addView(TextView(this@CompanionActivity).apply {
                    text = displayName
                    textSize = 16f
                    setTypeface(null, Typeface.BOLD)
                    setTextColor(Color.parseColor(INK))
                    layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
                })
                addView(categoryBadge(category))
            })
            addView(TextView(this@CompanionActivity).apply {
                text = "Hinzugefügt ${relativeTime(addedAt)} · von $addedBy"
                textSize = 11f
                setTextColor(Color.parseColor(INK_MUTE))
                setPadding(0, dp(2), 0, dp(10))
            })

            val limitField = EditText(this@CompanionActivity).apply {
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
                setText(if (dailyMinutes > 0) dailyMinutes.toString() else "0")
                textSize = 16f
                gravity = Gravity.CENTER
                setTextColor(Color.parseColor(INK))
                layoutParams = LinearLayout.LayoutParams(dp(56), wc)
            }
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = lp(wc, wc, bottom = 10)
                addView(TextView(this@CompanionActivity).apply {
                    text = "Tageslimit "
                    textSize = 14f
                    setTextColor(Color.parseColor(INK_SOFT))
                })
                addView(infoBadge(INK_MUTE) {
                    infoDialog("Tageslimit", "Wie viele Minuten diese App pro Tag laufen darf. " +
                        "0 bedeutet: kein eigenes Limit (zählt aufs allgemeine Guthaben).")
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
                    text = " Min"
                    textSize = 14f
                    setTextColor(Color.parseColor(INK_MUTE))
                })
            })

            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                addView(secondaryButton(if (enabled) "Pausieren" else "Aktivieren") {
                    val newEnabled = !enabled
                    scope.launch {
                        withContext(Dispatchers.IO) {
                            try {
                                fetchApi("/api/apps/toggle", "POST", """{"packageName":"$pkg","enabled":$newEnabled}""")
                            } catch (e: Exception) { null }
                        }
                        openAppsScreen()
                    }
                }.apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(0, 0, dp(4), 0) } })

                addView(primaryButton("Limit setzen") {
                    val mins = limitField.text.toString().toIntOrNull() ?: 0
                    scope.launch {
                        withContext(Dispatchers.IO) {
                            try {
                                fetchApi("/api/limits", "POST", """{"packageName":"$pkg","dailyMinutes":$mins}""")
                            } catch (e: Exception) { null }
                        }
                        toast(if (mins > 0) "Limit: $mins Min/Tag ✓" else "Limit entfernt")
                    }
                }.apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(dp(4), 0, dp(4), 0) } })

                addView(dangerButton("Entfernen") {
                    confirm("App entfernen?", "$displayName wird aus der Liste entfernt. Jake kann sie dann nicht mehr starten.") {
                        scope.launch {
                            withContext(Dispatchers.IO) {
                                try { fetchApi("/api/apps/remove", "POST", """{"packageName":"$pkg"}""") }
                                catch (e: Exception) { null }
                            }
                            openAppsScreen()
                        }
                    }
                }.apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(dp(4), 0, 0, 0) } })
            })
        }
    }

    // ─────────────────────────── Settings screen ───────────────────────────

    private fun openSettingsScreen() {
        val content = newScreen()
        content.addView(backHeader("Einstellungen") { showLoading(); loadData() })

        content.addView(card().apply {
            addView(sectionTitleRow("Sichern & übertragen", "Sichern & übertragen",
                "Exportiere alle Apps & Limits als Text — z. B. um sie auf ein neues Gerät zu übertragen oder als Backup zu speichern."))
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = lp(mp, wc, top = 4)
                addView(primaryButton("📤 Exportieren") {
                    scope.launch {
                        val json = withContext(Dispatchers.IO) { try { fetchApi("/api/export") } catch (e: Exception) { null } }
                        if (json != null) showExportDialog(json) else toast("Export fehlgeschlagen")
                    }
                }.apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(0, 0, dp(4), 0) } })
                addView(secondaryButton("📥 Importieren") { showImportDialog() }
                    .apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(dp(4), 0, 0, 0) } })
            })
        })

        content.addView(card().apply {
            addView(bodyText("Verbunden mit", color = INK_MUTE, size = 12f))
            addView(bodyText(prefs.getString("launcher_ip", "—") ?: "—", bold = true, color = INK))
            addView(secondaryButton("Anderes Gerät koppeln") {
                confirm("Neu koppeln?", "Die aktuelle Verbindung wird getrennt und du scannst einen neuen QR-Code.") { resetToPairing() }
            })
        })

        content.addView(ghostButton("❔  Hilfe & Erklärung") { showWelcome(0) })
    }

    private fun showExportDialog(json: String) {
        val formatted = try { JSONObject(json).toString(2) } catch (e: Exception) { json }
        val textView = TextView(this).apply {
            text = formatted
            textSize = 12f
            setTextColor(Color.parseColor(INK))
            setPadding(dp(20), dp(12), dp(20), dp(12))
            setTypeface(Typeface.MONOSPACE)
        }
        AlertDialog.Builder(this)
            .setTitle("Export-Daten")
            .setView(ScrollView(this).apply { addView(textView) })
            .setPositiveButton("Kopieren") { _, _ ->
                getSystemService(ClipboardManager::class.java)
                    .setPrimaryClip(ClipData.newPlainText("LAUNCHPAD Export", formatted))
                toast("In Zwischenablage kopiert")
            }
            .setNegativeButton("Schließen", null)
            .show()
    }

    private fun showImportDialog() {
        val input = EditText(this).apply {
            hint = "JSON hier einfügen…"
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
            minLines = 4
        }
        AlertDialog.Builder(this)
            .setTitle("Einstellungen importieren")
            .setMessage("Füge den Export-Text ein. Alle bestehenden Apps und Limits werden ersetzt.")
            .setView(input)
            .setPositiveButton("Importieren") { _, _ ->
                val body = input.text.toString().trim()
                if (body.isBlank()) { toast("Kein JSON eingefügt"); return@setPositiveButton }
                scope.launch {
                    val result = withContext(Dispatchers.IO) { try { fetchApi("/api/import", "POST", body) } catch (e: Exception) { null } }
                    if (result != null) {
                        val msg = try { JSONObject(result).optString("message", "Import OK") } catch (e: Exception) { "Import OK" }
                        toast(msg); showLoading(); loadData()
                    } else toast("Import fehlgeschlagen")
                }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun showGrantTimeDialog() {
        val input = EditText(this).apply {
            hint = "Minuten (z. B. 20, auch −10)"
            inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_SIGNED
        }
        AlertDialog.Builder(this)
            .setTitle("Zeit geben")
            .setMessage("Plus schreibt gut, Minus zieht ab (nie unter 0).")
            .setView(input)
            .setPositiveButton("Geben") { _, _ ->
                val m = input.text.toString().toIntOrNull()
                if (m == null || m == 0) { toast("Ungültige Minutenzahl"); return@setPositiveButton }
                sendCommand("""{"type":"adjust_time","minutes":$m,"reason":"Eltern-Bonus"}""")
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    // ─────────────────────────── Approval items ───────────────────────────

    private fun dogeApprovalItem(title: String, subtitle: String, id: String): LinearLayout {
        return innerCard().apply {
            addView(bodyText(title, bold = true, color = INK, size = 15f))
            addView(bodyText(subtitle, color = INK_SOFT, size = 13f))
            val minutesField = EditText(this@CompanionActivity).apply {
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
                setText("20")
                textSize = 16f
                gravity = Gravity.CENTER
                setTextColor(Color.parseColor(INK))
                layoutParams = LinearLayout.LayoutParams(dp(64), wc)
            }
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = lp(wc, wc, top = 6, bottom = 6)
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
                    text = " Min."; textSize = 14f; setTextColor(Color.parseColor(INK_MUTE))
                })
            })
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                addView(primaryButton("✓ Genehmigen") {
                    val mins = minutesField.text.toString().toIntOrNull() ?: 20
                    sendCommand("""{"type":"approve_doge","id":"$id","minutes":$mins}""")
                }.apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(0, 0, dp(4), 0) } })
                addView(dangerButton("✗ Ablehnen") {
                    sendCommand("""{"type":"deny_doge","id":"$id"}""")
                }.apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(dp(4), 0, 0, 0) } })
            })
        }
    }

    private fun approvalItem(title: String, subtitle: String, approveJson: String, denyJson: String): LinearLayout {
        return innerCard().apply {
            addView(bodyText(title, bold = true, color = INK, size = 15f))
            addView(bodyText(subtitle, color = INK_SOFT, size = 13f))
            addView(LinearLayout(this@CompanionActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = lp(mp, wc, top = 8)
                addView(primaryButton("✓ Genehmigen") { sendCommand(approveJson) }
                    .apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(0, 0, dp(4), 0) } })
                addView(dangerButton("✗ Ablehnen") { sendCommand(denyJson) }
                    .apply { layoutParams = LinearLayout.LayoutParams(0, wc, 1f).apply { setMargins(dp(4), 0, 0, 0) } })
            })
        }
    }

    // ─────────────────────────── Error / loading ───────────────────────────

    private fun showLoading() {
        val content = newScreen()
        appHeader(content, "Verbinde…")
        content.addView(spacer(40))
        content.addView(TextView(this).apply {
            text = "⏳"; textSize = 40f; gravity = Gravity.CENTER; layoutParams = lp(mp, wc)
        })
        content.addView(centerHint("Verbinde mit Jakes Gerät…"))
    }

    /** Never leave the parent on a blank screen: show why /api/status failed and a way out. */
    private fun showConnectionError(reason: String?) {
        val content = newScreen()
        appHeader(content, "Verbindung")
        val unauthorized = reason?.contains("401") == true || reason?.contains("403") == true
        content.addView(card().apply {
            addView(TextView(this@CompanionActivity).apply {
                text = if (unauthorized) "🔑" else "📡"; textSize = 36f; gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = lp(mp, wc)
            })
            addView(bodyText(if (unauthorized) "Neu koppeln nötig" else "Keine Verbindung",
                bold = true, color = INK, size = 18f).apply { gravity = Gravity.CENTER_HORIZONTAL })
            addView(TextView(this@CompanionActivity).apply {
                text = if (unauthorized) {
                    "Die Kopplung ist abgelaufen oder Jakes Gerät wurde neu eingerichtet. " +
                        "Bitte kopple einmal neu — danach läuft alles wieder."
                } else {
                    "Jakes Gerät antwortet nicht. Ist es eingeschaltet und im selben WLAN?\n\n($reason)"
                }
                textSize = 14f
                setTextColor(Color.parseColor(INK_SOFT))
                gravity = Gravity.CENTER_HORIZONTAL
                setPadding(dp(4), dp(8), dp(4), dp(12))
            })
            addView(primaryButton("🔄 Erneut versuchen") { showLoading(); loadData() })
            addView(
                if (unauthorized) primaryButton("📷 Neu koppeln") { resetToPairing() }
                else secondaryButton("Neu koppeln") { resetToPairing() }
            )
        })
    }

    /** Clear the saved device + key and re-run onCreate, which lands on the pairing screen. */
    private fun resetToPairing() {
        prefs.edit().remove("launcher_ip").remove("session_key").apply()
        recreate()
    }

    private fun sendCommand(commandJson: String) {
        scope.launch {
            val response = withContext(Dispatchers.IO) {
                try { fetchApi("/api/command", method = "POST", body = commandJson) }
                catch (e: Exception) { Log.e("API", "Command failed", e); null }
            }
            val message = if (response != null) {
                try { JSONObject(response).optString("message", "OK ✓") } catch (e: Exception) { "OK ✓" }
            } else "Befehl fehlgeschlagen"
            toast(message)
            showLoading(); loadData()
        }
    }

    private fun fetchApi(path: String, method: String = "GET", body: String = ""): String {
        val base = prefs.getString("launcher_ip", null)
            ?: throw java.io.IOException("Keine Geräte-IP gespeichert")
        val connection = URL("$base$path").openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 5000
        connection.readTimeout = 5000

        val token = prefs.getString("session_key", null)
        if (!token.isNullOrBlank()) connection.setRequestProperty("Authorization", "Bearer $token")

        if (method == "POST" && body.isNotBlank()) {
            connection.doOutput = true
            connection.outputStream.use { it.write(body.toByteArray()) }
        }

        // A non-2xx (e.g. 401 unauthorized) makes getInputStream() throw — read the error
        // body instead and surface the code, so loadData() can show a real message + re-pair.
        val code = connection.responseCode
        if (code !in 200..299) {
            val errBody = try {
                connection.errorStream?.bufferedReader()?.use { it.readText() }
            } catch (e: Exception) { null }
            throw ApiHttpException(code, errBody.orEmpty())
        }
        return connection.inputStream.bufferedReader().use { it.readText() }
    }

    /** Carries the HTTP status so the UI can react (e.g. 401 → re-pair) instead of failing silently. */
    private class ApiHttpException(val code: Int, val bodyText: String) :
        java.io.IOException("HTTP $code" + if (bodyText.isNotBlank()) ": ${bodyText.take(160)}" else "")

    // ─────────────────────────── Welcome wizard ───────────────────────────

    private val welcomeSteps = listOf(
        Triple("👋", "Willkommen!", "Hier steuerst du die Bildschirmzeit auf Jakes Gerät — bequem von deinem eigenen Handy aus."),
        Triple("⏱️", "Guthaben & Zeit", "Ganz oben siehst du, wie viele Minuten Jake heute noch hat. Mit „Zeit geben“ schenkst du Bonus-Minuten."),
        Triple("📨", "Anfragen", "Wenn Jake etwas möchte (z. B. ein Video), erscheint hier eine Anfrage. Ein Tipp genügt zum Erlauben oder Ablehnen."),
        Triple("📱", "Apps", "Unter „Apps verwalten“ legst du fest, welche Apps erlaubt sind und wie lange sie pro Tag laufen dürfen.")
    )

    private fun showWelcome(step: Int) {
        if (step >= welcomeSteps.size) { prefs.edit().putBoolean("welcomed", true).apply(); return }
        val (emoji, title, bodyTxt) = welcomeSteps[step]
        val view = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(20), dp(24), dp(8))
            addView(TextView(this@CompanionActivity).apply {
                text = emoji; textSize = 44f; gravity = Gravity.CENTER_HORIZONTAL; layoutParams = lp(mp, wc)
            })
            addView(TextView(this@CompanionActivity).apply {
                text = title; textSize = 20f; setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor(INK)); gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = lp(mp, wc, top = 10, bottom = 6)
            })
            addView(TextView(this@CompanionActivity).apply {
                text = bodyTxt; textSize = 15f; setTextColor(Color.parseColor(INK_SOFT)); gravity = Gravity.CENTER_HORIZONTAL
            })
            addView(TextView(this@CompanionActivity).apply {
                text = "Schritt ${step + 1} von ${welcomeSteps.size}"; textSize = 12f
                setTextColor(Color.parseColor(INK_MUTE)); gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = lp(mp, wc, top = 14)
            })
        }
        val last = step == welcomeSteps.size - 1
        val builder = AlertDialog.Builder(this)
            .setView(view)
            .setPositiveButton(if (last) "Los geht's" else "Weiter ▸") { _, _ -> showWelcome(step + 1) }
            .setCancelable(false)
        if (!last) builder.setNegativeButton("Überspringen") { _, _ -> prefs.edit().putBoolean("welcomed", true).apply() }
        builder.show()
    }

    private fun infoDialog(title: String, body: String) {
        AlertDialog.Builder(this).setTitle(title).setMessage(body).setPositiveButton("Verstanden", null).show()
    }

    private fun confirm(title: String, message: String, onYes: () -> Unit) {
        AlertDialog.Builder(this).setTitle(title).setMessage(message)
            .setPositiveButton("Ja") { _, _ -> onYes() }
            .setNegativeButton("Abbrechen", null).show()
    }

    // ─────────────────────────── Design system ───────────────────────────

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private fun dpf(v: Float): Float = v * resources.displayMetrics.density
    private fun lp(w: Int, h: Int, top: Int = 0, bottom: Int = 0) =
        LinearLayout.LayoutParams(w, h).apply { topMargin = dp(top); bottomMargin = dp(bottom) }

    private fun newScreen(): LinearLayout {
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(28))
        }
        setContentView(ScrollView(this).apply {
            setBackgroundColor(Color.parseColor(BG))
            isFillViewport = true
            addView(content)
        })
        return content
    }

    private fun appHeader(content: LinearLayout, subtitle: String, showHelp: Boolean = false) {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        row.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
            addView(TextView(this@CompanionActivity).apply {
                text = "LAUNCHPAD ELTERN"; textSize = 12f; letterSpacing = 0.12f
                setTypeface(null, Typeface.BOLD); setTextColor(Color.parseColor(ORANGE))
            })
            addView(TextView(this@CompanionActivity).apply {
                text = subtitle; textSize = 24f; setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor(INK))
            })
        })
        if (showHelp) row.addView(roundIconButton("?") { showWelcome(0) })
        content.addView(row)
        content.addView(spacer(8))
    }

    private fun backHeader(title: String, onBack: () -> Unit): View {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = lp(mp, wc, bottom = 4)
            addView(roundIconButton("‹") { onBack() })
            addView(TextView(this@CompanionActivity).apply {
                text = title; textSize = 22f; setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor(INK)); setPadding(dp(10), 0, 0, 0)
            })
        }
    }

    private fun card(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(18), dp(16), dp(18), dp(16))
        background = GradientDrawable().apply { setColor(Color.parseColor(CARD)); cornerRadius = dpf(18f) }
        layoutParams = lp(mp, wc, top = 6, bottom = 6)
        elevation = dpf(2f)
    }

    private fun innerCard(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(12), dp(14), dp(12))
        background = GradientDrawable().apply {
            setColor(Color.parseColor(BG)); cornerRadius = dpf(12f)
        }
        layoutParams = lp(mp, wc, top = 8, bottom = 4)
    }

    private fun sectionTitleRow(title: String, infoTitle: String, infoBody: String): View {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            addView(TextView(this@CompanionActivity).apply {
                text = title; textSize = 17f; setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor(INK)); layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
            })
            addView(infoBadge(INK_MUTE) { infoDialog(infoTitle, infoBody) })
        }
    }

    private fun rowWithInfo(button: View, infoTitle: String, infoBody: String): View {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            button.layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
            addView(button)
            addView(infoBadge(INK_MUTE) { infoDialog(infoTitle, infoBody) })
        }
    }

    private fun sectionLabel(text: String) = TextView(this).apply {
        this.text = text; textSize = 13f; setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor(INK_SOFT)); setPadding(dp(4), dp(8), 0, dp(4))
    }

    private fun statusChip(label: String, colorHex: String) = TextView(this).apply {
        text = label; textSize = 12f; setTypeface(null, Typeface.BOLD); setTextColor(Color.WHITE)
        background = GradientDrawable().apply { setColor(Color.parseColor(colorHex)); cornerRadius = dpf(20f) }
        setPadding(dp(11), dp(6), dp(11), dp(6))
        layoutParams = LinearLayout.LayoutParams(wc, wc).apply { rightMargin = dp(8) }
    }

    private fun categoryBadge(category: String): TextView {
        val (color, label) = when (category) {
            "ACTIVE_LEISURE" -> ORANGE to "Coins"
            "CREATIVE" -> PURPLE to "Kreativ"
            "LEARNING" -> GREEN to "Lernen"
            "COOLDOWN" -> BLUE to "Pause"
            "COMMUNICATION" -> "#56CCF2" to "Komm."
            else -> INK_MUTE to "Neutral"
        }
        return TextView(this).apply {
            text = label; textSize = 11f; setTextColor(Color.WHITE); setTypeface(null, Typeface.BOLD)
            background = GradientDrawable().apply { setColor(Color.parseColor(color)); cornerRadius = dpf(8f) }
            setPadding(dp(9), dp(4), dp(9), dp(4))
        }
    }

    private fun emptyState(emoji: String, title: String, sub: String) = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER_HORIZONTAL
        setPadding(0, dp(10), 0, dp(8))
        addView(TextView(this@CompanionActivity).apply { text = emoji; textSize = 32f; gravity = Gravity.CENTER })
        addView(TextView(this@CompanionActivity).apply {
            text = title; textSize = 15f; setTypeface(null, Typeface.BOLD); setTextColor(Color.parseColor(INK))
            gravity = Gravity.CENTER; setPadding(0, dp(6), 0, 0)
        })
        addView(TextView(this@CompanionActivity).apply {
            text = sub; textSize = 13f; setTextColor(Color.parseColor(INK_MUTE)); gravity = Gravity.CENTER
        })
    }

    private fun stepLine(num: String, text: String) = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
        layoutParams = lp(mp, wc, top = 8)
        addView(TextView(this@CompanionActivity).apply {
            this.text = num; textSize = 14f; setTypeface(null, Typeface.BOLD); setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            background = GradientDrawable().apply { setColor(Color.parseColor(ORANGE)); shape = GradientDrawable.OVAL }
            layoutParams = LinearLayout.LayoutParams(dp(26), dp(26)).apply { rightMargin = dp(12) }
        })
        addView(TextView(this@CompanionActivity).apply {
            this.text = text; textSize = 15f; setTextColor(Color.parseColor(INK))
            layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
        })
    }

    private fun navButton(title: String, subtitle: String, onClick: () -> Unit) = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(18), dp(16), dp(18), dp(16))
        background = GradientDrawable().apply { setColor(Color.parseColor(CARD)); cornerRadius = dpf(16f) }
        layoutParams = lp(mp, wc, top = 6, bottom = 0)
        elevation = dpf(1f)
        isClickable = true
        setOnClickListener { onClick() }
        addView(LinearLayout(this@CompanionActivity).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, wc, 1f)
            addView(TextView(this@CompanionActivity).apply {
                text = title; textSize = 16f; setTypeface(null, Typeface.BOLD); setTextColor(Color.parseColor(INK))
            })
            addView(TextView(this@CompanionActivity).apply {
                text = subtitle; textSize = 12f; setTextColor(Color.parseColor(INK_MUTE))
            })
        })
        addView(TextView(this@CompanionActivity).apply {
            text = "›"; textSize = 24f; setTextColor(Color.parseColor(INK_MUTE))
        })
    }

    private fun infoBadge(colorHex: String, onClick: () -> Unit) = TextView(this).apply {
        text = "ⓘ"; textSize = 17f; setTextColor(Color.parseColor(colorHex))
        setPadding(dp(10), dp(4), dp(4), dp(4)); isClickable = true
        setOnClickListener { onClick() }
    }

    private fun roundIconButton(glyph: String, onClick: () -> Unit) = TextView(this).apply {
        text = glyph; textSize = 20f; setTypeface(null, Typeface.BOLD); gravity = Gravity.CENTER
        setTextColor(Color.parseColor(NAVY))
        background = GradientDrawable().apply {
            setColor(Color.parseColor("#FFFFFF")); cornerRadius = dpf(22f); setStroke(dp(1), Color.parseColor(LINE))
        }
        layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        isClickable = true
        setOnClickListener { onClick() }
    }

    private fun bodyText(text: String, bold: Boolean = false, color: String = INK_SOFT, size: Float = 14f) =
        TextView(this).apply {
            this.text = text; textSize = size
            if (bold) setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor(color)); setPadding(0, dp(3), 0, dp(3))
        }

    private fun centerHint(text: String) = TextView(this).apply {
        this.text = text; textSize = 13f; setTextColor(Color.parseColor(INK_MUTE)); gravity = Gravity.CENTER
        setPadding(dp(8), dp(8), dp(8), dp(8))
    }

    private fun primaryButton(label: String, onClick: () -> Unit) = styledButton(label, ORANGE, "#FFFFFF", onClick)
    private fun dangerButton(label: String, onClick: () -> Unit) = styledButton(label, DANGER, "#FFFFFF", onClick)

    private fun styledButton(label: String, bg: String, fg: String, onClick: () -> Unit) = Button(this).apply {
        text = label; isAllCaps = false; textSize = 15f; setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor(fg))
        background = GradientDrawable().apply { setColor(Color.parseColor(bg)); cornerRadius = dpf(14f) }
        layoutParams = lp(mp, dp(52), top = 6, bottom = 4)
        stateListAnimator = null
        setOnClickListener { onClick() }
    }

    private fun secondaryButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label; isAllCaps = false; textSize = 15f; setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor(NAVY))
        background = GradientDrawable().apply {
            setColor(Color.parseColor("#FFFFFF")); cornerRadius = dpf(14f); setStroke(dp(2), Color.parseColor(LINE))
        }
        layoutParams = lp(mp, dp(52), top = 6, bottom = 4)
        stateListAnimator = null
        setOnClickListener { onClick() }
    }

    private fun ghostButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label; isAllCaps = false; textSize = 14f; setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor(NAVY))
        background = GradientDrawable().apply { setColor(Color.parseColor("#00FFFFFF")); cornerRadius = dpf(14f) }
        layoutParams = lp(mp, wc, top = 2, bottom = 2)
        stateListAnimator = null
        setOnClickListener { onClick() }
    }

    private fun compactButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label; isAllCaps = false; textSize = 18f; setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor(NAVY))
        background = GradientDrawable().apply { setColor(Color.parseColor(LINE)); cornerRadius = dpf(10f) }
        layoutParams = LinearLayout.LayoutParams(dp(42), dp(42)).apply { setMargins(dp(6), 0, dp(6), 0) }
        stateListAnimator = null
        minWidth = 0; minimumWidth = 0
        setPadding(0, 0, 0, 0)
        setOnClickListener { onClick() }
    }

    private fun spacer(height: Int) = View(this).apply {
        layoutParams = LinearLayout.LayoutParams(mp, dp(height))
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
