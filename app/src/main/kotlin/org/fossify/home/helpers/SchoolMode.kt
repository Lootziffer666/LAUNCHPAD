// File: app/src/main/kotlin/org/fossify/home/helpers/SchoolMode.kt
// LAUNCHPAD: "Schulmodus" pauses ACTIVE_LEISURE (games/SOG) apps while learning, communication
// and calm apps stay open. Two OR-combined drivers:
//   - manual override (PREF_SCHOOL_MODE): a parent forces it on now.
//   - auto schedule: enabled + chosen weekdays + a daily time window (configurable).
// isActive() is evaluated live on each launch — no background alarm needed. The window test
// (isWithinWindow) is pure so it is unit-testable.

@file:Suppress("MagicNumber", "TooManyFunctions") // clock arithmetic; small cohesive helper

package org.fossify.home.helpers

import android.content.Context
import java.util.Calendar

object SchoolMode {

    const val DEFAULT_START_MIN = 8 * 60   // 08:00
    const val DEFAULT_END_MIN = 14 * 60    // 14:00
    const val DEFAULT_DAYS = "2,3,4,5,6"   // Mon–Fri (Calendar.DAY_OF_WEEK)

    // ── manual override ──
    fun isManualOn(context: Context): Boolean =
        prefs(context).getBoolean(LaunchpadPrefs.PREF_SCHOOL_MODE, false)

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(LaunchpadPrefs.PREF_SCHOOL_MODE, enabled).apply()
    }

    // ── auto schedule config ──
    fun autoEnabled(context: Context): Boolean =
        prefs(context).getBoolean(LaunchpadPrefs.PREF_SCHOOL_AUTO_ENABLED, false)

    fun startMinutes(context: Context): Int =
        prefs(context).getInt(LaunchpadPrefs.PREF_SCHOOL_START_MIN, DEFAULT_START_MIN)

    fun endMinutes(context: Context): Int =
        prefs(context).getInt(LaunchpadPrefs.PREF_SCHOOL_END_MIN, DEFAULT_END_MIN)

    fun days(context: Context): Set<Int> =
        (prefs(context).getString(LaunchpadPrefs.PREF_SCHOOL_DAYS, DEFAULT_DAYS) ?: DEFAULT_DAYS)
            .split(",").mapNotNull { it.trim().toIntOrNull() }.toSet()

    fun saveSchedule(context: Context, enabled: Boolean, startMin: Int, endMin: Int, days: Set<Int>) {
        prefs(context).edit()
            .putBoolean(LaunchpadPrefs.PREF_SCHOOL_AUTO_ENABLED, enabled)
            .putInt(LaunchpadPrefs.PREF_SCHOOL_START_MIN, startMin)
            .putInt(LaunchpadPrefs.PREF_SCHOOL_END_MIN, endMin)
            .putString(LaunchpadPrefs.PREF_SCHOOL_DAYS, days.sorted().joinToString(","))
            .apply()
    }

    // ── evaluation ──
    fun isAutoActiveNow(context: Context, now: Calendar = Calendar.getInstance()): Boolean {
        val nowMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
        return isWithinWindow(
            autoEnabled(context), now.get(Calendar.DAY_OF_WEEK), nowMin,
            days(context), startMinutes(context), endMinutes(context)
        )
    }

    /** Effective state used by the launch gate: manual override OR an open auto window. */
    fun isActive(context: Context): Boolean = isManualOn(context) || isAutoActiveNow(context)

    /** Pure: is the auto window open right now? */
    fun isWithinWindow(
        enabled: Boolean,
        dayOfWeek: Int,
        nowMinutes: Int,
        days: Set<Int>,
        startMin: Int,
        endMin: Int
    ): Boolean =
        enabled && startMin < endMin && dayOfWeek in days &&
            nowMinutes >= startMin && nowMinutes < endMin

    /** Which apps school mode pauses. Only ACTIVE_LEISURE; everything else stays open. */
    fun blocksCategory(active: Boolean, category: String?): Boolean =
        active && category == LaunchpadConstants.CATEGORY_ACTIVE_LEISURE

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
