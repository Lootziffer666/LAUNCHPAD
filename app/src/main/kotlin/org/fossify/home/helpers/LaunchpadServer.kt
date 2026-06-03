// File: app/src/main/kotlin/org/fossify/home/helpers/LaunchpadServer.kt
// LAUNCHPAD M4: Minimal HTTP server that the parent companion app calls over LAN.
// Runs on port 7391. No external deps — pure Java ServerSocket.
//
// Endpoints:
//   GET  /api/status     → {balance, enforcement, cooldown}
//   GET  /api/pending    → {doge:[...], zusagen:[...]}
//   POST /api/command    → apply CommandProcessor; returns {ok, message}

// HTTP status codes + broad intentional fail-safe catches.
@file:Suppress(
    "MagicNumber", "CyclomaticComplexMethod", "NestedBlockDepth",
    "TooGenericExceptionCaught", "TooManyFunctions", "LongMethod"
)

package org.fossify.home.helpers

import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.fossify.home.databases.AllowedApp
import org.fossify.home.databases.AppTimeLimit
import org.fossify.home.databases.AppsDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.net.ServerSocket
import java.net.Socket

object LaunchpadServer {
    private const val TAG = "LaunchpadServer"
    const val PORT = 7391

    @Volatile private var running = false
    private var serverSocket: ServerSocket? = null

    @Volatile var testQrPayload: String? = null
    @Volatile var testSessionKey: String? = null

    fun start(context: Context) {
        if (running) return
        running = true
        Thread {
            try {
                serverSocket = ServerSocket(PORT)
                Log.i(TAG, "Listening on :$PORT")
                while (running) {
                    val client = serverSocket?.accept() ?: break
                    CoroutineScope(Dispatchers.IO).launch { handle(context.applicationContext, client) }
                }
            } catch (e: Exception) {
                if (running) Log.e(TAG, "Server error", e)
            }
        }.also { it.isDaemon = true; it.start() }
    }

    fun stop() {
        running = false
        try { serverSocket?.close() } catch (_: Exception) {}
    }

    private suspend fun handle(context: Context, client: Socket) {
        try {
            client.use {
                val reader = BufferedReader(InputStreamReader(it.getInputStream()))
                val writer = PrintWriter(it.getOutputStream(), true)

                // Read request line + headers
                val requestLine = reader.readLine() ?: return
                val parts = requestLine.split(" ")
                if (parts.size < 2) return
                val method = parts[0]
                val path = parts[1].substringBefore("?")

                var contentLength = 0
                var line = reader.readLine()
                while (!line.isNullOrBlank()) {
                    if (line.startsWith("Content-Length:", ignoreCase = true)) {
                        contentLength = line.substringAfter(":").trim().toIntOrNull() ?: 0
                    }
                    line = reader.readLine()
                }
                val body = if (contentLength > 0) {
                    val buf = CharArray(contentLength)
                    reader.read(buf, 0, contentLength)
                    String(buf)
                } else ""

                val (status, responseBody) = when {
                    method == "GET" && path == "/api/status" -> handleStatus(context)
                    method == "GET" && path == "/api/pending" -> handlePending(context)
                    method == "POST" && path == "/api/command" -> handleCommand(context, body)
                    method == "GET" && path == "/api/apps" -> handleGetApps(context)
                    method == "POST" && path == "/api/apps/remove" -> handleRemoveApp(context, body)
                    method == "POST" && path == "/api/apps/toggle" -> handleToggleApp(context, body)
                    method == "GET" && path == "/api/limits" -> handleGetLimits(context)
                    method == "POST" && path == "/api/limits" -> handleSetLimit(context, body)
                    method == "POST" && path == "/api/limits/remove" -> handleRemoveLimit(context, body)
                    method == "GET" && path == "/api/export" -> handleExport(context)
                    method == "POST" && path == "/api/import" -> handleImport(context, body)
                    path == "/api/ip" -> 200 to """{"ip":"${getLocalIp()}","port":$PORT}"""
                    method == "GET" && path == "/api/test-pair" -> {
                        val p = testQrPayload
                        if (p != null) 200 to p else 404 to """{"error":"no test payload"}"""
                    }
                    method == "POST" && path == "/api/test-pair" -> {
                        testSessionKey = body
                        // Complete pairing immediately so it does not depend on a UI poll window.
                        val ok = PairingManager(context).receiveSessionKey(body)
                        if (ok) 200 to """{"ok":true}""" else 400 to """{"error":"decrypt failed"}"""
                    }
                    else -> 404 to """{"error":"not found"}"""
                }

                writer.println("HTTP/1.1 $status OK")
                writer.println("Content-Type: application/json")
                writer.println("Access-Control-Allow-Origin: *")
                writer.println("Connection: close")
                writer.println()
                writer.print(responseBody)
                writer.flush()
            }
        } catch (e: Exception) {
            Log.w(TAG, "handle error", e)
        }
    }

    private suspend fun handleStatus(context: Context): Pair<Int, String> {
        val db = AppsDatabase.getInstance(context)
        val balance = db.cryptoCashDao().getCurrentBalance()
        val prefs = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val enforcement = prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
        val cooldown = System.currentTimeMillis() < prefs.getLong(LaunchpadPrefs.PREF_COOLDOWN_UNTIL, 0L)
        return 200 to JSONObject().apply {
            put("balance", balance)
            put("enforcement", enforcement)
            put("cooldown", cooldown)
        }.toString()
    }

    private suspend fun handlePending(context: Context): Pair<Int, String> {
        val db = AppsDatabase.getInstance(context)
        val dogeRequests = db.dogeRequestDao().getPending()
        val zusagen = db.zusageDao().getZusagenByStatus("ACTIVE")
            .filter { it.decidedAt == null }

        val dogeArr = JSONArray()
        dogeRequests.forEach { r ->
            dogeArr.put(JSONObject().apply {
                put("id", r.id)
                put("description", r.contentDescription)
                put("requestedAt", r.requestedAt)
            })
        }

        val zusageArr = JSONArray()
        zusagen.forEach { z ->
            zusageArr.put(JSONObject().apply {
                put("id", z.id)
                put("text", z.text)
                put("createdAt", z.createdAt)
            })
        }

        return 200 to JSONObject().apply {
            put("doge", dogeArr)
            put("zusagen", zusageArr)
        }.toString()
    }

    private suspend fun handleCommand(context: Context, body: String): Pair<Int, String> {
        val result = CommandProcessor(context, AppsDatabase.getInstance(context)).apply(body)
        return 200 to JSONObject().apply {
            put("ok", result.ok)
            put("message", result.message)
        }.toString()
    }

    private suspend fun handleGetApps(context: Context): Pair<Int, String> {
        val db = AppsDatabase.getInstance(context)
        val pm = context.packageManager
        val apps = db.allowedAppDao().getAll().sortedByDescending { it.addedAt }
        val limits = db.appTimeLimitDao().getAll().associateBy { it.packageName }

        val arr = JSONArray()
        apps.forEach { app ->
            val displayName = try {
                pm.getApplicationLabel(pm.getApplicationInfo(app.packageName, 0)).toString()
            } catch (e: Exception) {
                Log.w(TAG, "Label not found for ${app.packageName}", e)
                app.packageName
            }
            arr.put(JSONObject().apply {
                put("packageName", app.packageName)
                put("displayName", displayName)
                put("category", app.category)
                put("enabled", app.enabled)
                put("addedAt", app.addedAt)
                put("addedBy", app.addedBy)
                put("dailyMinutes", limits[app.packageName]?.dailyMinutes ?: 0)
            })
        }
        return 200 to JSONObject().apply { put("apps", arr) }.toString()
    }

    private suspend fun handleRemoveApp(context: Context, body: String): Pair<Int, String> {
        val pkg = JSONObject(body).optString("packageName", "")
        if (pkg.isBlank()) return 400 to """{"error":"packageName required"}"""
        AppsDatabase.getInstance(context).allowedAppDao().deleteApp(pkg)
        return 200 to """{"ok":true}"""
    }

    private suspend fun handleToggleApp(context: Context, body: String): Pair<Int, String> {
        val json = JSONObject(body)
        val pkg = json.optString("packageName", "")
        if (pkg.isBlank()) return 400 to """{"error":"packageName required"}"""
        val enabled = json.optBoolean("enabled", true)
        AppsDatabase.getInstance(context).allowedAppDao().setEnabled(pkg, enabled)
        return 200 to """{"ok":true}"""
    }

    private suspend fun handleGetLimits(context: Context): Pair<Int, String> {
        val limits = AppsDatabase.getInstance(context).appTimeLimitDao().getAll()
        val arr = JSONArray()
        limits.forEach { l ->
            arr.put(JSONObject().apply {
                put("packageName", l.packageName)
                put("dailyMinutes", l.dailyMinutes)
            })
        }
        return 200 to JSONObject().apply { put("limits", arr) }.toString()
    }

    private suspend fun handleSetLimit(context: Context, body: String): Pair<Int, String> {
        val json = JSONObject(body)
        val pkg = json.optString("packageName", "")
        val minutes = json.optInt("dailyMinutes", 0)
        if (pkg.isBlank()) return 400 to """{"error":"packageName required"}"""
        val db = AppsDatabase.getInstance(context)
        if (minutes <= 0) {
            db.appTimeLimitDao().delete(pkg)
        } else {
            db.appTimeLimitDao().upsert(AppTimeLimit(pkg, minutes))
        }
        return 200 to """{"ok":true}"""
    }

    private suspend fun handleRemoveLimit(context: Context, body: String): Pair<Int, String> {
        val pkg = JSONObject(body).optString("packageName", "")
        if (pkg.isBlank()) return 400 to """{"error":"packageName required"}"""
        AppsDatabase.getInstance(context).appTimeLimitDao().delete(pkg)
        return 200 to """{"ok":true}"""
    }

    private suspend fun handleExport(context: Context): Pair<Int, String> {
        val db = AppsDatabase.getInstance(context)
        val prefs = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

        val appsArr = JSONArray()
        db.allowedAppDao().getAll().forEach { app ->
            appsArr.put(JSONObject().apply {
                put("packageName", app.packageName)
                put("category", app.category)
                put("enabled", app.enabled)
                put("addedAt", app.addedAt)
                put("addedBy", app.addedBy)
            })
        }

        val limitsArr = JSONArray()
        db.appTimeLimitDao().getAll().forEach { l ->
            limitsArr.put(JSONObject().apply {
                put("packageName", l.packageName)
                put("dailyMinutes", l.dailyMinutes)
            })
        }

        val settingsObj = JSONObject().apply {
            put(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED,
                prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false))
            put(LaunchpadPrefs.PREF_BASE_TIME_MINUTES,
                prefs.getInt(LaunchpadPrefs.PREF_BASE_TIME_MINUTES, 60))
            put(LaunchpadPrefs.PREF_WEEK_CAP_MINUTES,
                prefs.getInt(LaunchpadPrefs.PREF_WEEK_CAP_MINUTES, 120))
            put(LaunchpadPrefs.PREF_SCHOOL_DAY_CAP_MINUTES,
                prefs.getInt(LaunchpadPrefs.PREF_SCHOOL_DAY_CAP_MINUTES, 60))
            put(LaunchpadPrefs.PREF_COOLDOWN_MINUTES,
                prefs.getInt(LaunchpadPrefs.PREF_COOLDOWN_MINUTES, 15))
            put(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON,
                prefs.getString(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON, "") ?: "")
            put(LaunchpadPrefs.PREF_IMPULSE_ENABLED,
                prefs.getBoolean(LaunchpadPrefs.PREF_IMPULSE_ENABLED, true))
            put(LaunchpadPrefs.PREF_IMPULSE_SECONDS,
                prefs.getInt(LaunchpadPrefs.PREF_IMPULSE_SECONDS,
                    LaunchpadConstants.DEFAULT_IMPULSE_SECONDS))
            put(LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN,
                prefs.getInt(LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN,
                    LaunchpadConstants.DEFAULT_IMPULSE_REOPEN_WINDOW_MIN))
            put(LaunchpadPrefs.PREF_VIBRATION_ENABLED,
                prefs.getBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED, false))
            put(LaunchpadPrefs.PREF_VIBRATION_MS,
                prefs.getInt(LaunchpadPrefs.PREF_VIBRATION_MS,
                    LaunchpadConstants.DEFAULT_VIBRATION_MS))
        }

        val export = JSONObject().apply {
            put("version", 1)
            put("exportedAt", System.currentTimeMillis())
            put("allowedApps", appsArr)
            put("timeLimits", limitsArr)
            put("settings", settingsObj)
        }
        return 200 to export.toString()
    }

    @Suppress("NestedBlockDepth")
    private suspend fun handleImport(context: Context, body: String): Pair<Int, String> {
        val json = JSONObject(body)
        if (json.optInt("version", 0) != 1) return 400 to """{"error":"unsupported version"}"""

        val db = AppsDatabase.getInstance(context)
        val prefs = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

        val appsArr = json.optJSONArray("allowedApps") ?: JSONArray()
        val newApps = mutableListOf<AllowedApp>()
        for (i in 0 until appsArr.length()) {
            val o = appsArr.getJSONObject(i)
            newApps.add(AllowedApp(
                packageName = o.getString("packageName"),
                category = o.optString("category", "NEUTRAL"),
                enabled = o.optBoolean("enabled", true),
                addedAt = o.optLong("addedAt", System.currentTimeMillis()),
                addedBy = o.optString("addedBy", "parent")
            ))
        }
        db.allowedAppDao().deleteAll()
        db.allowedAppDao().insertAll(newApps)

        val limitsArr = json.optJSONArray("timeLimits") ?: JSONArray()
        db.appTimeLimitDao().deleteAll()
        for (i in 0 until limitsArr.length()) {
            val o = limitsArr.getJSONObject(i)
            val mins = o.optInt("dailyMinutes", 0)
            if (mins > 0) db.appTimeLimitDao().upsert(AppTimeLimit(o.getString("packageName"), mins))
        }

        json.optJSONObject("settings")?.let { s ->
            prefs.edit().apply {
                if (s.has(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED))
                    putBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED,
                        s.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED))
                if (s.has(LaunchpadPrefs.PREF_BASE_TIME_MINUTES))
                    putInt(LaunchpadPrefs.PREF_BASE_TIME_MINUTES,
                        s.getInt(LaunchpadPrefs.PREF_BASE_TIME_MINUTES))
                if (s.has(LaunchpadPrefs.PREF_WEEK_CAP_MINUTES))
                    putInt(LaunchpadPrefs.PREF_WEEK_CAP_MINUTES,
                        s.getInt(LaunchpadPrefs.PREF_WEEK_CAP_MINUTES))
                if (s.has(LaunchpadPrefs.PREF_SCHOOL_DAY_CAP_MINUTES))
                    putInt(LaunchpadPrefs.PREF_SCHOOL_DAY_CAP_MINUTES,
                        s.getInt(LaunchpadPrefs.PREF_SCHOOL_DAY_CAP_MINUTES))
                if (s.has(LaunchpadPrefs.PREF_COOLDOWN_MINUTES))
                    putInt(LaunchpadPrefs.PREF_COOLDOWN_MINUTES,
                        s.getInt(LaunchpadPrefs.PREF_COOLDOWN_MINUTES))
                if (s.has(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON))
                    putString(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON,
                        s.getString(LaunchpadPrefs.PREF_COOLDOWN_RULES_JSON))
                if (s.has(LaunchpadPrefs.PREF_IMPULSE_ENABLED))
                    putBoolean(LaunchpadPrefs.PREF_IMPULSE_ENABLED,
                        s.getBoolean(LaunchpadPrefs.PREF_IMPULSE_ENABLED))
                if (s.has(LaunchpadPrefs.PREF_IMPULSE_SECONDS))
                    putInt(LaunchpadPrefs.PREF_IMPULSE_SECONDS,
                        s.getInt(LaunchpadPrefs.PREF_IMPULSE_SECONDS))
                if (s.has(LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN))
                    putInt(LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN,
                        s.getInt(LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN))
                if (s.has(LaunchpadPrefs.PREF_VIBRATION_ENABLED))
                    putBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED,
                        s.getBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED))
                if (s.has(LaunchpadPrefs.PREF_VIBRATION_MS))
                    putInt(LaunchpadPrefs.PREF_VIBRATION_MS,
                        s.getInt(LaunchpadPrefs.PREF_VIBRATION_MS))
            }.apply()
        }

        return 200 to """{"ok":true,"message":"Importiert: ${newApps.size} Apps"}"""
    }

    private fun getLocalIp(): String = getLocalIp(null) ?: "unknown"

    @Suppress("UnusedParameter") // kept for API symmetry with getLocalIp()
    fun getLocalIp(context: android.content.Context?): String? {
        return try {
            java.net.NetworkInterface.getNetworkInterfaces().toList()
                .flatMap { it.inetAddresses.toList() }
                .firstOrNull { !it.isLoopbackAddress && it is java.net.Inet4Address }
                ?.hostAddress
        } catch (e: Exception) {
            android.util.Log.w("LAUNCHPAD", "getLocalIp failed", e)
            null
        }
    }
}
