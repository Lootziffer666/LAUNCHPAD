// File: app/src/main/kotlin/org/fossify/home/helpers/WeeklyCap.kt
// LAUNCHPAD hard weekly cap. Earned time never expires (by design), but the amount the SYSTEM
// hands out per week (the daily base refill etc.) is hard-capped. Parent additions bypass the cap
// entirely — that is the parent veto (see CryptoCashDao.getWeekEarnedMinutes, which excludes
// source='parent_app'). Pure math here so it is unit-tested; the Android bits (prefs, DAO) live in
// DailyRefill.

@file:Suppress("MagicNumber") // calendar constants

package org.fossify.home.helpers

import java.util.Calendar
import java.util.GregorianCalendar

object WeeklyCap {

    /** Local start-of-week (Monday 00:00) for [now]. */
    fun weekStartMillis(now: Long): Long {
        // GregorianCalendar (not Calendar.getInstance) so week math never lands on a locale-specific
        // non-Gregorian calendar (Buddhist/Japanese Imperial etc.).
        val cal = GregorianCalendar()
        cal.timeInMillis = now
        cal.firstDayOfWeek = Calendar.MONDAY
        cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        // If setting to Monday rolled forward past `now` (locales where week starts Sunday), step back.
        if (cal.timeInMillis > now) cal.add(Calendar.DAY_OF_MONTH, -7)
        return cal.timeInMillis
    }

    /** Minutes still grantable this week (never negative). */
    fun remaining(weekCap: Int, weekEarned: Int): Int = (weekCap - weekEarned).coerceAtLeast(0)

    /**
     * Cap a desired system grant. When the cap is off, the desired amount passes through; when on,
     * it is clamped to what's left in the week. Never negative.
     */
    fun capGrant(desired: Int, remaining: Int, capEnabled: Boolean): Int =
        if (!capEnabled) desired.coerceAtLeast(0) else desired.coerceIn(0, remaining)
}
