// File: app/src/main/kotlin/org/fossify/home/helpers/NewAppsTracker.kt
// LAUNCHPAD: surfaces newly installed apps for parent review. With open installs (e.g. via
// Family Link) default-deny already keeps a new app unusable until the parent allows it — this
// only detects it and adds it to a "pending review" set the companion shows, instead of letting
// it sit unnoticed in "Apps verwalten". The diff in computeNewPending is pure (unit-tested).

@file:Suppress("TooGenericExceptionCaught", "SwallowedException")

package org.fossify.home.helpers

import android.content.Context
import android.content.Intent
import org.fossify.home.databases.AppsDatabase
import org.json.JSONArray

object NewAppsTracker {

    private const val MIN_SCAN_INTERVAL_MS = 60_000L

    /** Pure diff: packages that appeared since [known], minus already-[allowed] and [selfPackage]. */
    fun computeNewPending(
        known: Set<String>,
        current: Set<String>,
        allowed: Set<String>,
        selfPackage: String
    ): Set<String> = (current - known) - allowed - setOf(selfPackage)

    fun launchablePackages(context: Context): Set<String> {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        return context.packageManager.queryIntentActivities(intent, 0)
            .mapNotNull { it.activityInfo?.packageName }
            .toSet()
    }

    /**
     * Detect new installs. The first ever run snapshots silently (no flags, so existing apps are
     * not all flagged). Throttled to once a minute. Returns the packages newly flagged this pass.
     */
    suspend fun scan(context: Context, db: AppsDatabase): List<String> {
        val prefs = prefs(context)
        val knownRaw = prefs.getString(LaunchpadPrefs.PREF_KNOWN_PACKAGES, null)
        val current = launchablePackages(context)

        if (knownRaw == null) {
            prefs.edit()
                .putString(LaunchpadPrefs.PREF_KNOWN_PACKAGES, encode(current))
                .putLong(LaunchpadPrefs.PREF_LAST_APP_SCAN, System.currentTimeMillis())
                .apply()
            return emptyList()
        }

        val last = prefs.getLong(LaunchpadPrefs.PREF_LAST_APP_SCAN, 0L)
        if (System.currentTimeMillis() - last < MIN_SCAN_INTERVAL_MS) return emptyList()

        val known = decode(knownRaw)
        val allowed = db.allowedAppDao().getAll().map { it.packageName }.toSet()
        val alreadyPending = decode(prefs.getString(LaunchpadPrefs.PREF_PENDING_REVIEW_PACKAGES, null))

        val newlyFound = computeNewPending(known, current, allowed, context.packageName)
            .filter { it !in alreadyPending }
        // Keep only entries that still exist and are still not allowed.
        val stillPending = (alreadyPending + newlyFound).filter { it in current && it !in allowed }.toSet()

        prefs.edit()
            .putString(LaunchpadPrefs.PREF_KNOWN_PACKAGES, encode(current))
            .putString(LaunchpadPrefs.PREF_PENDING_REVIEW_PACKAGES, encode(stillPending))
            .putLong(LaunchpadPrefs.PREF_LAST_APP_SCAN, System.currentTimeMillis())
            .apply()
        return newlyFound
    }

    fun pending(context: Context): Set<String> =
        decode(prefs(context).getString(LaunchpadPrefs.PREF_PENDING_REVIEW_PACKAGES, null))

    fun clearPending(context: Context, packageName: String) {
        val updated = pending(context) - packageName
        prefs(context).edit()
            .putString(LaunchpadPrefs.PREF_PENDING_REVIEW_PACKAGES, encode(updated)).apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

    private fun encode(set: Set<String>): String =
        JSONArray().apply { set.forEach { put(it) } }.toString()

    private fun decode(raw: String?): Set<String> {
        if (raw.isNullOrEmpty()) return emptySet()
        return try {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { arr.getString(it) }.toSet()
        } catch (e: Exception) {
            emptySet()
        }
    }
}
