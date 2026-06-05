// File: app/src/main/kotlin/org/fossify/home/activities/WeekScheduleActivity.kt
// LAUNCHPAD: Per-day time-window editor — parents set when ACTIVE_LEISURE apps are unlocked.

package org.fossify.home.activities

import android.os.Bundle
import android.widget.Button
import android.widget.CheckBox
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
import org.fossify.home.databases.WeekScheduleEntry
import org.fossify.home.helpers.ChildProfile
import java.util.Calendar

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class WeekScheduleActivity : AppCompatActivity() {

    private lateinit var db: AppsDatabase
    private lateinit var content: LinearLayout
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // In-memory edits: dayOfWeek → draft entry
    private val drafts = mutableMapOf<Int, WeekScheduleEntry>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = AppsDatabase.getInstance(this)
        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        setContentView(ScrollView(this).apply { addView(content) })
        loadSchedule()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    private fun loadSchedule() {
        scope.launch {
            val saved = withContext(Dispatchers.IO) {
                db.weekScheduleDao().getAll().associateBy { it.dayOfWeek }
            }
            // Initialise drafts — use saved values or defaults
            DAY_ORDER.forEach { day ->
                drafts[day] = saved[day] ?: WeekScheduleEntry(
                    dayOfWeek = day,
                    active = false,
                    allowedFromHour = 15,
                    allowedUntilHour = 20
                )
            }
            renderSchedule()
        }
    }

    private fun renderSchedule() {
        content.removeAllViews()
        content.addView(header("Wochenplan"))
        content.addView(hint(
            "Lege fest, von wann bis wann ${ChildProfile.name(this)} 🪙 Coins-Apps nutzen darf. " +
                "Das erste Häkchen aktiviert die Einschränkung für diesen Tag."
        ))

        DAY_ORDER.forEach { day ->
            content.addView(buildDayRow(day))
        }

        content.addView(saveButton())
    }

    @Suppress("LongMethod")
    private fun buildDayRow(day: Int): LinearLayout {
        val draft = drafts[day]!!
        val dayName = DAY_NAMES[day] ?: "Tag $day"

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 16, 0, 16)
        }

        // Row 1: checkbox + day name
        val checkRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
        }
        val cb = CheckBox(this).apply {
            text = dayName
            isChecked = draft.active
            textSize = 16f
            setTypeface(null, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        checkRow.addView(cb)
        card.addView(checkRow)

        // Row 2: Von / Bis steppers (only visible when active)
        val windowRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding(0, 8, 0, 4)
            visibility = if (draft.active) android.view.View.VISIBLE else android.view.View.GONE
        }

        val fromView = hourView(draft.allowedFromHour)
        val untilView = hourView(draft.allowedUntilHour)

        windowRow.addView(TextView(this).apply {
            text = "Von"
            textSize = 14f
            setPadding(0, 0, 8, 0)
        })
        windowRow.addView(hourMinus(fromView, step = 1, min = 0) { v ->
            drafts[day] = drafts[day]!!.copy(allowedFromHour = v)
        })
        windowRow.addView(fromView)
        windowRow.addView(hourPlus(fromView, step = 1, max = 23) { v ->
            drafts[day] = drafts[day]!!.copy(allowedFromHour = v)
        })

        windowRow.addView(TextView(this).apply {
            text = "  bis"
            textSize = 14f
            setPadding(16, 0, 8, 0)
        })
        windowRow.addView(hourMinus(untilView, step = 1, min = 1) { v ->
            drafts[day] = drafts[day]!!.copy(allowedUntilHour = v)
        })
        windowRow.addView(untilView)
        windowRow.addView(hourPlus(untilView, step = 1, max = 24) { v ->
            drafts[day] = drafts[day]!!.copy(allowedUntilHour = v)
        })

        card.addView(windowRow)

        cb.setOnCheckedChangeListener { _, checked ->
            drafts[day] = drafts[day]!!.copy(active = checked)
            windowRow.visibility = if (checked) android.view.View.VISIBLE else android.view.View.GONE
        }

        // Thin divider
        card.addView(android.view.View(this).apply {
            setBackgroundColor(android.graphics.Color.parseColor("#EEEEEE"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 1
            ).apply { setMargins(0, 16, 0, 0) }
        })

        return card
    }

    private fun hourView(initial: Int) = TextView(this).apply {
        text = "%02d:00".format(initial)
        textSize = 15f
        setTypeface(null, android.graphics.Typeface.BOLD)
        gravity = android.view.Gravity.CENTER
        setPadding(8, 0, 8, 0)
        tag = initial
    }

    private fun hourMinus(
        display: TextView,
        step: Int,
        min: Int,
        onChange: (Int) -> Unit
    ) = Button(this).apply {
        text = "−"
        isAllCaps = false
        textSize = 14f
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        setOnClickListener {
            val cur = display.tag as Int
            if (cur - step >= min) {
                val next = cur - step
                display.text = "%02d:00".format(next)
                display.tag = next
                onChange(next)
            }
        }
    }

    private fun hourPlus(
        display: TextView,
        step: Int,
        max: Int,
        onChange: (Int) -> Unit
    ) = Button(this).apply {
        text = "+"
        isAllCaps = false
        textSize = 14f
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        setOnClickListener {
            val cur = display.tag as Int
            if (cur + step <= max) {
                val next = cur + step
                display.text = "%02d:00".format(next)
                display.tag = next
                onChange(next)
            }
        }
    }

    private fun saveButton() = Button(this).apply {
        text = "Speichern"
        isAllCaps = false
        textSize = 15f
        setTextColor(android.graphics.Color.WHITE)
        setBackgroundColor(android.graphics.Color.parseColor("#0D2847"))
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 32, 0, 0) }
        setOnClickListener { saveAll() }
    }

    private fun saveAll() {
        scope.launch(Dispatchers.IO) {
            db.weekScheduleDao().upsertAll(drafts.values.toList())
            withContext(Dispatchers.Main) {
                Toast.makeText(this@WeekScheduleActivity, "Wochenplan gespeichert", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun header(text: String) = TextView(this).apply {
        this.text = text
        textSize = 20f
        setTypeface(null, android.graphics.Typeface.BOLD)
        setTextColor(android.graphics.Color.parseColor("#0D2847"))
        setPadding(0, 0, 0, 8)
    }

    private fun hint(text: String) = TextView(this).apply {
        this.text = text
        textSize = 13f
        setTextColor(android.graphics.Color.parseColor("#666666"))
        setPadding(0, 0, 0, 24)
    }

    companion object {
        // European week order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        val DAY_ORDER = listOf(
            Calendar.MONDAY,
            Calendar.TUESDAY,
            Calendar.WEDNESDAY,
            Calendar.THURSDAY,
            Calendar.FRIDAY,
            Calendar.SATURDAY,
            Calendar.SUNDAY
        )

        val DAY_NAMES = mapOf(
            Calendar.MONDAY to "Montag",
            Calendar.TUESDAY to "Dienstag",
            Calendar.WEDNESDAY to "Mittwoch",
            Calendar.THURSDAY to "Donnerstag",
            Calendar.FRIDAY to "Freitag",
            Calendar.SATURDAY to "Samstag",
            Calendar.SUNDAY to "Sonntag"
        )
    }
}
