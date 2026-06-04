// File: app/src/test/kotlin/org/fossify/home/helpers/LaunchpadM4Tests.kt
// Unit tests for CategorySuggester, LaunchpadConstants reason codes, and WeekScheduleEntry defaults.

package org.fossify.home.helpers

import org.fossify.home.databases.AppTimeLimit
import org.fossify.home.databases.WeekScheduleEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CategorySuggesterTest {

    @Test
    fun exactMatchYouTube() {
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.google.android.youtube")
        )
    }

    @Test
    fun exactMatchNetflix() {
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.netflix.mediaclient")
        )
    }

    @Test
    fun exactMatchMinecraft() {
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.mojang.minecraftpe")
        )
    }

    @Test
    fun exactMatchDuolingo() {
        assertEquals(
            LaunchpadConstants.CATEGORY_LEARNING,
            CategorySuggester.suggest("com.duolingo")
        )
    }

    @Test
    fun exactMatchWhatsApp() {
        assertEquals(
            LaunchpadConstants.CATEGORY_COMMUNICATION,
            CategorySuggester.suggest("com.whatsapp")
        )
    }

    @Test
    fun exactMatchAudible() {
        assertEquals(
            LaunchpadConstants.CATEGORY_COOLDOWN,
            CategorySuggester.suggest("com.audible.application")
        )
    }

    @Test
    fun exactMatchChrome() {
        assertEquals(
            LaunchpadConstants.CATEGORY_NEUTRAL,
            CategorySuggester.suggest("com.android.chrome")
        )
    }

    @Test
    fun prefixSupercell() {
        // com.supercell prefix → Clash of Clans, Clash Royale, Brawl Stars
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.supercell.clashofclans")
        )
    }

    @Test
    fun prefixKing() {
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.king.candycrushsaga")
        )
    }

    @Test
    fun prefixRovio() {
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.rovio.angrybirdsreloaded")
        )
    }

    @Test
    fun prefixEaGames() {
        assertEquals(
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            CategorySuggester.suggest("com.ea.games.nfs14")
        )
    }

    @Test
    fun unknownPackageReturnsNull() {
        assertNull(CategorySuggester.suggest("com.unknown.totally.random.app"))
    }

    @Test
    fun emptyPackageReturnsNull() {
        // Edge case: empty string should not crash and should return null
        assertNull(CategorySuggester.suggest(""))
    }

    @Test
    fun prefixDoesNotMatchPartialSegment() {
        // "com.supercell" should match "com.supercell.anything" but NOT a different root
        assertNull(CategorySuggester.suggest("com.supercellother.game"))
    }
}

class LaunchpadConstantsGuardTest {

    // These tests guard against accidental renaming of reason code values.
    // AppBlockedActivity and other UI code depend on these exact strings.

    @Test
    fun reasonCodesAreStable() {
        assertEquals("not_allowed", LaunchpadConstants.REASON_NOT_ALLOWED)
        assertEquals("cooldown", LaunchpadConstants.REASON_COOLDOWN)
        assertEquals("no_budget", LaunchpadConstants.REASON_NO_BUDGET)
        assertEquals("min_threshold", LaunchpadConstants.REASON_MIN_THRESHOLD)
        assertEquals("lockdown", LaunchpadConstants.REASON_LOCKDOWN)
        assertEquals("schedule_window", LaunchpadConstants.REASON_SCHEDULE_WINDOW)
        assertEquals("app_daily_limit", LaunchpadConstants.REASON_APP_DAILY_LIMIT)
    }

    @Test
    fun categoryCodesAreStable() {
        assertNotNull(LaunchpadConstants.CATEGORY_ACTIVE_LEISURE)
        assertNotNull(LaunchpadConstants.CATEGORY_NEUTRAL)
        assertNotNull(LaunchpadConstants.CATEGORY_COOLDOWN)
        assertNotNull(LaunchpadConstants.CATEGORY_LEARNING)
        assertNotNull(LaunchpadConstants.CATEGORY_COMMUNICATION)
        assertNotNull(LaunchpadConstants.CATEGORY_CREATIVE)
    }

    @Test
    fun txTypesAreStable() {
        assertEquals("EARN", LaunchpadConstants.TX_TYPE_EARN)
        assertEquals("SPEND", LaunchpadConstants.TX_TYPE_SPEND)
        assertEquals("CORRECTION", LaunchpadConstants.TX_TYPE_CORRECTION)
    }

    @Test
    fun severityLevelsAreStable() {
        assertEquals("INFO", LaunchpadConstants.SEVERITY_INFO)
        assertEquals("WARNING", LaunchpadConstants.SEVERITY_WARNING)
        assertEquals("CRITICAL", LaunchpadConstants.SEVERITY_CRITICAL)
    }
}

class WeekScheduleEntryTest {

    @Test
    fun defaultsArePermissive() {
        // Default entry should not block anything
        val entry = WeekScheduleEntry(dayOfWeek = 2)
        assertTrue("Default should not be active", !entry.active)
        assertEquals("Default from hour should be 0 (unrestricted)", 0, entry.allowedFromHour)
        assertEquals("Default until hour should be 24 (unrestricted)", 24, entry.allowedUntilHour)
    }

    @Test
    fun schoolDayWindowRepresentable() {
        // Typical "15:00–20:00" school day setting
        val entry = WeekScheduleEntry(
            dayOfWeek = 2, // Monday
            active = true,
            allowedFromHour = 15,
            allowedUntilHour = 20
        )
        assertTrue(entry.active)
        assertEquals(15, entry.allowedFromHour)
        assertEquals(20, entry.allowedUntilHour)

        // Before 15:00 → hour 14 is outside
        val hour = 14
        val blocked = hour < entry.allowedFromHour || hour >= entry.allowedUntilHour
        assertTrue("Hour 14 should be blocked by 15–20 window", blocked)
    }

    @Test
    fun exactBoundaryHoursNotBlocked() {
        val entry = WeekScheduleEntry(
            dayOfWeek = 7, // Sunday
            active = true,
            allowedFromHour = 15,
            allowedUntilHour = 20
        )
        // 15:00 exactly — allowed
        val hourStart = 15
        val blockedAtStart = hourStart < entry.allowedFromHour || hourStart >= entry.allowedUntilHour
        assertTrue("Hour 15 should be allowed (from=15)", !blockedAtStart)

        // 20:00 exactly — blocked (>= untilHour)
        val hourEnd = 20
        val blockedAtEnd = hourEnd < entry.allowedFromHour || hourEnd >= entry.allowedUntilHour
        assertTrue("Hour 20 should be blocked (until=20)", blockedAtEnd)
    }
}

class AppDailyLimitTest {

    // Mirrors the decision used by LaunchGate (Check 2.5) and TimeTrackingService:
    // a limit is active when dailyMinutes > 0, and reached when used >= dailyMinutes.
    private fun reached(limit: AppTimeLimit, usedToday: Int): Boolean =
        limit.dailyMinutes > 0 && usedToday >= limit.dailyMinutes

    @Test
    fun zeroMinutesMeansNoLimit() {
        val limit = AppTimeLimit("com.example.app", 0)
        assertFalse("0 dailyMinutes must never block", reached(limit, 0))
        assertFalse("0 dailyMinutes must never block", reached(limit, 999))
    }

    @Test
    fun underLimitIsAllowed() {
        val limit = AppTimeLimit("com.example.app", 30)
        assertFalse("29 < 30 should be allowed", reached(limit, 29))
    }

    @Test
    fun exactLimitIsReached() {
        val limit = AppTimeLimit("com.example.app", 30)
        assertTrue("30 >= 30 should be blocked", reached(limit, 30))
    }

    @Test
    fun overLimitIsReached() {
        val limit = AppTimeLimit("com.example.app", 30)
        assertTrue("31 >= 30 should be blocked", reached(limit, 31))
    }
}
