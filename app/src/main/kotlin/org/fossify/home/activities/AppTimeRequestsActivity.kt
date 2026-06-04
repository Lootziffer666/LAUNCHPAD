// File: app/src/main/kotlin/org/fossify/home/activities/AppTimeRequestsActivity.kt
// Parent-facing list of Jake's "more time for this app" requests. Approving grants a one-off
// today-bonus on top of that app's daily cap (via AppLimitBonus); rejecting just records it.

@file:Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically

package org.fossify.home.activities

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.widget.Button
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
import org.fossify.home.databases.AppTimeRequest
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.AppLimitBonus
import org.fossify.home.helpers.LaunchpadConstants
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class AppTimeRequestsActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var db: AppsDatabase
    private lateinit var listContainer: LinearLayout
    private val fmt = SimpleDateFormat("dd.MM. HH:mm", Locale.GERMANY)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)

        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        setContentView(root)

        root.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0D2847"))
            setPadding(24, 48, 24, 24)
            addView(TextView(this@AppTimeRequestsActivity).apply {
                text = "← Schließen"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
                setOnClickListener { finish() }
            })
            addView(TextView(this@AppTimeRequestsActivity).apply {
                text = "Mehr-Zeit-Anfragen"
                textSize = 24f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                setPadding(0, 16, 0, 4)
            })
            addView(TextView(this@AppTimeRequestsActivity).apply {
                text = "Jake möchte länger an einer App bleiben"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
            })
        })

        val scroll = ScrollView(this)
        listContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 32)
        }
        scroll.addView(listContainer)
        root.addView(scroll)

        load()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun load() {
        scope.launch {
            val (pending, recent) = withContext(Dispatchers.IO) {
                db.appTimeRequestDao().getPending() to db.appTimeRequestDao().getRecent(20)
            }
            listContainer.removeAllViews()

            if (pending.isEmpty()) {
                listContainer.addView(hint("Keine offenen Anfragen."))
            } else {
                pending.forEach { listContainer.addView(pendingRow(it)) }
            }

            val decided = recent.filter { it.decision != null }
            if (decided.isNotEmpty()) {
                listContainer.addView(sectionLabel("Verlauf"))
                decided.take(10).forEach { listContainer.addView(decidedRow(it)) }
            }
        }
    }

    private fun pendingRow(req: AppTimeRequest): LinearLayout {
        return card("#F7F9FC").apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(this@AppTimeRequestsActivity).apply {
                text = req.label
                textSize = 16f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor("#0D2847"))
            })
            addView(TextView(this@AppTimeRequestsActivity).apply {
                text = "gefragt ${fmt.format(Date(req.requestedAt))}"
                textSize = 11f
                setTextColor(Color.parseColor("#828282"))
                setPadding(0, 2, 0, 8)
            })
            addView(LinearLayout(this@AppTimeRequestsActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                addView(actionButton("+15 Min", "#4CAF50") { decide(req, 15) })
                addView(actionButton("+30 Min", "#4CAF50") { decide(req, 30) })
                addView(actionButton("Ablehnen", "#D32F2F") { decide(req, 0) })
            })
        }
    }

    private fun decidedRow(req: AppTimeRequest): TextView {
        val approved = req.decision == LaunchpadConstants.DOGE_APPROVED
        val mark = if (approved) "✓ +${req.grantedMinutes} Min" else "✗ abgelehnt"
        return TextView(this).apply {
            text = "${req.label} — $mark"
            textSize = 13f
            setTextColor(Color.parseColor(if (approved) "#2E7D32" else "#828282"))
            setPadding(8, 6, 8, 6)
        }
    }

    /** Grant [minutes] (0 = reject) for the request's app and record the decision. */
    private fun decide(req: AppTimeRequest, minutes: Int) {
        scope.launch {
            withContext(Dispatchers.IO) {
                if (minutes > 0) {
                    AppLimitBonus.addTodayBonus(
                        this@AppTimeRequestsActivity, req.packageName, minutes, todayMidnight()
                    )
                }
                val decision = if (minutes > 0) {
                    LaunchpadConstants.DOGE_APPROVED
                } else {
                    LaunchpadConstants.DOGE_REJECTED
                }
                db.appTimeRequestDao().decide(
                    req.id, decision, minutes, System.currentTimeMillis()
                )
            }
            load()
        }
    }

    private fun todayMidnight(): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    // ── View helpers ─────────────────────────────────────────────────────────────

    private fun card(bg: String) = LinearLayout(this).apply {
        background = GradientDrawable().apply {
            setColor(Color.parseColor(bg))
            cornerRadius = 8f
        }
        setPadding(16, 12, 16, 12)
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 4, 0, 4) }
    }

    private fun actionButton(label: String, color: String, onClick: () -> Unit) =
        Button(this).apply {
            text = label
            isAllCaps = false
            textSize = 13f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor(color))
                cornerRadius = 8f
            }
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                .apply { setMargins(4, 0, 4, 0) }
            setOnClickListener { onClick() }
        }

    private fun hint(text: String) = TextView(this).apply {
        this.text = text
        textSize = 14f
        setTextColor(Color.parseColor("#828282"))
        setPadding(8, 24, 8, 0)
    }

    private fun sectionLabel(text: String) = TextView(this).apply {
        this.text = text
        textSize = 12f
        setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor("#828282"))
        setPadding(8, 24, 8, 8)
    }
}
