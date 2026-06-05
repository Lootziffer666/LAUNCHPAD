// File: app/src/test/kotlin/org/fossify/home/helpers/TamperClockTest.kt
// Unit tests for the pure wall-vs-monotonic reconciliation logic.

package org.fossify.home.helpers

import org.fossify.home.helpers.TamperClock.Verdict
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TamperClockTest {

    private val interval = 10_000L        // 10s poll
    private val drift = 60_000L           // 1 min tolerance
    private val gap = 300_000L            // 5 min gap threshold

    private fun evaluate(pw: Long, pe: Long, nw: Long, ne: Long) =
        TamperClock.evaluate(pw, pe, nw, ne, interval, drift, gap)

    @Test
    fun noBaselineIsNormal() {
        assertEquals(Verdict.Normal, evaluate(0L, 0L, 1_000L, 1_000L))
    }

    @Test
    fun steadyTickIsNormal() {
        // Both clocks advanced by the same ~10s.
        assertEquals(Verdict.Normal, evaluate(1_000_000L, 50_000L, 1_010_000L, 60_000L))
    }

    @Test
    fun smallJitterWithinToleranceIsNormal() {
        // Wall advanced 10s, monotonic 11s → 1s drift, well inside tolerance.
        assertEquals(Verdict.Normal, evaluate(1_000_000L, 50_000L, 1_010_000L, 61_000L))
    }

    @Test
    fun wallClockJumpedForwardIsTimeChanged() {
        // Monotonic advanced 10s, wall jumped 2h ahead.
        val verdict = evaluate(1_000_000L, 50_000L, 1_000_000L + 7_200_000L, 60_000L)
        assertTrue(verdict is Verdict.TimeChanged)
    }

    @Test
    fun wallClockJumpedBackwardIsTimeChanged() {
        // Child winds the clock back an hour to dodge a daily reset.
        val verdict = evaluate(1_000_000L, 50_000L, 1_000_000L - 3_600_000L, 60_000L)
        assertTrue(verdict is Verdict.TimeChanged)
        assertTrue((verdict as Verdict.TimeChanged).driftMs < 0)
    }

    @Test
    fun monotonicWentBackwardsIsReboot() {
        // elapsedRealtime resets to near-zero after a reboot.
        assertEquals(Verdict.Reboot, evaluate(1_000_000L, 5_000_000L, 1_020_000L, 8_000L))
    }

    @Test
    fun longSuspensionIsGap() {
        // Both advanced together by ~20 min → Doze/kill suppressed our ticks.
        val verdict = evaluate(1_000_000L, 50_000L, 1_000_000L + 1_200_000L, 50_000L + 1_200_000L)
        assertTrue(verdict is Verdict.Gap)
    }

    @Test
    fun gapTakesPriorityOnlyWhenNoDrift() {
        // A long advance that also drifts is reported as TimeChanged, not Gap.
        val verdict = evaluate(1_000_000L, 50_000L, 1_000_000L + 1_200_000L, 50_000L + 600_000L)
        assertTrue(verdict is Verdict.TimeChanged)
    }
}
