@file:Suppress("TooManyFunctions") // cohesive launcher activity extensions

package org.fossify.home.extensions

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.LauncherApps
import android.graphics.Rect
import android.net.Uri
import android.os.Process
import android.provider.Settings
import kotlinx.coroutines.runBlocking
import org.fossify.commons.extensions.showErrorToast
import org.fossify.home.R
import org.fossify.home.activities.AppBlockedActivity
import org.fossify.home.activities.SettingsActivity
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.ITEM_TYPE_FOLDER
import org.fossify.home.helpers.ITEM_TYPE_ICON
import org.fossify.home.helpers.ITEM_TYPE_WIDGET
import org.fossify.home.helpers.LaunchGate
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.helpers.TimeBudgetManager
import org.fossify.home.helpers.UNINSTALL_APP_REQUEST_CODE
import org.fossify.home.interfaces.ItemMenuListener
import org.fossify.home.models.HomeScreenGridItem
import org.fossify.home.models.TimeBudget
import org.fossify.home.ui.GameMenuUi

fun Activity.launchApp(packageName: String, activityName: String) {
    // LAUNCHPAD M1: Launch gate (whitelist + time budget + cool-down) — only enforced once the
    // parent has switched on Kindermodus. Fail-open so a gate error never blocks launching.
    try {
        val gate = evaluateLaunchGate(packageName)
        if (gate != null) {
            val (decision, budget) = gate
            if (!decision.allowed) {
                showBlockScreen(packageName, decision, budget)
                return
            }
            // Impulsbremse: calming countdown before a rapid re-open of a high-stimulation app.
            // Category is already resolved inside LaunchGate — no extra DB round-trip needed.
            if (maybeShowImpulseBrake(packageName, activityName, decision.category)) return
        }
    } catch (e: Exception) {
        android.util.Log.e("LAUNCHPAD", "launch gate failed; allowing launch", e)
    }

    launchAppDirect(packageName, activityName)
}

/**
 * Gate an app-shortcut launch (the long-press shortcut menu calls LauncherApps.startShortcut
 * directly, which would otherwise skip the launch gate). Returns true if the shortcut may
 * proceed; when blocked it shows the context-aware block screen and returns false. Fail-open.
 */
fun Activity.passesLaunchGateForShortcut(packageName: String): Boolean {
    return try {
        val gate = evaluateLaunchGate(packageName) ?: return true
        val (decision, budget) = gate
        if (!decision.allowed) {
            showBlockScreen(packageName, decision, budget)
            false
        } else {
            true
        }
    } catch (e: Exception) {
        android.util.Log.e("LAUNCHPAD", "shortcut gate failed; allowing launch", e)
        true
    }
}

/** Evaluate the launch gate for [packageName]. Returns null when enforcement is OFF. */
private fun Activity.evaluateLaunchGate(
    packageName: String
): Pair<LaunchGate.LaunchDecision, TimeBudget>? {
    val enforce = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        .getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
    if (!enforce) return null
    val db = AppsDatabase.getInstance(applicationContext)
    val budget = runBlocking { TimeBudgetManager(this@evaluateLaunchGate, db).getCurrentBudget() }
    val decision = runBlocking { LaunchGate(this@evaluateLaunchGate, db).canLaunch(packageName, budget) }
    return decision to budget
}

private fun Activity.showBlockScreen(
    packageName: String,
    decision: LaunchGate.LaunchDecision,
    budget: TimeBudget
) {
    startActivity(
        Intent(this@showBlockScreen, AppBlockedActivity::class.java)
            .putExtra(AppBlockedActivity.EXTRA_PACKAGE, packageName)
            .putExtra(AppBlockedActivity.EXTRA_REASON, decision.reason)
            .putExtra(AppBlockedActivity.EXTRA_MESSAGE, decision.childVisibleMessage)
            .putExtra(AppBlockedActivity.EXTRA_BALANCE_MINUTES, budget.balanceMinutes)
            .putExtra(AppBlockedActivity.EXTRA_COOLDOWN_UNTIL, budget.cooldownExpiresAt ?: 0L)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    )
}

/**
 * Return to the launcher home instead of falling back to whatever sits beneath this screen
 * (often the just-blocked app, when it reached the foreground via a side channel). Used by the
 * block / pause screens so dismissing them always lands the child safely on home.
 */
fun Activity.goHome() {
    try {
        startActivity(
            Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
        )
    } catch (e: android.content.ActivityNotFoundException) {
        android.util.Log.w("LAUNCHPAD", "No home activity for goHome", e)
    }
    finish()
}

/**
 * If the Impulsbremse is enabled and [packageName] is a high-stimulation (ACTIVE_LEISURE) app
 * being re-opened within the configured window, start [ImpulseDelayActivity] and return true
 * (the caller must not launch directly). Otherwise return false.
 */
@Suppress("MagicNumber") // 60_000L = ms per minute
private fun Activity.maybeShowImpulseBrake(
    packageName: String,
    activityName: String,
    category: String?
): Boolean {
    if (category != org.fossify.home.helpers.LaunchpadConstants.CATEGORY_ACTIVE_LEISURE) return false
    val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(LaunchpadPrefs.PREF_IMPULSE_ENABLED, true)) return false

    val seconds = prefs.getInt(
        LaunchpadPrefs.PREF_IMPULSE_SECONDS,
        org.fossify.home.helpers.LaunchpadConstants.DEFAULT_IMPULSE_SECONDS
    )
    val windowMin = prefs.getInt(
        LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN,
        org.fossify.home.helpers.LaunchpadConstants.DEFAULT_IMPULSE_REOPEN_WINDOW_MIN
    )
    val isReopen = org.fossify.home.helpers.ImpulseTracker
        .isRapidReopen(packageName, windowMin * 60_000L)
    if (!isReopen) return false

    startActivity(
        Intent(this, org.fossify.home.activities.ImpulseDelayActivity::class.java)
            .putExtra(org.fossify.home.activities.ImpulseDelayActivity.EXTRA_PACKAGE, packageName)
            .putExtra(org.fossify.home.activities.ImpulseDelayActivity.EXTRA_ACTIVITY, activityName)
            .putExtra(org.fossify.home.activities.ImpulseDelayActivity.EXTRA_SECONDS, seconds)
    )
    return true
}

/** Raw app launch with no gate/Impulsbremse — used after the gate has already passed. */
fun Activity.launchAppDirect(packageName: String, activityName: String) {
    try {
        Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
            `package` = packageName
            component = ComponentName.unflattenFromString("$packageName/$activityName")
            addFlags(Intent.FLAG_RECEIVER_FOREGROUND)
            startActivity(this)
        }
    } catch (e: Exception) {
        try {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            startActivity(launchIntent)
        } catch (e: Exception) {
            showErrorToast(e)
        }
    }
}


fun Activity.launchAppInfo(packageName: String) {
    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", packageName, null)
        startActivity(this)
    }
}

fun Activity.canAppBeUninstalled(packageName: String): Boolean {
    return try {
        val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
        (applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0
    } catch (ignored: Exception) {
        false
    }
}

fun Activity.uninstallApp(packageName: String) {
    Intent(Intent.ACTION_DELETE).apply {
        data = Uri.fromParts("package", packageName, null)
        startActivityForResult(this, UNINSTALL_APP_REQUEST_CODE)
    }
}

fun Activity.handleGridItemPopupMenu(
    gridItem: HomeScreenGridItem,
    isOnAllAppsFragment: Boolean,
    listener: ItemMenuListener,
): GameMenuUi.GameActionMenu {
    val actions = mutableListOf<GameMenuUi.Action>()
    if (gridItem.type == ITEM_TYPE_ICON) {
        val launcherApps =
            applicationContext.getSystemService(Context.LAUNCHER_APPS_SERVICE) as LauncherApps
        val shortcuts = if (launcherApps.hasShortcutHostPermission()) {
            try {
                val query = LauncherApps.ShortcutQuery().setQueryFlags(
                    LauncherApps.ShortcutQuery.FLAG_MATCH_DYNAMIC or LauncherApps.ShortcutQuery.FLAG_MATCH_MANIFEST or LauncherApps.ShortcutQuery.FLAG_MATCH_PINNED
                ).setPackage(gridItem.packageName)
                launcherApps.getShortcuts(query, Process.myUserHandle())
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
        shortcuts.orEmpty().forEach { shortcutInfo ->
            actions += GameMenuUi.Action(shortcutInfo.getLabel().toString(), "▶", GameMenuUi.YELLOW) {
                listener.onAnyClick()
                val shortcutPackage = shortcutInfo.`package`
                if (passesLaunchGateForShortcut(shortcutPackage)) {
                    launcherApps.startShortcut(
                        shortcutPackage,
                        shortcutInfo.id,
                        Rect(),
                        null,
                        Process.myUserHandle(),
                    )
                }
            }
        }
        actions += GameMenuUi.Action(getString(R.string.app_info), "ⓘ") {
            listener.onAnyClick(); listener.appInfo(gridItem)
        }
        if (isOnAllAppsFragment) {
            actions += GameMenuUi.Action(getString(R.string.hide), "◉") {
                listener.onAnyClick(); listener.hide(gridItem)
            }
        }
        if (canAppBeUninstalled(gridItem.packageName) && gridItem.packageName != packageName) {
            actions += GameMenuUi.Action(getString(R.string.uninstall), "×", GameMenuUi.RED) {
                listener.onAnyClick(); listener.uninstall(gridItem)
            }
        }
    }

    if ((gridItem.type == ITEM_TYPE_ICON || gridItem.type == ITEM_TYPE_FOLDER) && !isOnAllAppsFragment) {
        actions += GameMenuUi.Action(getString(R.string.rename), "✎") {
            listener.onAnyClick(); listener.rename(gridItem)
        }
    }
    if (gridItem.type == ITEM_TYPE_WIDGET) {
        actions += GameMenuUi.Action(getString(R.string.resize), "↔") {
            listener.onAnyClick(); listener.resize(gridItem)
        }
    }
    if (!isOnAllAppsFragment) {
        actions += GameMenuUi.Action(getString(R.string.remove), "−", GameMenuUi.RED) {
            listener.onAnyClick(); listener.remove(gridItem)
        }
    }

    return GameMenuUi.showActionMenu(
        this,
        gridItem.title.ifBlank { getString(R.string.app_name) },
        actions,
        listener::onDismiss,
    )
}
