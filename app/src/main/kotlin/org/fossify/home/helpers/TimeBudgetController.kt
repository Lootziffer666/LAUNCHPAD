package org.fossify.home.helpers

import android.content.Context
import java.time.LocalDate

data class TimeBudgetState(
    val baseDailyBudget: Int,
    val grantedBonusTime: Int,
    val usedToday: Int,
    val unlimitedForToday: Boolean,
    val locked: Boolean
) {
    val availableToday: Int get() = baseDailyBudget + grantedBonusTime
    val remainingToday: Int get() = (availableToday - usedToday).coerceAtLeast(0)
}

object DailyBudgetReducer {
    fun newDay(previous: TimeBudgetState) = previous.copy(grantedBonusTime = 0, usedToday = 0, unlimitedForToday = false, locked = false)
}

/** The single persisted source of truth for today's Launchpad time. */
class TimeBudgetController(private val context: Context) {
    private val prefs get() = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

    @Synchronized fun state(today: LocalDate = LocalDate.now()): TimeBudgetState {
        resetForNewDay(today)
        return TimeBudgetState(
            prefs.getInt(LaunchpadPrefs.PREF_BASE_TIME_MINUTES, LaunchpadConstants.DEFAULT_BASE_TIME_MINUTES),
            prefs.getInt(LaunchpadPrefs.PREF_BONUS_TODAY, 0),
            prefs.getInt(LaunchpadPrefs.PREF_USED_TODAY, 0),
            prefs.getBoolean(LaunchpadPrefs.PREF_UNLIMITED_TODAY, false),
            prefs.getBoolean(LaunchpadPrefs.PREF_REMOTE_LOCKED, false)
        )
    }

    @Synchronized fun recordUsage(minutes: Int) {
        val s = state()
        prefs.edit().putInt(LaunchpadPrefs.PREF_USED_TODAY, s.usedToday + minutes.coerceAtLeast(0)).apply()
    }

    @Synchronized fun grantBonus(minutes: Int) {
        val s = state()
        prefs.edit().putInt(LaunchpadPrefs.PREF_BONUS_TODAY, s.grantedBonusTime + minutes.coerceAtLeast(0)).apply()
    }

    fun setUnlimitedToday(value: Boolean) = prefs.edit().putBoolean(LaunchpadPrefs.PREF_UNLIMITED_TODAY, value).apply()
    fun setLocked(value: Boolean) = prefs.edit().putBoolean(LaunchpadPrefs.PREF_REMOTE_LOCKED, value).apply()

    @Synchronized fun resetForNewDay(today: LocalDate = LocalDate.now()) {
        val key = today.toString()
        if (prefs.getString(LaunchpadPrefs.PREF_BUDGET_DAY, null) == key) return
        prefs.edit().putString(LaunchpadPrefs.PREF_BUDGET_DAY, key)
            .putInt(LaunchpadPrefs.PREF_USED_TODAY, 0).putInt(LaunchpadPrefs.PREF_BONUS_TODAY, 0)
            .putBoolean(LaunchpadPrefs.PREF_UNLIMITED_TODAY, false)
            .putLong(LaunchpadPrefs.PREF_BREAK_ACTIVE_UNTIL, 0L)
            .putLong(LaunchpadPrefs.PREF_CONTINUOUS_USAGE_START, 0L).apply()
    }
}
