// File: app/src/main/kotlin/org/fossify/home/activities/DailyReportActivity.kt
// LAUNCHPAD: Daily summary screen for the parent — heute genutzt, Top-Apps, Anfragen, Audit.

package org.fossify.home.activities

import android.os.Bundle
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.databases.AuditEvent
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.CryptoCashTransaction
import org.fossify.home.databases.DogeRequest
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.TimeBudgetManager
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class DailyReportActivity : AppCompatActivity() {

    private lateinit var db: AppsDatabase
    private lateinit var content: LinearLayout
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)
        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        setContentView(ScrollView(this).apply { addView(content) })
        loadReport()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun loadReport() {
        scope.launch {
            val (midnight, now) = todayRange()
            val txs = withContext(Dispatchers.IO) {
                db.cryptoCashDao().getTransactionsBetween(midnight, now)
            }
            val dogeAll = withContext(Dispatchers.IO) {
                db.dogeRequestDao().getAllRequests()
            }
            val audits = withContext(Dispatchers.IO) {
                db.auditEventDao().getRecent(100)
                    .filter { it.createdAt >= midnight }
            }
            val balance = withContext(Dispatchers.IO) {
                TimeBudgetManager(this@DailyReportActivity, db).getCurrentBudget().balanceMinutes
            }

            renderReport(txs, dogeAll, audits, balance, midnight, now)
        }
    }

    @Suppress("LongMethod")
    private fun renderReport(
        txs: List<CryptoCashTransaction>,
        dogeAll: List<DogeRequest>,
        audits: List<AuditEvent>,
        balance: Int,
        midnight: Long,
        @Suppress("UNUSED_PARAMETER") now: Long
    ) {
        content.removeAllViews()

        val dateLabel = SimpleDateFormat("EEEE, d. MMMM", Locale.GERMAN).format(midnight)
        content.addView(section("Tagesbericht", 22f, topPad = 0))
        content.addView(caption(dateLabel))

        // ── Budget ────────────────────────────────────────────────────────────────
        val spent = txs
            .filter { it.type == LaunchpadConstants.TX_TYPE_SPEND && !it.deleted }
            .sumOf { -it.deltaMinutes }
        val earned = txs
            .filter { it.type == LaunchpadConstants.TX_TYPE_EARN && !it.deleted }
            .sumOf { it.deltaMinutes }
        val corrections = txs
            .filter { it.type == LaunchpadConstants.TX_TYPE_CORRECTION && !it.deleted }
            .sumOf { it.deltaMinutes }

        content.addView(section("Konto"))
        content.addView(dataRow("Aktuelles Guthaben", "$balance Min"))
        content.addView(dataRow("Heute verbraucht", "$spent Min"))
        if (earned > 0) content.addView(dataRow("Heute verdient", "+$earned Min"))
        if (corrections != 0) {
            val sign = if (corrections > 0) "+" else ""
            content.addView(dataRow("Korrekturen", "$sign$corrections Min"))
        }

        // ── Top apps ──────────────────────────────────────────────────────────────
        val spendTxs = txs.filter { it.type == LaunchpadConstants.TX_TYPE_SPEND && !it.deleted }
        val byPkg = spendTxs
            .groupBy { it.reasonText.removePrefix("Nutzung: ") }
            .mapValues { (_, list) -> list.sumOf { -it.deltaMinutes } }
            .entries
            .sortedByDescending { it.value }
            .take(5)

        if (byPkg.isNotEmpty()) {
            content.addView(section("Top-Apps heute"))
            for ((pkg, mins) in byPkg) {
                val label = try {
                    packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
                } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
                    android.util.Log.w("DailyReport", "Package not found: $pkg", e)
                    pkg
                }
                content.addView(dataRow(label, "$mins Min"))
            }
        }

        // ── Doge-Anfragen ─────────────────────────────────────────────────────────
        val todayRequests = dogeAll.filter { it.requestedAt >= midnight }
        if (todayRequests.isNotEmpty()) {
            val approved = todayRequests.count { it.decision == "APPROVED" }
            val rejected = todayRequests.count { it.decision == "REJECTED" }
            val pending = todayRequests.count { it.decision == null }

            content.addView(section("Medien-Anfragen heute"))
            content.addView(dataRow("Eingereicht", "${todayRequests.size}"))
            if (approved > 0) content.addView(dataRow("Genehmigt", "$approved"))
            if (rejected > 0) content.addView(dataRow("Abgelehnt", "$rejected"))
            if (pending > 0) content.addView(dataRow("Ausstehend", "$pending"))
        }

        // ── Audit events ──────────────────────────────────────────────────────────
        val warnings = audits.filter {
            it.severity == LaunchpadConstants.SEVERITY_WARNING || it.severity == LaunchpadConstants.SEVERITY_CRITICAL
        }
        if (warnings.isNotEmpty()) {
            content.addView(section("Ereignisse heute"))
            for (ev in warnings.take(5)) {
                content.addView(auditRow(ev))
            }
            if (warnings.size > 5) {
                content.addView(caption("… und ${warnings.size - 5} weitere"))
            }
        } else {
            content.addView(section("Ereignisse heute"))
            content.addView(caption("Keine Auffälligkeiten"))
        }

        // ── Nächster Tag ─────────────────────────────────────────────────────────
        content.addView(section("Morgen"))
        content.addView(caption("Das Konto wird nicht automatisch zurückgesetzt — " +
            "neues Budget über „Heute Ausnahme" hinzufügen."))
    }

    // ── View helpers ─────────────────────────────────────────────────────────────

    private fun section(text: String, size: Float = 16f, topPad: Int = 24) =
        TextView(this).apply {
            this.text = text
            textSize = size
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(android.graphics.Color.parseColor("#0D2847"))
            setPadding(0, topPad, 0, 8)
        }

    private fun caption(text: String) = TextView(this).apply {
        this.text = text
        textSize = 13f
        setTextColor(android.graphics.Color.parseColor("#666666"))
        setPadding(0, 0, 0, 8)
    }

    private fun dataRow(label: String, value: String) = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        setPadding(0, 6, 0, 6)
        addView(TextView(this@DailyReportActivity).apply {
            text = label
            textSize = 15f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        })
        addView(TextView(this@DailyReportActivity).apply {
            text = value
            textSize = 15f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(android.graphics.Color.parseColor("#0D2847"))
        })
    }

    private fun auditRow(ev: AuditEvent) = TextView(this).apply {
        val color = when (ev.severity) {
            LaunchpadConstants.SEVERITY_CRITICAL -> "#D32F2F"
            LaunchpadConstants.SEVERITY_WARNING -> "#E65100"
            else -> "#555555"
        }
        text = "• ${ev.message}"
        textSize = 13f
        setTextColor(android.graphics.Color.parseColor(color))
        setPadding(0, 4, 0, 4)
    }

    private fun todayRange(): Pair<Long, Long> {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis to System.currentTimeMillis()
    }
}
