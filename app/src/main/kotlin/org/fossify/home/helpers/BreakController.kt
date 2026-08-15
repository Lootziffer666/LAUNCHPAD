package org.fossify.home.helpers

private const val MINUTES_AFTER_UNLOCK_BEFORE_BREAK = 15
private const val MINUTES_BETWEEN_BREAKS = 30

data class BreakConfig(
    val enabled: Boolean = true,
    val afterContinuousMinutes: Int = 60,
    val durationMinutes: Int = 5,
    val warningMinutes: Int = 2
)

enum class BreakDecision { NONE, WARNING, START_BREAK }

object BreakPolicy {
    fun decide(
        config: BreakConfig,
        continuousMinutes: Int,
        minutesSinceUnlock: Int,
        breakActive: Boolean,
        minutesSinceLastBreak: Int
    ): BreakDecision {
        if (!config.enabled) return BreakDecision.NONE
        if (breakActive) return BreakDecision.NONE
        if (minutesSinceUnlock < MINUTES_AFTER_UNLOCK_BEFORE_BREAK) return BreakDecision.NONE
        val minimumBreakGap = config.durationMinutes + MINUTES_BETWEEN_BREAKS
        if (minutesSinceLastBreak < minimumBreakGap) return BreakDecision.NONE

        return when {
            continuousMinutes >= config.afterContinuousMinutes -> BreakDecision.START_BREAK
            continuousMinutes >= config.afterContinuousMinutes - config.warningMinutes -> BreakDecision.WARNING
            else -> BreakDecision.NONE
        }
    }
}
