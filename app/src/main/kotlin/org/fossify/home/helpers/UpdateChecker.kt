// File: app/src/main/kotlin/org/fossify/home/helpers/UpdateChecker.kt
// LAUNCHPAD auto-update: the parent pushes a GitHub Release (CI already builds & names the APK
// "launcher-<versionCode>…apk"), and the child's phone picks it up. A daily background check posts
// a notification when a newer versionCode is available; the parent then installs it from
// UpdateActivity. On a device-owner device the install is silent; otherwise the system shows the
// normal install confirmation.
//
// The JSON parsing + version comparison are pure (unit-tested in UpdateCheckerTest); the network
// and install steps are thin Android wrappers around them.

@file:Suppress("MagicNumber", "TooGenericExceptionCaught", "TooManyFunctions") // timeouts/sizes; fail-safe catches; cohesive helper

package org.fossify.home.helpers

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import org.fossify.home.BuildConfig
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

object UpdateChecker {

    private const val TAG = "UpdateChecker"
    private const val CONNECT_TIMEOUT_MS = 15_000
    private const val READ_TIMEOUT_MS = 20_000

    data class Release(
        val versionCode: Int,
        val versionName: String,
        val apkUrl: String?,
        val notes: String
    ) {
        val installable: Boolean get() = versionCode > 0 && !apkUrl.isNullOrBlank()
    }

    // ── Pure logic (unit-tested) ─────────────────────────────────────────────────────────

    /** versionCode embedded in a CI asset name, e.g. "launcher-17-foss-release.apk" → 17. */
    fun versionCodeFromAssetName(name: String): Int? =
        Regex("""launcher-(\d+)""").find(name)?.groupValues?.get(1)?.toIntOrNull()

    /** Fallback: "versionCode: 17" anywhere in the release notes. */
    fun versionCodeFromNotes(notes: String): Int? =
        Regex("""versionCode[:\s]+(\d+)""", RegexOption.IGNORE_CASE)
            .find(notes)?.groupValues?.get(1)?.toIntOrNull()

    fun isNewer(currentCode: Int, remoteCode: Int): Boolean = remoteCode > currentCode

    /** Parse a GitHub /releases/latest response. Returns null only if the JSON is unusable. */
    fun parseLatestRelease(json: String): Release? {
        return try {
            val o = JSONObject(json)
            val versionName = o.optString("name").ifBlank { o.optString("tag_name") }
            val notes = o.optString("body")
            val assets = o.optJSONArray("assets")
            var apkUrl: String? = null
            var code = 0
            if (assets != null) {
                for (i in 0 until assets.length()) {
                    val asset = assets.optJSONObject(i) ?: continue
                    val name = asset.optString("name")
                    if (!name.endsWith(".apk", ignoreCase = true)) continue
                    val c = versionCodeFromAssetName(name) ?: continue
                    if (c > code) {
                        code = c
                        apkUrl = asset.optString("browser_download_url").takeIf { it.isNotBlank() }
                    }
                }
            }
            if (code == 0) code = versionCodeFromNotes(notes) ?: 0
            Release(versionCode = code, versionName = versionName, apkUrl = apkUrl, notes = notes)
        } catch (e: JSONException) {
            android.util.Log.w(TAG, "release JSON parse failed", e)
            null
        }
    }

    // ── Android: config + state ──────────────────────────────────────────────────────────

    fun currentVersionCode(): Int = BuildConfig.VERSION_CODE

    fun feedUrl(context: Context): String =
        prefs(context).getString(LaunchpadPrefs.PREF_UPDATE_FEED_URL, null)
            ?.takeIf { it.isNotBlank() }
            ?: LaunchpadConstants.DEFAULT_UPDATE_FEED_URL

    fun setFeedUrl(context: Context, url: String) =
        prefs(context).edit().putString(LaunchpadPrefs.PREF_UPDATE_FEED_URL, url.trim()).apply()

    fun isAutoCheckEnabled(context: Context): Boolean =
        prefs(context).getBoolean(LaunchpadPrefs.PREF_UPDATE_AUTO_CHECK, true)

    fun setAutoCheckEnabled(context: Context, enabled: Boolean) =
        prefs(context).edit().putBoolean(LaunchpadPrefs.PREF_UPDATE_AUTO_CHECK, enabled).apply()

    fun isDueForAutoCheck(context: Context, now: Long = System.currentTimeMillis()): Boolean {
        val last = prefs(context).getLong(LaunchpadPrefs.PREF_UPDATE_LAST_CHECK, 0L)
        return now - last >= LaunchpadConstants.UPDATE_CHECK_INTERVAL_MS
    }

    private fun recordCheck(context: Context) =
        prefs(context).edit()
            .putLong(LaunchpadPrefs.PREF_UPDATE_LAST_CHECK, System.currentTimeMillis()).apply()

    // ── Android: network + install ───────────────────────────────────────────────────────

    /** Blocking network call — must run off the main thread. Returns the latest release or null. */
    fun fetchLatest(context: Context): Release? {
        val body = httpGet(feedUrl(context)) ?: return null
        return parseLatestRelease(body)
    }

    /**
     * Fire-and-forget daily check (call from MainActivity). Runs on its own thread, respects the
     * auto-check toggle + throttle, and posts a notification when a newer version is available.
     */
    fun maybeAutoCheck(context: Context) {
        if (!isAutoCheckEnabled(context)) return
        if (!isDueForAutoCheck(context)) return
        Thread {
            try {
                recordCheck(context)
                val release = fetchLatest(context) ?: return@Thread
                if (release.installable && isNewer(currentVersionCode(), release.versionCode)) {
                    NotificationHelper.notifyUpdateAvailable(context, release.versionName)
                }
            } catch (e: Exception) {
                android.util.Log.w(TAG, "auto update check failed", e)
            }
        }.apply { isDaemon = true }.start()
    }

    /** Download [release]'s APK into cacheDir/updates. Blocking — off the main thread. */
    fun downloadApk(context: Context, release: Release): File? {
        val url = release.apkUrl ?: return null
        val dir = File(context.cacheDir, "updates").apply { mkdirs() }
        // Clean stale downloads so the cache doesn't grow unbounded.
        dir.listFiles()?.forEach { it.delete() }
        val target = File(dir, "launchpad-${release.versionCode}.apk")
        return try {
            val conn = openConnection(url).apply {
                requestMethod = "GET"
                setRequestProperty("User-Agent", "LAUNCHPAD-Updater")
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
            }
            if (conn.responseCode !in 200..299) {
                android.util.Log.w(TAG, "APK download HTTP ${conn.responseCode}")
                return null
            }
            conn.inputStream.use { input ->
                target.outputStream().use { output -> input.copyTo(output) }
            }
            // A truncated/HTML response isn't a valid package; guard against installing garbage.
            if (target.length() < 1_000L) {
                android.util.Log.w(TAG, "downloaded APK implausibly small (${target.length()} B)")
                target.delete()
                return null
            }
            target
        } catch (e: Exception) {
            android.util.Log.w(TAG, "APK download failed", e)
            target.delete()
            null
        }
    }

    /** True if we're allowed to install APKs (device owner is always allowed). */
    fun canInstall(context: Context): Boolean {
        if (KioskManager.isDeviceOwner(context)) return true
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.packageManager.canRequestPackageInstalls()
        } else {
            true
        }
    }

    /** Send the user to the "install unknown apps" settings for this app. */
    fun openInstallPermissionSettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                context.startActivity(
                    Intent(
                        android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:${context.packageName}")
                    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            } catch (e: Exception) {
                android.util.Log.w(TAG, "cannot open install-sources settings", e)
            }
        }
    }

    /**
     * Install [apk]. Device owner → silent via PackageInstaller; otherwise the system install
     * confirmation via a FileProvider content URI. Returns false if it couldn't even start.
     */
    fun installApk(context: Context, apk: File): Boolean {
        return if (KioskManager.isDeviceOwner(context)) {
            installSilently(context, apk)
        } else {
            installWithPrompt(context, apk)
        }
    }

    private fun installWithPrompt(context: Context, apk: File): Boolean {
        return try {
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apk)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            android.util.Log.w(TAG, "install intent failed", e)
            false
        }
    }

    private fun installSilently(context: Context, apk: File): Boolean {
        return try {
            val installer = context.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(
                PackageInstaller.SessionParams.MODE_FULL_INSTALL
            )
            val sessionId = installer.createSession(params)
            installer.openSession(sessionId).use { session ->
                apk.inputStream().use { input ->
                    session.openWrite("launchpad.apk", 0, apk.length()).use { output ->
                        input.copyTo(output)
                        session.fsync(output)
                    }
                }
                val intent = Intent(context, org.fossify.home.activities.UpdateActivity::class.java)
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or
                        android.app.PendingIntent.FLAG_MUTABLE
                } else {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT
                }
                val pi = android.app.PendingIntent.getActivity(context, sessionId, intent, flags)
                session.commit(pi.intentSender)
            }
            true
        } catch (e: Exception) {
            android.util.Log.w(TAG, "silent install failed; falling back to prompt", e)
            installWithPrompt(context, apk)
        }
    }

    private fun httpGet(urlString: String): String? {
        return try {
            val conn = openConnection(urlString).apply {
                requestMethod = "GET"
                setRequestProperty("Accept", "application/vnd.github+json")
                setRequestProperty("User-Agent", "LAUNCHPAD-Updater")
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
            }
            val code = conn.responseCode
            if (code !in 200..299) {
                android.util.Log.w(TAG, "feed HTTP $code")
                return null
            }
            conn.inputStream.bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            android.util.Log.w(TAG, "feed fetch failed", e)
            null
        }
    }

    private fun openConnection(urlString: String): HttpURLConnection {
        val conn = URL(urlString).openConnection() as HttpURLConnection
        conn.instanceFollowRedirects = true
        return conn
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
}
