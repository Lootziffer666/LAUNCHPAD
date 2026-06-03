// File: app/src/main/kotlin/org/fossify/home/activities/PermissionHealthActivity.kt
// Central permission health-check screen. Shows all required/recommended system permissions
// with status indicators and one-tap fix actions.

@file:Suppress("MagicNumber")

package org.fossify.home.activities

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.helpers.LaunchpadServer
import org.fossify.home.helpers.UsageTracker
import org.fossify.home.services.TimeTrackingService

@Suppress("TooManyFunctions", "LongMethod", "CyclomaticComplexMethod")
class PermissionHealthActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var listContainer: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val scroll = ScrollView(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, 0, 32)
        }
        scroll.addView(root)
        setContentView(scroll)

        // Header
        root.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0D2847"))
            setPadding(24, 48, 24, 24)

            addView(TextView(this@PermissionHealthActivity).apply {
                text = "← Schließen"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
                setOnClickListener { finish() }
            })
            addView(TextView(this@PermissionHealthActivity).apply {
                text = "Systemstatus"
                textSize = 24f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                setPadding(0, 16, 0, 4)
            })
            addView(TextView(this@PermissionHealthActivity).apply {
                text = "Alle Berechtigungen und Dienste auf einen Blick"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
            })
        })

        listContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 0)
        }
        root.addView(listContainer)

        root.addView(Button(this).apply {
            text = "Aktualisieren"
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F2994A"))
                cornerRadius = 8f
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(16, 16, 16, 8) }
            setOnClickListener { loadChecks() }
        })

        loadChecks()
    }

    override fun onResume() {
        super.onResume()
        loadChecks()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun loadChecks() {
        listContainer.removeAllViews()
        listContainer.addView(sectionLabel("KRITISCH"))

        // 1 — Usage Stats
        val hasUsage = UsageTracker.hasUsageAccess(this)
        listContainer.addView(healthItem(
            title = "Nutzungsstatistiken",
            description = if (hasUsage)
                "Zeiterfassung funktioniert korrekt."
            else
                "Zeiterfassung funktioniert NICHT. Ohne diesen Zugriff kann LAUNCHPAD die Bildschirmzeit nicht messen.",
            status = if (hasUsage) Status.OK else Status.CRITICAL,
            actionLabel = if (hasUsage) null else "Beheben →",
            onAction = if (hasUsage) null else {
                { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
            }
        ))

        // 2 — TimeTrackingService running
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
        val enforcementOn = prefs.getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)
        val serviceRunning = TimeTrackingService.isRunning
        val serviceStatus = when {
            !enforcementOn -> Status.OK // not needed if Kindermodus is off
            serviceRunning -> Status.OK
            else -> Status.CRITICAL
        }
        listContainer.addView(healthItem(
            title = "Zeiterfassung läuft",
            description = when {
                !enforcementOn -> "Kindermodus ist aus — Dienst wird bei Aktivierung gestartet."
                serviceRunning -> "TimeTrackingService ist aktiv."
                else -> "Dienst läuft nicht! Zeitguthaben wird gerade nicht gemessen."
            },
            status = serviceStatus,
            actionLabel = if (serviceStatus == Status.CRITICAL) "Neu starten" else null,
            onAction = if (serviceStatus == Status.CRITICAL) {
                {
                    org.fossify.home.services.TimeTrackingStartup().initializeTimeTracking(this)
                    loadChecks()
                }
            } else null
        ))

        listContainer.addView(sectionLabel("EMPFOHLEN"))

        // 3 — Battery optimization
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        val batteryOk = pm.isIgnoringBatteryOptimizations(packageName)
        listContainer.addView(healthItem(
            title = "Akku-Optimierung deaktiviert",
            description = if (batteryOk)
                "Android schläft den Dienst nicht ein."
            else
                "Android kann den Tracking-Dienst einschlafen lassen. " +
                "Guthaben könnte nicht korrekt abgezogen werden.",
            status = if (batteryOk) Status.OK else Status.WARNING,
            actionLabel = if (batteryOk) null else "Beheben →",
            onAction = if (batteryOk) null else {
                {
                    startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    })
                }
            }
        ))

        // 4 — Notifications
        val notifOk = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).areNotificationsEnabled()
        } else true
        listContainer.addView(healthItem(
            title = "Benachrichtigungen erlaubt",
            description = if (notifOk)
                "Foreground-Service kann Statusbenachrichtigung anzeigen."
            else
                "Ohne Benachrichtigungen kann der Tracking-Service auf Android 8+ nicht als Foreground-Service laufen.",
            status = if (notifOk) Status.OK else Status.WARNING,
            actionLabel = if (notifOk) null else "Beheben →",
            onAction = if (notifOk) null else {
                {
                    startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                    })
                }
            }
        ))

        // 5 — Boot autostart (always OK after BootReceiver is registered)
        listContainer.addView(healthItem(
            title = "Boot-Autostart",
            description = "Tracking wird nach Neustart automatisch wiederhergestellt, sofern Kindermodus aktiv ist.",
            status = Status.OK
        ))

        listContainer.addView(sectionLabel("INFO"))

        // 6 — LaunchpadServer (async)
        val serverRunning = LaunchpadServer.isRunning
        listContainer.addView(healthItem(
            title = "Companion-Server",
            description = if (serverRunning)
                "Eltern-App kann sich per WLAN verbinden (Port 7391)."
            else
                "Server läuft nicht. Companion-App kann nicht verbinden. " +
                "Wird beim nächsten Launcher-Start automatisch gestartet.",
            status = if (serverRunning) Status.OK else Status.WARNING
        ))
    }

    // ─── Layout helpers ──────────────────────────────────────────────────────

    private enum class Status { OK, WARNING, CRITICAL }

    private fun sectionLabel(text: String) = TextView(this).apply {
        this.text = text
        textSize = 11f
        setTypeface(null, Typeface.BOLD)
        setTextColor(Color.parseColor("#828282"))
        setPadding(4, 20, 4, 8)
        letterSpacing = 0.1f
    }

    private fun healthItem(
        title: String,
        description: String,
        status: Status,
        actionLabel: String? = null,
        onAction: (() -> Unit)? = null
    ): LinearLayout {
        val stripeColor = when (status) {
            Status.OK -> "#4CAF50"
            Status.WARNING -> "#F2994A"
            Status.CRITICAL -> "#D32F2F"
        }
        val icon = when (status) {
            Status.OK -> "✅"
            Status.WARNING -> "⚠️"
            Status.CRITICAL -> "❌"
        }

        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F7F9FC"))
                cornerRadius = 8f
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 6, 0, 6) }
            elevation = 2f

            // Left color stripe
            addView(android.view.View(this@PermissionHealthActivity).apply {
                setBackgroundColor(Color.parseColor(stripeColor))
                layoutParams = LinearLayout.LayoutParams(6,
                    LinearLayout.LayoutParams.MATCH_PARENT)
            })

            // Content
            addView(LinearLayout(this@PermissionHealthActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(16, 14, 16, 14)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )

                addView(LinearLayout(this@PermissionHealthActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = android.view.Gravity.CENTER_VERTICAL
                    addView(TextView(this@PermissionHealthActivity).apply {
                        text = "$icon  $title"
                        textSize = 15f
                        setTypeface(null, Typeface.BOLD)
                        setTextColor(Color.parseColor("#0D2847"))
                    })
                })

                addView(TextView(this@PermissionHealthActivity).apply {
                    text = description
                    textSize = 13f
                    setTextColor(Color.parseColor("#555555"))
                    setPadding(0, 6, 0, 0)
                })

                if (actionLabel != null && onAction != null) {
                    addView(Button(this@PermissionHealthActivity).apply {
                        text = actionLabel
                        textSize = 13f
                        setTextColor(Color.WHITE)
                        background = GradientDrawable().apply {
                            setColor(Color.parseColor(stripeColor))
                            cornerRadius = 6f
                        }
                        layoutParams = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply { topMargin = 10 }
                        setOnClickListener { onAction() }
                    })
                }
            })
        }
    }
}
