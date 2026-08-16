// File: app/src/main/kotlin/org/fossify/home/fragments/RulesFragment.kt
// LAUNCHPAD: the real DS dual-screen overview shown left of the launcher home.

@file:Suppress("MagicNumber", "MaxLineLength")

package org.fossify.home.fragments

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.fragment.app.Fragment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.activities.DailyReportActivity
import org.fossify.home.activities.DogeRequestsActivity
import org.fossify.home.activities.EntdeckenActivity
import org.fossify.home.activities.MainActivity
import org.fossify.home.activities.ZusagenActivity
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.SupervisedOverride
import org.fossify.home.helpers.TimeBudgetController
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.ui.GameScreen
import org.fossify.home.ui.GameScreenState
import org.fossify.home.ui.HandheldPalette
import org.fossify.home.ui.NavAction
import org.fossify.home.ui.StitchBottomNav
import org.fossify.home.ui.StitchHeaderView
import org.fossify.home.ui.TouchAction
import org.fossify.home.ui.TouchPage
import org.fossify.home.ui.TouchScreenPager
import java.util.Calendar

class RulesFragment : Fragment() {
    private var viewScope: CoroutineScope? = null
    private var refreshJob: Job? = null
    private var gameScreen: GameScreen? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        viewScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
        val context = requireContext()
        val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(HandheldPalette.DARK_SCREEN)
        }

        root.addView(
            StitchHeaderView(context),
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, context.dp(56)),
        )

        val screens = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(context.dp(24), 0, context.dp(24), context.dp(16))
        }
        val upperScreen = GameScreen(context)
        gameScreen = upperScreen
        screens.addView(
            upperScreen,
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, .82f),
        )
        screens.addView(
            buildTouchScreen(context),
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f).apply {
                topMargin = context.dp(12)
            },
        )
        root.addView(
            screens,
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f),
        )

        root.addView(
            buildBottomNav(context),
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, context.dp(80)),
        )

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
            )
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(root)
        return root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        refresh()
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    /** MainActivity calls this whenever the off-screen dashboard becomes visible. */
    fun refresh() {
        val target = gameScreen ?: return
        val scope = viewScope ?: return
        refreshJob?.cancel()
        refreshJob = scope.launch {
            val context = requireContext().applicationContext
            val state = withContext(Dispatchers.IO) { loadState(context) }
            target.render(state)
        }
    }

    override fun onDestroyView() {
        refreshJob?.cancel()
        viewScope?.cancel()
        viewScope = null
        gameScreen = null
        super.onDestroyView()
    }

    private suspend fun loadState(context: Context): GameScreenState {
        val db = AppsDatabase.getInstance(context)
        val budget = TimeBudgetManager(context, db).getCurrentBudget()
        val midnight = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        val spent = db.cryptoCashDao().getTransactionsBetween(midnight, System.currentTimeMillis())
            .filter { it.type == LaunchpadConstants.TX_TYPE_SPEND }
            .sumOf { -it.deltaMinutes }
        val minutes = if (budget.inCooldown) budget.minutesUntilCooldownExpires() ?: 0 else budget.balanceMinutes
        val status = when {
            SupervisedOverride.isActive(context) -> "PAPA-MODUS AKTIV"
            budget.inCooldown -> "VERSCHNAUFPAUSE"
            budget.balanceMinutes <= 0 -> "ZEIT VORBEI"
            spent > 0 -> "HEUTE $spent MIN GENUTZT"
            else -> "BEREIT"
        }
        val available = TimeBudgetController(context).state().availableToday.coerceAtLeast(1)
        return GameScreenState(
            name = ChildProfile.name(context),
            minutes = minutes.coerceAtLeast(0),
            progress = minutes.toFloat() / available,
            status = status,
            paused = budget.inCooldown || budget.balanceMinutes <= 0,
        )
    }

    private fun buildTouchScreen(context: Context) = TouchScreenPager(
        context,
        listOf(
            TouchPage(
                listOf(
                    TouchAction("Anfragen", "✉", HandheldPalette.RED) {
                        startActivity(
                            Intent(requireContext(), DogeRequestsActivity::class.java)
                                .putExtra("isParentMode", false),
                        )
                    },
                    TouchAction("Versprechen", "✓", HandheldPalette.GREEN) {
                        startActivity(
                            Intent(requireContext(), ZusagenActivity::class.java)
                                .putExtra("isParentMode", false),
                        )
                    },
                    TouchAction("Karte", "⌖", HandheldPalette.YELLOW) {
                        open(EntdeckenActivity::class.java)
                    },
                    TouchAction("Rucksack", "▣", 0xFFABC7FF.toInt()) {
                        (activity as? MainActivity)?.closeLaunchpadOverview()
                    },
                ),
            ),
        ),
    )

    private fun buildBottomNav(context: Context) = StitchBottomNav(
        context,
        listOf(
            NavAction("Quests", "⚔", true) { Unit },
            NavAction("Gear", "◆") { (activity as? MainActivity)?.closeLaunchpadOverview() },
            NavAction("Map", "⌖") { open(EntdeckenActivity::class.java) },
            NavAction("Journal", "▤") { open(DailyReportActivity::class.java) },
        ),
    )

    private fun open(activityClass: Class<*>) {
        startActivity(Intent(requireContext(), activityClass))
    }
}

private fun Context.dp(value: Int) = (value * resources.displayMetrics.density).toInt()
