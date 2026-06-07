// File: app/src/main/kotlin/org/fossify/home/activities/TimesUpActivity.kt
// 30-second grace window when screen-time budget hits zero.

@file:Suppress("MagicNumber") // countdown seconds and UI dimensions

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Typeface
import android.os.Bundle
import android.os.CountDownTimer
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.fossify.home.R
import org.fossify.home.helpers.Playful

class TimesUpActivity : AppCompatActivity() {

    private var timer: CountDownTimer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pal = Playful.palette(this)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(pal.bg)
            setPadding(32, 64, 32, 64)
        }
        setContentView(root)

        root.addView(Playful.mascot(this, R.drawable.mascot_rocket_rest, 120))

        val headline = TextView(this).apply {
            text = "Zeit ist um! 🌙"
            textSize = 34f
            setTypeface(null, Typeface.BOLD)
            setTextColor(pal.accent)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 8, 0, 8)
        }
        root.addView(headline)

        val sub = TextView(this).apply {
            text = "Lass uns noch kurz fertig machen … 😊"
            textSize = 16f
            setTextColor(pal.inkSoft)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }
        root.addView(sub)

        val progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = COUNTDOWN_SECONDS
            progress = COUNTDOWN_SECONDS
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 16) }
        }
        root.addView(progress)

        val counter = TextView(this).apply {
            text = COUNTDOWN_SECONDS.toString()
            textSize = 56f
            setTypeface(null, Typeface.BOLD)
            setTextColor(pal.ink)
            gravity = android.view.Gravity.CENTER
        }
        root.addView(counter)

        timer = object : CountDownTimer(COUNTDOWN_SECONDS * 1_000L, 1_000L) {
            override fun onTick(msLeft: Long) {
                val secs = ((msLeft + 500) / 1_000).toInt()
                counter.text = secs.toString()
                progress.progress = secs
            }

            override fun onFinish() {
                counter.text = "0"
                progress.progress = 0
                launchCooldown()
            }
        }.start()
    }

    @Suppress("MissingSuperCall", "GestureBackNavigation", "OVERRIDE_DEPRECATION")
    override fun onBackPressed() {
        // blocked — Jake must wait through the countdown
    }

    override fun onDestroy() {
        super.onDestroy()
        timer?.cancel()
    }

    private fun launchCooldown() {
        try {
            startActivity(
                Intent(this, CooldownActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: android.content.ActivityNotFoundException) {
            android.util.Log.e("TimesUpActivity", "Could not launch CooldownActivity", e)
        }
        finish()
    }

    companion object {
        const val COUNTDOWN_SECONDS = 30
    }
}
