// File: app/src/main/kotlin/org/fossify/home/helpers/DailyRefill.kt
// LAUNCHPAD: daily base-time allowance. Jake's dashboard promises "morgen gibt's neue" — this
// makes it real. Once per local day, top the balance UP TO the configured base allowance (it never
// removes earned minutes above the base; it only fills a shortfall), recorded as a normal EARN so
// the ledger and No-Regression invariant stay intact. Idempotent: a per-day stamp means repeated
// calls (from the tracking tick and MainActivity.onResume) grant at most once per day.

@file:Suppress("MagicNumber") // calendar/ms math

package org.fossify.home.helpers

import android.content.Context
import kotlinx.coroutines.sync.withLock
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.CryptoCashTransaction
import java.util.Calendar

object DailyRefill {

    /** Pure: minutes to grant so the balance reaches [base] (never negative, never removes). */
    fun grantAmount(base: Int, currentBalance: Int): Int = (base - currentBalance).coerceAtLeast(0)

    /** Pure: has the day rolled over since the last refill stamp? */
    fun isNewDay(lastRefillDay: Long, todayMidnight: Long): Boolean = lastRefillDay != todayMidnight

    fun baseMinutes(context: Context): Int =
        prefs(context).getInt(
            LaunchpadPrefs.PREF_BASE_TIME_MINUTES,
            LaunchpadConstants.DEFAULT_BASE_TIME_MINUTES
        )

    fun todayMidnight(now: Long = System.currentTimeMillis()): Long {
        val cal = Calendar.getInstance()
        cal.timeInMillis = now
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    /**
     * Grant today's base allowance if not already granted today. No-op unless Kindermodus
     * (enforcement) is on and the base allowance is > 0. Shares LedgerGuard with every other
     * balance mutation so it can't race a metering spend.
     */
    suspend fun maybeGrant(context: Context, db: AppsDatabase) {
        val prefs = prefs(context)
        if (!prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)) return
        val base = baseMinutes(context)
        if (base <= 0) return
        val today = todayMidnight()
        // Cheap pre-check outside the lock; the authoritative check repeats inside.
        if (!isNewDay(prefs.getLong(LaunchpadPrefs.PREF_LAST_REFILL_DAY, 0L), today)) return

        LedgerGuard.mutex.withLock {
            if (!isNewDay(prefs.getLong(LaunchpadPrefs.PREF_LAST_REFILL_DAY, 0L), today)) {
                return@withLock
            }
            val balance = db.cryptoCashDao().getCurrentBalance()
            // Hard weekly cap: the system may only top up within what's left of the week's cap.
            // Parent additions are excluded from the earned total (getWeekEarnedMinutes), so a
            // parent can always give more — that's the veto. Turn the whole cap off via the pref.
            val capEnabled = prefs.getBoolean(LaunchpadPrefs.PREF_WEEK_CAP_ENABLED, true)
            val weekCap = prefs.getInt(
                LaunchpadPrefs.PREF_WEEK_CAP_MINUTES, LaunchpadConstants.DEFAULT_WEEK_CAP_MINUTES
            )
            val weekEarned = db.cryptoCashDao().getWeekEarnedMinutes(WeeklyCap.weekStartMillis(today))
            val grant = WeeklyCap.capGrant(
                desired = grantAmount(base, balance),
                remaining = WeeklyCap.remaining(weekCap, weekEarned),
                capEnabled = capEnabled
            )
            if (grant > 0) {
                db.cryptoCashDao().insertTransaction(
                    CryptoCashTransaction(
                        deltaMinutes = grant,
                        type = LaunchpadConstants.TX_TYPE_EARN,
                        actor = "system",
                        reasonType = "daily_base",
                        reasonText = "Tägliche Grundzeit",
                        childVisibleText = "Neuer Tag +$grant Min",
                        source = "system",
                        balanceAfter = balance + grant
                    )
                )
            }
            prefs.edit().putLong(LaunchpadPrefs.PREF_LAST_REFILL_DAY, today).apply()
        }
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
