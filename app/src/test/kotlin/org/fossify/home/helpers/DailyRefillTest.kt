// Unit tests for the pure daily-refill math. Plain JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DailyRefillTest {

    @Test
    fun topsUpToBaseWithoutRemoving() {
        assertEquals("fills the shortfall", 50, DailyRefill.grantAmount(base = 60, currentBalance = 10))
        assertEquals("already at base → nothing", 0, DailyRefill.grantAmount(base = 60, currentBalance = 60))
        assertEquals("above base → never removes", 0, DailyRefill.grantAmount(base = 60, currentBalance = 90))
        assertEquals("empty → full base", 60, DailyRefill.grantAmount(base = 60, currentBalance = 0))
    }

    @Test
    fun newDayDetection() {
        assertTrue("never refilled", DailyRefill.isNewDay(lastRefillDay = 0L, todayMidnight = 1000L))
        assertTrue("different day", DailyRefill.isNewDay(lastRefillDay = 1000L, todayMidnight = 2000L))
        assertFalse("same day → no refill", DailyRefill.isNewDay(lastRefillDay = 2000L, todayMidnight = 2000L))
    }
}
