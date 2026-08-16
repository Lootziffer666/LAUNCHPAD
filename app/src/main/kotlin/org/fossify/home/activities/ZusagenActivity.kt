// File: app/src/main/kotlin/org/fossify/home/activities/ZusagenActivity.kt
// M2: Zusagen (promises) UI for parents and child — wired to Room via ZusageDao + mappers.

package org.fossify.home.activities

import android.app.AlertDialog
import android.os.Bundle
import android.text.InputType
import android.widget.LinearLayout
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
import org.fossify.home.models.Zusage
import org.fossify.home.models.ZusageManager
import org.fossify.home.ui.GameMenuUi
import org.fossify.home.ui.LaunchpadDestination
import org.fossify.home.ui.LaunchpadNavigation

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically; padding/size literals
class ZusagenActivity : AppCompatActivity() {
    private lateinit var database: AppsDatabase
    private val manager = ZusageManager()
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var isParentMode = false

    private lateinit var content: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        database = AppsDatabase.getInstance(this)
        isParentMode = intent.getBooleanExtra("isParentMode", false)

        content = GameMenuUi.install(
            this,
            if (isParentMode) "Zusagen verwalten" else "Zusagen",
            if (isParentMode) null else LaunchpadNavigation.view(this, LaunchpadDestination.QUESTS),
        )

        if (isParentMode) showParentView() else showChildView()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    // ─── Parent view ────────────────────────────────────────────────────────────────

    private fun showParentView() {
        content.removeAllViews()
        content.addView(GameMenuUi.title(this, "Zusagen verwalten"))
        content.addView(GameMenuUi.body(this, "Was versprochen wird, bleibt sichtbar und nachvollziehbar."))

        val textInput = GameMenuUi.field(this).apply {
            hint = "z.B. 'Nach Hausaufgaben, dann 20 Min Minecraft'"
            inputType = InputType.TYPE_CLASS_TEXT
        }
        val conditionInput = GameMenuUi.field(this).apply {
            hint = "Bedingung (optional): z.B. 'Hausaufgaben fertig'"
            inputType = InputType.TYPE_CLASS_TEXT
        }
        content.addView(GameMenuUi.card(this, GameMenuUi.YELLOW) {
            addView(GameMenuUi.panelText(this@ZusagenActivity, "Neue Zusage", strong = true))
            addView(textInput)
            addView(conditionInput)
            addView(GameMenuUi.rawButton(this@ZusagenActivity, GameMenuUi.YELLOW).apply {
                text = "Zusage erstellen"
                layoutParams = matchWidth()
                setOnClickListener {
                    val text = textInput.text.toString()
                    if (text.isBlank()) {
                        toast("Zusage-Text erforderlich")
                        return@setOnClickListener
                    }
                    val condition = conditionInput.text.toString().ifBlank { null }
                    createZusage(text, condition) {
                        textInput.text.clear()
                        conditionInput.text.clear()
                    }
                }
            })
        })

        val pending = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(GameMenuUi.card(this, GameMenuUi.BLUE) {
            addView(GameMenuUi.panelText(this@ZusagenActivity, "Wartende Genehmigungen", strong = true))
            addView(GameMenuUi.panelText(this@ZusagenActivity, "Automatische Genehmigung nach 24 Stunden"))
            addView(pending)
        })

        refreshPending(pending)
    }

    private fun createZusage(text: String, condition: String?, onDone: () -> Unit) {
        scope.launch {
            withContext(Dispatchers.IO) {
                val zusage = manager.createZusage(text, "Eltern", condition)
                database.zusageDao().insertZusage(zusage.toEntity())
            }
            toast("Zusage erstellt — Auto-Genehmigung in 24h")
            onDone()
            // Rebuild parent view so the pending list refreshes.
            showParentView()
        }
    }

    private fun refreshPending(target: LinearLayout) {
        scope.launch {
            val pending = withContext(Dispatchers.IO) {
                val all = database.zusageDao().getAllZusagen().map { it.toModel() }
                manager.getPendingZusagen(all)
            }
            target.removeAllViews()
            if (pending.isEmpty()) {
                target.addView(GameMenuUi.emptyState(this@ZusagenActivity, "Keine wartenden Zusagen"))
                return@launch
            }
            for (z in pending) {
                target.addView(renderPendingRow(z))
            }
        }
    }

    private fun renderPendingRow(z: Zusage): LinearLayout {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 12, 0, 12)
        }
        row.addView(GameMenuUi.panelText(this, z.text + (z.condition?.let { "  (Bedingung: $it)" } ?: ""), strong = true).apply {
            textSize = 15f
        })
        val buttons = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        buttons.addView(GameMenuUi.rawButton(this, GameMenuUi.GREEN).apply {
            text = "Genehmigen"
            setOnClickListener { decide(z, approve = true) }
        })
        buttons.addView(GameMenuUi.rawButton(this, GameMenuUi.RED).apply {
            text = "Ablehnen"
            setOnClickListener { promptReject(z) }
        })
        row.addView(buttons)
        return row
    }

    private fun promptReject(z: Zusage) {
        val reasonInput = GameMenuUi.field(this, "Grund")
        val dialog = AlertDialog.Builder(this)
            .setTitle("Zusage ablehnen")
            .setView(reasonInput)
            .setPositiveButton("Ablehnen") { _, _ ->
                decide(z, approve = false, reason = reasonInput.text.toString().ifBlank { "Abgelehnt" })
            }
            .setNegativeButton("Abbrechen", null)
            .create()
        GameMenuUi.styleDialog(dialog)
        dialog.show()
    }

    private fun decide(z: Zusage, approve: Boolean, reason: String = "") {
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val updated = if (approve) {
                        manager.approveZusage(z, "Eltern")
                    } else {
                        manager.rejectZusage(z, "Eltern", reason)
                    }
                    database.zusageDao().updateZusage(updated.toEntity())
                }
                toast(if (approve) "Zusage genehmigt" else "Zusage abgelehnt")
            } catch (e: IllegalStateException) {
                toast("Nicht möglich: ${e.message}")
            }
            showParentView()
        }
    }

    // ─── Child view (read-only) ──────────────────────────────────────────────────────

    private fun showChildView() {
        content.removeAllViews()
        content.addView(GameMenuUi.title(this, "Mama und Papas Zusagen"))
        content.addView(GameMenuUi.body(this, "Hier siehst du, was Mama und Papa dir versprechen. ✨"))

        val activeHolder = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(GameMenuUi.card(this, GameMenuUi.YELLOW) {
            addView(GameMenuUi.panelText(this@ZusagenActivity, "Das erwartet dich", strong = true))
            addView(activeHolder)
        })

        val fulfilledHolder = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(GameMenuUi.card(this, GameMenuUi.GREEN) {
            addView(GameMenuUi.panelText(this@ZusagenActivity, "Das hat geklappt", strong = true))
            addView(fulfilledHolder)
        })

        scope.launch {
            val all = withContext(Dispatchers.IO) {
                database.zusageDao().getAllZusagen().map { it.toModel() }
            }
            val active = manager.getActiveZusagen(all)
            val fulfilled = all.filter { it.status == "FULFILLED" }

            if (active.isEmpty()) {
                activeHolder.addView(GameMenuUi.emptyState(this@ZusagenActivity, "Noch keine aktiven Zusagen"))
            } else {
                for (z in active) activeHolder.addView(GameMenuUi.panelText(this@ZusagenActivity, "◆ ${z.childVisibleText}").apply {
                    setPadding(8, 6, 8, 6)
                })
            }

            if (fulfilled.isEmpty()) {
                fulfilledHolder.addView(GameMenuUi.emptyState(this@ZusagenActivity, "Noch nichts erfüllt"))
            } else {
                for (z in fulfilled) fulfilledHolder.addView(GameMenuUi.panelText(this@ZusagenActivity, "✓ ${z.text}").apply {
                    setPadding(8, 6, 8, 6)
                })
            }
        }
    }

    private fun matchWidth() = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { setMargins(0, 8, 0, 16) }

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
