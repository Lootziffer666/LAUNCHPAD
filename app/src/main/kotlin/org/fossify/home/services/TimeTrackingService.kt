// File: app/src/main/kotlin/org/fossify/home/services/TimeTrackingService.kt
// M2/M5: Foreground service that meters real screen-time usage and enforces the budget.
//
// Counts wall-clock time while the screen is ON and a *whitelisted, non-cool-down* app is in
// the foreground (detected via UsageStatsManager). Every whole minute is debited from the
// Krypto-Cash ledger via TimeBudgetManager.spend(); when the balance reaches 0 the cool-down
// window starts and CooldownActivity is shown. Requires Usage Access (granted in Eltern-Modus).

@file:Suppress(
    "MagicNumber", "TooGenericExceptionCaught", "TooManyFunctions"
) // polling intervals; fail-safe catches; service handles tracking + tamper checks

package org.fossify.home.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.os.Vibrator
import android.util.Log
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import kotlinx.coroutines.runBlocking
import org.fossify.home.activities.AppBlockedActivity
import org.fossify.home.activities.TimesUpActivity
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.AppLimitBonus
import org.fossify.home.helpers.ForegroundPolicy
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.helpers.TamperClock
import org.fossify.home.helpers.TamperMonitor
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.helpers.UsageTracker
import java.util.concurrent.TimeUnit

class TimeTrackingService : Service() {
    private val tag = "TimeTrackingService"
    private lateinit var database: AppsDatabase
    private lateinit var budgetManager: TimeBudgetManager
    private lateinit var powerManager: PowerManager
    private lateinit var handlerThread: HandlerThread
    private lateinit var handler: Handler

    // Sub-minute carry of counted foreground time, and the timestamp of the last counted tick.
    private var accumulatedMs = 0L
    private var lastCountedAt = 0L
    @Volatile private var lastCooldownLaunch = 0L
    @Volatile private var lastAppLimitLaunch = 0L
    @Volatile private var lastStrictBlock = 0L
    // Tracks the last warned balance level so each threshold is announced at most once.
    private var lastWarnedMinutes = Int.MAX_VALUE

    // Fires on a manual system-clock or time-zone change → strong tamper signal.
    private val clockChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val ctx = context ?: return
            val enforce = ctx.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
                .getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
            if (!enforce) return
            val (type, label) = when (intent?.action) {
                Intent.ACTION_TIMEZONE_CHANGED ->
                    LaunchpadConstants.AUDIT_TIMEZONE_CHANGED to "Zeitzone wurde geändert"
                else ->
                    LaunchpadConstants.AUDIT_TIME_CHANGED to "Systemzeit wurde geändert"
            }
            TamperMonitor.triggerLockdown(ctx, type, label)
        }
    }

    override fun onCreate() {
        super.onCreate()
        database = AppsDatabase.getInstance(this)
        budgetManager = TimeBudgetManager(this, database)
        powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        handlerThread = HandlerThread("TimeTrackingWorker")
        handlerThread.start()
        handler = Handler(handlerThread.looper)
        registerReceiver(clockChangeReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_TIME_CHANGED)
            addAction(Intent.ACTION_TIMEZONE_CHANGED)
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        isRunning = true
        startInForeground()
        startTracking()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        try { unregisterReceiver(clockChangeReceiver) } catch (e: IllegalArgumentException) {
            Log.w(tag, "clockChangeReceiver already unregistered", e)
        }
        super.onDestroy()
        if (this::handlerThread.isInitialized) handlerThread.quit()
    }

    private fun startInForeground() {
        val channelId = "launchpad_time_tracking"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (mgr.getNotificationChannel(channelId) == null) {
                mgr.createNotificationChannel(
                    NotificationChannel(channelId, "Bildschirmzeit", NotificationManager.IMPORTANCE_MIN)
                )
            }
        }
        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("LAUNCHPAD")
            .setContentText("Bildschirmzeit aktiv")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun startTracking() {
        handler.post(object : Runnable {
            override fun run() {
                try {
                    tick()
                } catch (e: Exception) {
                    Log.e(tag, "Error in tracking loop", e)
                }
                handler.postDelayed(this, POLL_INTERVAL_MS)
            }
        })
    }

    private fun tick() {
        // Only meter time once the parent has switched on Kindermodus (enforcement).
        val enforce = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
            .getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
        if (!enforce) {
            resetCounter()
            return
        }
        // Tamper checks run on every enforced tick, regardless of foreground app.
        checkClockIntegrity()
        // Need Usage Access to know the foreground app.
        if (!UsageTracker.hasUsageAccess(this)) {
            handleUsageAccessLost()
            resetCounter()
            return
        }
        markUsageAccessGranted()
        // Only count while the screen is actually on.
        if (!powerManager.isInteractive) {
            resetCounter()
            return
        }
        val pkg = UsageTracker.getForegroundPackage(this)
        if (pkg == null) {
            resetCounter()
            return
        }

        runBlocking {
            // Strict mode (opt-in): block any non-whitelisted app reaching the foreground via a
            // side channel. Runs before the budget logic, which only handles whitelisted apps.
            if (maybeStrictForegroundBlock(pkg)) return@runBlocking

            val budget = budgetManager.getCurrentBudget()

            // If balance is 0 or in cooldown, keep re-launching CooldownActivity when a
            // coin-gated app is still in the foreground (e.g. user pressed Back to escape).
            if (budget.inCooldown || budget.balanceMinutes <= 0) {
                if (isCountedApp(pkg)) {
                    val now = System.currentTimeMillis()
                    if (now - lastCooldownLaunch >= COOLDOWN_RELAUNCH_THROTTLE_MS) {
                        lastCooldownLaunch = now
                        launchCooldown()
                    }
                }
                resetCounter()
                return@runBlocking
            }

            if (!isCountedApp(pkg)) {
                resetCounter()
                return@runBlocking
            }

            // Per-app daily limit: kick out mid-session once today's usage hits the cap.
            // Mirrors the cool-down relaunch — throttled so we don't spam the block screen.
            if (isAppDailyLimitReached(pkg)) {
                val now = System.currentTimeMillis()
                if (now - lastAppLimitLaunch >= COOLDOWN_RELAUNCH_THROTTLE_MS) {
                    lastAppLimitLaunch = now
                    launchAppBlocked(
                        pkg,
                        LaunchpadConstants.REASON_APP_DAILY_LIMIT,
                        "Tageslimit für diese App erreicht."
                    )
                }
                resetCounter()
                return@runBlocking
            }

            val now = System.currentTimeMillis()
            if (lastCountedAt == 0L) {
                lastCountedAt = now
                return@runBlocking
            }
            accumulatedMs += now - lastCountedAt
            lastCountedAt = now

            val wholeMinutes = (accumulatedMs / 60_000L).toInt()
            if (wholeMinutes >= 1) {
                accumulatedMs -= wholeMinutes * 60_000L
                val newBalance = budgetManager.spend(wholeMinutes, pkg)
                if (newBalance <= 0) {
                    resetCounter()
                    lastCooldownLaunch = System.currentTimeMillis()
                    lastWarnedMinutes = Int.MAX_VALUE
                    launchTimesUp()
                } else {
                    maybeWarnTimeRunningLow(newBalance)
                }
            }
        }
    }

    /**
     * Reconcile wall clock vs. monotonic uptime across heartbeats to catch a changed clock,
     * a reboot, or a long suppression gap (Doze/kill). Persists the heartbeat each tick so the
     * check survives a process kill.
     */
    private fun checkClockIntegrity() {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val prevWall = prefs.getLong(LaunchpadPrefs.PREF_HEARTBEAT_WALL, 0L)
        val prevElapsed = prefs.getLong(LaunchpadPrefs.PREF_HEARTBEAT_ELAPSED, 0L)
        val nowWall = System.currentTimeMillis()
        val nowElapsed = SystemClock.elapsedRealtime()

        when (
            val verdict = TamperClock.evaluate(
                prevWall = prevWall,
                prevElapsed = prevElapsed,
                nowWall = nowWall,
                nowElapsed = nowElapsed,
                expectedIntervalMs = POLL_INTERVAL_MS,
                driftToleranceMs = LaunchpadConstants.TAMPER_TIME_DRIFT_TOLERANCE_MS,
                gapThresholdMs = LaunchpadConstants.TAMPER_GAP_THRESHOLD_MS
            )
        ) {
            is TamperClock.Verdict.TimeChanged ->
                TamperMonitor.triggerLockdown(
                    this,
                    LaunchpadConstants.AUDIT_TIME_CHANGED,
                    "Systemzeit weicht ab (${verdict.driftMs / 60_000L} Min) — möglicherweise manipuliert"
                )
            is TamperClock.Verdict.Gap ->
                TamperMonitor.record(
                    this,
                    LaunchpadConstants.AUDIT_SERVICE_GAP,
                    LaunchpadConstants.SEVERITY_WARNING,
                    "Zeiterfassung war ${verdict.gapMs / 60_000L} Min unterbrochen (Energiesparmodus?)"
                )
            TamperClock.Verdict.Reboot,
            TamperClock.Verdict.Normal -> Unit // reboot is logged by BootReceiver
        }

        prefs.edit()
            .putLong(LaunchpadPrefs.PREF_HEARTBEAT_WALL, nowWall)
            .putLong(LaunchpadPrefs.PREF_HEARTBEAT_ELAPSED, nowElapsed)
            .apply()
    }

    private fun markUsageAccessGranted() {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        if (!prefs.getBoolean(LaunchpadPrefs.PREF_USAGE_WAS_GRANTED, false)) {
            prefs.edit().putBoolean(LaunchpadPrefs.PREF_USAGE_WAS_GRANTED, true).apply()
        }
    }

    private fun handleUsageAccessLost() {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        // Only a tamper signal if access was previously granted and is now gone.
        if (prefs.getBoolean(LaunchpadPrefs.PREF_USAGE_WAS_GRANTED, false)) {
            prefs.edit().putBoolean(LaunchpadPrefs.PREF_USAGE_WAS_GRANTED, false).apply()
            TamperMonitor.triggerLockdown(
                this,
                LaunchpadConstants.AUDIT_USAGE_ACCESS_REVOKED,
                "Nutzungszugriff wurde entzogen — Zeit kann nicht mehr gemessen werden"
            )
        }
    }

    private fun resetCounter() {
        accumulatedMs = 0L
        lastCountedAt = 0L
    }

    private suspend fun isCountedApp(pkg: String): Boolean {
        if (pkg == packageName) return false
        if (!database.allowedAppDao().isAppAllowed(pkg)) return false
        val category = database.allowedAppDao().getAppCategory(pkg)
        return category == LaunchpadConstants.CATEGORY_ACTIVE_LEISURE
    }

    /**
     * Strict mode: if enabled, block a non-whitelisted foreground app (throttled). Returns true
     * if it acted (caller should stop this tick). Essential packages are never blocked.
     */
    private suspend fun maybeStrictForegroundBlock(pkg: String): Boolean {
        val strict = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
            .getBoolean(LaunchpadPrefs.PREF_STRICT_FOREGROUND_BLOCK, false)
        if (!strict) return false
        val whitelisted = database.allowedAppDao().isAppAllowed(pkg)
        val essentials = ForegroundPolicy.essentialPackages(this)
        if (!ForegroundPolicy.shouldBlock(pkg, packageName, whitelisted, essentials)) return false
        val now = System.currentTimeMillis()
        if (now - lastStrictBlock >= COOLDOWN_RELAUNCH_THROTTLE_MS) {
            lastStrictBlock = now
            launchAppBlocked(pkg, LaunchpadConstants.REASON_NOT_ALLOWED, "Diese App ist nicht erlaubt.")
        }
        resetCounter()
        return true
    }

    private suspend fun isAppDailyLimitReached(pkg: String): Boolean {
        val limit = database.appTimeLimitDao().getForApp(pkg) ?: return false
        val dayOfWeek = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK)
        val baseLimit = limit.minutesForDay(dayOfWeek)
        if (baseLimit <= 0) return false
        val midnight = todayMidnight()
        val used = database.cryptoCashDao().getTodaySpentMinutesForApp(pkg, midnight)
        val bonus = AppLimitBonus.getTodayBonus(this, pkg, midnight)
        return used >= AppLimitBonus.effectiveLimit(baseLimit, bonus)
    }

    private fun todayMidnight(): Long {
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    private fun maybeWarnTimeRunningLow(balanceMinutes: Int) {
        if (balanceMinutes >= lastWarnedMinutes) return
        val thresholds = WARNING_THRESHOLDS
        val hit = thresholds.firstOrNull { balanceMinutes <= it } ?: return
        if (hit >= lastWarnedMinutes) return
        lastWarnedMinutes = hit
        val msg = "Noch $balanceMinutes Minute${if (balanceMinutes != 1) "n" else ""} Bildschirmzeit!"
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(applicationContext, msg, Toast.LENGTH_LONG).show()
            val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
            if (prefs.getBoolean(LaunchpadPrefs.PREF_VIBRATION_ENABLED, true)) {
                val vib = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                val ms = prefs.getInt(LaunchpadPrefs.PREF_VIBRATION_MS, 300).toLong()
                if (vib != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vib.vibrate(
                            android.os.VibrationEffect.createOneShot(
                                ms, android.os.VibrationEffect.DEFAULT_AMPLITUDE
                            )
                        )
                    } else {
                        @Suppress("DEPRECATION")
                        vib.vibrate(ms)
                    }
                }
            }
        }
    }

    private fun launchTimesUp() {
        try {
            startActivity(
                Intent(this, TimesUpActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: Exception) {
            Log.e(tag, "Could not launch TimesUpActivity", e)
            launchCooldown()
        }
    }

    private fun launchCooldown() {
        try {
            startActivity(
                Intent()
                    .setClassName(this, "org.fossify.home.activities.CooldownActivity")
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: Exception) {
            Log.e(tag, "Could not launch CooldownActivity", e)
        }
    }

    private fun launchAppBlocked(pkg: String, reason: String, message: String) {
        try {
            startActivity(
                Intent(this, AppBlockedActivity::class.java)
                    .putExtra(AppBlockedActivity.EXTRA_PACKAGE, pkg)
                    .putExtra(AppBlockedActivity.EXTRA_REASON, reason)
                    .putExtra(AppBlockedActivity.EXTRA_MESSAGE, message)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: Exception) {
            Log.e(tag, "Could not launch AppBlockedActivity", e)
            launchTimesUp()
        }
    }

    companion object {
        private const val NOTIFICATION_ID = 4711
        private const val POLL_INTERVAL_MS = 10_000L
        private const val COOLDOWN_RELAUNCH_THROTTLE_MS = 30_000L

        // Balance thresholds (minutes) at which Jake sees a warning toast.
        val WARNING_THRESHOLDS = sortedSetOf(15, 10, 7, 5, 3, 2, 1)

        /** True while the service is running; readable from other components. */
        @Volatile var isRunning = false
    }
}

/**
 * Periodic (30 min) housekeeping. Full auto-expire / cleanup logic is M4/M5.
 */
class TimeTrackingWorker(context: Context, params: WorkerParameters) :
    Worker(context, params) {

    override fun doWork(): Result = try {
        Log.d("TimeTrackingWorker", "Periodic check")
        Result.success()
    } catch (e: Exception) {
        Log.w("TimeTrackingWorker", "Periodic check failed", e)
        Result.retry()
    }

    companion object {
        fun schedulePeriodicChecks(context: Context) {
            val work = PeriodicWorkRequestBuilder<TimeTrackingWorker>(30, TimeUnit.MINUTES).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "launchpad_time_tracking",
                ExistingPeriodicWorkPolicy.KEEP,
                work
            )
        }
    }
}

/**
 * Starts the tracking service + schedules periodic checks. Call from a foreground context
 * (MainActivity.onCreate). Idempotent.
 */
class TimeTrackingStartup {
    fun initializeTimeTracking(context: Context) {
        val intent = Intent(context, TimeTrackingService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        TimeTrackingWorker.schedulePeriodicChecks(context)
    }
}
