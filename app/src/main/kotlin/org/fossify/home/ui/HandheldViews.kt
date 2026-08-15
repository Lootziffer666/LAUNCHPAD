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
import android.os.BatteryManager
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
import java.time.LocalTime
import java.time.format.DateTimeFormatter

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
        // Stitch substitution: its remote portrait and web fonts cannot be bundled under the
        // no-download/no-binary rule. The avatar is therefore procedural and Android's bold
        // sans-serif is used; every measurable panel/color/spacing value remains source-exact.
        val frame = RectF(0f, 0f, width - 4*d, height - 6*d)
        paint.color = HandheldPalette.INK
        canvas.drawRoundRect(RectF(4*d, 6*d, width.toFloat(), height.toFloat()), 12*d, 12*d, paint)
        canvas.drawRoundRect(frame, 12*d, 12*d, paint)
        val screen = RectF(4*d, 4*d, frame.right - 4*d, frame.bottom - 4*d)
        paint.color = HandheldPalette.BLUE
        canvas.drawRoundRect(screen, 8*d, 8*d, paint)
        paint.clearShadowLayer()

        // Exact repeating-linear-gradient cadence: transparent 3px, black/15% 3px.
        paint.color = 0x26000000
        var y = screen.top + 3*d
        while (y < screen.bottom) { canvas.drawRect(screen.left, y, screen.right, y + 3*d, paint); y += 6*d }
        paint.color = 0x14FFFFFF
        canvas.drawRect(screen.left, screen.top, screen.right, screen.top + screen.height()/3f, paint)

        val shownEvent = event
        if (shownEvent != null) drawEvent(canvas, screen, shownEvent, d) else drawState(canvas, screen, d)
    }

    private fun drawState(canvas: Canvas, r: RectF, d: Float) {
        val left = r.left + 20*d
        val top = r.top + 16*d
        // 2px outlined translucent pill, 40px procedural avatar, 12px gap, 16px right padding.
        paint.color = 0xCC1F2A3C.toInt()
        canvas.drawRoundRect(RectF(left, top, left+139*d, top+52*d), 26*d, 26*d, paint)
        paint.style = Paint.Style.STROKE; paint.strokeWidth = 2*d; paint.color = HandheldPalette.INK
        canvas.drawRoundRect(RectF(left, top, left+139*d, top+52*d), 26*d, 26*d, paint)
        paint.style = Paint.Style.FILL
        paint.color = HandheldPalette.PANEL; canvas.drawCircle(left+26*d, top+26*d, 20*d, paint)
        paint.style = Paint.Style.STROKE; paint.strokeWidth = 2*d; paint.color = HandheldPalette.INK
        canvas.drawCircle(left+26*d, top+26*d, 20*d, paint)
        paint.style = Paint.Style.FILL
        paint.color = HandheldPalette.YELLOW; canvas.drawCircle(left+26*d, top+25*d, 12*d, paint)
        paint.color = HandheldPalette.RED; canvas.drawRect(left+17*d, top+15*d, left+34*d, top+20*d, paint)

        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 14*d
        paint.color = Color.WHITE
        canvas.drawText(state.name.uppercase(), left+52*d, top+23*d, paint)
        paint.textSize = 10*d; paint.color = HandheldPalette.YELLOW
        canvas.drawText("HEUTE", left+52*d, top+41*d, paint)
        paint.color = HandheldPalette.GREEN; canvas.drawCircle(r.right-39*d, top+8*d, 6*d, paint)
        paint.style = Paint.Style.STROKE; paint.strokeWidth = 2*d; paint.color = HandheldPalette.INK
        canvas.drawCircle(r.right-39*d, top+8*d, 6*d, paint)
        paint.style = Paint.Style.FILL; paint.color = 0x80E35D35.toInt()
        canvas.drawCircle(r.right-19*d, top+8*d, 6*d, paint)
        paint.style = Paint.Style.STROKE; paint.color = HandheldPalette.INK
        canvas.drawCircle(r.right-19*d, top+8*d, 6*d, paint)

        val cx = r.centerX(); val cy = r.centerY() + 25*d
        val radius = minOf(84*d, r.height()*.31f)
        paint.style = Paint.Style.STROKE; paint.strokeWidth = d; paint.pathEffect = android.graphics.DashPathEffect(floatArrayOf(4*d,4*d),0f)
        paint.color = 0x33FFFFFF; canvas.drawCircle(cx, cy, radius+12*d, paint)
        paint.pathEffect = null; paint.strokeWidth = 6*d; paint.strokeCap = Paint.Cap.ROUND
        paint.color = 0x801E293B.toInt(); canvas.drawCircle(cx, cy, radius, paint)
        paint.color = if (state.minutes <= 10) HandheldPalette.RED else HandheldPalette.YELLOW
        val arc = RectF(cx-radius, cy-radius, cx+radius, cy+radius)
        canvas.drawArc(arc, -90f, 360f * state.progress.coerceIn(0f, 1f), false, paint)
        paint.style = Paint.Style.FILL; paint.strokeCap = Paint.Cap.BUTT
        paint.textAlign = Paint.Align.CENTER; paint.color = Color.WHITE; paint.textSize = 56*d
        canvas.drawText(state.minutes.toString(), cx, cy + 13*d, paint)
        paint.textSize = 14*d; paint.letterSpacing = .2f; paint.color = HandheldPalette.YELLOW
        canvas.drawText("MIN", cx, cy + 39*d, paint); paint.letterSpacing = 0f
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

/** Stitch's exact 2×2 touch panel: 16px padding/gaps, 4px outlines and 4×6px shadows. */
class TouchScreenPager(context: Context, pages: List<TouchPage>) : View(context) {
    private val actions = pages.first().actions
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var pressed = -1
    init { isClickable = true; isFocusable = true; contentDescription = "Launchpad-Menü" }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val index = hit(event.x, event.y)
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> { pressed = index; invalidate() }
            MotionEvent.ACTION_UP -> {
                val selected = pressed; pressed = -1; invalidate(); performClick()
                if (selected >= 0 && selected == index) actions[selected].onClick()
            }
            MotionEvent.ACTION_CANCEL -> { pressed = -1; invalidate() }
        }
        return true
    }

    override fun performClick(): Boolean { super.performClick(); return true }

    override fun onDraw(canvas: Canvas) {
        val d = resources.displayMetrics.density
        panel(canvas, RectF(0f,0f,width-4*d,height-6*d), HandheldPalette.PANEL, 12*d, d)
        paint.color = 0x1A1E293B
        var x = 8*d
        while (x < width) { var y = 8*d; while (y < height) { canvas.drawCircle(x,y,1.5f*d,paint); y += 16*d }; x += 16*d }
        val gap = 16*d; val padding = 16*d
        val cellW = (width-4*d-padding*2-gap)/2f; val cellH = (height-6*d-padding*2-gap)/2f
        actions.forEachIndexed { index, action ->
            val col = index%2; val row = index/2
            val dx = if (pressed == index) 4*d else 0f; val dy = if (pressed == index) 6*d else 0f
            val r = RectF(padding+col*(cellW+gap)+dx,padding+row*(cellH+gap)+dy,padding+col*(cellW+gap)+cellW+dx,padding+row*(cellH+gap)+cellH+dy)
            drawButton(canvas,r,action,index,d)
        }
    }

    private fun drawButton(canvas: Canvas, r: RectF, action: TouchAction, index: Int, d: Float) {
        if (pressed != index) { paint.color=HandheldPalette.INK; canvas.drawRoundRect(RectF(r.left+4*d,r.top+6*d,r.right+4*d,r.bottom+6*d),12*d,12*d,paint) }
        paint.color=HandheldPalette.DARK_SCREEN; canvas.drawRoundRect(r,12*d,12*d,paint)
        paint.style=Paint.Style.STROKE; paint.strokeWidth=4*d; paint.color=HandheldPalette.INK; canvas.drawRoundRect(r,12*d,12*d,paint); paint.style=Paint.Style.FILL
        paint.color=0x0DFFFFFF; canvas.drawRoundRect(RectF(r.left+4*d,r.top+4*d,r.right-4*d,r.top+r.height()*.4f),8*d,8*d,paint)
        val cy=r.centerY()-17*d; paint.color=action.color; canvas.drawCircle(r.centerX(),cy,32*d,paint)
        paint.style=Paint.Style.STROKE; paint.strokeWidth=4*d; paint.color=HandheldPalette.INK; canvas.drawCircle(r.centerX(),cy,32*d,paint); paint.style=Paint.Style.FILL
        paint.textAlign=Paint.Align.CENTER; paint.typeface=Typeface.DEFAULT_BOLD; paint.textSize=32*d
        paint.color=if(index==0) HandheldPalette.PANEL else HandheldPalette.INK; canvas.drawText(action.symbol,r.centerX(),cy+11*d,paint)
        paint.textSize=14*d; paint.letterSpacing=.08f; paint.color=0xFFD8E3FB.toInt(); canvas.drawText(action.label.uppercase(),r.centerX(),cy+59*d,paint); paint.letterSpacing=0f
        if(index==0) { paint.color=HandheldPalette.YELLOW; canvas.drawCircle(r.right-10*d,r.top+10*d,6*d,paint); paint.style=Paint.Style.STROKE; paint.strokeWidth=2*d; paint.color=HandheldPalette.INK; canvas.drawCircle(r.right-10*d,r.top+10*d,6*d,paint); paint.style=Paint.Style.FILL }
    }

    private fun panel(canvas: Canvas,r:RectF,color:Int,radius:Float,d:Float) { paint.color=HandheldPalette.INK; canvas.drawRoundRect(RectF(r.left+4*d,r.top+6*d,r.right+4*d,r.bottom+6*d),radius,radius,paint); paint.color=color; canvas.drawRoundRect(r,radius,radius,paint); paint.style=Paint.Style.STROKE;paint.strokeWidth=4*d;paint.color=HandheldPalette.INK;canvas.drawRoundRect(r,radius,radius,paint);paint.style=Paint.Style.FILL }
    private fun hit(x:Float,y:Float):Int { val col=if(x<width/2f)0 else 1; val row=if(y<height/2f)0 else 1; return row*2+col }
}

class StitchHeaderView(context: Context) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val clock = DateTimeFormatter.ofPattern("HH:mm")
    private val ticker = object : Runnable { override fun run() { invalidate(); postDelayed(this, 30_000) } }
    init { contentDescription = "Quests, Systemstatus"; post(ticker) }
    override fun onDetachedFromWindow() { removeCallbacks(ticker); super.onDetachedFromWindow() }
    override fun onDraw(canvas: Canvas) {
        val d=resources.displayMetrics.density
        paint.color=HandheldPalette.INK; canvas.drawRect(4*d,6*d,width.toFloat(),height.toFloat(),paint)
        val header=RectF(0f,0f,width-4*d,height-6*d)
        paint.color=0xE61F2A3C.toInt(); canvas.drawRoundRect(header,0f,0f,paint)
        paint.color=0x0DFFFFFF; canvas.drawRect(0f,0f,width-4*d,(height-6*d)/2f,paint)
        paint.textAlign=Paint.Align.LEFT;paint.typeface=Typeface.DEFAULT_BOLD;paint.textSize=20*d;paint.color=HandheldPalette.YELLOW
        canvas.drawText("◆",16*d,36*d,paint);paint.color=0xFFD8E3FB.toInt();canvas.drawText("QUESTS",44*d,36*d,paint)
        val battery=context.getSystemService(BatteryManager::class.java).getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        paint.textAlign=Paint.Align.RIGHT;paint.textSize=14*d;paint.color=0xFFE6BDB5.toInt()
        canvas.drawText("${LocalTime.now().format(clock)}  ▰ ${battery.coerceIn(0,100)}%",width-61*d,35*d,paint)
        paint.color=0xFFFFB4A4.toInt();canvas.drawCircle(width-27*d,28*d,16*d,paint)
        paint.style=Paint.Style.STROKE;paint.strokeWidth=2*d;paint.color=HandheldPalette.INK;canvas.drawCircle(width-27*d,28*d,16*d,paint)
        paint.style=Paint.Style.FILL;paint.textAlign=Paint.Align.CENTER;paint.textSize=18*d;paint.color=0xFF630E00.toInt();canvas.drawText("●",width-27*d,34*d,paint)
        paint.style=Paint.Style.STROKE;paint.strokeWidth=4*d;paint.color=HandheldPalette.INK;canvas.drawRoundRect(header,0f,0f,paint);paint.style=Paint.Style.FILL
    }
}

data class NavAction(val label:String,val symbol:String,val active:Boolean=false,val onClick:()->Unit)

class StitchBottomNav(context: Context, private val actions:List<NavAction>) : View(context) {
    private val paint=Paint(Paint.ANTI_ALIAS_FLAG); private var down=-1
    init { isClickable=true;isFocusable=true;contentDescription="Launchpad-Navigation" }
    override fun onTouchEvent(event:MotionEvent):Boolean { val i=(event.x/(width/4f)).toInt().coerceIn(0,3); when(event.actionMasked){MotionEvent.ACTION_DOWN->{down=i;invalidate()};MotionEvent.ACTION_UP->{val old=down;down=-1;invalidate();performClick();if(old==i)actions[i].onClick()};MotionEvent.ACTION_CANCEL->{down=-1;invalidate()}};return true }
    override fun performClick():Boolean { super.performClick();return true }
    override fun onDraw(canvas:Canvas){val d=resources.displayMetrics.density;paint.color=HandheldPalette.INK;canvas.drawRoundRect(RectF(4*d,0f,width.toFloat(),height.toFloat()),12*d,12*d,paint);val nav=RectF(0f,4*d,width-4*d,height.toFloat());paint.color=0xFF1F2A3C.toInt();canvas.drawRoundRect(nav,12*d,12*d,paint);paint.style=Paint.Style.STROKE;paint.strokeWidth=4*d;paint.color=HandheldPalette.INK;canvas.drawRoundRect(nav,12*d,12*d,paint);paint.style=Paint.Style.FILL;actions.forEachIndexed{i,a->val cx=(i+.5f)*width/4f;val top=10*d+(if(down==i)2*d else 0f);if(a.active){paint.color=0xFFFFB4A4.toInt();canvas.drawRoundRect(RectF(cx-32*d,top,cx+32*d,top+64*d),8*d,8*d,paint);paint.color=0xFF630E00.toInt()}else paint.color=0xFFE6BDB5.toInt();paint.textAlign=Paint.Align.CENTER;paint.typeface=Typeface.DEFAULT_BOLD;paint.textSize=28*d;canvas.drawText(a.symbol,cx,top+31*d,paint);paint.textSize=12*d;canvas.drawText(a.label.uppercase(),cx,top+52*d,paint)}}
}
