// File: app/src/main/kotlin/org/fossify/home/activities/DogeRequestsActivity.kt
// M2: Doge-Coins (SOG media approvals) UI — wired to Room via DogeRequestDao + mappers.

package org.fossify.home.activities

import android.app.AlertDialog
import android.os.Bundle
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.toEntity
import org.fossify.home.helpers.toModel
import org.fossify.home.models.DogeManager
import org.fossify.home.models.DogeRequest

/**
 * DogeRequestsActivity: request-based media approvals.
 *
 * Child: requests specific content ("YouTube – Minecraft tutorials"); sees pending +
 * active (time-limited) approvals.
 * Parent: reviews pending requests, approves with a duration (pre-filled by a content
 * heuristic) or rejects.
 */
@Suppress("MagicNumber", "TooManyFunctions", "CyclomaticComplexMethod") // UI built programmatically
class DogeRequestsActivity : AppCompatActivity() {
    private lateinit var database: AppsDatabase
    private val manager = DogeManager()
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var isParentMode = false
    private var prefillPkg: String? = null   // package name from blocked-app denial dialog

    private lateinit var content: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        database = AppsDatabase.getInstance(this)
        isParentMode = intent.getBooleanExtra("isParentMode", false)
        prefillPkg = intent.getStringExtra("prefill_package")

        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        setContentView(ScrollView(this).apply { addView(content) })

        if (isParentMode) showParentView() else showChildView()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun label(text: String, size: Float = 16f, topPad: Int = 24) = TextView(this).apply {
        this.text = text
        textSize = size
        setPadding(0, topPad, 0, 8)
    }

    private fun matchWidth() = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { setMargins(0, 8, 0, 16) }

    // ─── Parent view ────────────────────────────────────────────────────────────────

    private fun showParentView() {
        content.removeAllViews()
        content.addView(label("Medien-Anfragen", size = 20f, topPad = 0))
        content.addView(label("Jakes Wünsche – genehmige mit einer Dauer oder lehne ab.", size = 14f))

        val pending = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(pending)

        scope.launch {
            val models = withContext(Dispatchers.IO) {
                database.dogeRequestDao().getAllRequests().map { it.toModel() }
            }
            val pendingList = manager.getPendingRequests(models)
            pending.removeAllViews()
            if (pendingList.isEmpty()) {
                pending.addView(label("(Keine offenen Anfragen)", size = 14f, topPad = 8))
            } else {
                for (r in pendingList) pending.addView(renderPendingRow(r))
            }
        }
    }

    private fun renderPendingRow(r: DogeRequest): LinearLayout {
        val age = formatAge(r.requestedAt)
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 12, 0, 16)
        }
        row.addView(TextView(this).apply {
            text = r.contentDescription
            textSize = 15f
            setTypeface(null, android.graphics.Typeface.BOLD)
        })
        row.addView(TextView(this).apply {
            text = "Angefragt $age"
            textSize = 12f
            setTextColor(android.graphics.Color.parseColor("#888888"))
            setPadding(0, 2, 0, 8)
        })
        // Quick-approve chips
        val chips = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 0, 0, 4)
        }
        listOf(30, 60, 90).forEach { mins ->
            chips.addView(Button(this).apply {
                text = "+$mins Min"
                isAllCaps = false
                textSize = 12f
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 0, 8, 0) }
                setOnClickListener { decide(r, approve = true, durationMinutes = mins) }
            })
        }
        chips.addView(Button(this).apply {
            text = "⚙"
            isAllCaps = false
            textSize = 14f
            setOnClickListener { promptCustomDuration(r) }
        })
        row.addView(chips)
        // Reject options
        val rejectRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        rejectRow.addView(Button(this).apply {
            text = "Nicht jetzt"
            isAllCaps = false
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 8, 0) }
            setOnClickListener { decide(r, approve = false, durationMinutes = 0, reason = "Nicht jetzt") }
        })
        rejectRow.addView(Button(this).apply {
            text = "Heute nicht"
            isAllCaps = false
            textSize = 12f
            setOnClickListener { decide(r, approve = false, durationMinutes = 0, reason = "Heute nicht") }
        })
        row.addView(rejectRow)
        // Divider
        row.addView(android.view.View(this).apply {
            setBackgroundColor(android.graphics.Color.parseColor("#EEEEEE"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 1
            ).apply { setMargins(0, 8, 0, 0) }
        })
        return row
    }

    private fun promptCustomDuration(r: DogeRequest) {
        val suggested = manager.suggestApprovalDuration(r.contentDescription)
        val durationInput = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
            setText(suggested.toString())
        }
        AlertDialog.Builder(this)
            .setTitle("Genehmigen: ${r.contentDescription}")
            .setMessage("Dauer in Minuten:")
            .setView(durationInput)
            .setPositiveButton("Genehmigen") { _, _ ->
                val minutes = durationInput.text.toString().toIntOrNull()
                if (minutes == null || minutes <= 0) {
                    toast("Bitte gültige Minutenzahl eingeben")
                    return@setPositiveButton
                }
                decide(r, approve = true, durationMinutes = minutes)
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun formatAge(requestedAt: Long): String {
        val ageMs = System.currentTimeMillis() - requestedAt
        val mins = (ageMs / 60_000).toInt()
        return when {
            mins < 1 -> "gerade eben"
            mins < 60 -> "vor $mins Min"
            mins < 24 * 60 -> "vor ${mins / 60} Std"
            else -> "vor ${mins / 1440} Tag(en)"
        }
    }

    private fun decide(
        r: DogeRequest,
        approve: Boolean,
        durationMinutes: Int,
        reason: String = "Nicht jetzt"
    ) {
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val updated = if (approve) {
                        manager.approveRequest(r, "Eltern", durationMinutes)
                    } else {
                        manager.rejectRequest(r, "Eltern", reason)
                    }
                    database.dogeRequestDao().updateRequest(updated.toEntity())
                }
                toast(if (approve) "Genehmigt: $durationMinutes Min" else "Abgelehnt — $reason")
            } catch (e: IllegalStateException) {
                toast("Nicht möglich: ${e.message}")
            }
            showParentView()
        }
    }

    // ─── Child view ─────────────────────────────────────────────────────────────────

    private fun showChildView() {
        content.removeAllViews()
        content.addView(label("Was möchtest du sehen?", size = 20f, topPad = 0))

        val prefillText = prefillPkg?.let { pkg ->
            try {
                packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
            } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
                android.util.Log.w("DogeRequests", "Package not found for prefill: $pkg", e)
                pkg
            }
        }
        val input = EditText(this).apply {
            hint = "z.B. 'YouTube – Minecraft Tutorials'"
            inputType = InputType.TYPE_CLASS_TEXT
            prefillText?.let { setText(it) }
        }
        content.addView(input)
        content.addView(Button(this).apply {
            text = "Anfragen"
            layoutParams = matchWidth()
            setOnClickListener {
                val text = input.text.toString()
                if (text.isBlank()) {
                    toast("Bitte etwas eingeben")
                    return@setOnClickListener
                }
                createRequest(text) { input.text.clear() }
            }
        })

        content.addView(label("Genehmigt (läuft):"))
        val activeHolder = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(activeHolder)

        content.addView(label("Wartet auf Mama/Papa:"))
        val pendingHolder = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(pendingHolder)

        scope.launch {
            val models = withContext(Dispatchers.IO) {
                database.dogeRequestDao().getAllRequests().map { it.toModel() }
            }
            val active = manager.getActiveApprovals(models)
            val pending = manager.getPendingRequests(models)

            if (active.isEmpty()) {
                activeHolder.addView(label("(Nichts genehmigt gerade)", size = 14f, topPad = 4))
            } else {
                for (r in active) {
                    val remaining = manager.getTimeRemaining(r) ?: 0
                    activeHolder.addView(TextView(this@DogeRequestsActivity).apply {
                        text = "• ${r.contentDescription} — noch $remaining Min"
                        setPadding(8, 6, 8, 6)
                    })
                }
            }

            if (pending.isEmpty()) {
                pendingHolder.addView(label("(Keine offenen Anfragen)", size = 14f, topPad = 4))
            } else {
                for (r in pending) pendingHolder.addView(TextView(this@DogeRequestsActivity).apply {
                    text = "• ${r.contentDescription}"
                    setPadding(8, 6, 8, 6)
                })
            }
        }
    }

    private fun createRequest(text: String, onDone: () -> Unit) {
        scope.launch {
            withContext(Dispatchers.IO) {
                val request = manager.createRequest(text)
                database.dogeRequestDao().insertRequest(request.toEntity())
            }
            // Notify parent
            org.fossify.home.helpers.NotificationHelper.notifyDogeRequest(this@DogeRequestsActivity, text)
            toast("Anfrage gesendet — Mama/Papa werden benachrichtigt")
            onDone()
            showChildView()
        }
    }

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
