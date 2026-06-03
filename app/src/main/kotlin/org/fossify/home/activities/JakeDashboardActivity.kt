// File: app/src/main/kotlin/org/fossify/home/activities/JakeDashboardActivity.kt
// LAUNCHPAD: Jake's view — balance, today's usage, active promises, quick actions.

@file:Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
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
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.Zusage
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.TimeBudgetManager
import java.util.Calendar

@Suppress("CyclomaticComplexMethod")
class JakeDashboardActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var db: AppsDatabase

    // Live-updated views
    private lateinit var balanceText: TextView
    private lateinit var balanceLabel: TextView
    private lateinit var statusMsg: TextView
    private lateinit var usedTodayText: TextView
    private lateinit var zusagenContainer: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0D2847"))
        }

        root.addView(buildHeader())

        val scroll = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
            )
        }
        val body = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        scroll.addView(body)
        root.addView(scroll)

        body.addView(buildBalanceSection())
        body.addView(buildDivider())
        body.addView(buildTodaySection())
        body.addView(buildDivider())
        zusagenContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        body.addView(zusagenContainer)
        body.addView(buildDivider())
        body.addView(buildActions())

        setContentView(root)
        load()
    }

    override fun onResume() {
        super.onResume()
        load()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun load() {
        scope.launch {
            val (budget, spentToday, zusagen) = withContext(Dispatchers.IO) {
                val b = TimeBudgetManager(this@JakeDashboardActivity, db).getCurrentBudget()
                val midnight = todayMidnightMs()
                val txs = db.cryptoCashDao().getTransactionsBetween(midnight, System.currentTimeMillis())
                val spent = txs.filter { it.type == LaunchpadConstants.TX_TYPE_SPEND }
                    .sumOf { -it.deltaMinutes }
                val z = db.zusageDao().getZusagenByStatus(LaunchpadConstants.ZUSAGE_ACTIVE)
                Triple(b, spent, z)
            }

            // Balance
            balanceText.text = if (budget.inCooldown) {
                "${budget.minutesUntilCooldownExpires() ?: 0}"
            } else {
                "${budget.balanceMinutes}"
            }
            balanceText.setTextColor(when {
                budget.inCooldown -> Color.parseColor("#F2994A")
                budget.balanceMinutes <= 0 -> Color.parseColor("#FF4444")
                budget.balanceMinutes < 10 -> Color.parseColor("#FFD166")
                else -> Color.parseColor("#4CAF50")
            })
            balanceLabel.text = if (budget.inCooldown) "Minuten Pause noch" else "Minuten verfügbar"
            statusMsg.text = when {
                budget.inCooldown -> "😌 Bildschirmpause! Zeichnen, Lesen oder LEGO?"
                budget.balanceMinutes <= 0 -> "⏰ Keine Zeit mehr. Frag Mama oder Papa."
                budget.balanceMinutes < 10 -> "⚡ Fast aufgebraucht — noch ${budget.balanceMinutes} Min!"
                else -> "👍 Viel Spaß!"
            }

            // Today's usage
            usedTodayText.text = if (spentToday > 0) "$spentToday Min genutzt heute"
            else "Heute noch nicht genutzt"

            // Zusagen
            renderZusagen(zusagen)
        }
    }

    private fun renderZusagen(list: List<Zusage>) {
        zusagenContainer.removeAllViews()
        if (list.isEmpty()) return

        zusagenContainer.addView(sectionHeader("🤝 Versprechen — Zeit verdienen"))
        list.take(3).forEach { z ->
            zusagenContainer.addView(buildZusageRow(z))
        }
    }

    private fun buildZusageRow(z: Zusage): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 12, 24, 12)
            background = GradientDrawable().apply {
                setColor(Color.argb(30, 255, 255, 255))
                cornerRadius = 8f
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(16, 4, 16, 4) }

            addView(TextView(this@JakeDashboardActivity).apply {
                text = z.childVisibleText.ifBlank { z.text }
                textSize = 14f
                setTextColor(Color.WHITE)
                setTypeface(null, Typeface.BOLD)
            })
            addView(TextView(this@JakeDashboardActivity).apply {
                text = "von ${z.namedParent}"
                textSize = 12f
                setTextColor(Color.argb(160, 255, 255, 255))
                setPadding(0, 2, 0, 0)
            })
        }
    }

    private fun buildHeader(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 48, 24, 16)
            addView(TextView(this@JakeDashboardActivity).apply {
                text = "✕ Schließen"
                textSize = 14f
                setTextColor(Color.argb(180, 255, 255, 255))
                setOnClickListener { finish() }
            })
            addView(TextView(this@JakeDashboardActivity).apply {
                text = "Mein Status"
                textSize = 22f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                setPadding(0, 12, 0, 0)
            })
        }
    }

    private fun buildBalanceSection(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(32, 24, 32, 24)

            balanceText = TextView(this@JakeDashboardActivity).apply {
                textSize = 72f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                text = "…"
            }
            addView(balanceText)

            balanceLabel = TextView(this@JakeDashboardActivity).apply {
                textSize = 14f
                setTextColor(Color.argb(180, 255, 255, 255))
                gravity = Gravity.CENTER
                text = "Minuten verfügbar"
                setPadding(0, 0, 0, 8)
            }
            addView(balanceLabel)

            statusMsg = TextView(this@JakeDashboardActivity).apply {
                textSize = 15f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
            }
            addView(statusMsg)
        }
    }

    private fun buildTodaySection(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 16, 24, 16)

            addView(sectionHeader("📊 Heute"))

            usedTodayText = TextView(this@JakeDashboardActivity).apply {
                textSize = 14f
                setTextColor(Color.argb(200, 255, 255, 255))
                setPadding(0, 4, 0, 0)
            }
            addView(usedTodayText)
        }
    }

    private fun buildActions(): LinearLayout {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }

        row.addView(bigButton("Medien\nanfragen", "🎬") {
            startActivity(
                Intent(this@JakeDashboardActivity, DogeRequestsActivity::class.java)
                    .putExtra("isParentMode", false)
            )
        })
        row.addView(bigButton("Versprechen", "🤝") {
            startActivity(
                Intent(this@JakeDashboardActivity, ZusagenActivity::class.java)
                    .putExtra("isParentMode", false)
            )
        })
        return row
    }

    private fun bigButton(label: String, emoji: String, onClick: () -> Unit): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            setPadding(0, 24, 0, 24)
            isClickable = true
            isFocusable = true
            background = android.util.TypedValue().let { tv ->
                theme.resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, tv, true)
                resources.getDrawable(tv.resourceId, theme)
            }
            addView(TextView(context).apply {
                text = emoji; textSize = 32f; gravity = Gravity.CENTER
            })
            addView(TextView(context).apply {
                text = label; textSize = 12f
                setTextColor(Color.argb(200, 255, 255, 255))
                gravity = Gravity.CENTER; setPadding(0, 4, 0, 0)
            })
            setOnClickListener { onClick() }
        }
    }

    private fun sectionHeader(title: String): TextView = TextView(this).apply {
        text = title
        textSize = 13f
        setTypeface(null, Typeface.BOLD)
        setTextColor(Color.argb(180, 255, 255, 255))
        setPadding(0, 0, 0, 8)
    }

    private fun buildDivider(): android.view.View = android.view.View(this).apply {
        setBackgroundColor(Color.argb(40, 255, 255, 255))
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 1
        )
    }

    private fun todayMidnightMs(): Long {
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }
}
