// File: app/src/main/kotlin/org/fossify/home/helpers/ChildProfile.kt
// The child's display name, configurable instead of the hard-coded "Jake". Foundation for
// multi-child support. The genitive helper is pure so it can be unit-tested.

package org.fossify.home.helpers

import android.content.Context

object ChildProfile {
    const val DEFAULT_NAME = "Jake"

    fun name(context: Context): String =
        prefs(context).getString(LaunchpadPrefs.PREF_CHILD_NAME, DEFAULT_NAME)
            ?.trim()?.takeIf { it.isNotEmpty() } ?: DEFAULT_NAME

    fun setName(context: Context, name: String) {
        prefs(context).edit()
            .putString(LaunchpadPrefs.PREF_CHILD_NAME, name.trim().ifEmpty { DEFAULT_NAME })
            .apply()
    }

    /** German genitive: "Jake" → "Jakes", but sibilant endings (s/ß/x/z) take an apostrophe. */
    fun possessive(name: String): String {
        if (name.isEmpty()) return name
        val last = name.last().lowercaseChar()
        return if (last == 's' || last == 'ß' || last == 'x' || last == 'z') "$name'" else "${name}s"
    }

    /** Convenience: possessive of the configured name (e.g. "Jakes"). */
    fun possessiveName(context: Context): String = possessive(name(context))

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
