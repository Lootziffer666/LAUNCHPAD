// File: app/src/main/kotlin/org/fossify/home/activities/SetupActivity.kt
// LAUNCHPAD first-run wizard: PIN → Startguthaben → Fertig.

package org.fossify.home.activities

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.app.AlertDialog
import android.provider.Settings
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
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
import org.fossify.home.databases.CryptoCashTransaction
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.LaunchpadPrefs
import org.fossify.home.helpers.PinGateHelper
import org.fossify.home.helpers.UsageTracker
import org.fossify.home.ui.GameMenuUi

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically; literals are paddings/colors/sizes
class SetupActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var currentStep = 1
    private var chosenBalance = 60

    // Views we need to reference across steps
    private lateinit var content: LinearLayout
    private lateinit var nextBtn: Button
    private lateinit var dot1: android.view.View
    private lateinit var dot2: android.view.View
    private lateinit var dot3: android.view.View
    private lateinit var dot4: android.view.View
    private var coreSaved = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val screen = GameMenuUi.install(this, "Einrichten")
        screen.addView(LinearLayout(this).apply {
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, resources.displayMetrics.density.times(16).toInt())
            dot1 = stepDot(); addView(dot1)
            dot2 = stepDot(); addView(dot2)
            dot3 = stepDot(); addView(dot3)
            dot4 = stepDot(); addView(dot4)
        })
        content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        screen.addView(content)
        nextBtn = GameMenuUi.rawButton(this, GameMenuUi.YELLOW)
        screen.addView(nextBtn)

        showStep(1)
        nextBtn.setOnClickListener { advance() }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    override fun onResume() {
        super.onResume()
        // The parent may leave to grant Usage Access or pick apps — refresh the checklist.
        if (currentStep == 4) showStep(4)
    }

    private fun showStep(step: Int) {
        content.removeAllViews()
        currentStep = step
        updateDots()
        when (step) {
            1 -> buildWelcome()
            2 -> buildPin()
            3 -> buildBalance()
            4 -> buildNextSteps()
        }
    }

    private fun updateDots() {
        val active = GameMenuUi.YELLOW
        val inactive = GameMenuUi.HIGH
        dot1.setBackgroundColor(if (currentStep >= 1) active else inactive)
        dot2.setBackgroundColor(if (currentStep >= 2) active else inactive)
        dot3.setBackgroundColor(if (currentStep >= 3) active else inactive)
        dot4.setBackgroundColor(if (currentStep >= 4) active else inactive)
    }

    // ─── Step 1: Welcome ──────────────────────────────────────────────────────

    private fun buildWelcome() {
        nextBtn.text = "Einrichten →"
        title("🚀 Willkommen bei LAUNCHPAD")
        body(
            "Ein fairer Launcher mit Zeitlimits, Versprechen und klaren Regeln.\n\n" +
                "Wie heißt dein Kind?"
        )
        content.addView(spacer(16))
        nameField = GameMenuUi.field(this, "Name des Kindes").apply {
            setText(ChildProfile.name(this@SetupActivity))
            setSingleLine()
        }
        content.addView(nameField)
    }

    private lateinit var nameField: EditText

    // ─── Step 2: PIN ──────────────────────────────────────────────────────────

    private lateinit var pinField1: EditText
    private lateinit var pinField2: EditText

    private fun buildPin() {
        nextBtn.text = "Weiter →"
        title("🔒 Eltern-PIN festlegen")
        body("Mit diesem PIN öffnest du den Eltern-Modus. Mindestens 4 Ziffern.")

        pinField1 = GameMenuUi.field(this, "PIN eingeben").apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        }
        content.addView(spacer(16))
        content.addView(pinField1)

        pinField2 = GameMenuUi.field(this, "PIN wiederholen").apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        }
        content.addView(spacer(12))
        content.addView(pinField2)
    }

    private fun validateAndSavePin(): Boolean {
        val p1 = pinField1.text.toString()
        val p2 = pinField2.text.toString()
        return when {
            p1.length < 4 -> { toast("PIN muss mindestens 4 Ziffern haben"); false }
            p1 != p2 -> { toast("PINs stimmen nicht überein"); false }
            else -> {
                val helper = PinGateHelper(this)
                helper.setPinCode(p1)
                val recoveryCode = helper.setRecoveryCode()
                showRecoveryCodeDialog(recoveryCode)
                true
            }
        }
    }

    private fun showRecoveryCodeDialog(code: String) {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 32, 48, 16)
            addView(android.widget.TextView(this@SetupActivity).apply {
                text = "Falls du deinen PIN vergisst, kannst du ihn mit diesem Code zurücksetzen:"
                textSize = 14f
                setTextColor(android.graphics.Color.parseColor("#333333"))
                setPadding(0, 0, 0, 24)
            })
            addView(android.widget.TextView(this@SetupActivity).apply {
                text = code
                textSize = 28f
                setTypeface(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD)
                setTextColor(android.graphics.Color.parseColor("#FF6B35"))
                gravity = android.view.Gravity.CENTER
                setPadding(0, 8, 0, 24)
            })
            addView(android.widget.TextView(this@SetupActivity).apply {
                text = "Bitte notiere diesen Code an einem sicheren Ort. " +
                    "Er wird nur dieses eine Mal angezeigt und kann nicht wiederhergestellt werden."
                textSize = 13f
                setTextColor(android.graphics.Color.parseColor("#666666"))
            })
        }
        val dialog = AlertDialog.Builder(this)
            .setTitle("Wiederherstellungscode")
            .setView(box)
            .setPositiveButton("Verstanden, Code notiert") { _, _ -> }
            .setCancelable(false)
            .create()
        GameMenuUi.styleDialog(dialog)
        dialog.show()
    }

    // ─── Step 3: Balance ──────────────────────────────────────────────────────

    private val balanceBtns = mutableMapOf<Int, Button>()

    private fun buildBalance() {
        nextBtn.text = "Weiter →"
        val name = ChildProfile.name(this@SetupActivity)
        title("⏱️ Startguthaben für $name")
        body("Wie viel Bildschirmzeit bekommt $name zum Start? Du kannst das jederzeit ändern.")
        content.addView(spacer(24))

        for (minutes in listOf(30, 60, 90, 120)) {
            val btn = GameMenuUi.rawButton(this).apply {
                text = "$minutes Minuten"
                GameMenuUi.styleChoice(this, minutes == chosenBalance)
                setPadding(0, 16, 0, 16)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 8, 0, 8) }
                setOnClickListener {
                    this@SetupActivity.chosenBalance = minutes
                    balanceBtns.forEach { (m, b) ->
                        val sel = this@SetupActivity.chosenBalance
                        GameMenuUi.styleChoice(b, m == sel)
                    }
                }
            }
            balanceBtns[minutes] = btn
            content.addView(btn)
        }
    }

    /** Persist PIN-step results (balance + setup_done) once, then show the next-steps checklist. */
    private fun finishCoreSetup() {
        if (coreSaved) {
            showStep(4)
            return
        }
        coreSaved = true
        val balance = chosenBalance
        scope.launch {
            withContext(Dispatchers.IO) {
                val db = AppsDatabase.getInstance(this@SetupActivity)
                db.cryptoCashDao().insertTransaction(
                    CryptoCashTransaction(
                        deltaMinutes = balance,
                        type = LaunchpadConstants.TX_TYPE_EARN,
                        actor = "setup",
                        reasonType = "initial_balance",
                        reasonText = "Startguthaben",
                        childVisibleText = "Startguthaben +$balance Min",
                        source = "setup",
                        balanceAfter = balance
                    )
                )
            }
            getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)
                .edit().putBoolean(LaunchpadPrefs.PREF_SETUP_DONE, true).apply()
            showStep(4)
        }
    }

    private fun goToMain() {
        startActivity(
            Intent(this@SetupActivity, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        )
    }

    // ─── Step 4: Next steps checklist ───────────────────────────────────────────

    private fun buildNextSteps() {
        nextBtn.text = "Los geht's →"
        title("✅ Fast fertig!")
        body(
            "Damit LAUNCHPAD wirkt, fehlen noch diese Schritte. Du kannst sie auch " +
                "jederzeit später im Eltern-Modus erledigen."
        )
        content.addView(spacer(16))
        val list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(list)

        scope.launch {
            val appCount = withContext(Dispatchers.IO) {
                AppsDatabase.getInstance(this@SetupActivity).allowedAppDao().getAllEnabledApps().size
            }
            val usageOk = UsageTracker.hasUsageAccess(this@SetupActivity)
            val enforcement = appPrefs().getBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, false)

            list.removeAllViews()
            list.addView(
                checklistRow(
                    appCount > 0,
                    if (appCount > 0) {
                        "$appCount Apps freigegeben"
                    } else {
                        "Apps für ${ChildProfile.name(this@SetupActivity)} freigeben"
                    },
                    "Öffnen"
                ) { startActivity(Intent(this@SetupActivity, AppsManagementActivity::class.java)) }
            )
            list.addView(
                checklistRow(
                    usageOk,
                    if (usageOk) "Bildschirmzeit-Messung aktiv" else "Bildschirmzeit messen erlauben",
                    if (usageOk) null else "Geben"
                ) { openUsageAccess() }
            )
            list.addView(kindermodusRow(enforcement, appCount))
        }
    }

    private fun kindermodusRow(enforcement: Boolean, appCount: Int): LinearLayout = when {
        enforcement -> checklistRow(true, "Kindermodus ist AN", null, null)
        appCount == 0 -> checklistRow(false, "Kindermodus (erst Apps freigeben)", null, null)
        else -> checklistRow(false, "Kindermodus aktivieren", "An") { enableKindermodus() }
    }

    private fun checklistRow(
        done: Boolean,
        label: String,
        actionLabel: String?,
        action: (() -> Unit)?
    ): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = android.view.Gravity.CENTER_VERTICAL
        setPadding(0, 14, 0, 14)
        addView(TextView(this@SetupActivity).apply {
            text = if (done) "✅" else "⬜"
            textSize = 18f
            setPadding(0, 0, 16, 0)
        })
        addView(TextView(this@SetupActivity).apply {
            text = label
            textSize = 15f
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        })
        if (actionLabel != null && action != null) {
            addView(GameMenuUi.rawButton(this@SetupActivity, GameMenuUi.BLUE).apply {
                text = actionLabel
                isAllCaps = false
                setPadding(28, 8, 28, 8)
                setOnClickListener { action() }
            })
        }
    }

    private fun appPrefs() =
        applicationContext.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

    private fun openUsageAccess() {
        try {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        } catch (e: Exception) {
            android.util.Log.w("LAUNCHPAD", "Usage-access settings unavailable", e)
            toast("Einstellungen nicht verfügbar")
        }
    }

    private fun enableKindermodus() {
        appPrefs().edit().putBoolean(LaunchpadPrefs.PREF_ENFORCEMENT_ENABLED, true).apply()
        toast("Kindermodus AN — du kannst ihn im Eltern-Modus wieder ausschalten")
        showStep(4)
    }

    // ─── Navigation ───────────────────────────────────────────────────────────

    private fun advance() {
        when (currentStep) {
            1 -> {
                ChildProfile.setName(this, nameField.text.toString())
                showStep(2)
            }
            2 -> if (validateAndSavePin()) showStep(3)
            3 -> finishCoreSetup()
            4 -> goToMain()
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun title(text: String) {
        content.addView(GameMenuUi.title(this, text))
    }

    private fun body(text: String) {
        content.addView(GameMenuUi.body(this, text))
    }

    private fun stepDot() = android.view.View(this).apply {
        val size = (10 * resources.displayMetrics.density).toInt()
        layoutParams = LinearLayout.LayoutParams(size, size).apply {
            val margin = (4 * resources.displayMetrics.density).toInt()
            setMargins(margin, margin, margin, margin)
        }
    }

    private fun spacer(dp: Int) = android.view.View(this).apply {
        layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
            (dp * resources.displayMetrics.density).toInt())
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_LONG).show()

    // ─── Back press: only allow on step 2+ ───────────────────────────────────

    @Deprecated("Deprecated in Java")
    @Suppress("GestureBackNavigation")
    override fun onBackPressed() {
        if (currentStep > 1) showStep(currentStep - 1) else super.onBackPressed()
    }
}
