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
import org.fossify.home.databases.AppTimeLimit
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.ChangeLogEntity
import org.fossify.home.helpers.AppLimitBonus
import org.fossify.home.helpers.CategorySuggester
import org.fossify.home.helpers.LaunchpadConstants
import org.fossify.home.helpers.LaunchpadPrefs
import java.util.UUID

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
    // packageName → per-app limit (weekday + weekend caps)
    private var appLimits: Map<String, AppTimeLimit> = emptyMap()
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
        val verlaufBtn = Button(this).apply {
            text = "Verlauf"
            isAllCaps = false
            textSize = 13f
            setTextColor(android.graphics.Color.parseColor("#CCFFFFFF"))
            setBackgroundColor(android.graphics.Color.TRANSPARENT)
            setOnClickListener { showChangeLog() }
        }
        toolbar.addView(
            verlaufBtn,
            androidx.appcompat.widget.Toolbar.LayoutParams(
                androidx.appcompat.widget.Toolbar.LayoutParams.WRAP_CONTENT,
                androidx.appcompat.widget.Toolbar.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.END
            )
        )
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
                "Tippe auf „Frei\" / „🪙 Coins\", um zu wählen, ob die App Doge-Coins kostet.\n" +
                "⏱ = Tageslimit pro App (nur für 🪙-Apps)."
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
        val snapshot = allApps
        val batchId = UUID.randomUUID().toString()
        scope.launch(Dispatchers.IO) {
            val entries = pkgs.mapNotNull { p ->
                val cur = snapshot.find { it.first == p } ?: return@mapNotNull null
                if (cur.third == null) return@mapNotNull null // not whitelisted — skip
                ChangeLogEntity(
                    batchId = batchId, packageName = p, label = cur.second,
                    prevCategory = cur.third, newCategory = category
                )
            }
            if (entries.isNotEmpty()) db.changeLogDao().insertAll(entries)
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
                Toast.makeText(
                    this@AppsManagementActivity, "${pkgs.size} App(s) aktualisiert", Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun applyBulkRemove() {
        val pkgs = selectedPkgs.toList()
        val snapshot = allApps
        val batchId = UUID.randomUUID().toString()
        scope.launch(Dispatchers.IO) {
            val entries = pkgs.mapNotNull { p ->
                val cur = snapshot.find { it.first == p } ?: return@mapNotNull null
                if (cur.third == null) return@mapNotNull null // already not whitelisted
                ChangeLogEntity(
                    batchId = batchId, packageName = p, label = cur.second,
                    prevCategory = cur.third, newCategory = null
                )
            }
            if (entries.isNotEmpty()) db.changeLogDao().insertAll(entries)
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
            val (allowedMap, limitsMap) = withContext(Dispatchers.IO) {
                Pair(
                    db.allowedAppDao().getAll().associate { it.packageName to it.category },
                    db.appTimeLimitDao().getAll().associateBy { it.packageName }
                )
            }
            appLimits = limitsMap

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

                if (isLeisure) {
                    val limitLabel = limitLabelFor(appLimits[pkg])
                    row.addView(Button(this).apply {
                        text = limitLabel
                        textSize = 12f
                        isAllCaps = false
                        setTextColor(android.graphics.Color.parseColor("#CCCCCC"))
                        setBackgroundColor(android.graphics.Color.parseColor("#1A3A5C"))
                        setPadding(16, 8, 16, 8)
                        layoutParams = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        )
                        setOnClickListener { showTimeLimitDialog(pkg) }
                    })
                }
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

    private fun limitLabelFor(limit: AppTimeLimit?): String {
        if (limit == null) return "⏱ ∞"
        val d = limit.dailyMinutes
        val w = limit.weekendMinutes
        fun cap(m: Int) = if (m == 0) "∞" else m.toString()
        return when {
            d == 0 && w == 0 -> "⏱ ∞"
            d == w -> "⏱ ${d}m"
            else -> "⏱ ${cap(d)}/${cap(w)}" // Schultag/Wochenende
        }
    }

    private fun showTimeLimitDialog(pkg: String) {
        val current = appLimits[pkg]
        var daily = current?.dailyMinutes ?: 0
        var weekend = current?.weekendMinutes ?: 0

        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(android.graphics.Color.parseColor("#0D2847"))
            setPadding(48, 24, 48, 16)
            addView(TextView(this@AppsManagementActivity).apply {
                text = "0 = kein Limit"
                textSize = 12f
                setTextColor(android.graphics.Color.parseColor("#99FFFFFF"))
                setPadding(0, 0, 0, 12)
            })
            addView(stepperRow("Schultag (Mo–Fr)", "min", daily, 0, 180, 15) { daily = it })
            addView(stepperRow("Wochenende (Sa/So)", "min", weekend, 0, 180, 15) { weekend = it })
        }

        val builder = AlertDialog.Builder(this)
            .setTitle("Tageslimit pro App")
            .setView(panel)
            .setPositiveButton("Speichern") { _, _ ->
                scope.launch(Dispatchers.IO) {
                    if (daily <= 0 && weekend <= 0) {
                        db.appTimeLimitDao().delete(pkg)
                    } else {
                        db.appTimeLimitDao().upsert(AppTimeLimit(pkg, daily, weekend))
                    }
                    appLimits = db.appTimeLimitDao().getAll().associateBy { it.packageName }
                    withContext(Dispatchers.Main) { renderList() }
                }
            }
            .setNegativeButton("Abbrechen", null)

        // A one-off "today only" bonus only makes sense when today already has a cap.
        val today = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK)
        if ((current?.minutesForDay(today) ?: 0) > 0) {
            builder.setNeutralButton("Heute +15 Min") { _, _ -> grantTodayBonus(pkg, 15) }
        }
        builder.show()
    }

    private fun grantTodayBonus(pkg: String, minutes: Int) {
        val total = AppLimitBonus.addTodayBonus(this, pkg, minutes, todayMidnight())
        Toast.makeText(this, "Heute +$total Min für diese App", Toast.LENGTH_SHORT).show()
    }

    private fun todayMidnight(): Long {
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    private fun toggleApp(pkg: String, enable: Boolean, currentCategory: String?) {
        val suggested = if (enable && currentCategory == null) CategorySuggester.suggest(pkg) else null
        val newCategory = if (enable) {
            currentCategory ?: suggested ?: LaunchpadConstants.CATEGORY_NEUTRAL
        } else null
        val appLabel = allApps.find { it.first == pkg }?.second ?: pkg
        val batchId = UUID.randomUUID().toString()
        scope.launch(Dispatchers.IO) {
            db.changeLogDao().insertAll(listOf(
                ChangeLogEntity(
                    batchId = batchId,
                    packageName = pkg,
                    label = appLabel,
                    prevCategory = currentCategory,
                    newCategory = newCategory
                )
            ))
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
        val appLabel = allApps.find { it.first == pkg }?.second ?: pkg
        val batchId = UUID.randomUUID().toString()
        scope.launch(Dispatchers.IO) {
            db.changeLogDao().insertAll(listOf(
                ChangeLogEntity(
                    batchId = batchId,
                    packageName = pkg,
                    label = appLabel,
                    prevCategory = currentCategory,
                    newCategory = newCategory
                )
            ))
            db.allowedAppDao().deleteApp(pkg)
            db.allowedAppDao().insertApp(AllowedApp(packageName = pkg, category = newCategory))
            allApps = allApps.map { (p, l, c) -> Triple(p, l, if (p == pkg) newCategory else c) }
            withContext(Dispatchers.Main) { renderList() }
        }
    }

    // ─── Verlauf / Undo ─────────────────────────────────────────────────────────

    private fun showChangeLog() {
        scope.launch {
            val batchIds = withContext(Dispatchers.IO) { db.changeLogDao().getRecentBatchIds(5) }
            if (batchIds.isEmpty()) {
                AlertDialog.Builder(this@AppsManagementActivity)
                    .setTitle("Verlauf")
                    .setMessage("Keine Änderungen aufgezeichnet.")
                    .setPositiveButton("OK", null)
                    .show()
                return@launch
            }

            val batches = withContext(Dispatchers.IO) {
                batchIds.map { id -> id to db.changeLogDao().getByBatch(id) }
            }

            val message = batches.joinToString("\n\n") { (_, entries) ->
                val time = formatLogAge(entries.first().timestamp)
                "$time: ${batchSummary(entries)}"
            }

            AlertDialog.Builder(this@AppsManagementActivity)
                .setTitle("Letzte Änderungen")
                .setMessage(message)
                .setPositiveButton("Rückgängig (letzte)") { _, _ -> undoBatch(batches.first().first) }
                .setNegativeButton("Schließen", null)
                .show()
        }
    }

    private fun undoBatch(batchId: String) {
        scope.launch(Dispatchers.IO) {
            val entries = db.changeLogDao().getByBatch(batchId)
            for (entry in entries) {
                if (entry.prevCategory == null) {
                    db.allowedAppDao().deleteApp(entry.packageName)
                } else {
                    db.allowedAppDao().deleteApp(entry.packageName)
                    db.allowedAppDao().insertApp(
                        AllowedApp(packageName = entry.packageName, category = entry.prevCategory)
                    )
                }
                allApps = allApps.map { (p, l, c) ->
                    Triple(p, l, if (p == entry.packageName) entry.prevCategory else c)
                }
            }
            db.changeLogDao().deleteByBatch(batchId)
            withContext(Dispatchers.Main) {
                renderList()
                Toast.makeText(this@AppsManagementActivity, "Rückgängig gemacht", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun batchSummary(entries: List<ChangeLogEntity>): String {
        if (entries.size == 1) {
            val e = entries.first()
            val from = categoryLabel(e.prevCategory ?: "")
            val to = categoryLabel(e.newCategory ?: "")
            return when {
                e.prevCategory == null -> "${e.label} hinzugefügt ($to)"
                e.newCategory == null -> "${e.label} entfernt (war: $from)"
                else -> "${e.label}: $from → $to"
            }
        }
        val op = when {
            entries.all { it.newCategory == null } -> "entfernt"
            entries.all { it.newCategory == entries.first().newCategory } ->
                "→ ${categoryLabel(entries.first().newCategory ?: "")}"
            else -> "geändert"
        }
        return "${entries.size} Apps $op"
    }

    private fun formatLogAge(timestamp: Long): String {
        val mins = ((System.currentTimeMillis() - timestamp) / 60_000).toInt()
        return when {
            mins < 1 -> "gerade eben"
            mins < 60 -> "vor $mins Min"
            mins < 24 * 60 -> "vor ${mins / 60} Std"
            else -> "vor ${mins / 1440} Tag(en)"
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
