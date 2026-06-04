// File: app/src/test/kotlin/org/fossify/home/helpers/LaunchpadCompanionTests.kt
// Round-trip tests for the companion sync serialisation (CompanionSerializer). Uses the real
// org.json on the unit-test classpath (testImplementation libs.org.json).

package org.fossify.home.helpers

import org.fossify.home.databases.AllowedApp
import org.fossify.home.databases.AppTimeLimit
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CompanionLimitSerializerTest {

    @Test
    fun limitRoundTripPreservesBothCaps() {
        val limit = AppTimeLimit("com.example.app", dailyMinutes = 30, weekendMinutes = 60)
        val back = CompanionSerializer.limitFromJson(CompanionSerializer.limitToJson(limit))
        assertEquals(limit, back)
    }

    @Test
    fun limitBackwardCompatMissingWeekend() {
        // Older companion clients/exports only send dailyMinutes → keep same cap every day.
        val json = JSONObject().put("packageName", "com.example.app").put("dailyMinutes", 30)
        val back = CompanionSerializer.limitFromJson(json)
        assertEquals(AppTimeLimit("com.example.app", 30, 30), back)
    }

    @Test
    fun limitNoCapReturnsNull() {
        val json = JSONObject()
            .put("packageName", "com.example.app")
            .put("dailyMinutes", 0)
            .put("weekendMinutes", 0)
        assertNull(CompanionSerializer.limitFromJson(json))
    }

    @Test
    fun limitWeekendOnlyIsKept() {
        val json = JSONObject()
            .put("packageName", "com.example.app")
            .put("dailyMinutes", 0)
            .put("weekendMinutes", 60)
        assertEquals(AppTimeLimit("com.example.app", 0, 60), CompanionSerializer.limitFromJson(json))
    }

    @Test
    fun limitBlankPackageReturnsNull() {
        assertNull(CompanionSerializer.limitFromJson(JSONObject().put("dailyMinutes", 30)))
    }
}

class CompanionAppSerializerTest {

    @Test
    fun appRoundTripPreservesFields() {
        val app = AllowedApp(
            packageName = "com.example.app",
            category = LaunchpadConstants.CATEGORY_ACTIVE_LEISURE,
            enabled = false,
            addedAt = 123_456L,
            addedBy = "mama"
        )
        val back = CompanionSerializer.allowedAppFromJson(CompanionSerializer.allowedAppToJson(app))
        assertEquals(app, back)
    }

    @Test
    fun appDefaultsWhenFieldsMissing() {
        val json = JSONObject().put("packageName", "com.example.app")
        val app = CompanionSerializer.allowedAppFromJson(json)!!
        assertEquals(LaunchpadConstants.CATEGORY_NEUTRAL, app.category)
        assertTrue("enabled should default to true", app.enabled)
        assertEquals("parent", app.addedBy)
        assertTrue("addedAt should default to a real timestamp", app.addedAt > 0L)
    }

    @Test
    fun appBlankPackageReturnsNull() {
        assertNull(CompanionSerializer.allowedAppFromJson(JSONObject().put("category", "NEUTRAL")))
    }
}
