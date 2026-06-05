// File: app/src/main/kotlin/org/fossify/home/activities/AuditLogActivity.kt
// Parent-facing event timeline: tamper signals + notable system events, newest first.

@file:Suppress("MagicNumber", "CyclomaticComplexMethod") // UI built programmatically

package org.fossify.home.activities

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
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
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.AuditEvent
import org.fossify.home.helpers.LaunchpadConstants
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AuditLogActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var listContainer: LinearLayout
    private val fmt = SimpleDateFormat("dd.MM. HH:mm", Locale.GERMANY)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        setContentView(root)

        root.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0D2847"))
            setPadding(24, 48, 24, 24)
            addView(TextView(this@AuditLogActivity).apply {
                text = "← Schließen"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
                setOnClickListener { finish() }
            })
            addView(TextView(this@AuditLogActivity).apply {
                text = "Verlauf & Ereignisse"
                textSize = 24f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
                setPadding(0, 16, 0, 4)
            })
            addView(TextView(this@AuditLogActivity).apply {
                text = "Was ist passiert — neueste zuerst"
                textSize = 13f
                setTextColor(Color.argb(180, 255, 255, 255))
            })
        })

        val scroll = ScrollView(this)
        listContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 32)
        }
        scroll.addView(listContainer)
        root.addView(scroll)

        load()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun load() {
        scope.launch {
            val events = withContext(Dispatchers.IO) {
                AppsDatabase.getInstance(this@AuditLogActivity).auditEventDao().getRecent(200)
            }
            listContainer.removeAllViews()
            if (events.isEmpty()) {
                listContainer.addView(TextView(this@AuditLogActivity).apply {
                    text = "Noch keine Ereignisse aufgezeichnet."
                    textSize = 14f
                    setTextColor(Color.parseColor("#828282"))
                    setPadding(8, 24, 8, 0)
                })
                return@launch
            }
            listContainer.addView(Button(this@AuditLogActivity).apply {
                text = "Alle als gelesen markieren"
                setTextColor(Color.parseColor("#0D2847"))
                background = GradientDrawable().apply {
                    setColor(Color.WHITE)
                    cornerRadius = 8f
                    setStroke(1, Color.parseColor("#E0E0E0"))
                }
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 0, 0, 8) }
                setOnClickListener {
                    scope.launch {
                        withContext(Dispatchers.IO) {
                            AppsDatabase.getInstance(this@AuditLogActivity)
                                .auditEventDao().acknowledgeAll()
                        }
                        load()
                    }
                }
            })
            listContainer.addView(Button(this@AuditLogActivity).apply {
                text = "Verlauf teilen"
                setTextColor(Color.parseColor("#0D2847"))
                background = GradientDrawable().apply {
                    setColor(Color.WHITE)
                    cornerRadius = 8f
                    setStroke(1, Color.parseColor("#E0E0E0"))
                }
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 0, 0, 8) }
                setOnClickListener { shareEvents(events) }
            })
            events.forEach { listContainer.addView(eventRow(it)) }
        }
    }

    private fun shareEvents(events: List<AuditEvent>) {
        val body = buildString {
            append("LAUNCHPAD Verlauf & Ereignisse\n\n")
            events.forEach { ev ->
                val mark = when (ev.severity) {
                    LaunchpadConstants.SEVERITY_CRITICAL -> "[!]"
                    LaunchpadConstants.SEVERITY_WARNING -> "[*]"
                    else -> "[-]"
                }
                append(fmt.format(Date(ev.createdAt)))
                append("  ").append(mark).append("  ").append(ev.message).append("\n")
            }
        }
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "LAUNCHPAD Verlauf")
            putExtra(Intent.EXTRA_TEXT, body.trim())
        }
        startActivity(Intent.createChooser(send, "Verlauf teilen"))
    }

    private fun eventRow(event: AuditEvent): LinearLayout {
        val stripe = when (event.severity) {
            LaunchpadConstants.SEVERITY_CRITICAL -> "#D32F2F"
            LaunchpadConstants.SEVERITY_WARNING -> "#F2994A"
            else -> "#4CAF50"
        }
        val icon = when (event.severity) {
            LaunchpadConstants.SEVERITY_CRITICAL -> "❌"
            LaunchpadConstants.SEVERITY_WARNING -> "⚠️"
            else -> "•"
        }
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = GradientDrawable().apply {
                setColor(Color.parseColor(if (event.acknowledged) "#F2F2F2" else "#F7F9FC"))
                cornerRadius = 8f
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 4, 0, 4) }

            addView(android.view.View(this@AuditLogActivity).apply {
                setBackgroundColor(Color.parseColor(stripe))
                layoutParams = LinearLayout.LayoutParams(6, LinearLayout.LayoutParams.MATCH_PARENT)
            })
            addView(LinearLayout(this@AuditLogActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(16, 12, 16, 12)
                addView(TextView(this@AuditLogActivity).apply {
                    text = "$icon  ${event.message}"
                    textSize = 14f
                    setTextColor(Color.parseColor("#0D2847"))
                    if (!event.acknowledged) setTypeface(null, Typeface.BOLD)
                })
                addView(TextView(this@AuditLogActivity).apply {
                    text = fmt.format(Date(event.createdAt))
                    textSize = 11f
                    setTextColor(Color.parseColor("#828282"))
                    setPadding(0, 2, 0, 0)
                })
            })
        }
    }
}
