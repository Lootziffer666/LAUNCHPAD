@file:Suppress("MagicNumber")

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.FrameLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.ConnectivityState
import org.fossify.home.helpers.ConnectivityStateMonitor
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.SupervisedOverride
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.ui.GameScreen
import org.fossify.home.ui.GameScreenEvent
import org.fossify.home.ui.GameScreenState
import org.fossify.home.ui.HandheldPalette
import org.fossify.home.ui.OfflineMode
import org.fossify.home.ui.SoundCue
import org.fossify.home.ui.SoundFeedback
import org.fossify.home.ui.SystemSoundFeedback
import org.fossify.home.ui.TouchAction
import org.fossify.home.ui.TouchPage
import org.fossify.home.ui.TouchScreenPager
import java.util.Calendar

class JakeDashboardActivity : AppCompatActivity() {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var db: AppsDatabase
    private lateinit var gameScreen: GameScreen
    private lateinit var normalControls: TouchScreenPager
    private lateinit var upperHolder: FrameLayout
    private lateinit var lowerHolder: FrameLayout
    private lateinit var offlineMode: OfflineMode
    private lateinit var sound: SoundFeedback
    private lateinit var connectivity: ConnectivityStateMonitor
    private var offline = false
    private var previousMinutes: Int? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)
        window.statusBarColor = HandheldPalette.DARK_SCREEN
        window.navigationBarColor = HandheldPalette.DARK_SCREEN
        setContentView(buildHandheld())
        sound = SystemSoundFeedback(this) { gameScreen }
        offlineMode = OfflineMode(this, sound, ::leaveOfflineMode)
        upperHolder.addView(offlineMode.display, matchParent())
        lowerHolder.addView(offlineMode.controls, matchParent())
        showNormalViews()
        connectivity = ConnectivityStateMonitor(applicationContext) { state ->
            runOnUiThread { onConnectivityState(state) }
        }
        intent.getStringExtra(EXTRA_GAME_EVENT)?.let { gameScreen.show(GameScreenEvent(it, haptic = true)) }
    }

    override fun onStart() { super.onStart(); connectivity.start() }
    override fun onResume() { super.onResume(); if (!offline) load() }
    override fun onStop() { connectivity.stop(); super.onStop() }
    override fun onDestroy() { offlineMode.stop(); scope.cancel(); super.onDestroy() }

    private fun buildHandheld() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(10), dp(14), dp(14))
        setBackgroundColor(0xFF182337.toInt())
        addView(TextView(this@JakeDashboardActivity).apply {
            text = "‹  LAUNCHPAD"; textSize = 13f; setTextColor(Color.WHITE); gravity = Gravity.CENTER_VERTICAL
            setOnClickListener { finish() }; setPadding(dp(4), 0, 0, dp(5))
        }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(31)))
        upperHolder = FrameLayout(this@JakeDashboardActivity)
        gameScreen = GameScreen(this@JakeDashboardActivity)
        upperHolder.addView(gameScreen, matchParent())
        addView(upperHolder, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 43f))
        lowerHolder = FrameLayout(this@JakeDashboardActivity)
        normalControls = buildTouchScreen()
        lowerHolder.addView(normalControls, matchParent())
        addView(lowerHolder, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 57f).apply { topMargin = dp(8) })
    }

    private fun buildTouchScreen() = TouchScreenPager(this, listOf(TouchPage(listOf(
        TouchAction("Anfragen", "✉", HandheldPalette.RED) {
            startActivity(Intent(this, DogeRequestsActivity::class.java).putExtra("isParentMode", false))
        },
        TouchAction("Versprechen", "✓", HandheldPalette.GREEN) {
            startActivity(Intent(this, ZusagenActivity::class.java).putExtra("isParentMode", false))
        },
        TouchAction("Apps", "▦", HandheldPalette.YELLOW) {
            startActivity(Intent(this, MainActivity::class.java))
        },
        TouchAction("Heute", "◷", HandheldPalette.BLUE) {
            startActivity(Intent(this, DailyReportActivity::class.java))
        },
    ))))

    private fun load() = scope.launch {
        val data = withContext(Dispatchers.IO) {
            val budget = TimeBudgetManager(this@JakeDashboardActivity, db).getCurrentBudget()
            val midnight = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            }.timeInMillis
            val spent = db.cryptoCashDao().getTransactionsBetween(midnight, System.currentTimeMillis())
                .filter { it.type == LaunchpadConstants.TX_TYPE_SPEND }.sumOf { -it.deltaMinutes }
            Triple(budget, spent, SupervisedOverride.isActive(this@JakeDashboardActivity))
        }
        val (budget, spent, override) = data
        val minutes = if (budget.inCooldown) budget.minutesUntilCooldownExpires() ?: 0 else budget.balanceMinutes
        val status = when {
            override -> "PAPA-MODUS AKTIV"
            budget.inCooldown -> "VERSCHNAUFPAUSE"
            budget.balanceMinutes <= 0 -> "ZEIT VORBEI"
            spent > 0 -> "HEUTE $spent MIN GENUTZT"
            else -> "BEREIT"
        }
        gameScreen.render(GameScreenState(
            ChildProfile.name(this@JakeDashboardActivity), minutes,
            minutes / 120f, status, budget.inCooldown || budget.balanceMinutes <= 0,
        ))
        previousMinutes?.let { old ->
            when {
                minutes > old -> {
                    sound.play(SoundCue.TIME_ADDED)
                    gameScreen.show(GameScreenEvent("+${minutes - old} MIN!", HandheldPalette.GREEN, haptic = true))
                }
                old > 15 && minutes <= 15 -> {
                    sound.play(SoundCue.WARNING)
                    gameScreen.show(GameScreenEvent("NOCH 15 MIN", HandheldPalette.YELLOW, haptic = true))
                }
                old > 0 && minutes <= 0 -> {
                    sound.play(SoundCue.WARNING)
                    gameScreen.show(GameScreenEvent("ZEIT VORBEI", HandheldPalette.RED, haptic = true))
                }
            }
        }
        previousMinutes = minutes
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
    private fun matchParent() = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

    private fun onConnectivityState(state: ConnectivityState) {
        when (state) {
            ConnectivityState.AVAILABLE -> if (!offline) showNormalViews()
            ConnectivityState.LOST -> if (offline) offlineMode.connectionLostAgain() else enterOfflineMode()
            ConnectivityState.RESTORED -> if (offline) offlineMode.connectionRestored() else showNormalViews()
        }
    }

    private fun enterOfflineMode() {
        if (offline) return
        offline = true
        gameScreen.visibility = android.view.View.GONE
        normalControls.visibility = android.view.View.GONE
        offlineMode.display.visibility = android.view.View.VISIBLE
        offlineMode.controls.visibility = android.view.View.VISIBLE
        window.statusBarColor = org.fossify.home.ui.OfflinePalette.VIOLET
        window.navigationBarColor = org.fossify.home.ui.OfflinePalette.VIOLET
        offlineMode.enter()
    }

    private fun leaveOfflineMode() {
        offlineMode.stop(); offline = false; showNormalViews()
        window.statusBarColor = HandheldPalette.DARK_SCREEN
        window.navigationBarColor = HandheldPalette.DARK_SCREEN
        load()
    }

    private fun showNormalViews() {
        if (!::offlineMode.isInitialized) return
        gameScreen.visibility = android.view.View.VISIBLE
        normalControls.visibility = android.view.View.VISIBLE
        offlineMode.display.visibility = android.view.View.GONE
        offlineMode.controls.visibility = android.view.View.GONE
    }

    companion object { const val EXTRA_GAME_EVENT = "game_screen_event" }
}
