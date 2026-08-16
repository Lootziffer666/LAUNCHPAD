package org.fossify.home.ui

import android.app.Activity
import android.content.Intent
import org.fossify.home.activities.DailyReportActivity
import org.fossify.home.activities.EntdeckenActivity
import org.fossify.home.activities.MainActivity

enum class LaunchpadDestination { QUESTS, GEAR, MAP, JOURNAL }

/** One native navigation contract shared by Quests, Gear and every child-facing sub-screen. */
object LaunchpadNavigation {
    fun view(activity: Activity, active: LaunchpadDestination) = StitchBottomNav(
        activity,
        listOf(
            NavAction("Quests", "⚔", active == LaunchpadDestination.QUESTS) {
                if (activity is MainActivity) {
                    closeOverlays(activity)
                    activity.showQuestsScreen()
                } else {
                    openMain(activity, gear = false)
                }
            },
            NavAction("Gear", "◆", active == LaunchpadDestination.GEAR) {
                if (activity is MainActivity) {
                    closeOverlays(activity)
                    activity.showGearScreen()
                } else {
                    openMain(activity, gear = true)
                }
            },
            NavAction("Map", "⌖", active == LaunchpadDestination.MAP) {
                if (activity !is EntdeckenActivity) {
                    closeOverlays(activity)
                    activity.startActivity(Intent(activity, EntdeckenActivity::class.java))
                }
            },
            NavAction("Journal", "▤", active == LaunchpadDestination.JOURNAL) {
                if (activity !is DailyReportActivity) {
                    closeOverlays(activity)
                    activity.startActivity(Intent(activity, DailyReportActivity::class.java))
                }
            },
        ),
    )

    private fun openMain(activity: Activity, gear: Boolean) {
        activity.startActivity(
            Intent(activity, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                if (gear) putExtra(MainActivity.EXTRA_OPEN_GEAR, true)
            },
        )
    }

    private fun closeOverlays(activity: Activity) {
        if (activity is MainActivity) {
            activity.closeAppDrawer()
            activity.closeWidgetsFragment()
        }
    }
}
