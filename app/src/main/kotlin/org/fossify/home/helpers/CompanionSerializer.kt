// File: app/src/main/kotlin/org/fossify/home/helpers/CompanionSerializer.kt
// Pure JSON (de)serialisation for the companion sync (LaunchpadServer). Kept free of Context/DB
// so the round-trip can be unit-tested directly — see LaunchpadCompanionTests.

package org.fossify.home.helpers

import org.fossify.home.databases.AllowedApp
import org.fossify.home.databases.AppTimeLimit
import org.json.JSONObject

object CompanionSerializer {

    // ─── AppTimeLimit ────────────────────────────────────────────────────────────

    fun limitToJson(limit: AppTimeLimit): JSONObject = JSONObject().apply {
        put("packageName", limit.packageName)
        put("dailyMinutes", limit.dailyMinutes)
        put("weekendMinutes", limit.weekendMinutes)
    }

    /**
     * Parse a limit entry. Returns null when it represents "no cap" (both values <= 0) or has a
     * blank package — the caller should then delete/skip the row. Backward-compatible: an entry
     * without `weekendMinutes` (older companion clients/exports) keeps the same cap every day.
     */
    fun limitFromJson(o: JSONObject): AppTimeLimit? {
        val pkg = o.optString("packageName", "")
        if (pkg.isBlank()) return null
        val daily = o.optInt("dailyMinutes", 0)
        val weekend = o.optInt("weekendMinutes", daily)
        if (daily <= 0 && weekend <= 0) return null
        return AppTimeLimit(pkg, daily, weekend)
    }

    // ─── AllowedApp ───────────────────────────────────────────────────────────────

    fun allowedAppToJson(app: AllowedApp): JSONObject = JSONObject().apply {
        put("packageName", app.packageName)
        put("category", app.category)
        put("enabled", app.enabled)
        put("addedAt", app.addedAt)
        put("addedBy", app.addedBy)
    }

    /** Parse an allowed-app entry. Returns null when the package name is blank. */
    fun allowedAppFromJson(o: JSONObject): AllowedApp? {
        val pkg = o.optString("packageName", "")
        if (pkg.isBlank()) return null
        return AllowedApp(
            packageName = pkg,
            category = o.optString("category", LaunchpadConstants.CATEGORY_NEUTRAL),
            enabled = o.optBoolean("enabled", true),
            addedAt = o.optLong("addedAt", System.currentTimeMillis()),
            addedBy = o.optString("addedBy", "parent")
        )
    }
}
