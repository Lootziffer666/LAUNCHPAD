// File: app/src/main/kotlin/org/fossify/home/helpers/TamperMonitor.kt
// Android-side tamper recording + protective lockdown. Writes AuditEvents and toggles the
// lockdown flag that LaunchGate reads to pause coin-gated apps until a parent reviews.

@file:Suppress("MagicNumber")

package org.fossify.home.helpers

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.AuditEvent

object TamperMonitor {
    private const val TAG = "TamperMonitor"

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

    /** Record an audit event. Safe to call from any thread (uses runBlocking on IO). */
    fun record(context: Context, type: String, severity: String, message: String) {
        Log.i(TAG, "[$severity] $type — $message")
        runBlocking {
            withContext(Dispatchers.IO) {
                AppsDatabase.getInstance(context).auditEventDao().insert(
                    AuditEvent(type = type, severity = severity, message = message)
                )
            }
        }
    }

    suspend fun recordSuspend(context: Context, type: String, severity: String, message: String) {
        Log.i(TAG, "[$severity] $type — $message")
        withContext(Dispatchers.IO) {
            AppsDatabase.getInstance(context).auditEventDao().insert(
                AuditEvent(type = type, severity = severity, message = message)
            )
        }
    }

    /** True while protective lockdown is active (coin-gated apps paused). */
    fun isLockdownActive(context: Context): Boolean =
        prefs(context).getBoolean(LaunchpadPrefs.PREF_TAMPER_LOCKDOWN, false)

    /** Enter protective lockdown and record why. No-op (no duplicate event) if already locked. */
    fun triggerLockdown(context: Context, type: String, message: String) {
        if (isLockdownActive(context)) return
        prefs(context).edit().putBoolean(LaunchpadPrefs.PREF_TAMPER_LOCKDOWN, true).apply()
        record(context, type, LaunchpadConstants.SEVERITY_CRITICAL, message)
    }

    /** Parent clears lockdown (after reviewing/repairing). Acknowledges open events too. */
    fun clearLockdown(context: Context) {
        prefs(context).edit().putBoolean(LaunchpadPrefs.PREF_TAMPER_LOCKDOWN, false).apply()
        runBlocking {
            withContext(Dispatchers.IO) {
                val dao = AppsDatabase.getInstance(context).auditEventDao()
                dao.acknowledgeAll()
                dao.insert(
                    AuditEvent(
                        type = LaunchpadConstants.AUDIT_LOCKDOWN_CLEARED,
                        severity = LaunchpadConstants.SEVERITY_INFO,
                        message = "Schutzmodus von Eltern aufgehoben"
                    )
                )
            }
        }
    }
}
