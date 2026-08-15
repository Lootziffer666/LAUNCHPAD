@file:Suppress("MagicNumber")

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
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
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.SupervisedOverride
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.ui.GameScreen
import org.fossify.home.ui.GameScreenEvent
import org.fossify.home.ui.GameScreenState
import org.fossify.home.ui.HandheldPalette
import org.fossify.home.ui.TouchAction
import org.fossify.home.ui.TouchPage
import org.fossify.home.ui.TouchScreenPager
import java.util.Calendar

class JakeDashboardActivity : AppCompatActivity() {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var db: AppsDatabase
    private lateinit var gameScreen: GameScreen
    private var previousMinutes: Int? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)
        window.statusBarColor = HandheldPalette.DARK_SCREEN
        window.navigationBarColor = HandheldPalette.DARK_SCREEN
        setContentView(buildHandheld())
        intent.getStringExtra(EXTRA_GAME_EVENT)?.let { gameScreen.show(GameScreenEvent(it, haptic = true)) }
    }

    override fun onResume() { super.onResume(); load() }
    override fun onDestroy() { scope.cancel(); super.onDestroy() }

    private fun buildHandheld() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(10), dp(14), dp(14))
        setBackgroundColor(0xFF182337.toInt())
        addView(TextView(this@JakeDashboardActivity).apply {
            text = "‹  LAUNCHPAD"; textSize = 13f; setTextColor(Color.WHITE); gravity = Gravity.CENTER_VERTICAL
            setOnClickListener { finish() }; setPadding(dp(4), 0, 0, dp(5))
        }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(31)))
        gameScreen = GameScreen(this@JakeDashboardActivity)
        addView(gameScreen, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 43f))
        addView(buildTouchScreen(), LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 57f).apply { topMargin = dp(8) })
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
                minutes > old -> gameScreen.show(GameScreenEvent("+${minutes - old} MIN!", HandheldPalette.GREEN, haptic = true))
                old > 15 && minutes <= 15 -> gameScreen.show(GameScreenEvent("NOCH 15 MIN", HandheldPalette.YELLOW, haptic = true))
                old > 0 && minutes <= 0 -> gameScreen.show(GameScreenEvent("ZEIT VORBEI", HandheldPalette.RED, haptic = true))
            }
        }
        previousMinutes = minutes
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    companion object { const val EXTRA_GAME_EVENT = "game_screen_event" }
}
