package org.fossify.home.helpers

data class BreakConfig(val enabled: Boolean = true, val afterContinuousMinutes: Int = 60, val durationMinutes: Int = 5, val warningMinutes: Int = 2)
enum class BreakDecision { NONE, WARNING, START_BREAK }
object BreakPolicy {
    fun decide(config: BreakConfig, continuousMinutes: Int, minutesSinceUnlock: Int, breakActive: Boolean, minutesSinceLastBreak: Int): BreakDecision {
        if (!config.enabled || breakActive || minutesSinceUnlock < 15 || minutesSinceLastBreak < config.durationMinutes + 30) return BreakDecision.NONE
        return when {
            continuousMinutes >= config.afterContinuousMinutes -> BreakDecision.START_BREAK
            continuousMinutes >= config.afterContinuousMinutes - config.warningMinutes -> BreakDecision.WARNING
            else -> BreakDecision.NONE
        }
    }
}
