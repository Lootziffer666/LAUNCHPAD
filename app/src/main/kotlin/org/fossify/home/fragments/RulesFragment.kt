// File: app/src/main/kotlin/org/fossify/home/fragments/RulesFragment.kt
// LAUNCHPAD: retro overview shown to the LEFT of the home screen (swipe right from page 0).

@file:Suppress("MagicNumber", "MaxLineLength")

package org.fossify.home.fragments

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView
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
import org.fossify.home.activities.JakeDashboardActivity
import org.fossify.home.activities.MainActivity
import org.fossify.home.activities.ZusagenActivity
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.helpers.SupervisedOverride
import org.fossify.home.helpers.TimeBudgetController
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.ui.GameMenuUi
import org.fossify.home.ui.NavAction
import org.fossify.home.ui.RetroOverviewAction
import org.fossify.home.ui.RetroOverviewState
import org.fossify.home.ui.RetroOverviewView
import org.fossify.home.ui.StitchBottomNav
import org.fossify.home.ui.StitchHeaderView

class RulesFragment : Fragment() {
    private var viewScope: CoroutineScope? = null
    private var refreshJob: Job? = null
    private var overview: RetroOverviewView? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        viewScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
        val context = requireContext()
        val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(GameMenuUi.LOWEST)
        }

        root.addView(
            StitchHeaderView(context),
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, context.dp(56)),
        )

        val overviewView = RetroOverviewView(context, ::handleOverviewAction)
        overview = overviewView
        val scroll = ScrollView(context).apply {
            isFillViewport = true
            isVerticalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            setBackgroundColor(GameMenuUi.LOWEST)
            addView(
                overviewView,
                ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT),
            )
        }
        root.addView(
            scroll,
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

    /** Called by MainActivity each time the off-screen overview is brought into view. */
    fun refresh() {
        val target = overview ?: return
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
        overview = null
        super.onDestroyView()
    }

    private suspend fun loadState(context: Context): RetroOverviewState {
        val db = AppsDatabase.getInstance(context)
        val budget = TimeBudgetManager(context, db).getCurrentBudget()
        val timeState = TimeBudgetController(context).state()
        val prefs = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val enforced = prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
        val pendingCount = db.dogeRequestDao().getPending().size
        val promiseCount = db.zusageDao().getZusagenByStatus(LaunchpadConstants.ZUSAGE_ACTIVE).size
        val capacity = timeState.availableToday.coerceAtLeast(1)
        val minutes = budget.balanceMinutes.coerceAtLeast(0)
        return RetroOverviewState(
            name = ChildProfile.name(context),
            minutes = minutes,
            capacity = capacity,
            status = overviewEnergyStatus(
                minutes = minutes,
                capacity = capacity,
                inCooldown = budget.inCooldown,
                enforced = enforced,
                overrideActive = SupervisedOverride.isActive(context),
            ),
            missionSummary = countLabel(pendingCount, "offene Anfrage", "offene Anfragen", "Tägliche Aufgaben"),
            promiseSummary = countLabel(promiseCount, "aktiver Pakt", "aktive Pakte", "Aktive Pakte"),
        )
    }

    private fun handleOverviewAction(action: RetroOverviewAction) {
        when (action) {
            RetroOverviewAction.STATUS -> open(JakeDashboardActivity::class.java)
            RetroOverviewAction.MISSIONS -> startActivity(
                Intent(requireContext(), DogeRequestsActivity::class.java).putExtra("isParentMode", false),
            )
            RetroOverviewAction.PROMISES -> startActivity(
                Intent(requireContext(), ZusagenActivity::class.java).putExtra("isParentMode", false),
            )
        }
    }

    private fun buildBottomNav(context: Context) = StitchBottomNav(
        context,
        listOf(
            NavAction("Quests", "⚔", true) { open(JakeDashboardActivity::class.java) },
            NavAction("Gear", "◆") { (activity as? MainActivity)?.closeLaunchpadOverview() },
            NavAction("Map", "⌖") { open(EntdeckenActivity::class.java) },
            NavAction("Journal", "▤") { open(DailyReportActivity::class.java) },
        ),
    )

    private fun open(activityClass: Class<*>) {
        startActivity(Intent(requireContext(), activityClass))
    }
}

internal fun overviewEnergyStatus(
    minutes: Int,
    capacity: Int,
    inCooldown: Boolean,
    enforced: Boolean,
    overrideActive: Boolean,
): String = when {
    overrideActive -> "PAPA-MODUS AKTIV"
    !enforced -> "BEREIT ZUM EINRICHTEN"
    inCooldown -> "VERSCHNAUFPAUSE"
    minutes <= 0 -> "ENERGIE LEER"
    minutes.toFloat() / capacity.coerceAtLeast(1) <= .25f -> "ENERGIE KNAPP"
    else -> "ENERGIE VOLL"
}

internal fun countLabel(count: Int, singular: String, plural: String, empty: String): String = when (count) {
    0 -> empty
    1 -> "1 $singular"
    else -> "$count $plural"
}

private fun Context.dp(value: Int) = (value * resources.displayMetrics.density).toInt()
