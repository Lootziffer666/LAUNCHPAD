// File: app/src/main/kotlin/org/fossify/home/activities/AppsManagementActivity.kt
// LAUNCHPAD: Whitelist app management — searchable list with checkboxes + bulk actions.

package org.fossify.home.activities

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
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
import org.fossify.home.databases.AllowedApp
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.CategorySuggester
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.LaunchpadPrefs

@Suppress("MagicNumber", "TooManyFunctions", "NestedBlockDepth") // UI built programmatically
class AppsManagementActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var db: AppsDatabase
    private lateinit var listHolder: LinearLayout
    private lateinit var searchBox: EditText
    private lateinit var bottomBar: LinearLayout
    private lateinit var bottomBarLabel: TextView
    private lateinit var selectModeBtn: Button

    // packageName → (label, category): category is null when not whitelisted
    private var allApps: List<Triple<String, String, String?>> = emptyList()
    private var filter = ""

    private var selectionMode = false
    private val selectedPkgs = mutableSetOf<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        db = AppsDatabase.getInstance(this)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        val toolbar = androidx.appcompat.widget.Toolbar(this).apply {
            setBackgroundColor(android.graphics.Color.parseColor("#0D2847"))
            title = "Apps verwalten"
            setTitleTextColor(android.graphics.Color.WHITE)
            setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
            setNavigationOnClickListener { finish() }
            navigationIcon?.setTint(android.graphics.Color.WHITE)
        }
        selectModeBtn = Button(this).apply {
            text = "Auswählen"
            isAllCaps = false
            textSize = 13f
            setTextColor(android.graphics.Color.WHITE)
            setBackgroundColor(android.graphics.Color.TRANSPARENT)
            setOnClickListener { toggleSelectionMode() }
        }
        toolbar.addView(
            selectModeBtn,
            androidx.appcompat.widget.Toolbar.LayoutParams(
                androidx.appcompat.widget.Toolbar.LayoutParams.WRAP_CONTENT,
                androidx.appcompat.widget.Toolbar.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.END
            )
        )
        root.addView(
            toolbar,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        searchBox = EditText(this).apply {
            hint = "Apps suchen…"
            setPadding(32, 16, 32, 16)
            inputType = android.text.InputType.TYPE_CLASS_TEXT
            addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) { /* no-op */ }
                override fun onTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) { /* no-op */ }
                override fun afterTextChanged(s: Editable?) { filter = s.toString().lowercase(); renderList() }
            })
        }
        root.addView(
            searchBox,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        val hint = TextView(this).apply {
            text = "Häkchen = Jake darf die App sehen.\n" +
                "Tippe auf „Frei\" / „🪙 Coins\", um zu wählen, ob die App Doge-Coins kostet."
            textSize = 12f
            setPadding(32, 8, 32, 16)
            setTextColor(android.graphics.Color.parseColor("#888888"))
        }
        root.addView(
            hint,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        root.addView(
            buildImpulseOptions(),
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        val scroll = ScrollView(this)
        listHolder = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        scroll.addView(listHolder)
        root.addView(scroll, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))

        bottomBar = buildBottomBar()
        root.addView(
            bottomBar,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        setContentView(root)
        setSupportActionBar(toolbar)

        loadApps()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    // ─── Selection mode ─────────────────────────────────────────────────────────

    private fun toggleSelectionMode() {
        selectionMode = !selectionMode
        if (!selectionMode) selectedPkgs.clear()
        selectModeBtn.text = if (selectionMode) "Fertig" else "Auswählen"
        bottomBar.visibility = if (selectionMode) android.view.View.VISIBLE else android.view.View.GONE
        renderList()
    }

    private fun toggleRowSelection(pkg: String) {
        if (selectedPkgs.contains(pkg)) selectedPkgs.remove(pkg) else selectedPkgs.add(pkg)
        updateBottomBarLabel()
        renderList()
    }

    private fun updateBottomBarLabel() {
        bottomBarLabel.text = "${selectedPkgs.size} ausgewählt"
    }

    private fun buildBottomBar(): LinearLayout {
        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(android.graphics.Color.parseColor("#0D2847"))
            visibility = android.view.View.GONE
        }
        bottomBarLabel = TextView(this).apply {
            text = "0 ausgewählt"
            textSize = 13f
            setTextColor(android.graphics.Color.parseColor("#CCFFFFFF"))
            setPadding(32, 16, 32, 4)
        }
        bar.addView(bottomBarLabel)
        val btnRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(24, 4, 24, 16)
        }
        btnRow.addView(bulkActionButton("🪙 Coins") {
            if (selectedPkgs.isEmpty()) {
                Toast.makeText(this, "Keine Apps ausgewählt", Toast.LENGTH_SHORT).show()
            } else {
                confirmBulkCategory(LaunchpadConstants.CATEGORY_ACTIVE_LEISURE)
            }
        })
        btnRow.addView(bulkActionButton("Frei") {
            if (selectedPkgs.isEmpty()) {
                Toast.makeText(this, "Keine Apps ausgewählt", Toast.LENGTH_SHORT).show()
            } else {
                confirmBulkCategory(LaunchpadConstants.CATEGORY_NEUTRAL)
            }
        })
        btnRow.addView(bulkActionButton("Entfernen") {
            if (selectedPkgs.isEmpty()) {
                Toast.makeText(this, "Keine Apps ausgewählt", Toast.LENGTH_SHORT).show()
            } else {
                confirmBulkRemove()
            }
        })
        bar.addView(btnRow)
        return bar
    }

    private fun bulkActionButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 13f
        setTextColor(android.graphics.Color.WHITE)
        setBackgroundColor(android.graphics.Color.parseColor("#1A4A7A"))
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 0, 12, 0) }
        setOnClickListener { onClick() }
    }

    private fun confirmBulkCategory(category: String) {
        val label = categoryLabel(category)
        AlertDialog.Builder(this)
            .setTitle("Kategorie setzen")
            .setMessage("${selectedPkgs.size} App(s) auf „$label" setzen?")
            .setPositiveButton("Setzen") { _, _ -> applyBulkCategory(category) }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun confirmBulkRemove() {
        AlertDialog.Builder(this)
            .setTitle("Apps entfernen")
            .setMessage("${selectedPkgs.size} App(s) aus Jakes Liste entfernen?")
            .setPositiveButton("Entfernen") { _, _ -> applyBulkRemove() }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun applyBulkCategory(category: String) {
        val pkgs = selectedPkgs.toList()
        scope.launch(Dispatchers.IO) {
            for (pkg in pkgs) {
                db.allowedAppDao().deleteApp(pkg)
                db.allowedAppDao().insertApp(AllowedApp(packageName = pkg, category = category))
            }
            allApps = allApps.map { (p, l, c) ->
                Triple(p, l, if (p in pkgs && c != null) category else c)
            }
            withContext(Dispatchers.Main) {
                selectedPkgs.clear()
                updateBottomBarLabel()
                renderList()
                Toast.makeText(this@AppsManagementActivity, "${pkgs.size} App(s) aktualisiert", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun applyBulkRemove() {
        val pkgs = selectedPkgs.toList()
        scope.launch(Dispatchers.IO) {
            for (pkg in pkgs) db.allowedAppDao().deleteApp(pkg)
            allApps = allApps.map { (p, l, c) -> Triple(p, l, if (p in pkgs) null else c) }
            withContext(Dispatchers.Main) {
                selectedPkgs.clear()
                updateBottomBarLabel()
                renderList()
                Toast.makeText(this@AppsManagementActivity, "${pkgs.size} App(s) entfernt", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ─── List rendering ──────────────────────────────────────────────────────────

    private fun loadApps() {
        scope.launch {
            val pm = packageManager
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val resolved = pm.queryIntentActivities(intent, 0)
            val allowedMap = withContext(Dispatchers.IO) {
                db.allowedAppDao().getAll().associate { it.packageName to it.category }
            }

            allApps = resolved
                .map { ri ->
                    Triple(
                        ri.activityInfo.packageName,
                        ri.loadLabel(pm).toString(),
                        allowedMap[ri.activityInfo.packageName]
                    )
                }
                .filter { (pkg, _, _) -> pkg != packageName }
                .distinctBy { (pkg, _, _) -> pkg }
                .sortedWith(
                    compareByDescending<Triple<String, String, String?>> { (_, _, cat) -> cat != null }
                        .thenBy { (_, label, _) -> label.lowercase() }
                )

            renderList()
        }
    }

    private fun renderList() {
        listHolder.removeAllViews()
        val filtered = allApps.filter { (pkg, label, _) ->
            filter.isEmpty() || label.lowercase().contains(filter) || pkg.lowercase().contains(filter)
        }
        for ((pkg, label, category) in filtered) {
            val enabled = category != null
            val isSelected = selectedPkgs.contains(pkg)
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
                setPadding(32, 0, 32, 0)
                layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 88.dp)
                if (selectionMode) {
                    setBackgroundColor(
                        if (isSelected) android.graphics.Color.parseColor("#1A4A7A")
                        else android.graphics.Color.TRANSPARENT
                    )
                    setOnClickListener { toggleRowSelection(pkg) }
                }
            }

            if (selectionMode) {
                val selCb = CheckBox(this).apply {
                    isChecked = isSelected
                    isClickable = false
                    isFocusable = false
                    setPadding(0, 0, 16, 0)
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    )
                }
                row.addView(selCb)
            }

            val cb = CheckBox(this).apply {
                text = label
                isChecked = enabled
                setPadding(8, 0, 8, 0)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                if (selectionMode) {
                    isClickable = false
                    isFocusable = false
                } else {
                    setOnCheckedChangeListener { _, checked -> toggleApp(pkg, checked, category) }
                }
            }
            row.addView(cb)

            if (enabled && !selectionMode) {
                val isLeisure = category == LaunchpadConstants.CATEGORY_ACTIVE_LEISURE
                val catBtn = Button(this).apply {
                    text = if (isLeisure) "🪙 Coins" else "Frei"
                    textSize = 13f
                    isAllCaps = false
                    setTextColor(android.graphics.Color.WHITE)
                    setBackgroundColor(
                        if (isLeisure) {
                            android.graphics.Color.parseColor("#E8A317")
                        } else {
                            android.graphics.Color.parseColor("#4CAF50")
                        }
                    )
                    setPadding(24, 8, 24, 8)
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    )
                    setOnClickListener { toggleCategory(pkg, category!!) }
                }
                row.addView(catBtn)
            }
            listHolder.addView(row)
        }
        if (filtered.isEmpty()) {
            listHolder.addView(TextView(this).apply {
                text = if (filter.isEmpty()) "Keine Apps gefunden" else "Keine Treffer für \"$filter\""
                setPadding(32, 32, 32, 32)
            })
        }
    }

    private fun toggleApp(pkg: String, enable: Boolean, currentCategory: String?) {
        val suggested = if (enable && currentCategory == null) CategorySuggester.suggest(pkg) else null
        val newCategory = if (enable) {
            currentCategory ?: suggested ?: LaunchpadConstants.CATEGORY_NEUTRAL
        } else null
        scope.launch(Dispatchers.IO) {
            if (enable) {
                db.allowedAppDao().insertApp(AllowedApp(packageName = pkg, category = newCategory!!))
            } else {
                db.allowedAppDao().deleteApp(pkg)
            }
            allApps = allApps.map { (p, l, c) -> Triple(p, l, if (p == pkg) newCategory else c) }
            withContext(Dispatchers.Main) {
                if (suggested != null) {
                    val label = categoryLabel(suggested)
                    Toast.makeText(
                        this@AppsManagementActivity,
                        "Kategorie-Vorschlag: $label",
                        Toast.LENGTH_SHORT
                    ).show()
                }
                renderList()
            }
        }
    }

    private fun categoryLabel(category: String): String = when (category) {
        LaunchpadConstants.CATEGORY_ACTIVE_LEISURE -> "🪙 Coins (Aktive Freizeit)"
        LaunchpadConstants.CATEGORY_CREATIVE -> "🎨 Kreativ"
        LaunchpadConstants.CATEGORY_LEARNING -> "📚 Lernen"
        LaunchpadConstants.CATEGORY_COMMUNICATION -> "💬 Kommunikation"
        LaunchpadConstants.CATEGORY_COOLDOWN -> "😌 Erholung"
        else -> "Neutral"
    }

    private fun toggleCategory(pkg: String, currentCategory: String) {
        val newCategory = if (currentCategory == LaunchpadConstants.CATEGORY_ACTIVE_LEISURE) {
            LaunchpadConstants.CATEGORY_NEUTRAL
        } else {
            LaunchpadConstants.CATEGORY_ACTIVE_LEISURE
        }
        scope.launch(Dispatchers.IO) {
            db.allowedAppDao().deleteApp(pkg)
            db.allowedAppDao().insertApp(AllowedApp(packageName = pkg, category = newCategory))
            allApps = allApps.map { (p, l, c) -> Triple(p, l, if (p == pkg) newCategory else c) }
            withContext(Dispatchers.Main) { renderList() }
        }
    }

    // ─── Impulsbremse options ───────────────────────────────────────────────────
    private fun buildImpulseOptions(): LinearLayout {
        val prefs = getSharedPreferences(LaunchpadPrefs.PREFS_FILE, MODE_PRIVATE)
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 16, 32, 16)
            setBackgroundColor(android.graphics.Color.parseColor("#0D2847"))
        }

        val enabledCb = CheckBox(this).apply {
            text = "🧘 Impulsbremse"
            textSize = 16f
            setTextColor(android.graphics.Color.WHITE)
            isChecked = prefs.getBoolean(LaunchpadPrefs.PREF_IMPULSE_ENABLED, true)
        }
        box.addView(enabledCb)

        box.addView(TextView(this).apply {
            text = "Kurzer Countdown, wenn Jake eine 🪙 Coins-App schnell wieder öffnet. " +
                "Das erste Öffnen bleibt immer frei."
            textSize = 12f
            setTextColor(android.graphics.Color.parseColor("#888888"))
            setPadding(0, 0, 0, 8)
        })

        val detail = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        detail.addView(
            stepperRow(
                label = "Dauer",
                unit = "s",
                initial = prefs.getInt(
                    LaunchpadPrefs.PREF_IMPULSE_SECONDS, LaunchpadConstants.DEFAULT_IMPULSE_SECONDS
                ),
                min = 3, max = 30, step = 1
            ) { v -> prefs.edit().putInt(LaunchpadPrefs.PREF_IMPULSE_SECONDS, v).apply() }
        )
        detail.addView(
            stepperRow(
                label = "Fenster",
                unit = "min",
                initial = prefs.getInt(
                    LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN,
                    LaunchpadConstants.DEFAULT_IMPULSE_REOPEN_WINDOW_MIN
                ),
                min = 1, max = 30, step = 1
            ) { v -> prefs.edit().putInt(LaunchpadPrefs.PREF_IMPULSE_REOPEN_WINDOW_MIN, v).apply() }
        )
        box.addView(detail)
        detail.visibility = if (enabledCb.isChecked) android.view.View.VISIBLE else android.view.View.GONE

        enabledCb.setOnCheckedChangeListener { _, checked ->
            prefs.edit().putBoolean(LaunchpadPrefs.PREF_IMPULSE_ENABLED, checked).apply()
            detail.visibility = if (checked) android.view.View.VISIBLE else android.view.View.GONE
        }
        return box
    }

    private fun stepperRow(
        label: String,
        unit: String,
        initial: Int,
        min: Int,
        max: Int,
        step: Int,
        onChange: (Int) -> Unit
    ): LinearLayout {
        var value = initial
        val valueView = TextView(this).apply {
            text = "$value $unit"
            textSize = 16f
            setTextColor(android.graphics.Color.WHITE)
            gravity = android.view.Gravity.CENTER
            width = 88.dp
        }
        fun apply() { valueView.text = "$value $unit"; onChange(value) }
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding(0, 4, 0, 4)
            addView(TextView(this@AppsManagementActivity).apply {
                text = label
                textSize = 15f
                setTextColor(android.graphics.Color.parseColor("#CCFFFFFF"))
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            })
            addView(Button(this@AppsManagementActivity).apply {
                text = "−"
                setOnClickListener { if (value - step >= min) { value -= step; apply() } }
            })
            addView(valueView)
            addView(Button(this@AppsManagementActivity).apply {
                text = "+"
                setOnClickListener { if (value + step <= max) { value += step; apply() } }
            })
        }
    }

    private val Int.dp get() = (this * resources.displayMetrics.density).toInt()
}
