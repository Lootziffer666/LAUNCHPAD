// File: app/src/main/kotlin/org/fossify/home/helpers/TamperClock.kt
// Pure, side-effect-free reconciliation of wall-clock vs. monotonic uptime between two
// heartbeats. Detects clock manipulation, reboots, and service-suppression gaps (Doze/kill).
// No Android dependencies → fully unit-testable.

package org.fossify.home.helpers

import kotlin.math.abs

object TamperClock {

    sealed class Verdict {
        /** Everything advanced as expected. */
        object Normal : Verdict()

        /** Monotonic uptime went backwards → device rebooted since last heartbeat. */
        object Reboot : Verdict()

        /** Wall clock drifted from monotonic uptime → the system clock was changed. */
        data class TimeChanged(val driftMs: Long) : Verdict()

        /** Both clocks advanced together but by far more than expected → tracking was suspended. */
        data class Gap(val gapMs: Long) : Verdict()
    }

    /**
     * Compare the previous heartbeat (wall + monotonic) against the current one.
     *
     * @param prevWall last recorded System.currentTimeMillis(); 0 means "no baseline yet"
     * @param prevElapsed last recorded SystemClock.elapsedRealtime(); 0 means "no baseline yet"
     * @param expectedIntervalMs the nominal spacing between heartbeats (the poll interval)
     * @param driftToleranceMs allowed wall-vs-monotonic mismatch before flagging TimeChanged
     * @param gapThresholdMs monotonic advance beyond which a suspension Gap is reported
     */
    @Suppress("LongParameterList", "ReturnCount")
    fun evaluate(
        prevWall: Long,
        prevElapsed: Long,
        nowWall: Long,
        nowElapsed: Long,
        expectedIntervalMs: Long,
        driftToleranceMs: Long,
        gapThresholdMs: Long
    ): Verdict {
        // No baseline → cannot judge.
        if (prevWall <= 0L || prevElapsed <= 0L) return Verdict.Normal

        val elapsedDelta = nowElapsed - prevElapsed
        // Monotonic clock only resets on reboot.
        if (elapsedDelta < 0L) return Verdict.Reboot

        val wallDelta = nowWall - prevWall
        val drift = wallDelta - elapsedDelta
        if (abs(drift) > driftToleranceMs) return Verdict.TimeChanged(drift)

        if (elapsedDelta > expectedIntervalMs + gapThresholdMs) return Verdict.Gap(elapsedDelta)

        return Verdict.Normal
    }
}
