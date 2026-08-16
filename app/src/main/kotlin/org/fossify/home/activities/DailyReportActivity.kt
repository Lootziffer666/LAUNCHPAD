// File: app/src/main/kotlin/org/fossify/home/activities/DailyReportActivity.kt
// LAUNCHPAD: Daily summary screen for the parent — heute genutzt, Top-Apps, Anfragen, Audit.

package org.fossify.home.activities

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
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
import org.fossify.home.helpers.AppLimitBonus
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.ui.GameMenuUi
import org.fossify.home.ui.LaunchpadDestination
import org.fossify.home.ui.LaunchpadNavigation
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class DailyReportActivity : AppCompatActivity() {

    private lateinit var db: AppsDatabase
    private lateinit var content: LinearLayout
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Plain-text mirror of the rendered report, assembled by the view helpers so the
    // "Teilen" button can hand a copy to the other parent without re-querying.
    private val reportText = StringBuilder()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)
        content = GameMenuUi.install(
            this,
            "Tagesbericht",
            LaunchpadNavigation.view(this, LaunchpadDestination.JOURNAL),
        )
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
            val today = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
            val limits = withContext(Dispatchers.IO) {
                db.appTimeLimitDao().getAll()
                    .mapNotNull { limit ->
                        val base = limit.minutesForDay(today)
                        if (base <= 0) return@mapNotNull null // no cap today
                        val bonus = AppLimitBonus.getTodayBonus(
                            this@DailyReportActivity, limit.packageName, midnight
                        )
                        limit.packageName to AppLimitBonus.effectiveLimit(base, bonus)
                    }
                    .toMap()
            }

            renderReport(txs, dogeAll, audits, balance, limits, midnight, now)
        }
    }

    @Suppress("LongMethod")
    private fun renderReport(
        txs: List<CryptoCashTransaction>,
        dogeAll: List<DogeRequest>,
        audits: List<AuditEvent>,
        balance: Int,
        limits: Map<String, Int>,
        midnight: Long,
        @Suppress("UNUSED_PARAMETER") now: Long
    ) {
        content.removeAllViews()
        reportText.setLength(0)

        val dateLabel = SimpleDateFormat("EEEE, d. MMMM", Locale.GERMAN).format(midnight)
        reportText.append("Tagesbericht\n").append(dateLabel).append("\n")
        content.addView(GameMenuUi.title(this, "Dein Tag im Überblick"))
        content.addView(GameMenuUi.body(this, dateLabel))

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

        content.addView(GameMenuUi.card(this, GameMenuUi.GREEN) {
            addView(section("Konto"))
            addView(dataRow("Aktuelles Guthaben", "$balance Min"))
            addView(dataRow("Heute verbraucht", "$spent Min"))
            if (earned > 0) addView(dataRow("Heute verdient", "+$earned Min"))
            if (corrections != 0) {
                val sign = if (corrections > 0) "+" else ""
                addView(dataRow("Korrekturen", "$sign$corrections Min"))
            }
        })

        // ── Top apps ──────────────────────────────────────────────────────────────
        val spendTxs = txs.filter { it.type == LaunchpadConstants.TX_TYPE_SPEND && !it.deleted }
        val byPkg = spendTxs
            .groupBy { it.reasonText.removePrefix("Nutzung: ") }
            .mapValues { (_, list) -> list.sumOf { -it.deltaMinutes } }
            .entries
            .sortedByDescending { it.value }
            .take(5)

        if (byPkg.isNotEmpty()) {
            content.addView(GameMenuUi.card(this, GameMenuUi.BLUE) {
                addView(section("Top-Apps heute"))
                for ((pkg, mins) in byPkg) {
                    val label = try {
                        packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
                    } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
                        android.util.Log.w("DailyReport", "Package not found: $pkg", e)
                        pkg
                    }
                    val limit = limits[pkg]
                    val value = when {
                        limit == null -> "$mins Min"
                        mins >= limit -> "$mins / $limit Min ⛔"
                        else -> "$mins / $limit Min"
                    }
                    addView(dataRow(label, value))
                }
                if (byPkg.any { (pkg, mins) -> limits[pkg]?.let { mins >= it } == true }) {
                    addView(caption("⛔ = Tageslimit heute erreicht"))
                }
            })
        }

        // ── Doge-Anfragen ─────────────────────────────────────────────────────────
        val todayRequests = dogeAll.filter { it.requestedAt >= midnight }
        if (todayRequests.isNotEmpty()) {
            val approved = todayRequests.count { it.decision == "APPROVED" }
            val rejected = todayRequests.count { it.decision == "REJECTED" }
            val pending = todayRequests.count { it.decision == null }

            content.addView(GameMenuUi.card(this, GameMenuUi.YELLOW) {
                addView(section("Medien-Anfragen heute"))
                addView(dataRow("Eingereicht", "${todayRequests.size}"))
                if (approved > 0) addView(dataRow("Genehmigt", "$approved"))
                if (rejected > 0) addView(dataRow("Abgelehnt", "$rejected"))
                if (pending > 0) addView(dataRow("Ausstehend", "$pending"))
            })
        }

        // ── Audit events ──────────────────────────────────────────────────────────
        val warnings = audits.filter {
            it.severity == LaunchpadConstants.SEVERITY_WARNING || it.severity == LaunchpadConstants.SEVERITY_CRITICAL
        }
        if (warnings.isNotEmpty()) {
            content.addView(GameMenuUi.card(this, GameMenuUi.RED) {
                addView(section("Ereignisse heute"))
                for (ev in warnings.take(5)) addView(auditRow(ev))
                if (warnings.size > 5) addView(caption("… und ${warnings.size - 5} weitere"))
            })
        } else {
            content.addView(GameMenuUi.card(this, GameMenuUi.GREEN) {
                addView(section("Ereignisse heute"))
                addView(GameMenuUi.emptyState(this@DailyReportActivity, "✓ Keine Auffälligkeiten"))
            })
            reportText.append("\nEreignisse heute\nKeine Auffälligkeiten\n")
        }

        // ── Nächster Tag ─────────────────────────────────────────────────────────
        content.addView(GameMenuUi.card(this, GameMenuUi.BLUE) {
            addView(section("Morgen"))
            addView(caption("Das Konto wird nicht automatisch zurückgesetzt — " +
                "neues Budget über „Heute Ausnahme\" hinzufügen."))
        })

        // ── Teilen ─────────────────────────────────────────────────────────────────
        content.addView(GameMenuUi.button(this, "Bericht teilen", GameMenuUi.YELLOW, ::shareReport))
    }

    private fun shareReport() {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "LAUNCHPAD Tagesbericht")
            putExtra(Intent.EXTRA_TEXT, reportText.toString().trim())
        }
        startActivity(Intent.createChooser(send, "Bericht teilen"))
    }

    // ── View helpers ─────────────────────────────────────────────────────────────

    private fun section(text: String, size: Float = 16f, topPad: Int = 0): TextView {
        reportText.append("\n").append(text).append("\n")
        return GameMenuUi.panelText(this, text, strong = true).apply {
            textSize = size
            setPadding(0, topPad, 0, 8)
        }
    }

    private fun caption(text: String): TextView {
        reportText.append(text).append("\n")
        return GameMenuUi.panelText(this, text).apply {
            textSize = 13f
            setPadding(0, 0, 0, 8)
        }
    }

    private fun dataRow(label: String, value: String): LinearLayout {
        reportText.append("  ").append(label).append(": ").append(value).append("\n")
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 6, 0, 6)
            addView(GameMenuUi.panelText(this@DailyReportActivity, label).apply {
                textSize = 15f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            })
            addView(GameMenuUi.panelText(this@DailyReportActivity, value, strong = true).apply {
                textSize = 15f
            })
        }
    }

    private fun auditRow(ev: AuditEvent): TextView {
        reportText.append("  • ").append(ev.message).append("\n")
        val color = when (ev.severity) {
            LaunchpadConstants.SEVERITY_CRITICAL -> GameMenuUi.RED
            LaunchpadConstants.SEVERITY_WARNING -> 0xFF9A4E00.toInt()
            else -> GameMenuUi.INK
        }
        return GameMenuUi.panelText(this, "• ${ev.message}").apply {
            textSize = 13f
            setTextColor(color)
            setPadding(0, 4, 0, 4)
        }
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
