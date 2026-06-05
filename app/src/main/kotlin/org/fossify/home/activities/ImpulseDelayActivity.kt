// File: app/src/main/kotlin/org/fossify/home/activities/ImpulseDelayActivity.kt
// LAUNCHPAD: Impulsbremse — a short, calm countdown shown before re-opening a high-stimulation
// app. Reizarm by design: dark background, no animations, one big number. The child can wait it
// out (the app then opens automatically) or tap "Doch nicht" to step back — the actual point of
// the brake is to give that moment of choice.

package org.fossify.home.activities

import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.fossify.home.extensions.launchAppDirect
import org.fossify.home.helpers.LaunchpadConstants

@Suppress("MagicNumber") // UI built programmatically
class ImpulseDelayActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())
    private var remaining = LaunchpadConstants.DEFAULT_IMPULSE_SECONDS
    private lateinit var pkg: String
    private lateinit var activityName: String
    private lateinit var countdownView: TextView
    private var launched = false

    private val tick = object : Runnable {
        override fun run() {
            remaining -= 1
            if (remaining <= 0) {
                proceed()
            } else {
                countdownView.text = remaining.toString()
                handler.postDelayed(this, 1_000L)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        pkg = intent.getStringExtra(EXTRA_PACKAGE).orEmpty()
        activityName = intent.getStringExtra(EXTRA_ACTIVITY).orEmpty()
        remaining = intent.getIntExtra(EXTRA_SECONDS, LaunchpadConstants.DEFAULT_IMPULSE_SECONDS)
            .coerceIn(1, 60)

        if (pkg.isBlank()) {
            finish()
            return
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0D2847"))
            setPadding(64, 64, 64, 64)
        }

        root.addView(TextView(this).apply {
            text = "Kurz durchatmen …"
            setTextColor(Color.parseColor("#CCFFFFFF"))
            textSize = 22f
            gravity = Gravity.CENTER
        })

        countdownView = TextView(this).apply {
            text = remaining.toString()
            setTextColor(Color.WHITE)
            textSize = 96f
            gravity = Gravity.CENTER
            setPadding(0, 48, 0, 48)
        }
        root.addView(countdownView)

        root.addView(TextView(this).apply {
            text = "Möchtest du das wirklich öffnen?"
            setTextColor(Color.parseColor("#88FFFFFF"))
            textSize = 15f
            gravity = Gravity.CENTER
        })

        root.addView(Button(this).apply {
            text = "Doch nicht"
            isAllCaps = false
            textSize = 16f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#33FFFFFF"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 64 }
            setOnClickListener { finish() } // step back to the launcher
        })

        setContentView(root)
        handler.postDelayed(tick, 1_000L)
    }

    private fun proceed() {
        if (launched) return
        launched = true
        launchAppDirect(pkg, activityName)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(tick)
    }

    companion object {
        const val EXTRA_PACKAGE = "impulse_package"
        const val EXTRA_ACTIVITY = "impulse_activity"
        const val EXTRA_SECONDS = "impulse_seconds"
    }
}
