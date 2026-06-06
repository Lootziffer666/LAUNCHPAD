// File: app/src/main/java/org/fossify/home/activities/CooldownActivity.kt
// M1: Cool-down screen (restorative phase after time expires)

package org.fossify.home.activities

import android.graphics.Typeface
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
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
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.Playful
import java.util.Locale

/**
 * CooldownActivity: Shown when time budget expires or cool-down is triggered.
 *
 * Purpose: Restorative phase allowing only low-stimulation activities.
 * Duration: 15 minutes (configurable)
 *
 * Allowed activities:
 * - Audiobooks (e.g., Libby, Audible)
 * - Drawing apps (e.g., Ibis Paint, MediBang)
 * - LEGO building/planning
 * - Reading (e.g., Kindle, Wikipedia)
 * - No YouTube, games, social media
 *
 * Behavior:
 * - Shows countdown timer
 * - Prevents home button exit (optional: via Device Admin later)
 * - Allows launching only whitelisted cool-down apps
 * - Provides friendly message about cool-down purpose
 * - Auto-dismisses when timer expires
 */
@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class CooldownActivity : AppCompatActivity() {
    private val tag = "CooldownActivity"

    private lateinit var timerText: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var messageText: TextView
    private lateinit var appButtonContainer: LinearLayout
    private lateinit var pal: Playful.Pal

    private var cooldownDurationMinutes = 15 // Default
    private var cooldownDurationMs = cooldownDurationMinutes * 60 * 1000L
    private var timer: CountDownTimer? = null

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_cooldown)

        // Get cool-down duration from intent or config
        cooldownDurationMinutes = intent.getIntExtra("cooldown_minutes", 15)
        cooldownDurationMs = cooldownDurationMinutes * 60 * 1000L

        timerText = findViewById(R.id.cooldown_timer_text)
        progressBar = findViewById(R.id.cooldown_progress)
        messageText = findViewById(R.id.cooldown_message)
        appButtonContainer = findViewById(R.id.cooldown_app_buttons)

        // Tint the screen to match the wallpaper (cosy coral fallback when unavailable).
        pal = Playful.palette(this)
        findViewById<View>(R.id.cooldown_root).setBackgroundColor(pal.bg)
        timerText.setTextColor(pal.accent)
        messageText.setTextColor(pal.ink)
        progressBar.progressTintList = android.content.res.ColorStateList.valueOf(pal.accent)

        showCooldownUI()
        startCooldownTimer()
    }

    /**
     * Configure UI for cool-down screen.
     */
    private fun showCooldownUI() {
        // Title
        val title = TextView(this).apply {
            text = "Verschnaufpause 🌿"
            textSize = 28f
            setTypeface(null, Typeface.BOLD)
            setTextColor(pal.ink)
            gravity = android.view.Gravity.CENTER
            setPadding(16, 8, 16, 16)
        }
        appButtonContainer.addView(title, 0)

        // Message
        messageText.text = "Kurze Pause für deinen Kopf 🌿 Lehn dich zurück und entspann dich " +
                "ein paar Minuten.\n\nWie wär's mit Vorlesen, Malen oder LEGO bauen?"

        // Progress bar (visual countdown)
        progressBar.max = cooldownDurationMinutes
        progressBar.progress = cooldownDurationMinutes

        // Suggested low-stimulation activities
        showCooldownApps()
    }

    /**
     * Show available cool-down apps.
     */
    private fun showCooldownApps() {
        scope.launch {
            // Real COOLDOWN-category apps from the whitelist that are actually installed.
            val db = AppsDatabase.getInstance(this@CooldownActivity)
            val cooldownApps = withContext(Dispatchers.IO) {
                db.allowedAppDao().getAllEnabledApps()
                    .filter { it.category == LaunchpadConstants.CATEGORY_COOLDOWN }
                    .mapNotNull { app -> resolveInstalled(app.packageName) }
            }
            val toShow = cooldownApps.ifEmpty { fallbackCooldownApps() }
            if (toShow.isEmpty()) {
                appButtonContainer.addView(TextView(this@CooldownActivity).apply {
                    text = "Frag Mama oder Papa nach einer ruhigen App. 💛"
                    textSize = 16f
                    setTextColor(pal.inkSoft)
                    setPadding(16, 16, 16, 16)
                })
                return@launch
            }
            for ((label, packageName) in toShow) {
                appButtonContainer.addView(cooldownButton(label, packageName))
            }
        }
    }

    /** Resolve a package to (label, packageName) if it is installed and launchable, else null. */
    private fun resolveInstalled(packageName: String): Pair<String, String>? {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
        if (launchIntent.component == null) return null
        val label = try {
            packageManager.getApplicationLabel(
                packageManager.getApplicationInfo(packageName, 0)
            ).toString()
        } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
            Log.w(tag, "Label not found for $packageName", e)
            packageName
        }
        return label to packageName
    }

    /** Only used when the parent hasn't categorised any COOLDOWN apps yet. */
    private fun fallbackCooldownApps(): List<Pair<String, String>> = listOf(
        Pair("📚 Audiobook", "org.librarysimplified.r2.simplereader"),
        Pair("✏️ Zeichnen", "com.ibis.paintx"),
        Pair("🧱 LEGO", "com.lego.common"),
        Pair("📖 Lesen", "com.amazon.kindle")
    ).filter { packageManager.getLaunchIntentForPackage(it.second) != null }

    private fun cooldownButton(label: String, packageName: String) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 16f
        setTextColor(pal.ink)
        background = Playful.roundedBg(this@CooldownActivity, pal.accentSoft, 16)
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(16, 8, 16, 8) }
        setOnClickListener { launchCooldownApp(packageName) }
    }

    /**
     * Launch a cool-down app (only allowed during cool-down).
     */
    @Suppress("TooGenericExceptionCaught") // broad catch: intentional fail-safe on app launch
    private fun launchCooldownApp(packageName: String) {
        Log.d(tag, "Launching cool-down app: $packageName")
        try {
            val intent = packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                startActivity(intent)
            } else {
                showMessage("App nicht installiert")
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed to launch app: $packageName", e)
            showMessage("Fehler beim Starten der App")
        }
    }

    /**
     * Start cool-down countdown timer.
     */
    private fun startCooldownTimer() {
        Log.d(tag, "Starting cool-down timer: $cooldownDurationMinutes minutes")

        timer = object : CountDownTimer(cooldownDurationMs, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val secondsRemaining = millisUntilFinished / 1000
                val minutesRemaining = secondsRemaining / 60
                val secondsInMinute = secondsRemaining % 60

                val timeString = String.format(Locale.US, "%02d:%02d", minutesRemaining, secondsInMinute)
                timerText.text = timeString

                // Update progress bar
                progressBar.progress = minutesRemaining.toInt()
            }

            override fun onFinish() {
                Log.d(tag, "Cool-down period finished")
                timerText.text = "00:00"
                messageText.text = "Pause vorbei — willkommen zurück! 🌈"
                showMessage("Pause vorbei! 🎉")

                // Return to launcher
                finish()
            }
        }

        timer?.start()
    }

    /**
     * Prevent exiting cool-down (soft enforcement in M1).
     * Hard enforcement via Device Admin in M5.
     */
    @Suppress("MissingSuperCall", "GestureBackNavigation") // cool-down intentionally blocks back exit
    override fun onBackPressed() {
        // Do nothing - prevent exiting
        Log.d(tag, "Back button pressed during cool-down - ignored")
    }

    override fun onPause() {
        super.onPause()
        // Resume cool-down timer if app is resumed
        Log.d(tag, "Cool-down activity paused")
    }

    override fun onResume() {
        super.onResume()
        Log.d(tag, "Cool-down activity resumed")
        // Ensure timer is still running
        if (timer == null) {
            startCooldownTimer()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        timer?.cancel()
        scope.cancel()
    }

    private fun showMessage(message: String) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
    }
}
