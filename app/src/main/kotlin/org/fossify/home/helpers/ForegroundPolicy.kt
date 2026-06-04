// File: app/src/main/kotlin/org/fossify/home/helpers/ForegroundPolicy.kt
// Decision logic for the strict foreground block (TimeTrackingService). Kept split into a pure,
// unit-testable [shouldBlock] and an impure [essentialPackages] resolver (needs Context).
//
// SAFETY: the dialer/phone/system/settings/IME packages are always treated as essential so the
// strict block can never trap the device or stop an emergency call. Still opt-in + device-test.

package org.fossify.home.helpers

import android.content.Context
import android.provider.Settings
import android.telecom.TelecomManager

object ForegroundPolicy {

    /**
     * True if [foregroundPkg] should be blocked under the strict foreground policy.
     * Never blocks the launcher itself, essential packages, or whitelisted apps.
     */
    fun shouldBlock(
        foregroundPkg: String,
        ownPackage: String,
        isWhitelisted: Boolean,
        essentialPackages: Set<String>
    ): Boolean {
        if (foregroundPkg.isBlank()) return false
        if (foregroundPkg == ownPackage) return false
        if (foregroundPkg in essentialPackages) return false
        return !isWhitelisted
    }

    /** Packages that must never be blocked: telephony/emergency, system UI, settings, IME. */
    fun essentialPackages(context: Context): Set<String> {
        val set = STATIC_ESSENTIALS.toMutableSet()
        // The *actual* default dialer (covers OEM dialers we don't hard-code) — emergency calls.
        runCatching {
            val tm = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            tm?.defaultDialerPackage?.takeIf { it.isNotBlank() }?.let { set.add(it) }
        }
        // The active keyboard, so text entry (e.g. in the dialer) keeps working.
        runCatching {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
                ?.substringBefore("/")
                ?.takeIf { it.isNotBlank() }
                ?.let { set.add(it) }
        }
        return set
    }

    private val STATIC_ESSENTIALS = setOf(
        "com.android.systemui",
        "com.android.settings",
        "com.android.phone",
        "com.android.server.telecom",
        "com.android.emergency",
        "com.android.dialer",
        "com.google.android.dialer",
        "com.samsung.android.dialer",
        "com.google.android.permissioncontroller",
        "com.android.permissioncontroller",
        "com.android.packageinstaller",
        "com.google.android.packageinstaller"
    )
}
