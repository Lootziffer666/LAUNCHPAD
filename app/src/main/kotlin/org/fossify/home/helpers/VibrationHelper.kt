// File: app/src/main/kotlin/org/fossify/home/helpers/VibrationHelper.kt
// LAUNCHPAD: optional haptic reinforcement for time-limit warnings. Parent-configurable
// (on/off + strength = buzz length) under Eltern-Modus → Hinweise & Vibration.

@file:Suppress("MagicNumber", "TooGenericExceptionCaught", "DEPRECATION")

package org.fossify.home.helpers

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

object VibrationHelper {
    private const val TAG = "VibrationHelper"

    /** Buzz iff the parent enabled vibration; length is the configured "strength" in ms. */
    fun buzz(context: Context) {
        val prefs = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        if (!prefs.getBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED, false)) return
        val ms = prefs.getInt(LaunchpadPrefs.PREF_VIBRATION_MS, LaunchpadConstants.DEFAULT_VIBRATION_MS)
            .toLong().coerceIn(50L, 1_000L)
        try {
            val vibrator = vibrator(context) ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                vibrator.vibrate(ms)
            }
        } catch (e: Exception) {
            Log.w(TAG, "vibrate failed", e)
        }
    }

    private fun vibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val mgr = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            mgr?.defaultVibrator
        } else {
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }
}
