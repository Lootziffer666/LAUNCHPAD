@file:Suppress("MagicNumber", "MaxLineLength")

package org.fossify.home.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import kotlin.math.max

/** Live data rendered by the retro overview supplied in dashboard_retro_gba_edition.html. */
data class RetroOverviewState(
    val name: String,
    val minutes: Int,
    val capacity: Int,
    val status: String,
    val missionSummary: String,
    val promiseSummary: String,
) {
    val progress: Float get() = minutes.toFloat() / max(capacity, 1)
}

enum class RetroOverviewAction { STATUS, MISSIONS, PROMISES }

/**
 * Native, dependency-free rendering of the supplied GBA overview.
 *
 * The three large cards are real touch targets. The status card opens the dual-screen view from
 * dashboard_ds_dual_mode.html; the two menu cards open their existing Launchpad workflows.
 */
class RetroOverviewView(
    context: Context,
    private val onAction: (RetroOverviewAction) -> Unit,
) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val statusRect = RectF()
    private val missionsRect = RectF()
    private val promisesRect = RectF()
    private var pressed: RetroOverviewAction? = null
    private var state = RetroOverviewState(
        name = "Jake",
        minutes = 0,
        capacity = 120,
        status = "BEREIT",
        missionSummary = "Keine offenen Anfragen",
        promiseSummary = "Keine aktiven Pakte",
    )

    init {
        isClickable = true
        isFocusable = true
        minimumHeight = dp(560)
        contentDescription = "Launchpad Übersicht"
    }

    fun render(newState: RetroOverviewState) {
        state = newState
        contentDescription = buildString {
            append("Launchpad Übersicht für ${newState.name}. ")
            append("${newState.minutes} von ${newState.capacity} Minuten. ")
            append("${newState.status}. ${newState.missionSummary}. ${newState.promiseSummary}.")
        }
        invalidate()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val target = hit(event.x, event.y)
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                pressed = target
                invalidate()
            }
            MotionEvent.ACTION_MOVE -> {
                if (pressed != target) {
                    pressed = null
                    invalidate()
                }
            }
            MotionEvent.ACTION_UP -> {
                val selected = pressed
                pressed = null
                invalidate()
                performClick()
                if (selected != null && selected == target) {
                    performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                    onAction(selected)
                }
            }
            MotionEvent.ACTION_CANCEL -> {
                pressed = null
                invalidate()
            }
        }
        return true
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val d = resources.displayMetrics.density
        canvas.drawColor(GameMenuUi.LOWEST)
        drawDotGrid(canvas, d)

        val side = 24f * d
        val top = 20f * d
        drawGreeting(canvas, RectF(width - side - 176f * d, top, width - side, top + 54f * d), d)

        statusRect.set(side, top + 78f * d, width - side - 4f * d, top + 274f * d)
        drawStatusCard(canvas, shifted(statusRect, RetroOverviewAction.STATUS, d), d)

        missionsRect.set(side, top + 294f * d, width - side - 4f * d, top + 390f * d)
        drawMenuCard(
            canvas,
            shifted(missionsRect, RetroOverviewAction.MISSIONS, d),
            accent = 0xFFFFB4A4.toInt(),
            symbol = "⌖",
            title = "MISSIONEN",
            subtitle = state.missionSummary,
            d = d,
        )

        promisesRect.set(side, top + 406f * d, width - side - 4f * d, top + 502f * d)
        drawMenuCard(
            canvas,
            shifted(promisesRect, RetroOverviewAction.PROMISES, d),
            accent = 0xFFABC7FF.toInt(),
            symbol = "✓",
            title = "VERSPRECHEN",
            subtitle = state.promiseSummary,
            d = d,
        )

        val dotsY = minOf(height - 18f * d, top + 532f * d)
        listOf(HandheldPalette.RED, HandheldPalette.YELLOW, HandheldPalette.GREEN).forEachIndexed { index, color ->
            paint.color = color
            canvas.drawCircle(width / 2f + (index - 1) * 14f * d, dotsY, 4f * d, paint)
        }
    }

    private fun drawDotGrid(canvas: Canvas, d: Float) {
        paint.color = GameMenuUi.HIGH
        var x = 8f * d
        while (x < width) {
            var y = 8f * d
            while (y < height) {
                canvas.drawCircle(x, y, 1.5f * d, paint)
                y += 16f * d
            }
            x += 16f * d
        }
    }

    private fun drawGreeting(canvas: Canvas, rect: RectF, d: Float) {
        drawRaisedPanel(canvas, rect, HandheldPalette.YELLOW, HandheldPalette.INK, 18f * d, d)
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = 19f * d
        paint.color = 0xFF241A00.toInt()
        canvas.drawText("HI, ${state.name.uppercase()}!  ✦", rect.centerX(), rect.centerY() + 7f * d, paint)

        val tail = android.graphics.Path().apply {
            moveTo(rect.right - 43f * d, rect.bottom - 1f * d)
            lineTo(rect.right - 24f * d, rect.bottom - 1f * d)
            lineTo(rect.right - 31f * d, rect.bottom + 14f * d)
            close()
        }
        paint.color = HandheldPalette.INK
        canvas.save()
        canvas.translate(3f * d, 5f * d)
        canvas.drawPath(tail, paint)
        canvas.restore()
        paint.color = HandheldPalette.YELLOW
        canvas.drawPath(tail, paint)
    }

    private fun drawStatusCard(canvas: Canvas, rect: RectF, d: Float) {
        drawRaisedPanel(canvas, rect, HandheldPalette.PANEL, HandheldPalette.BLUE, 12f * d, d)

        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f * d
        paint.pathEffect = DashPathEffect(floatArrayOf(5f * d, 5f * d), 0f)
        paint.color = 0x4D3164B3
        canvas.drawRoundRect(
            RectF(rect.left + 9f * d, rect.top + 9f * d, rect.right - 9f * d, rect.bottom - 9f * d),
            8f * d,
            8f * d,
            paint,
        )
        paint.pathEffect = null
        paint.style = Paint.Style.FILL

        val left = rect.left + 20f * d
        val right = rect.right - 20f * d
        paint.textAlign = Paint.Align.LEFT
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textSize = 23f * d
        paint.color = HandheldPalette.INK
        canvas.drawText("ABENTEUERZEIT", left, rect.top + 43f * d, paint)

        val badge = RectF(right - 75f * d, rect.top + 18f * d, right, rect.top + 46f * d)
        paint.color = GameMenuUi.HIGH
        canvas.drawRoundRect(badge, 15f * d, 15f * d, paint)
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f * d
        paint.color = HandheldPalette.INK
        canvas.drawRoundRect(badge, 15f * d, 15f * d, paint)
        paint.style = Paint.Style.FILL
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = 11f * d
        paint.color = Color.WHITE
        canvas.drawText("LVL ${state.minutes.coerceAtLeast(0)}", badge.centerX(), badge.centerY() + 4f * d, paint)

        paint.color = HandheldPalette.INK
        canvas.drawRect(left, rect.top + 57f * d, right, rect.top + 61f * d, paint)
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 12f * d
        canvas.drawText("HP", left, rect.top + 88f * d, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("${state.minutes.coerceAtLeast(0)} / ${state.capacity.coerceAtLeast(0)}", right, rect.top + 88f * d, paint)

        val track = RectF(left, rect.top + 100f * d, right, rect.top + 126f * d)
        paint.color = HandheldPalette.INK
        canvas.drawRoundRect(track, 14f * d, 14f * d, paint)
        val fillWidth = (track.width() - 8f * d) * state.progress.coerceIn(0f, 1f)
        val fillColor = when {
            state.progress <= .15f -> HandheldPalette.RED
            state.progress <= .35f -> HandheldPalette.YELLOW
            else -> HandheldPalette.GREEN
        }
        if (fillWidth > 0f) {
            val fill = RectF(track.left + 4f * d, track.top + 4f * d, track.left + 4f * d + fillWidth, track.bottom - 4f * d)
            paint.color = fillColor
            canvas.drawRoundRect(fill, 10f * d, 10f * d, paint)
            paint.color = 0x33FFFFFF
            canvas.drawRoundRect(RectF(fill.left + 4f * d, fill.top + 2f * d, fill.right - 4f * d, fill.top + 6f * d), 3f * d, 3f * d, paint)
        }

        paint.textAlign = Paint.Align.CENTER
        paint.textSize = 13f * d
        paint.letterSpacing = .08f
        paint.color = fillColor
        canvas.drawText(state.status.uppercase(), rect.centerX(), rect.top + 157f * d, paint)
        paint.letterSpacing = 0f

        paint.textSize = 11f * d
        paint.color = HandheldPalette.BLUE
        canvas.drawText("ANTIPPEN FÜR DEN DUAL-SCREEN", rect.centerX(), rect.top + 181f * d, paint)
    }

    private fun drawMenuCard(
        canvas: Canvas,
        rect: RectF,
        accent: Int,
        symbol: String,
        title: String,
        subtitle: String,
        d: Float,
    ) {
        drawRaisedPanel(canvas, rect, accent, HandheldPalette.INK, 12f * d, d)
        val inner = RectF(rect.left + 5f * d, rect.top + 5f * d, rect.right - 5f * d, rect.bottom - 5f * d)
        paint.color = HandheldPalette.PANEL
        canvas.drawRoundRect(inner, 8f * d, 8f * d, paint)

        val icon = RectF(inner.left + 14f * d, inner.top + 14f * d, inner.left + 66f * d, inner.bottom - 14f * d)
        paint.color = accent
        canvas.drawRoundRect(icon, 8f * d, 8f * d, paint)
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f * d
        paint.color = HandheldPalette.INK
        canvas.drawRoundRect(icon, 8f * d, 8f * d, paint)
        paint.style = Paint.Style.FILL
        paint.textAlign = Paint.Align.CENTER
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textSize = 29f * d
        paint.color = HandheldPalette.INK
        canvas.drawText(symbol, icon.centerX(), icon.centerY() + 10f * d, paint)

        val textLeft = icon.right + 16f * d
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 19f * d
        paint.color = HandheldPalette.INK
        canvas.drawText(title, textLeft, rect.top + 42f * d, paint)
        paint.typeface = Typeface.DEFAULT
        paint.textSize = 12f * d
        paint.color = 0xFF5C4039.toInt()
        canvas.drawText(ellipsize(subtitle, rect.right - textLeft - 45f * d), textLeft, rect.top + 65f * d, paint)

        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.RIGHT
        paint.textSize = 24f * d
        paint.color = 0x801E293B.toInt()
        canvas.drawText("›", rect.right - 20f * d, rect.centerY() + 8f * d, paint)
    }

    private fun drawRaisedPanel(canvas: Canvas, rect: RectF, fill: Int, stroke: Int, radius: Float, d: Float) {
        paint.style = Paint.Style.FILL
        paint.color = HandheldPalette.INK
        canvas.drawRoundRect(
            RectF(rect.left + 4f * d, rect.top + 6f * d, rect.right + 4f * d, rect.bottom + 6f * d),
            radius,
            radius,
            paint,
        )
        paint.color = fill
        canvas.drawRoundRect(rect, radius, radius, paint)
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 4f * d
        paint.color = stroke
        canvas.drawRoundRect(rect, radius, radius, paint)
        paint.style = Paint.Style.FILL
    }

    private fun shifted(rect: RectF, action: RetroOverviewAction, d: Float): RectF =
        RectF(rect).apply {
            if (pressed == action) offset(3f * d, 5f * d)
        }

    private fun hit(x: Float, y: Float): RetroOverviewAction? = when {
        statusRect.contains(x, y) -> RetroOverviewAction.STATUS
        missionsRect.contains(x, y) -> RetroOverviewAction.MISSIONS
        promisesRect.contains(x, y) -> RetroOverviewAction.PROMISES
        else -> null
    }

    private fun ellipsize(value: String, maxWidth: Float): String {
        if (paint.measureText(value) <= maxWidth) return value
        var shortened = value
        while (shortened.isNotEmpty() && paint.measureText("$shortened…") > maxWidth) {
            shortened = shortened.dropLast(1)
        }
        return "$shortened…"
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
