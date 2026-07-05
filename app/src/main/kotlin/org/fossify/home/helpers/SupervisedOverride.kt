// File: app/src/main/kotlin/org/fossify/home/helpers/SupervisedOverride.kt
// LAUNCHPAD "Papa-Modus" — a supervised, time-boxed override of the rules.
//
// WHY: the father supervises the child in person and values supervised use over strict
// PIN-gating. A physical NFC tag (or the same token as a QR code) at his place lets the child
// lift the launcher's rules *while there*. It is deliberately kept OUT of the Krypto-Cash ledger
// and the shared audit/report/companion-sync: during an active override apps launch without
// draining the time budget and nothing is written to the mother-visible history (see LaunchGate
// and TimeTrackingService, which both short-circuit while isActive()).
//
// SECURITY MODEL (honest scope): the token is HMAC-SHA256 signed with a secret that only the
// launcher and the father's tag/QR know, so the child cannot self-issue a grant, and every scan
// is time-boxed. It is NOT hardened against a determined attacker who clones the physical tag —
// that is out of scope and contrary to the "supervised, not fortress" intent. State is one
// timestamp: active while now < PREF_OVERRIDE_UNTIL (mirrors SchoolMode).

@file:Suppress("MagicNumber", "TooManyFunctions") // ms/minute math, key sizes; cohesive helper

package org.fossify.home.helpers

import android.content.Context
import android.net.Uri
import android.net.wifi.WifiManager
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object SupervisedOverride {

    private const val SECRET_BYTES = 32 // HMAC-SHA256 key
    private const val NONCE_BYTES = 8
    private const val HMAC_ALGO = "HmacSHA256"
    private const val TOKEN_SEPARATOR = "."
    private const val QUERY_PARAM = "t"

    // ── Pure logic (no Android deps → unit-tested in SupervisedOverrideTest) ──────────────

    /** Lowercase-hex HMAC-SHA256 of [message] under [secretHex]. */
    fun sign(secretHex: String, message: String): String {
        val mac = Mac.getInstance(HMAC_ALGO)
        mac.init(SecretKeySpec(hexToBytes(secretHex), HMAC_ALGO))
        return mac.doFinal(message.toByteArray(Charsets.UTF_8)).toHex()
    }

    /**
     * Build a signed grant token: "LPO1.<expiryEpochMs>.<nonce>.<hmacHex>". A single valid scan
     * grants an override until min(expiry, now + window). For a static tag the parent writes once,
     * set [expiryMs] far in the future; for a rotating QR set it a few minutes out.
     */
    fun buildToken(secretHex: String, expiryMs: Long, nonce: String): String {
        val body = "${LaunchpadConstants.OVERRIDE_TOKEN_VERSION}$TOKEN_SEPARATOR$expiryMs" +
            "$TOKEN_SEPARATOR$nonce"
        return "$body$TOKEN_SEPARATOR${sign(secretHex, body)}"
    }

    /**
     * Verify [token] against [secretHex] at [nowMs]. Returns the token's expiry epoch-ms when the
     * signature is valid AND the token has not expired; otherwise null. Constant-time comparison.
     */
    fun verifyToken(secretHex: String, token: String, nowMs: Long): Long? {
        val parts = token.trim().split(TOKEN_SEPARATOR)
        if (parts.size != 4) return null
        val (version, expiryStr, nonce, sig) = parts
        if (version != LaunchpadConstants.OVERRIDE_TOKEN_VERSION) return null
        val expiry = expiryStr.toLongOrNull() ?: return null
        val body = "$version$TOKEN_SEPARATOR$expiryStr$TOKEN_SEPARATOR$nonce"
        if (!constantTimeEquals(sig, sign(secretHex, body))) return null
        if (nowMs >= expiry) return null
        return expiry
    }

    /** Window a single scan grants: never past the token's own expiry. */
    fun grantedUntil(tokenExpiry: Long, nowMs: Long, windowMinutes: Int): Long =
        minOf(tokenExpiry, nowMs + windowMinutes * 60_000L)

    /** Extract the token from a launchpad://papa?t=… deep link / NDEF URI, or null. */
    fun tokenFromUriString(uriString: String?): String? {
        if (uriString.isNullOrBlank()) return null
        return try {
            Uri.parse(uriString).getQueryParameter(QUERY_PARAM)?.takeIf { it.isNotBlank() }
        } catch (e: RuntimeException) {
            android.util.Log.w("LAUNCHPAD", "Bad override URI", e)
            null
        }
    }

    fun deepLink(token: String): String =
        "${LaunchpadConstants.OVERRIDE_URI_SCHEME}://${LaunchpadConstants.OVERRIDE_URI_HOST}" +
            "?$QUERY_PARAM=$token"

    // ── Android state (mirrors SchoolMode: one timestamp) ────────────────────────────────

    fun activeUntil(context: Context): Long =
        prefs(context).getLong(LaunchpadPrefs.PREF_OVERRIDE_UNTIL, 0L)

    /**
     * Active = within the granted window AND (if the geofence is on) still on an allowed home
     * WiFi. The WiFi term is evaluated live, so leaving the network re-gates the rules on the
     * next check without waiting for the window to expire.
     */
    fun isActive(context: Context): Boolean =
        System.currentTimeMillis() < activeUntil(context) && isOnAllowedWifi(context)

    /** True while a window is set, ignoring the geofence — used to detect "left the WiFi". */
    private fun windowOpen(context: Context): Boolean =
        System.currentTimeMillis() < activeUntil(context)

    fun remainingMillis(context: Context): Long =
        (activeUntil(context) - System.currentTimeMillis()).coerceAtLeast(0L)

    fun lastUsed(context: Context): Long =
        prefs(context).getLong(LaunchpadPrefs.PREF_OVERRIDE_LAST_USED, 0L)

    fun windowMinutes(context: Context): Int =
        prefs(context).getInt(
            LaunchpadPrefs.PREF_OVERRIDE_WINDOW_MIN,
            LaunchpadConstants.DEFAULT_OVERRIDE_WINDOW_MINUTES
        )

    fun setWindowMinutes(context: Context, minutes: Int) =
        prefs(context).edit()
            .putInt(LaunchpadPrefs.PREF_OVERRIDE_WINDOW_MIN, minutes.coerceIn(5, 12 * 60))
            .apply()

    /** End the supervised session immediately. */
    fun stop(context: Context) =
        prefs(context).edit().putLong(LaunchpadPrefs.PREF_OVERRIDE_UNTIL, 0L).apply()

    // ── WiFi geofence ────────────────────────────────────────────────────────────────────

    fun requireWifi(context: Context): Boolean =
        prefs(context).getBoolean(LaunchpadPrefs.PREF_OVERRIDE_REQUIRE_WIFI, false)

    fun setRequireWifi(context: Context, required: Boolean) =
        prefs(context).edit().putBoolean(LaunchpadPrefs.PREF_OVERRIDE_REQUIRE_WIFI, required).apply()

    fun allowedSsids(context: Context): Set<String> =
        prefs(context).getStringSet(LaunchpadPrefs.PREF_OVERRIDE_WIFI_SSIDS, emptySet()) ?: emptySet()

    fun clearAllowedSsids(context: Context) =
        prefs(context).edit().remove(LaunchpadPrefs.PREF_OVERRIDE_WIFI_SSIDS).apply()

    /** Read the currently-connected WiFi SSID, or null if unavailable (needs location perm + on). */
    fun currentSsid(context: Context): String? {
        return try {
            val wm = context.applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? WifiManager ?: return null
            @Suppress("DEPRECATION") // connectionInfo works on all supported API levels
            val raw = wm.connectionInfo?.ssid ?: return null
            val ssid = raw.trim('"')
            if (ssid.isBlank() || ssid.equals("<unknown ssid>", ignoreCase = true) || ssid == "0x") {
                null
            } else {
                ssid
            }
        } catch (e: Exception) {
            android.util.Log.w("LAUNCHPAD", "SSID read failed", e)
            null
        }
    }

    /** Add the current network to the allow-list. Returns the SSID, or null if it couldn't be read. */
    fun rememberCurrentWifi(context: Context): String? {
        val ssid = currentSsid(context) ?: return null
        val next = allowedSsids(context).toMutableSet().apply { add(ssid) }
        prefs(context).edit().putStringSet(LaunchpadPrefs.PREF_OVERRIDE_WIFI_SSIDS, next).apply()
        return ssid
    }

    /**
     * Geofence gate. When the geofence is off → always true. When on → require a saved SSID list
     * and a current connection to one of them (fail-closed: no saved net, or SSID unreadable, or
     * on a foreign net → false).
     */
    fun isOnAllowedWifi(context: Context): Boolean {
        if (!requireWifi(context)) return true
        val allowed = allowedSsids(context)
        if (allowed.isEmpty()) return false
        val ssid = currentSsid(context) ?: return false
        return ssid in allowed
    }

    /**
     * Hard-end an in-progress session the moment the device leaves the allowed WiFi, so it can't
     * silently resume if they wander back within the window. Call from the tracking tick.
     */
    fun enforceGeofence(context: Context) {
        if (windowOpen(context) && requireWifi(context) && !isOnAllowedWifi(context)) {
            stop(context)
        }
    }

    /**
     * The launcher's HMAC secret (hex). Created on first use. A tag/QR only works if it was signed
     * with this exact secret, so re-issuing it (rotateSecret) invalidates every old tag/QR.
     */
    fun getOrCreateSecretHex(context: Context): String {
        val existing = prefs(context).getString(LaunchpadPrefs.PREF_OVERRIDE_SECRET_HEX, null)
        if (!existing.isNullOrBlank()) return existing
        val secret = ByteArray(SECRET_BYTES).also { SecureRandom().nextBytes(it) }.toHex()
        prefs(context).edit().putString(LaunchpadPrefs.PREF_OVERRIDE_SECRET_HEX, secret).apply()
        return secret
    }

    fun rotateSecret(context: Context): String {
        val secret = ByteArray(SECRET_BYTES).also { SecureRandom().nextBytes(it) }.toHex()
        prefs(context).edit().putString(LaunchpadPrefs.PREF_OVERRIDE_SECRET_HEX, secret).apply()
        return secret
    }

    fun hasSecret(context: Context): Boolean =
        !prefs(context).getString(LaunchpadPrefs.PREF_OVERRIDE_SECRET_HEX, null).isNullOrBlank()

    private fun secretHexOrNull(context: Context): String? =
        prefs(context).getString(LaunchpadPrefs.PREF_OVERRIDE_SECRET_HEX, null)?.takeIf { it.isNotBlank() }

    /** Random nonce for a freshly minted token. */
    fun newNonce(): String = ByteArray(NONCE_BYTES).also { SecureRandom().nextBytes(it) }.toHex()

    /**
     * Mint a token (and its deep link) for the parent to write to an NFC tag or render as a QR.
     * [validForMinutes] is the token's hard expiry; use a large value for a permanent tag or a
     * small one for a rotating QR. The per-scan window is a separate launcher setting.
     */
    data class Grant(val token: String, val deepLink: String, val expiryMs: Long)

    fun mintGrant(context: Context, validForMinutes: Long): Grant {
        val secret = getOrCreateSecretHex(context)
        val expiry = System.currentTimeMillis() + validForMinutes * 60_000L
        val token = buildToken(secret, expiry, newNonce())
        return Grant(token, deepLink(token), expiry)
    }

    /**
     * Verify a scanned/tapped [token] and, if valid, start (or extend) the override window. Returns
     * the epoch-ms the override now runs until, or null if the token was invalid/expired. Records a
     * local-only "last used" timestamp — never touches the ledger or the shared audit.
     */
    fun redeemToken(context: Context, token: String): Long? {
        // If Papa-Modus was never set up there is no secret — reject rather than silently minting
        // one (so a stray launchpad://papa scan can't seed a secret on an unconfigured device).
        val secret = secretHexOrNull(context) ?: return null
        val now = System.currentTimeMillis()
        val expiry = verifyToken(secret, token, now) ?: return null
        val until = maxOf(activeUntil(context), grantedUntil(expiry, now, windowMinutes(context)))
        prefs(context).edit()
            .putLong(LaunchpadPrefs.PREF_OVERRIDE_UNTIL, until)
            .putLong(LaunchpadPrefs.PREF_OVERRIDE_LAST_USED, now)
            .apply()
        return until
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

    // ── hex + constant-time helpers ──────────────────────────────────────────────────────

    private fun ByteArray.toHex(): String = joinToString("") { "%02x".format(it) }

    private fun hexToBytes(hex: String): ByteArray {
        val clean = if (hex.length % 2 == 0) hex else "0$hex"
        return ByteArray(clean.length / 2) {
            clean.substring(it * 2, it * 2 + 2).toInt(16).toByte()
        }
    }

    /** Length-and-content constant-time string compare (avoids early-exit timing leaks). */
    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        var diff = 0
        for (i in a.indices) diff = diff or (a[i].code xor b[i].code)
        return diff == 0
    }
}
