// File: app/src/main/kotlin/org/fossify/home/helpers/AppLimitBonus.kt
// LAUNCHPAD: one-off "today exception" minutes added on top of an app's daily limit.
//
// The parent can grant Jake a single-day bonus for a specific app without changing the
// permanent per-app limit. The bonus is stamped with today's local midnight and silently
// expires the next day (a stale stamp decodes to 0), so it never lingers.

package org.fossify.home.helpers

import android.content.Context

object AppLimitBonus {
    private const val KEY_PREFIX = "app_bonus_"

    /** Bonus minutes granted for [pkg] today (0 if none or expired). */
    fun getTodayBonus(context: Context, pkg: String, todayMidnight: Long): Int {
        val raw = prefs(context).getString(KEY_PREFIX + pkg, null) ?: return 0
        return decode(raw, todayMidnight)
    }

    /** Add [minutes] to today's bonus for [pkg]; stacks if one was already granted today. */
    fun addTodayBonus(context: Context, pkg: String, minutes: Int, todayMidnight: Long): Int {
        val total = getTodayBonus(context, pkg, todayMidnight) + minutes
        prefs(context).edit().putString(KEY_PREFIX + pkg, encode(todayMidnight, total)).apply()
        return total
    }

    /** Effective daily limit = permanent limit + today's bonus. */
    fun effectiveLimit(dailyMinutes: Int, bonusMinutes: Int): Int = dailyMinutes + bonusMinutes

    fun encode(dayStamp: Long, minutes: Int): String = "$dayStamp:$minutes"

    /** Decode stored "<dayStamp>:<minutes>"; returns 0 unless [dayStamp] matches [todayMidnight]. */
    fun decode(raw: String, todayMidnight: Long): Int {
        val parts = raw.split(":")
        if (parts.size != 2) return 0
        val day = parts[0].toLongOrNull() ?: return 0
        val mins = parts[1].toIntOrNull() ?: return 0
        return if (day == todayMidnight) mins else 0
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
