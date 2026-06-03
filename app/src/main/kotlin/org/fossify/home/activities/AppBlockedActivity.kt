// File: app/src/main/kotlin/org/fossify/home/activities/AppBlockedActivity.kt
// Context-aware block screen: tells Jake WHY an app is blocked and what he can do.

@file:Suppress("MagicNumber") // UI built programmatically

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.fossify.home.helpers.LaunchpadConstants

class AppBlockedActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_PACKAGE = "pkg"
        const val EXTRA_REASON = "reason"
        const val EXTRA_MESSAGE = "message"
        const val EXTRA_BALANCE_MINUTES = "balance_minutes"
        const val EXTRA_COOLDOWN_UNTIL = "cooldown_until"

        private const val HW_NAVY = "#0D2847"
        private const val HW_ORANGE = "#F2994A"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val pkg = intent.getStringExtra(EXTRA_PACKAGE).orEmpty()
        val reason = intent.getStringExtra(EXTRA_REASON).orEmpty()
        val message = intent.getStringExtra(EXTRA_MESSAGE)
            ?: "Diese App ist gerade nicht verfügbar."
        val balanceMinutes = intent.getIntExtra(EXTRA_BALANCE_MINUTES, -1)
        val cooldownUntil = intent.getLongExtra(EXTRA_COOLDOWN_UNTIL, 0L)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F2F4F7"))
        }
        setContentView(root)

        root.addView(buildHeader(pkg, reason))

        val scroll = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
            )
        }
        val body = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(20, 20, 20, 32)
        }
        scroll.addView(body)
        root.addView(scroll)

        body.addView(buildReasonCard(reason, message, balanceMinutes, cooldownUntil))
        body.addView(buildActions(pkg, reason))
    }

    private fun buildHeader(pkg: String, reason: String): LinearLayout {
        val (emoji, label) = headerContent(reason)
        val appName = try {
            packageManager.getApplicationLabel(
                packageManager.getApplicationInfo(pkg, 0)
            ).toString()
        } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
            android.util.Log.w("AppBlockedActivity", "Package not found: $pkg", e)
            pkg
        }
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor(HW_NAVY))
            setPadding(24, 52, 24, 28)
            addView(TextView(this@AppBlockedActivity).apply {
                text = "← Zurück"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
                setOnClickListener { finish() }
            })
            addView(TextView(this@AppBlockedActivity).apply {
                text = "$emoji  $appName"
                textSize = 22f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                setPadding(0, 16, 0, 4)
            })
            addView(TextView(this@AppBlockedActivity).apply {
                text = label
                textSize = 14f
                setTextColor(Color.parseColor(HW_ORANGE))
            })
        }
    }

    private fun headerContent(reason: String): Pair<String, String> = when (reason) {
        LaunchpadConstants.REASON_COOLDOWN -> "⏸" to "Bildschirmpause läuft"
        LaunchpadConstants.REASON_NO_BUDGET -> "⏰" to "Bildschirmzeit aufgebraucht"
        LaunchpadConstants.REASON_MIN_THRESHOLD -> "⚡" to "Zu wenig Zeit übrig"
        LaunchpadConstants.REASON_LOCKDOWN -> "🔒" to "Sicherheitscheck aktiv"
        LaunchpadConstants.REASON_NOT_ALLOWED -> "🚫" to "Nicht freigegeben"
        LaunchpadConstants.REASON_SCHEDULE_WINDOW -> "🕐" to "Noch nicht Bildschirmzeit"
        LaunchpadConstants.REASON_APP_DAILY_LIMIT -> "⏱️" to "Tageslimit erreicht"
        else -> "ℹ️" to "Nicht verfügbar"
    }

    private fun buildReasonCard(
        reason: String,
        message: String,
        balanceMinutes: Int,
        cooldownUntil: Long
    ): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = 12f
            }
            setPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 16) }

            addView(TextView(this@AppBlockedActivity).apply {
                text = message
                textSize = 15f
                setTextColor(Color.parseColor(HW_NAVY))
                setTypeface(null, Typeface.BOLD)
            })

            // Extra context line below the main message
            val extraLine = extraContextLine(reason, balanceMinutes, cooldownUntil)
            if (extraLine.isNotEmpty()) {
                addView(TextView(this@AppBlockedActivity).apply {
                    text = extraLine
                    textSize = 13f
                    setTextColor(Color.parseColor("#555555"))
                    setPadding(0, 8, 0, 0)
                })
            }
        }
    }

    private fun extraContextLine(reason: String, balanceMinutes: Int, cooldownUntil: Long): String {
        return when (reason) {
            LaunchpadConstants.REASON_COOLDOWN -> {
                val remaining = ((cooldownUntil - System.currentTimeMillis()) / 60_000).coerceAtLeast(0)
                if (remaining > 0) "Noch ca. $remaining Minute${if (remaining != 1L) "n" else ""}."
                else "Die Pause ist fast vorbei."
            }
            LaunchpadConstants.REASON_NO_BUDGET ->
                "Morgen um Mitternacht gibt es neue Zeit."
            LaunchpadConstants.REASON_MIN_THRESHOLD ->
                if (balanceMinutes >= 0) "Aktuelles Guthaben: $balanceMinutes Min."
                else ""
            LaunchpadConstants.REASON_LOCKDOWN ->
                "Mama oder Papa müssen LAUNCHPAD prüfen und freigeben."
            LaunchpadConstants.REASON_APP_DAILY_LIMIT ->
                "Morgen gibt es wieder Zeit für diese App."
            else -> ""
        }
    }

    private fun buildActions(pkg: String, reason: String): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            // "Anfragen" shown for all reasons except lockdown (parent must act, not child)
            if (reason != LaunchpadConstants.REASON_LOCKDOWN) {
                addView(primaryButton("Anfragen") {
                    startActivity(
                        Intent(this@AppBlockedActivity, DogeRequestsActivity::class.java)
                            .putExtra("isParentMode", false)
                            .putExtra("prefill_package", pkg)
                    )
                    finish()
                })
            }

            addView(secondaryButton("Schließen") { finish() })
        }
    }

    private fun primaryButton(label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            textSize = 15f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor(HW_ORANGE))
                cornerRadius = 10f
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 12) }
            setOnClickListener { onClick() }
        }

    private fun secondaryButton(label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            textSize = 14f
            setTextColor(Color.parseColor(HW_NAVY))
            background = GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = 10f
                setStroke(1, Color.parseColor("#CCCCCC"))
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setOnClickListener { onClick() }
        }
}
