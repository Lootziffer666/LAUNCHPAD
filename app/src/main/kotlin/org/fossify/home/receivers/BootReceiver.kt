// File: app/src/main/kotlin/org/fossify/home/receivers/BootReceiver.kt
// Restores TimeTrackingService after device reboot, only when Kindermodus is active.
// ACTION_BOOT_COMPLETED is explicitly exempt from Android 12+ background-start restrictions.

package org.fossify.home.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.services.TimeTrackingStartup

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        val prefs = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        if (!prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)) return
        Log.i("BootReceiver", "Boot completed — restarting time tracking")
        TimeTrackingStartup().initializeTimeTracking(context)
    }
}
