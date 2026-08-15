package org.fossify.home.ui

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.GridLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.roundToInt

object HandheldPalette {
    const val INK = 0xFF1E293B.toInt()
    const val BLUE = 0xFF3164B3.toInt()
    const val YELLOW = 0xFFFFCC00.toInt()
    const val GREEN = 0xFF48D0B0.toInt()
    const val RED = 0xFFE35D35.toInt()
    const val PANEL = 0xFFF8FAFC.toInt()
    const val DARK_SCREEN = 0xFF09172A.toInt()
}

data class GameScreenState(
    val name: String,
    val minutes: Int,
    val progress: Float,
    val status: String,
    val paused: Boolean = false,
)

data class GameScreenEvent(
    val message: String,
    val accent: Int = HandheldPalette.YELLOW,
    val durationMillis: Long = 2_600,
    val haptic: Boolean = false,
)

/** Event-capable upper display. Events temporarily replace, then restore, the live state. */
class GameScreen @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val handler = Handler(Looper.getMainLooper())
    private var state = GameScreenState("Jake", 0, 0f, "OFFLINE")
    private var event: GameScreenEvent? = null
    private var eventGeneration = 0

    init {
        setLayerType(LAYER_TYPE_SOFTWARE, null)
        contentDescription = "Spielanzeige"
    }

    fun render(newState: GameScreenState) {
        state = newState
        contentDescription = "${newState.name}, ${newState.minutes} Minuten, ${newState.status}"
        invalidate()
    }

    fun show(event: GameScreenEvent) {
        this.event = event
        val generation = ++eventGeneration
        if (event.haptic) performHapticFeedback(HapticFeedbackConstants.CONFIRM)
        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(this@GameScreen, View.SCALE_X, .94f, 1.04f, 1f),
                ObjectAnimator.ofFloat(this@GameScreen, View.SCALE_Y, .94f, 1.04f, 1f),
            )
            duration = 360
            start()
        }
        handler.postDelayed({
            if (generation == eventGeneration) {
                this.event = null
                invalidate()
            }
        }, event.durationMillis)
        invalidate()
    }

    override fun onDetachedFromWindow() {
        handler.removeCallbacksAndMessages(null)
        super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val d = resources.displayMetrics.density
        val frame = RectF(2 * d, 2 * d, width - 7 * d, height - 9 * d)
        paint.color = HandheldPalette.INK
        paint.setShadowLayer(0f, 0f, 0f, Color.TRANSPARENT)
        canvas.drawRoundRect(frame, 22 * d, 22 * d, paint)
        val screen = RectF(frame.left + 4*d, frame.top + 4*d, frame.right - 4*d, frame.bottom - 4*d)
        paint.color = HandheldPalette.DARK_SCREEN
        paint.setShadowLayer(12*d, 0f, 2*d, 0x99000000.toInt())
        canvas.drawRoundRect(screen, 18*d, 18*d, paint)
        paint.clearShadowLayer()

        // Restrained LCD scanlines, drawn in code rather than as an image asset.
        paint.color = 0x16000000
        var y = screen.top + 3*d
        while (y < screen.bottom) { canvas.drawRect(screen.left, y, screen.right, y + d, paint); y += 5*d }

        val shownEvent = event
        if (shownEvent != null) drawEvent(canvas, screen, shownEvent, d) else drawState(canvas, screen, d)
    }

    private fun drawState(canvas: Canvas, r: RectF, d: Float) {
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 18*d
        paint.color = Color.WHITE
        canvas.drawText(state.name.uppercase(), r.left + 20*d, r.top + 30*d, paint)
        paint.textAlign = Paint.Align.RIGHT
        paint.textSize = 11*d
        paint.color = if (state.paused) HandheldPalette.YELLOW else HandheldPalette.GREEN
        canvas.drawText(if (state.paused) "● PAUSE" else "● ONLINE", r.right - 20*d, r.top + 28*d, paint)

        val cx = r.centerX(); val cy = r.centerY() + 5*d; val radius = minOf(r.width(), r.height()) * .27f
        paint.style = Paint.Style.STROKE; paint.strokeWidth = 8*d; paint.strokeCap = Paint.Cap.ROUND
        paint.color = 0xFF243750.toInt(); canvas.drawCircle(cx, cy, radius, paint)
        paint.color = if (state.minutes <= 10) HandheldPalette.RED else HandheldPalette.YELLOW
        val arc = RectF(cx-radius, cy-radius, cx+radius, cy+radius)
        canvas.drawArc(arc, -90f, 360f * state.progress.coerceIn(0f, 1f), false, paint)
        paint.style = Paint.Style.FILL; paint.strokeCap = Paint.Cap.BUTT
        paint.textAlign = Paint.Align.CENTER; paint.color = Color.WHITE; paint.textSize = 48*d
        canvas.drawText(state.minutes.toString(), cx, cy + 10*d, paint)
        paint.textSize = 12*d; paint.color = HandheldPalette.YELLOW
        canvas.drawText("MIN", cx, cy + 29*d, paint)
        paint.textSize = 13*d; paint.color = 0xFFD8E3FB.toInt()
        canvas.drawText(state.status, cx, r.bottom - 18*d, paint)
    }

    private fun drawEvent(canvas: Canvas, r: RectF, event: GameScreenEvent, d: Float) {
        paint.textAlign = Paint.Align.CENTER; paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = event.accent; paint.textSize = 31*d
        canvas.drawText(event.message, r.centerX(), r.centerY() + 5*d, paint)
        paint.color = Color.WHITE; paint.textSize = 11*d
        canvas.drawText("LAUNCHPAD // STATUS", r.centerX(), r.centerY() + 32*d, paint)
    }
}

data class TouchAction(val label: String, val symbol: String, val color: Int, val onClick: () -> Unit)
data class TouchPage(val actions: List<TouchAction>) { init { require(actions.size == 4) } }

/** Horizontally paged lower display. Every page deliberately accepts exactly four actions. */
class TouchScreenPager(context: Context, pages: List<TouchPage>) : LinearLayout(context) {
    private val pager = SnapScrollView(context)
    private val strip = LinearLayout(context)
    private val dots = LinearLayout(context)
    private val pageCount = pages.size

    init {
        orientation = VERTICAL
        setPadding(dp(4), dp(4), dp(9), dp(10))
        background = framedBackground()
        pager.isHorizontalScrollBarEnabled = false
        strip.orientation = HORIZONTAL
        pages.forEach { strip.addView(page(it), LayoutParams(0, MATCH_PARENT).apply { width = resources.displayMetrics.widthPixels - dp(37) }) }
        pager.addView(strip, ViewGroup.LayoutParams(WRAP_CONTENT, MATCH_PARENT))
        addView(pager, LayoutParams(MATCH_PARENT, 0, 1f))
        dots.gravity = Gravity.CENTER
        repeat(pageCount) { dots.addView(dot(it == 0)) }
        addView(dots, LayoutParams(MATCH_PARENT, dp(22)))
        pager.onPageChanged = { selected ->
            (0 until dots.childCount).forEach { i -> dots.getChildAt(i).background = dotBackground(i == selected) }
        }
    }

    private fun page(page: TouchPage) = GridLayout(context).apply {
        columnCount = 2; rowCount = 2; setPadding(dp(12), dp(12), dp(12), dp(5))
        page.actions.forEachIndexed { index, action ->
            addView(actionButton(action), GridLayout.LayoutParams(
                GridLayout.spec(index / 2, 1f), GridLayout.spec(index % 2, 1f)
            ).apply { width = 0; height = 0; setMargins(dp(7), dp(7), dp(7), dp(7)) })
        }
    }

    private fun actionButton(action: TouchAction) = LinearLayout(context).apply {
        orientation = VERTICAL; gravity = Gravity.CENTER; isClickable = true; isFocusable = true
        background = buttonBackground(); elevation = dp(5).toFloat(); contentDescription = action.label
        addView(TextView(context).apply {
            text = action.symbol; textSize = 31f; gravity = Gravity.CENTER
            background = circle(action.color); setTextColor(HandheldPalette.INK)
        }, LayoutParams(dp(62), dp(62)))
        addView(TextView(context).apply {
            text = action.label.uppercase(); textSize = 12f; gravity = Gravity.CENTER
            setTypeface(null, Typeface.BOLD); setTextColor(Color.WHITE); setPadding(0, dp(8), 0, 0)
        })
        setOnTouchListener { view, e ->
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> { view.translationX = dp(4).toFloat(); view.translationY = dp(5).toFloat(); view.elevation = 0f }
                MotionEvent.ACTION_UP -> { resetPress(view); view.performClick() }
                MotionEvent.ACTION_CANCEL -> resetPress(view)
            }; true
        }
        setOnClickListener { action.onClick() }
    }

    private fun resetPress(view: View) { view.translationX = 0f; view.translationY = 0f; view.elevation = dp(5).toFloat() }
    private fun dot(active: Boolean) = View(context).apply { background = dotBackground(active); layoutParams = LayoutParams(dp(if (active) 22 else 8), dp(8)).apply { setMargins(dp(4), 0, dp(4), 0) } }
    private fun dotBackground(active: Boolean) = GradientDrawable().apply { cornerRadius = dp(9).toFloat(); setColor(if (active) HandheldPalette.BLUE else 0xFFB7C0CC.toInt()) }
    private fun circle(color: Int) = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(color); setStroke(dp(4), HandheldPalette.INK) }
    private fun buttonBackground() = GradientDrawable().apply { cornerRadius = dp(17).toFloat(); setColor(HandheldPalette.DARK_SCREEN); setStroke(dp(4), HandheldPalette.INK) }
    private fun framedBackground() = GradientDrawable().apply { cornerRadius = dp(22).toFloat(); setColor(HandheldPalette.PANEL); setStroke(dp(4), HandheldPalette.INK) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).roundToInt()

    private inner class SnapScrollView(context: Context) : HorizontalScrollView(context) {
        var onPageChanged: (Int) -> Unit = {}
        override fun onTouchEvent(ev: MotionEvent): Boolean {
            val handled = super.onTouchEvent(ev)
            if (ev.actionMasked == MotionEvent.ACTION_UP || ev.actionMasked == MotionEvent.ACTION_CANCEL) {
                postDelayed({
                    val width = this@TouchScreenPager.width.coerceAtLeast(1)
                    val page = (scrollX.toFloat() / width).roundToInt().coerceIn(0, pageCount - 1)
                    smoothScrollTo(page * width, 0); onPageChanged(page)
                }, 40)
            }
            return handled
        }
    }
}
