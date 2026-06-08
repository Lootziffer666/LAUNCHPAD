// File: app/src/main/kotlin/org/fossify/home/activities/ElternModusActivity.kt
// LAUNCHPAD: Parent control centre — proper Settings-style layout.

package org.fossify.home.activities

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.R
import org.fossify.home.databases.AllowedApp
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.LaunchpadWidgetProvider
import org.fossify.home.databases.CryptoCashTransaction
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.CooldownRulesConfig
import org.fossify.home.helpers.CooldownRulesValidator
import org.fossify.home.helpers.KioskManager
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.helpers.PairingManager
import org.fossify.home.helpers.PinGateHelper
import org.fossify.home.helpers.SchoolMode
import org.fossify.home.helpers.TamperMonitor
import org.fossify.home.helpers.UsageTracker
import org.fossify.home.services.TimeTrackingService
import java.text.SimpleDateFormat
import java.util.*

@Suppress("MagicNumber", "TooManyFunctions", "LargeClass") // settings screen, UI built programmatically
class ElternModusActivity : AppCompatActivity() {

    private lateinit var db: AppsDatabase
    private lateinit var pinGate: PinGateHelper
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Dashboard views
    private lateinit var balanceBig: android.widget.TextView
    private lateinit var modeBadge: android.widget.TextView
    private lateinit var lastTx: android.widget.TextView
    private lateinit var enforcementLabel: android.widget.TextView

    // Dashboard light
    private lateinit var todayUsed: android.widget.TextView
    private lateinit var topApps: android.widget.TextView

    // Row subtitles
    private lateinit var appsCount: android.widget.TextView
    private lateinit var zusagenCount: android.widget.TextView
    private lateinit var dogeCount: android.widget.TextView
    private lateinit var timeRequestsCount: android.widget.TextView
    private lateinit var usageStatus: android.widget.TextView
    private lateinit var pairStatus: android.widget.TextView
    private lateinit var healthStatus: android.widget.TextView
    private lateinit var auditStatus: android.widget.TextView
    private lateinit var strictStatus: android.widget.TextView
    private lateinit var childNameStatus: android.widget.TextView
    private lateinit var schoolStatus: android.widget.TextView

    // Switches
    private lateinit var kindermodusSwitch: org.fossify.commons.views.MyMaterialSwitch
    private lateinit var kioskSwitch: org.fossify.commons.views.MyMaterialSwitch

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        db = AppsDatabase.getInstance(this)
        pinGate = PinGateHelper(this)

        // Require PIN (or first-time setup)
        if (pinGate.isPinConfigured() && !pinGate.isParentModeActive()) {
            requestPin()
            return
        }

        initUi()
    }

    override fun onResume() {
        super.onResume()
        if (pinGate.isParentModeActive() || !pinGate.isPinConfigured()) {
            refresh()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun requestPin() {
        // Pre-check: if still locked out, don't even show the input dialog.
        if (pinGate.isLockedOut()) {
            val secs = pinGate.lockoutSecondsRemaining()
            toast("Zu viele Fehlversuche. Bitte warte ${secs}s.")
            finish()
            return
        }
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "Eltern-PIN"
        }
        AlertDialog.Builder(this)
            .setTitle("Eltern-Modus")
            .setMessage("PIN eingeben:")
            .setView(input)
            .setPositiveButton("OK") { _, _ ->
                when (val result = pinGate.verifyPin(input.text.toString())) {
                    is PinGateHelper.VerifyResult.Success -> {
                        pinGate.activateParentMode(30)
                        initUi()
                        refresh()
                    }
                    is PinGateHelper.VerifyResult.Wrong -> {
                        if (result.newLockoutSeconds > 0) {
                            toast("Zu viele Fehlversuche. Bitte warte ${result.newLockoutSeconds}s.")
                        } else {
                            toast("Falscher PIN (Versuch ${result.failCount})")
                        }
                        finish()
                    }
                    is PinGateHelper.VerifyResult.LockedOut -> {
                        toast("Zu viele Fehlversuche. Bitte warte ${result.secondsRemaining}s.")
                        finish()
                    }
                }
            }
            .setNegativeButton("Abbrechen") { _, _ -> finish() }
            .setCancelable(false)
            .show()
    }

    private fun initUi() {
        setContentView(R.layout.activity_eltern_modus)

        val toolbar = findViewById<androidx.appcompat.widget.Toolbar>(R.id.em_toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.apply { title = "Eltern-Modus"; setDisplayHomeAsUpEnabled(true) }
        toolbar.setNavigationOnClickListener { finish() }

        // Dashboard
        balanceBig = findViewById(R.id.em_balance_big)
        modeBadge = findViewById(R.id.em_mode_badge)
        lastTx = findViewById(R.id.em_last_tx)
        enforcementLabel = findViewById(R.id.em_enforcement_label)

        // Dashboard light
        todayUsed = findViewById(R.id.em_today_used)
        topApps = findViewById(R.id.em_top_apps)

        // Row subtitles
        appsCount = findViewById(R.id.em_apps_count)
        zusagenCount = findViewById(R.id.em_zusagen_count)
        dogeCount = findViewById(R.id.em_doge_count)
        timeRequestsCount = findViewById(R.id.em_time_requests_count)
        usageStatus = findViewById(R.id.em_usage_status)
        pairStatus = findViewById(R.id.em_pair_status)
        healthStatus = findViewById(R.id.em_health_status)
        auditStatus = findViewById(R.id.em_audit_status)
        strictStatus = findViewById(R.id.em_strict_status)
        childNameStatus = findViewById(R.id.em_child_name)
        schoolStatus = findViewById(R.id.em_school_status)

        // Switches
        kindermodusSwitch = findViewById(R.id.em_kindermodus_switch)
        kioskSwitch = findViewById(R.id.em_kiosk_switch)

        // Wire rows. NOTE: fossify-commons' SettingsSwitchStyle sets the MyMaterialSwitch to
        // android:clickable="false" — the switch never reacts to taps itself. The surrounding
        // holder row must catch the tap and call switch.toggle(). That's why the two switch
        // rows below toggle their switch instead of being left unwired (the missing
        // em_row_kindermodus handler is what stopped Kindermodus from turning on).
        listOf<Pair<Int, () -> Unit>>(
            R.id.em_row_add_time to { showAddTimeDialog() },
            R.id.em_row_transactions to { showTransactions() },
            R.id.em_row_tagesbericht to {
                startActivity(Intent(this, DailyReportActivity::class.java))
            },
            R.id.em_row_wochenplan to {
                startActivity(Intent(this, WeekScheduleActivity::class.java))
            },
            R.id.em_row_apps to { startActivity(Intent(this, AppsManagementActivity::class.java)) },
            R.id.em_row_zusagen to {
                startActivity(Intent(this, ZusagenActivity::class.java).putExtra("isParentMode", true))
            },
            R.id.em_row_doge to {
                startActivity(Intent(this, DogeRequestsActivity::class.java).putExtra("isParentMode", true))
            },
            R.id.em_row_time_requests to {
                startActivity(Intent(this, AppTimeRequestsActivity::class.java))
            },
            R.id.em_row_cooldown_rules to { showCooldownEditor() },
            R.id.em_row_hinweise to { showHinweiseDialog() },
            R.id.em_row_health to {
                startActivity(Intent(this, PermissionHealthActivity::class.java))
            },
            R.id.em_row_audit to {
                startActivity(Intent(this, AuditLogActivity::class.java))
            },
            R.id.em_row_strict_block to { showStrictBlockDialog() },
            R.id.em_row_child_name to { showChildNameDialog() },
            R.id.em_row_usage to { openUsageSettings() },
            R.id.em_row_kindermodus to { kindermodusSwitch.toggle() },
            R.id.em_row_kiosk to { kioskSwitch.toggle() },
            R.id.em_row_school to { showSchoolModeChooser() },
            R.id.em_row_qr to { startActivity(Intent(this, PairingActivity::class.java)) },
            R.id.em_row_familylink to { showFamilyLinkInfo() },
        ).forEach { (id, action) -> findViewById<android.view.View>(id).setOnClickListener { action() } }

        // Switches
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        kindermodusSwitch.isChecked = prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
        kindermodusSwitch.setOnCheckedChangeListener { _, checked -> toggleKindermodus(checked) }

        kioskSwitch.isChecked = KioskManager.isKioskEnabled(this)
        kioskSwitch.setOnCheckedChangeListener { _, checked ->
            if (!KioskManager.isDeviceOwner(this)) {
                // Can't enable kiosk without device owner. Revert quietly and explain. The
                // `if (checked)` guard stops the revert below from re-triggering this dialog
                // (setting isChecked = false fires this listener again with checked = false).
                if (checked) {
                    kioskSwitch.isChecked = false
                    showKioskSetupDialog()
                }
            } else {
                KioskManager.setKioskEnabled(this, checked)
                if (checked) KioskManager.applyRestrictions(this) else KioskManager.stopKiosk(this)
            }
        }
    }

    @Suppress("CyclomaticComplexMethod")
    private fun refresh() {
        if (!this::balanceBig.isInitialized) return
        scope.launch {
            val midnight = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            }.timeInMillis
            val balance = withContext(Dispatchers.IO) { db.cryptoCashDao().getCurrentBalance() }
            val tx = withContext(Dispatchers.IO) { db.cryptoCashDao().getLastTransaction() }
            val todayTxs = withContext(Dispatchers.IO) {
                db.cryptoCashDao().getTransactionsBetween(midnight, System.currentTimeMillis())
            }
            val spentToday = todayTxs.filter { it.type == LaunchpadConstants.TX_TYPE_SPEND }
                .sumOf { -it.deltaMinutes }
            val topPkgs = todayTxs.filter { it.type == LaunchpadConstants.TX_TYPE_SPEND }
                .groupBy { it.reasonText.removePrefix("Nutzung: ") }
                .mapValues { (_, txs) -> txs.sumOf { -it.deltaMinutes } }
                .entries.sortedByDescending { it.value }
                .take(3)
                .mapNotNull { (pkg, mins) ->
                    val name = try {
                        packageManager.getApplicationLabel(
                            packageManager.getApplicationInfo(pkg, 0)
                        ).toString()
                    } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
                        android.util.Log.w("ElternModus", "Package not found: $pkg", e)
                        null
                    }
                    name?.let { "$it ($mins Min)" }
                }
            val appCount = withContext(Dispatchers.IO) { db.allowedAppDao().getAllEnabledApps().size }
            val zusagenPending = withContext(Dispatchers.IO) { db.zusageDao().getZusagenByStatus("ACTIVE").size }
            val dogePending = withContext(Dispatchers.IO) { db.dogeRequestDao().getPending().size }
            val timeReqPending = withContext(Dispatchers.IO) { db.appTimeRequestDao().countPending() }
            val openEvents = withContext(Dispatchers.IO) { db.auditEventDao().getUnacknowledged().size }
            val lockdown = TamperMonitor.isLockdownActive(this@ElternModusActivity)
            val paired = PairingManager(this@ElternModusActivity).isPaired()
            val usageGranted = UsageTracker.hasUsageAccess(this@ElternModusActivity)
            val enforcement = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
                .getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)

            balanceBig.text = "$balance Min"
            balanceBig.setTextColor(when {
                balance <= 0 -> android.graphics.Color.parseColor("#E85D3D")
                balance < 15 -> android.graphics.Color.parseColor("#E8930C")
                else -> android.graphics.Color.parseColor("#2BB673")
            })

            modeBadge.text = if (enforcement) "AKTIV" else "SETUP"
            modeBadge.setBackgroundColor(
                android.graphics.Color.parseColor(if (enforcement) "#2BB673" else "#FF7A59")
            )

            todayUsed.text = if (spentToday > 0) "Heute genutzt: $spentToday Min" else "Heute noch nicht genutzt"
            topApps.text = if (topPkgs.isNotEmpty()) "Top: ${topPkgs.joinToString(" · ")}" else ""

            val fmt = SimpleDateFormat("dd.MM. HH:mm", Locale.GERMANY)
            lastTx.text = tx?.let { "Letzte Transaktion: ${fmt.format(Date(it.createdAt))}" } ?: "Keine Transaktionen"
            enforcementLabel.text = if (enforcement) "Kindermodus an" else "Kindermodus aus"

            appsCount.text = "$appCount Apps freigegeben"
            zusagenCount.text = if (zusagenPending > 0) {
                "$zusagenPending wartende Versprechen"
            } else {
                "Keine aktiven Versprechen"
            }
            dogeCount.text = if (dogePending > 0) "$dogePending offene Anfragen" else "Keine offenen Anfragen"
            timeRequestsCount.text = if (timeReqPending > 0) {
                "$timeReqPending offene Anfragen"
            } else {
                "Keine offenen Anfragen"
            }
            usageStatus.text = if (usageGranted) "Erteilt ✓" else "Noch nicht erteilt — zum Öffnen tippen"
            pairStatus.text = if (paired) "Verbunden ✓" else "Noch nicht verbunden"
            val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            val issues = listOfNotNull(
                if (!usageGranted) "Nutzungsstatistiken fehlen" else null,
                if (!pm.isIgnoringBatteryOptimizations(packageName)) "Akku-Optimierung aktiv" else null,
                if (enforcement && !TimeTrackingService.isRunning) "Tracking gestoppt" else null
            )
            healthStatus.text = if (issues.isEmpty()) "Alles OK ✓" else "⚠️ ${issues.joinToString(", ")}"
            healthStatus.setTextColor(
                android.graphics.Color.parseColor(if (issues.isEmpty()) "#2BB673" else "#F2994A")
            )
            auditStatus.text = when {
                lockdown -> "Schutzmodus aktiv — bitte kurz prüfen"
                openEvents > 0 -> "$openEvents neue Ereignisse"
                else -> "Keine besonderen Ereignisse"
            }
            auditStatus.setTextColor(
                android.graphics.Color.parseColor(if (lockdown) "#E85D3D" else "#9B8779")
            )
            val strict = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
                .getBoolean(LaunchpadPrefs.PREF_STRICT_FOREGROUND_BLOCK, false)
            strictStatus.text = if (strict) "An — nur erlaubte Apps" else "Aus"
            childNameStatus.text = ChildProfile.name(this@ElternModusActivity)

            val ctx = this@ElternModusActivity
            schoolStatus.text = if (SchoolMode.isActive(ctx)) {
                if (SchoolMode.activeUntil(ctx) == SchoolMode.INDEFINITE) {
                    "● Läuft — bis du es beendest"
                } else {
                    "● Läuft noch ${SchoolMode.remainingMillis(ctx) / 60_000L} Min"
                }
            } else {
                "Aus"
            }
        }
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    private fun showChildNameDialog() {
        val input = EditText(this).apply {
            setText(ChildProfile.name(this@ElternModusActivity))
            hint = "Name des Kindes"
            setSingleLine()
            setSelection(text.length)
        }
        AlertDialog.Builder(this)
            .setTitle("Name des Kindes")
            .setView(input)
            .setPositiveButton("Speichern") { _, _ ->
                ChildProfile.setName(this, input.text.toString())
                scope.launch { refresh() }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun showSchoolModeChooser() {
        if (SchoolMode.isActive(this)) {
            AlertDialog.Builder(this)
                .setTitle("Schulmodus läuft")
                .setMessage("Nur Lernen, Kommunikation und neutrale Apps sind sichtbar. " +
                    "Spielen wartet bis später.")
                .setPositiveButton("Beenden") { _, _ ->
                    SchoolMode.stop(this)
                    toast("Schulmodus beendet")
                    scope.launch { refresh() }
                }
                .setNegativeButton("Weiter laufen lassen", null)
                .show()
            return
        }
        val options = arrayOf("30 Minuten", "60 Minuten", "Bis Uhrzeit…", "Bis ich es beende")
        AlertDialog.Builder(this)
            .setTitle("Schulmodus starten")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> startSchool { SchoolMode.startForMinutes(this, 30) }
                    1 -> startSchool { SchoolMode.startForMinutes(this, 60) }
                    2 -> pickSchoolEndTime()
                    else -> startSchool { SchoolMode.startIndefinite(this) }
                }
            }
            .show()
    }

    private fun startSchool(start: () -> Unit) {
        start()
        toast("Schulzeit läuft 📚")
        scope.launch { refresh() }
    }

    private fun pickSchoolEndTime() {
        val now = Calendar.getInstance()
        android.app.TimePickerDialog(this, { _, h, m ->
            val end = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, h); set(Calendar.MINUTE, m)
                set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            }
            if (end.timeInMillis <= System.currentTimeMillis()) {
                end.add(Calendar.DAY_OF_MONTH, 1)
            }
            startSchool { SchoolMode.startUntil(this, end.timeInMillis) }
        }, now.get(Calendar.HOUR_OF_DAY), now.get(Calendar.MINUTE), true).show()
    }

    private fun showStrictBlockDialog() {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val on = prefs.getBoolean(LaunchpadPrefs.PREF_STRICT_FOREGROUND_BLOCK, false)
        if (on) {
            AlertDialog.Builder(this)
                .setTitle("Lückenloser App-Schutz ist an")
                .setMessage("Nicht freigegebene Apps werden auch über Umwege (Links, " +
                    "Benachrichtigungen, zuletzt genutzt) blockiert. Telefon/Notruf bleibt frei.")
                .setPositiveButton("Ausschalten") { _, _ ->
                    prefs.edit().putBoolean(LaunchpadPrefs.PREF_STRICT_FOREGROUND_BLOCK, false).apply()
                    scope.launch { refresh() }
                }
                .setNegativeButton("Schließen", null)
                .show()
            return
        }
        AlertDialog.Builder(this)
            .setTitle("Lückenlosen App-Schutz einschalten?")
            .setMessage(
                "Zusätzlich zum Launcher werden dann auch nicht freigegebene Apps blockiert, " +
                    "die über Umwege geöffnet werden.\n\n" +
                    "⚠️ Bitte vorher auf dem Gerät testen — besonders, dass Anrufe und der " +
                    "Notruf weiterhin funktionieren. Telefon, Einstellungen und System sind " +
                    "ausgenommen."
            )
            .setPositiveButton("Einschalten") { _, _ ->
                prefs.edit().putBoolean(LaunchpadPrefs.PREF_STRICT_FOREGROUND_BLOCK, true).apply()
                toast("Lückenloser Schutz an — bitte Notruf testen")
                scope.launch { refresh() }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun showAddTimeDialog() {
        val mins = EditText(this).apply {
            hint = "Eigene Minutenzahl"
            inputType = InputType.TYPE_CLASS_NUMBER
        }
        val reason = EditText(this).apply {
            hint = "Grund (optional)"
            inputType = InputType.TYPE_CLASS_TEXT
        }
        val presets = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 0, 0, 8)
        }
        listOf(15, 30, 60).forEach { preset ->
            presets.addView(Button(this).apply {
                text = "+$preset"
                isAllCaps = false
                textSize = 13f
                setTextColor(Color.WHITE)
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#FF7A59"))
                    cornerRadius = 8f
                }
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                    .apply { setMargins(0, 0, 8, 0) }
                setOnClickListener { mins.setText(preset.toString()) }
            })
        }
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 0)
            addView(presets); addView(mins); addView(reason)
        }
        AlertDialog.Builder(this)
            .setTitle("Heute Ausnahme")
            .setView(box)
            .setPositiveButton("Hinzufügen") { _, _ ->
                val m = mins.text.toString().toIntOrNull()
                if (m == null || m <= 0) { toast("Ungültige Minutenzahl"); return@setPositiveButton }
                val r = reason.text.toString().ifBlank { "Heute Ausnahme" }
                scope.launch {
                    withContext(Dispatchers.IO) {
                        val cur = db.cryptoCashDao().getCurrentBalance()
                        db.cryptoCashDao().insertTransaction(CryptoCashTransaction(
                            deltaMinutes = m, type = LaunchpadConstants.TX_TYPE_CORRECTION,
                            actor = "parent", reasonType = "today_exception", reasonText = r,
                            childVisibleText = "+$m Min (${r})", source = "parent_app",
                            balanceAfter = cur + m
                        ))
                        TamperMonitor.recordSuspend(
                            this@ElternModusActivity,
                            LaunchpadConstants.AUDIT_EXCEPTION_GRANTED,
                            LaunchpadConstants.SEVERITY_INFO,
                            "Heute Ausnahme: +$m Min — $r"
                        )
                    }
                    toast("+$m Minuten für heute")
                    refresh()
                    LaunchpadWidgetProvider.requestUpdate(this@ElternModusActivity)
                }
            }
            .setNegativeButton("Abbrechen", null).show()
    }

    private fun showTransactions() {
        scope.launch {
            val txs = withContext(Dispatchers.IO) { db.cryptoCashDao().getAllTransactions().reversed() }
            val fmt = SimpleDateFormat("dd.MM. HH:mm", Locale.GERMANY)
            val msg = if (txs.isEmpty()) "Keine Transaktionen"
            else txs.take(20).joinToString("\n") {
                val sign = if (it.deltaMinutes >= 0) "+" else ""
                "${fmt.format(Date(it.createdAt))}  $sign${it.deltaMinutes} Min — ${it.reasonText}"
            }
            AlertDialog.Builder(this@ElternModusActivity)
                .setTitle("Transaktionen")
                .setMessage(msg)
                .setPositiveButton("OK", null).show()
        }
    }

    private fun showCooldownEditor() {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val json = prefs.getString(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON, null) ?: CooldownRulesConfig.defaultJson()
        val input = EditText(this).apply {
            setText(json)
            inputType = InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
            minLines = 5
        }
        AlertDialog.Builder(this)
            .setTitle("Ruhezeiten (JSON)")
            .setView(input)
            .setPositiveButton("Speichern") { _, _ ->
                val v = CooldownRulesValidator().validate(input.text.toString())
                if (v.isValid) {
                    prefs.edit().putString(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON, input.text.toString()).apply()
                    toast("Gespeichert")
                } else toast("Ungültig: ${v.error}")
            }
            .setNegativeButton("Abbrechen", null).show()
    }

    private fun showHinweiseDialog() {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val enabledCb = android.widget.CheckBox(this).apply {
            text = "Vibration bei Zeit-Warnungen"
            isChecked = prefs.getBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED, false)
        }
        val strengthLabel = android.widget.TextView(this).apply {
            text = "Stärke (Dauer)"
            setPadding(0, 24, 0, 0)
        }
        val current = prefs.getInt(LaunchpadPrefs.PREF_VIBRATION_MS, LaunchpadConstants.DEFAULT_VIBRATION_MS)
        val seek = android.widget.SeekBar(this).apply {
            max = 700 // 100..800 ms
            progress = (current - 100).coerceIn(0, 700)
        }
        val valueLabel = android.widget.TextView(this).apply { text = "${seek.progress + 100} ms" }
        seek.setOnSeekBarChangeListener(object : android.widget.SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: android.widget.SeekBar?, p: Int, fromUser: Boolean) {
                valueLabel.text = "${p + 100} ms"
            }
            override fun onStartTrackingTouch(sb: android.widget.SeekBar?) { /* no-op */ }
            override fun onStopTrackingTouch(sb: android.widget.SeekBar?) {
                // Preview the chosen strength immediately.
                prefs.edit().putInt(LaunchpadPrefs.PREF_VIBRATION_MS, sb!!.progress + 100).apply()
                if (enabledCb.isChecked) {
                    prefs.edit().putBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED, true).apply()
                    org.fossify.home.helpers.VibrationHelper.buzz(this@ElternModusActivity)
                }
            }
        })
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 0)
            addView(enabledCb); addView(strengthLabel); addView(seek); addView(valueLabel)
        }
        AlertDialog.Builder(this)
            .setTitle("Hinweise & Vibration")
            .setMessage("Zeit-Warnungen (10/5/0 Min) als Hinweis mit optionaler Vibration.")
            .setView(box)
            .setPositiveButton("Speichern") { _, _ ->
                prefs.edit()
                    .putBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED, enabledCb.isChecked)
                    .putInt(LaunchpadPrefs.PREF_VIBRATION_MS, seek.progress + 100)
                    .apply()
                toast("Gespeichert")
            }
            .setNegativeButton("Abbrechen", null).show()
    }

    @Suppress("TooGenericExceptionCaught") // broad catch: intentional fail-safe opening settings
    private fun openUsageSettings() {
        if (UsageTracker.hasUsageAccess(this)) { toast("Nutzungszugriff ist bereits erteilt ✓"); return }
        try {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        } catch (e: Exception) {
            android.util.Log.w("LAUNCHPAD", "Usage-access settings unavailable", e)
            toast("Einstellungen nicht verfügbar")
        }
    }

    private fun toggleKindermodus(enable: Boolean) {
        // Write to applicationContext prefs to match the same context MainActivity uses.
        applicationContext.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
            .edit().putBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, enable).apply()

        if (enable) {
            scope.launch {
                val count = withContext(Dispatchers.IO) {
                    db.allowedAppDao().getAllEnabledApps().size
                }
                if (count == 0) {
                    // Don't block activation — just warn. Parent can add apps next.
                    toast("Kindermodus an ⚠️ Noch keine Apps freigegeben — " +
                        "unter 'Apps verwalten' welche hinzufügen")
                } else {
                    toast("Kindermodus an — $count Apps freigegeben")
                }
                refresh()
            }
        } else {
            toast("Kindermodus aus — alle Apps sichtbar")
            scope.launch { refresh() }
        }
    }

    private fun showKioskSetupDialog() {
        AlertDialog.Builder(this)
            .setTitle("Geschützten Modus einrichten")
            .setMessage(
                "Optional — nur für maximale lokale Härtung. Funktioniert NUR auf einem Gerät " +
                    "OHNE Google-Konto, lässt sich also nicht mit Family Link kombinieren.\n\n" +
                    "Für Fern-Funktionen lieber Family Link (App-Freigaben, mehr Zeit von " +
                    "unterwegs) und diesen Modus aus lassen.\n\n" +
                    "Einmaliger ADB-Befehl auf einem frisch zurückgesetzten Gerät:\n\n" +
                    "${KioskManager.deviceOwnerSetupCommand(this)}"
            )
            .setPositiveButton("OK", null).show()
    }

    private fun showFamilyLinkInfo() {
        AlertDialog.Builder(this)
            .setTitle("Fern-Zugriff & Family Link")
            .setMessage(
                "LAUNCHPAD steuert lokal im WLAN. Für Anfragen von unterwegs nutzt du am " +
                    "besten Google Family Link:\n\n" +
                    "• App-Installationen aus dem Play Store freigeben\n" +
                    "• Mehr-Zeit-Bitten unterwegs genehmigen\n" +
                    "• Gerät aus der Ferne sperren, Standort\n\n" +
                    "Family Link braucht ein Google-Kinderkonto auf dem Gerät — dann den " +
                    "geschützten Modus (Device Owner) hier aus lassen (beides zusammen geht " +
                    "nicht auf einem Gerät).\n\n" +
                    "Hinweis: Eine in Family Link neu erlaubte App erscheint im Kinder-Launcher " +
                    "erst, wenn du sie auch unter Apps verwalten freigibst."
            )
            .setPositiveButton("Mehr erfahren") { _, _ ->
                try {
                    startActivity(
                        Intent(Intent.ACTION_VIEW,
                            android.net.Uri.parse("https://families.google/familylink/"))
                    )
                } catch (e: android.content.ActivityNotFoundException) {
                    android.util.Log.w("ElternModus", "No browser for Family Link link", e)
                    toast("Kein Browser gefunden")
                }
            }
            .setNegativeButton("Schließen", null)
            .show()
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}
