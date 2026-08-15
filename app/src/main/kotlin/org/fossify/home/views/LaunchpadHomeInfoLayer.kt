package org.fossify.home.views

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import org.fossify.home.helpers.TimeBudgetState
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/**
 * A quiet, launcher-native status cluster. It is intentionally not an AppWidget: it neither
 * consumes grid cells nor participates in the launcher's drag, resize or widget-host lifecycle.
 */
class LaunchpadHomeInfoLayer @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : ViewGroup(context, attrs) {
    private val remaining = StatusCard(context, CardKind.REMAINING)
    private val clock = StatusCard(context, CardKind.CLOCK)
    private val range = StatusCard(context, CardKind.RANGE)
    private var topInset = 0
    private var bottomInset = 0

    init {
        isClickable = false
        isFocusable = false
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
        addView(remaining)
        addView(clock)
        addView(range)
        setOnApplyWindowInsetsListener { _, insets ->
            topInset = insets.systemWindowInsetTop
            bottomInset = insets.systemWindowInsetBottom
            requestLayout()
            insets
        }
    }

    fun render(state: TimeBudgetState, inCooldown: Boolean = false, cooldownMinutes: Int = 0) {
        remaining.primary = when {
            state.unlimitedForToday -> "FREI"
            inCooldown -> "$cooldownMinutes MIN"
            else -> "${state.remainingToday} MIN"
        }
        remaining.secondary = when {
            state.unlimitedForToday -> "HEUTE UNBEGRENZT"
            inCooldown -> "PAUSE"
            else -> "RESTZEIT"
        }
        range.primary = when {
            state.unlimitedForToday -> "kein Zeitlimit"
            inCooldown -> "Pause · noch ca. ${duration(cooldownMinutes)}"
            state.locked -> "für heute gesperrt"
            else -> "reicht noch ca. ${duration(state.remainingToday)}"
        }
        range.secondary = "ZEITSTATUS"
        updateClock()
    }

    fun updateClock(now: LocalTime = LocalTime.now()) {
        clock.primary = now.format(CLOCK_FORMAT)
        clock.secondary = "UHR"
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val height = MeasureSpec.getSize(heightMeasureSpec)
        setMeasuredDimension(width, height)
        val region = ((height - topInset - bottomInset) * MAX_HEIGHT_FRACTION).toInt()
            .coerceAtMost(dp(230))
        remaining.measure(exact((width * .52f).toInt()), exact((region * .55f).toInt()))
        clock.measure(exact((width * .35f).toInt()), exact((region * .38f).toInt()))
        range.measure(exact((width * .48f).toInt().coerceAtLeast(dp(166))), exact((region * .28f).toInt()))
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        val margin = dp(14)
        val startY = topInset + dp(8)
        remaining.layout(margin, startY, margin + remaining.measuredWidth, startY + remaining.measuredHeight)
        val clockRight = width - margin
        val clockTop = startY + dp(9)
        clock.layout(clockRight - clock.measuredWidth, clockTop, clockRight, clockTop + clock.measuredHeight)
        val rangeLeft = width - margin - range.measuredWidth - dp(11)
        val rangeTop = startY + remaining.measuredHeight + dp(5)
        range.layout(rangeLeft, rangeTop, rangeLeft + range.measuredWidth, rangeTop + range.measuredHeight)
    }

    private fun exact(size: Int) = MeasureSpec.makeMeasureSpec(size, MeasureSpec.EXACTLY)
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun duration(minutes: Int): String = when {
        minutes < 60 -> "$minutes min"
        minutes % 60 == 0 -> "${minutes / 60} h"
        else -> "${minutes / 60} h ${minutes % 60} min"
    }

    companion object {
        private const val MAX_HEIGHT_FRACTION = .34f
        private val CLOCK_FORMAT = DateTimeFormatter.ofPattern("HH:mm")
    }
}

private enum class CardKind { REMAINING, CLOCK, RANGE }

/** One reusable outlined surface; typography and opacity vary by information priority. */
private class StatusCard(context: Context, private val kind: CardKind) : View(context) {
    var primary: String = "—"
        set(value) { field = value; contentDescription = "$secondary $value"; invalidate() }
    var secondary: String = ""
        set(value) { field = value; contentDescription = "$value $primary"; invalidate() }

    private val density = resources.displayMetrics.density
    private val shadow = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xB81E293B.toInt() }
    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = when (kind) {
            CardKind.REMAINING -> 0xE33164B3.toInt()
            CardKind.CLOCK -> 0xC8111C2D.toInt()
            CardKind.RANGE -> 0xB8FFF4CC.toInt()
        }
    }
    private val outline = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFF1E293B.toInt(); style = Paint.Style.STROKE; strokeWidth = 2.5f * density
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
    }

    init { isClickable = false; isFocusable = false }

    override fun onDraw(canvas: Canvas) {
        val radius = 12f * density
        val shadowBounds = RectF(4f * density, 5f * density, width.toFloat(), height.toFloat())
        canvas.drawRoundRect(shadowBounds, radius, radius, shadow)
        val card = RectF(0f, 0f, width - 4f * density, height - 5f * density)
        canvas.drawRoundRect(card, radius, radius, fill)
        canvas.drawRoundRect(card, radius, radius, outline)
        val darkText = kind == CardKind.RANGE
        textPaint.color = if (darkText) 0xFF1E293B.toInt() else Color.WHITE
        textPaint.textSize = when (kind) {
            CardKind.REMAINING -> 31f * density
            CardKind.CLOCK -> 27f * density
            CardKind.RANGE -> 13f * density
        }
        val x = 12f * density
        val mainY = if (kind == CardKind.RANGE) height * .58f else height * .62f
        canvas.drawText(primary, x, mainY, textPaint)
        textPaint.textSize = 9f * density
        textPaint.letterSpacing = .12f
        textPaint.color = if (darkText) 0xC41E293B.toInt() else 0xD9FFE08B.toInt()
        canvas.drawText(secondary, x, height - 11f * density, textPaint)
        textPaint.letterSpacing = 0f
    }
}
