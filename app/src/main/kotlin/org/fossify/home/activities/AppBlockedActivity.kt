// File: app/src/main/kotlin/org/fossify/home/activities/AppBlockedActivity.kt
// Context-aware "not right now" screen: tells the child WHY an app is resting and what they can
// do. "Verspielt & bunt": sunny background, resting rocket mascot, kind wording instead of
// lock-icons and "access denied". Colours adapt to the wallpaper (Playful.palette). Rules unchanged.

@file:Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.R
import org.fossify.home.databases.AppTimeRequest
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.NotificationHelper
import org.fossify.home.helpers.Playful

class AppBlockedActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var pal: Playful.Pal

    companion object {
        const val EXTRA_PACKAGE = "pkg"
        const val EXTRA_REASON = "reason"
        const val EXTRA_MESSAGE = "message"
        const val EXTRA_BALANCE_MINUTES = "balance_minutes"
        const val EXTRA_COOLDOWN_UNTIL = "cooldown_until"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pal = Playful.palette(this)

        val pkg = intent.getStringExtra(EXTRA_PACKAGE).orEmpty()
        val reason = intent.getStringExtra(EXTRA_REASON).orEmpty()
        val message = intent.getStringExtra(EXTRA_MESSAGE)
            ?: "Diese App macht gerade ein Nickerchen. 💤"
        val balanceMinutes = intent.getIntExtra(EXTRA_BALANCE_MINUTES, -1)
        val cooldownUntil = intent.getLongExtra(EXTRA_COOLDOWN_UNTIL, 0L)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(pal.bg)
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
        body.addView(buildActions(pkg, reason, cooldownUntil))
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
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
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(pal.accent)
            setPadding(24, 44, 24, 28)
            addView(TextView(this@AppBlockedActivity).apply {
                text = "← Zurück"
                textSize = 13f
                setTextColor(Color.argb(210, 255, 255, 255))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                setOnClickListener { finish() }
            })
            addView(Playful.mascot(this@AppBlockedActivity, R.drawable.mascot_rocket_rest, 88))
            addView(TextView(this@AppBlockedActivity).apply {
                text = "$emoji  $appName"
                textSize = 22f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, 8, 0, 4)
            })
            addView(TextView(this@AppBlockedActivity).apply {
                text = label
                textSize = 14f
                setTextColor(Color.argb(235, 255, 255, 255))
                gravity = Gravity.CENTER
            })
        }
    }

    private fun headerContent(reason: String): Pair<String, String> = when (reason) {
        LaunchpadConstants.REASON_COOLDOWN -> "😴" to "Kurze Verschnaufpause"
        LaunchpadConstants.REASON_NO_BUDGET -> "🌙" to "Heute ist die Zeit alle"
        LaunchpadConstants.REASON_MIN_THRESHOLD -> "⏳" to "Nur noch ein bisschen Zeit"
        LaunchpadConstants.REASON_LOCKDOWN -> "🛠️" to "Kurzer Moment"
        LaunchpadConstants.REASON_NOT_ALLOWED -> "🌱" to "Diese App schläft noch"
        LaunchpadConstants.REASON_SCHEDULE_WINDOW -> "🌞" to "Gleich ist Spielzeit"
        LaunchpadConstants.REASON_APP_DAILY_LIMIT -> "🎒" to "Diese App macht Feierabend"
        else -> "🚀" to "Gleich geht's weiter"
    }

    private fun buildReasonCard(
        reason: String,
        message: String,
        balanceMinutes: Int,
        cooldownUntil: Long
    ): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = Playful.roundedBg(this@AppBlockedActivity, pal.card, 16)
            setPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 16) }

            addView(TextView(this@AppBlockedActivity).apply {
                text = message
                textSize = 15f
                setTextColor(pal.ink)
                setTypeface(null, Typeface.BOLD)
            })

            // Extra context line below the main message
            val extraLine = extraContextLine(reason, balanceMinutes, cooldownUntil)
            if (extraLine.isNotEmpty()) {
                addView(TextView(this@AppBlockedActivity).apply {
                    text = extraLine
                    textSize = 13f
                    setTextColor(pal.inkSoft)
                    setPadding(0, 8, 0, 0)
                })
            }
        }
    }

    private fun extraContextLine(reason: String, balanceMinutes: Int, cooldownUntil: Long): String {
        return when (reason) {
            LaunchpadConstants.REASON_COOLDOWN -> {
                val remaining = ((cooldownUntil - System.currentTimeMillis()) / 60_000).coerceAtLeast(0)
                val unit = if (remaining != 1L) "n" else ""
                if (remaining > 0) "Noch ca. $remaining Minute$unit, dann geht's weiter. 🌈"
                else "Die Pause ist fast vorbei. 🌈"
            }
            LaunchpadConstants.REASON_NO_BUDGET ->
                "Morgen früh ist alles wieder aufgeladen! 🔋"
            LaunchpadConstants.REASON_MIN_THRESHOLD ->
                if (balanceMinutes >= 0) "Du hast noch $balanceMinutes Min — magst du sie aufheben? ✨"
                else ""
            LaunchpadConstants.REASON_LOCKDOWN ->
                "Mama oder Papa schauen kurz drauf und schalten dich wieder frei. 💛"
            LaunchpadConstants.REASON_APP_DAILY_LIMIT ->
                "Morgen gibt's wieder frische Zeit für diese App. 🌅"
            else -> ""
        }
    }

    private fun buildActions(pkg: String, reason: String, cooldownUntil: Long): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            // During cool-down the most helpful action is the calming-apps screen, not a request.
            if (reason == LaunchpadConstants.REASON_COOLDOWN) {
                addView(primaryButton("Etwas Ruhiges entdecken 🎨") {
                    val remainingMin =
                        ((cooldownUntil - System.currentTimeMillis()) / 60_000L)
                            .coerceAtLeast(1L).toInt()
                    startActivity(
                        Intent(this@AppBlockedActivity, CooldownActivity::class.java)
                            .putExtra("cooldown_minutes", remainingMin)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                    finish()
                })
            }

            // App daily-limit: a dedicated "ask for more time" request, not a media request.
            if (reason == LaunchpadConstants.REASON_APP_DAILY_LIMIT) {
                addView(primaryButton("Mama oder Papa um mehr Zeit fragen 💬") { requestMoreTime(pkg) })
            }

            // "Fragen" (media request) for the remaining reasons except lockdown
            // (parent must act), cool-down (just wait), and app-limit (handled above).
            if (reason != LaunchpadConstants.REASON_LOCKDOWN &&
                reason != LaunchpadConstants.REASON_COOLDOWN &&
                reason != LaunchpadConstants.REASON_APP_DAILY_LIMIT
            ) {
                addView(primaryButton("Fragen, ob's geht 🙋") {
                    startActivity(
                        Intent(this@AppBlockedActivity, DogeRequestsActivity::class.java)
                            .putExtra("isParentMode", false)
                            .putExtra("prefill_package", pkg)
                    )
                    finish()
                })
            }

            addView(secondaryButton("Alles klar 👍") { finish() })
        }
    }

    /** Persist a child time-request for [pkg] (deduped) and ping the parent. */
    private fun requestMoreTime(pkg: String) {
        val label = resolveLabel(pkg)
        scope.launch {
            val created = withContext(Dispatchers.IO) {
                val dao = AppsDatabase.getInstance(applicationContext).appTimeRequestDao()
                if (dao.hasPendingFor(pkg)) {
                    false
                } else {
                    dao.insert(AppTimeRequest(packageName = pkg, label = label))
                    true
                }
            }
            if (created) NotificationHelper.notifyTimeRequest(this@AppBlockedActivity, label)
            val toastText = if (created) {
                "Deine Frage ist unterwegs zu Mama & Papa! 💌"
            } else {
                "Deine Frage ist schon unterwegs 😊"
            }
            Toast.makeText(this@AppBlockedActivity, toastText, Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun resolveLabel(pkg: String): String = try {
        packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
    } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
        android.util.Log.w("AppBlockedActivity", "Label not found: $pkg", e)
        pkg
    }

    private fun primaryButton(label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            isAllCaps = false
            textSize = 15f
            setTextColor(Color.WHITE)
            background = Playful.roundedBg(this@AppBlockedActivity, pal.accent, 14)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 12) }
            setOnClickListener { onClick() }
        }

    private fun secondaryButton(label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            isAllCaps = false
            textSize = 14f
            setTextColor(pal.ink)
            background = Playful.roundedBg(this@AppBlockedActivity, pal.card, 14).apply {
                setStroke(Playful.dp(this@AppBlockedActivity, 1), pal.line)
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setOnClickListener { onClick() }
        }
}
