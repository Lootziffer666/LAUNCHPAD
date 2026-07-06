// Unit tests for the pure weekly-cap math. Plain JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class WeeklyCapTest {

    @Test
    fun remainingNeverNegative() {
        assertEquals(30, WeeklyCap.remaining(weekCap = 120, weekEarned = 90))
        assertEquals(0, WeeklyCap.remaining(weekCap = 120, weekEarned = 120))
        assertEquals(0, WeeklyCap.remaining(weekCap = 120, weekEarned = 200))
    }

    @Test
    fun capGrantClampsWhenEnabled() {
        assertEquals("fits under remaining", 20, WeeklyCap.capGrant(desired = 20, remaining = 30, capEnabled = true))
        assertEquals("clamped to remaining", 30, WeeklyCap.capGrant(desired = 60, remaining = 30, capEnabled = true))
        assertEquals("no room left", 0, WeeklyCap.capGrant(desired = 60, remaining = 0, capEnabled = true))
    }

    @Test
    fun capGrantPassesThroughWhenDisabled() {
        assertEquals(60, WeeklyCap.capGrant(desired = 60, remaining = 0, capEnabled = false))
        assertEquals(0, WeeklyCap.capGrant(desired = -5, remaining = 0, capEnabled = false))
    }

    @Test
    fun weekStartIsMondayMidnightAndNotInFuture() {
        val now = System.currentTimeMillis()
        val start = WeeklyCap.weekStartMillis(now)
        assertTrue("week start is at or before now", start <= now)
        assertTrue("within the last 7 days", now - start < 7L * 24 * 60 * 60 * 1000)
        val cal = java.util.Calendar.getInstance().apply { timeInMillis = start }
        assertEquals(java.util.Calendar.MONDAY, cal.get(java.util.Calendar.DAY_OF_WEEK))
        assertEquals(0, cal.get(java.util.Calendar.HOUR_OF_DAY))
        assertEquals(0, cal.get(java.util.Calendar.MINUTE))
    }
}
