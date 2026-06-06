// File: app/src/main/kotlin/org/fossify/home/activities/JakeDashboardActivity.kt
// LAUNCHPAD: the child's view — balance, today's usage, active promises, quick actions.
// "Verspielt & bunt": sunny background, rocket mascot greeting, warm colours that ADAPT to the
// wallpaper (via Playful.palette). The numbers and rules underneath are unchanged — only the look
// and the wording got friendlier. Semantic status colours (mint = plenty, sun = low) stay fixed.

@file:Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically

package org.fossify.home.activities

import android.graphics.Typeface
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
import org.fossify.home.R
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.Zusage
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.Playful
import org.fossify.home.helpers.TimeBudgetManager
import java.util.Calendar

@Suppress("CyclomaticComplexMethod")
class JakeDashboardActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var db: AppsDatabase
    private lateinit var pal: Playful.Pal

    // Live-updated views
    private lateinit var balanceText: TextView
    private lateinit var balanceLabel: TextView
    private lateinit var statusMsg: TextView
    private lateinit var usedTodayText: TextView
    private lateinit var zusagenContainer: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)
        pal = Playful.palette(this)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(pal.bg)
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
        body.addView(buildTodaySection())
        zusagenContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        body.addView(zusagenContainer)
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
                budget.inCooldown -> pal.accent
                budget.balanceMinutes <= 0 -> pal.accent
                budget.balanceMinutes < 10 -> Playful.color(Playful.SUN)
                else -> Playful.color(Playful.MINT)
            })
            balanceLabel.text = if (budget.inCooldown) "Minuten Pause noch" else "Minuten zum Spielen"
            statusMsg.text = when {
                budget.inCooldown -> "🌿 Verschnaufpause! Magst du malen, lesen oder bauen?"
                budget.balanceMinutes <= 0 -> "🌙 Für heute ist die Zeit alle — morgen gibt's neue!"
                budget.balanceMinutes < 10 -> "✨ Nur noch ${budget.balanceMinutes} Min — clever einsetzen!"
                else -> "🚀 Viel Spaß!"
            }

            // Today's usage
            usedTodayText.text = if (spentToday > 0) "Heute schon $spentToday Min unterwegs 🛰️"
            else "Heute noch ganz frisch! 🌱"

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
            background = Playful.roundedBg(this@JakeDashboardActivity, pal.accentSoft, 14)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(20, 4, 20, 4) }

            addView(TextView(this@JakeDashboardActivity).apply {
                text = z.childVisibleText.ifBlank { z.text }
                textSize = 14f
                setTextColor(pal.ink)
                setTypeface(null, Typeface.BOLD)
            })
            addView(TextView(this@JakeDashboardActivity).apply {
                text = "von ${z.namedParent}"
                textSize = 12f
                setTextColor(pal.inkSoft)
                setPadding(0, 2, 0, 0)
            })
        }
    }

    private fun buildHeader(): LinearLayout {
        val name = ChildProfile.name(this)
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 48, 24, 8)
            addView(TextView(this@JakeDashboardActivity).apply {
                text = "← Zurück"
                textSize = 14f
                setTextColor(pal.inkSoft)
                setOnClickListener { finish() }
            })
            addView(LinearLayout(this@JakeDashboardActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, 12, 0, 0)
                addView(Playful.mascot(this@JakeDashboardActivity, R.drawable.mascot_rocket, 56))
                addView(LinearLayout(this@JakeDashboardActivity).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(16, 0, 0, 0)
                    addView(TextView(this@JakeDashboardActivity).apply {
                        text = "Hi, $name! 🚀"
                        textSize = 24f
                        setTypeface(null, Typeface.BOLD)
                        setTextColor(pal.ink)
                    })
                    addView(TextView(this@JakeDashboardActivity).apply {
                        text = "Schön, dass du da bist ✨"
                        textSize = 14f
                        setTextColor(pal.inkSoft)
                    })
                })
            })
        }
    }

    private fun buildBalanceSection(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(32, 24, 32, 24)
            background = Playful.roundedBg(this@JakeDashboardActivity, pal.card, 24)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(20, 12, 20, 12) }

            balanceText = TextView(this@JakeDashboardActivity).apply {
                textSize = 72f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Playful.color(Playful.MINT))
                gravity = Gravity.CENTER
                text = "…"
            }
            addView(balanceText)

            balanceLabel = TextView(this@JakeDashboardActivity).apply {
                textSize = 14f
                setTextColor(pal.inkSoft)
                gravity = Gravity.CENTER
                text = "Minuten zum Spielen"
                setPadding(0, 0, 0, 8)
            }
            addView(balanceLabel)

            statusMsg = TextView(this@JakeDashboardActivity).apply {
                textSize = 15f
                setTextColor(pal.ink)
                gravity = Gravity.CENTER
            }
            addView(statusMsg)
        }
    }

    private fun buildTodaySection(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 16, 24, 8)

            addView(sectionHeader("📊 Heute"))

            usedTodayText = TextView(this@JakeDashboardActivity).apply {
                textSize = 14f
                setTextColor(pal.inkSoft)
                setPadding(0, 4, 0, 0)
            }
            addView(usedTodayText)
        }
    }

    private fun buildActions(): LinearLayout {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(8, 12, 8, 24)
        }

        row.addView(bigButton("Medien\nanfragen", "🎬") {
            startActivity(
                android.content.Intent(this@JakeDashboardActivity, DogeRequestsActivity::class.java)
                    .putExtra("isParentMode", false)
            )
        })
        row.addView(bigButton("Versprechen", "🤝") {
            startActivity(
                android.content.Intent(this@JakeDashboardActivity, ZusagenActivity::class.java)
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
                .apply { setMargins(12, 0, 12, 0) }
            setPadding(0, 24, 0, 24)
            isClickable = true
            isFocusable = true
            background = Playful.roundedBg(context, pal.accentSoft, 18)
            addView(TextView(context).apply {
                text = emoji; textSize = 32f; gravity = Gravity.CENTER
            })
            addView(TextView(context).apply {
                text = label; textSize = 12f
                setTextColor(pal.ink)
                gravity = Gravity.CENTER; setPadding(0, 4, 0, 0)
            })
            setOnClickListener { onClick() }
        }
    }

    private fun sectionHeader(title: String): TextView = TextView(this).apply {
        text = title
        textSize = 13f
        setTypeface(null, Typeface.BOLD)
        setTextColor(pal.accent)
        setPadding(0, 0, 0, 8)
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
