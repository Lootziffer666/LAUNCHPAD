// File: app/src/main/kotlin/org/fossify/home/helpers/SchoolMode.kt
// LAUNCHPAD "Schulmodus" — a simple STATE, not time policy. It answers "what should the child see
// and use during school/homework/focus time?" While active: learning, communication and neutral
// apps stay; ACTIVE_LEISURE (games/SOG) is hidden from the home & drawer AND paused at launch.
// The whole state is one timestamp: active while now < PREF_SCHOOL_MODE_UNTIL.

@file:Suppress("MagicNumber") // minute→ms

package org.fossify.home.helpers

import android.content.Context

object SchoolMode {

    /** "Until I end it" sentinel. */
    const val INDEFINITE = Long.MAX_VALUE

    fun activeUntil(context: Context): Long =
        prefs(context).getLong(LaunchpadPrefs.PREF_SCHOOL_MODE_UNTIL, 0L)

    fun isActive(context: Context): Boolean = System.currentTimeMillis() < activeUntil(context)

    fun remainingMillis(context: Context): Long =
        (activeUntil(context) - System.currentTimeMillis()).coerceAtLeast(0L)

    fun startForMinutes(context: Context, minutes: Int) =
        setUntil(context, System.currentTimeMillis() + minutes * 60_000L)

    fun startUntil(context: Context, epochMs: Long) = setUntil(context, epochMs)

    fun startIndefinite(context: Context) = setUntil(context, INDEFINITE)

    fun stop(context: Context) = setUntil(context, 0L)

    private fun setUntil(context: Context, until: Long) {
        prefs(context).edit().putLong(LaunchpadPrefs.PREF_SCHOOL_MODE_UNTIL, until).apply()
    }

    /** Pure: which apps school mode hides/pauses. Only ACTIVE_LEISURE; everything else stays. */
    fun blocksCategory(active: Boolean, category: String?): Boolean =
        active && category == LaunchpadConstants.CATEGORY_ACTIVE_LEISURE

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
