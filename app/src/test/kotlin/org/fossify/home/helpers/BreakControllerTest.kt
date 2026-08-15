package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Test

class BreakControllerTest {
    private val config = BreakConfig()

    @Test
    fun noBreakDirectlyAfterStart() {
        assertEquals(
            BreakDecision.NONE,
            BreakPolicy.decide(config, 60, 2, false, 100)
        )
    }

    @Test
    fun noDoubleBreak() {
        assertEquals(
            BreakDecision.NONE,
            BreakPolicy.decide(config, 70, 70, true, 1)
        )
    }

    @Test
    fun warningTwoMinutesBefore() {
        assertEquals(
            BreakDecision.WARNING,
            BreakPolicy.decide(config, 58, 70, false, 100)
        )
    }

    @Test
    fun disabledMeansNoInterruption() {
        assertEquals(
            BreakDecision.NONE,
            BreakPolicy.decide(config.copy(enabled = false), 100, 100, false, 100)
        )
    }
}
