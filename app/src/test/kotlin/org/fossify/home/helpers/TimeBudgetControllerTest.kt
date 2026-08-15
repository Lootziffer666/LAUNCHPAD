package org.fossify.home.helpers

import org.junit.Assert.*
import org.junit.Test

class TimeBudgetControllerTest {
    @Test fun remainingUsesBaseAndConsumption() {
        assertEquals(120, TimeBudgetState(120, 0, 0, false, false).remainingToday)
        assertEquals(73, TimeBudgetState(120, 0, 47, false, false).remainingToday)
        assertEquals(103, TimeBudgetState(120, 30, 47, false, false).remainingToday)
    }

    @Test fun dayChangeClearsTemporaryStateButKeepsParentConfiguration() {
        val next = DailyBudgetReducer.newDay(TimeBudgetState(120, 30, 47, true, false))
        assertEquals(120, next.baseDailyBudget)
        assertEquals(0, next.usedToday)
        assertEquals(0, next.grantedBonusTime)
        assertFalse(next.unlimitedForToday)
    }
}
