// File: app/src/main/kotlin/org/fossify/home/helpers/SchoolMode.kt
// LAUNCHPAD: one-tap "Schulmodus". When active, ACTIVE_LEISURE (games/SOG) apps are paused while
// learning, communication and calm apps stay open. Independent of the time budget and the
// Wochenplan — a parent flips it on for school hours and off afterwards (from Eltern-Modus or the
// companion). blocksCategory is pure so it is unit-testable.

package org.fossify.home.helpers

import android.content.Context

object SchoolMode {

    fun isActive(context: Context): Boolean =
        prefs(context).getBoolean(LaunchpadPrefs.PREF_SCHOOL_MODE, false)

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(LaunchpadPrefs.PREF_SCHOOL_MODE, enabled).apply()
    }

    /** Pure: which apps school mode pauses. Only ACTIVE_LEISURE; everything else stays open. */
    fun blocksCategory(active: Boolean, category: String?): Boolean =
        active && category == LaunchpadConstants.CATEGORY_ACTIVE_LEISURE

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
