@file:Suppress("MagicNumber", "MaxLineLength")

package org.fossify.home.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View

object OfflinePalette {
    const val INK = 0xFF25194A.toInt()
    const val SKY = 0xFF42D6C7.toInt()
    const val LIME = 0xFFB9F227.toInt()
    const val YELLOW = 0xFFFFD447.toInt()
    const val ORANGE = 0xFFFF8A3D.toInt()
    const val VIOLET = 0xFF44316F.toInt()
}

/** Owns the mini-game loop and online deferral; the Activity only swaps high-level modes. */
class OfflineMode(
    context: Context,
    private val sound: SoundFeedback,
    private val onExitOnline: () -> Unit,
) {
    private val game = MiniGame()
    val display = OfflineGameDisplay(context)
    val controls = OfflineGameControls(context, ::onControl)
    private var lastFrame = 0L
    private var pendingOnline = false
    private var lastScoreCue = 0
    private val onlineExit = Runnable { onExitOnline() }
    private val showOfflineReady = Runnable { display.message = "OFFLINE-MODUS\nTIPPE UNTEN ZUM SPIELEN" }
    private val frame = object : Runnable {
        override fun run() {
            val now = SystemClock.uptimeMillis()
            val dt = if (lastFrame == 0L) 0f else (now - lastFrame) / 1000f
            lastFrame = now
            val before = display.snapshot.score
            val snapshot = game.update(dt)
            display.snapshot = snapshot
            controls.setState(snapshot)
            if (snapshot.score / 10 > before / 10 && snapshot.score != lastScoreCue) {
                lastScoreCue = snapshot.score; sound.play(SoundCue.SCORE)
            }
            if (snapshot.gameOver && !display.gameOverNotified) {
                display.gameOverNotified = true; sound.play(SoundCue.GAME_OVER)
                if (pendingOnline) {
                    display.message = "WIEDER ONLINE!"
                    sound.play(SoundCue.ONLINE)
                    display.postDelayed(onlineExit, 1_500)
                }
            }
            if (snapshot.running) display.postOnAnimation(this)
        }
    }

    fun enter() {
        display.removeCallbacks(onlineExit)
        display.removeCallbacks(showOfflineReady)
        pendingOnline = false
        display.message = "VERBINDUNG VERLOREN"
        sound.play(SoundCue.OFFLINE)
        display.postDelayed(showOfflineReady, 1_500)
    }

    fun connectionRestored() {
        display.removeCallbacks(showOfflineReady)
        if (game.running) {
            pendingOnline = true
            controls.onlinePending = true
        } else {
            display.message = "WIEDER ONLINE!"
            sound.play(SoundCue.ONLINE)
            display.postDelayed(onlineExit, 1_500)
        }
    }

    fun connectionLostAgain() {
        display.removeCallbacks(onlineExit)
        pendingOnline = false
        controls.onlinePending = false
    }

    fun stop() {
        display.removeCallbacks(frame)
        display.removeCallbacks(onlineExit)
        display.removeCallbacks(showOfflineReady)
    }

    private fun onControl(action: OfflineControl) {
        when (action) {
            OfflineControl.JUMP -> if (game.running) game.jump() else start()
            OfflineControl.START, OfflineControl.RESTART -> start()
            OfflineControl.PAUSE -> if (game.running) game.pause() else game.resume()
            OfflineControl.BACK -> if (pendingOnline) onExitOnline()
        }
    }

    private fun start() {
        display.removeCallbacks(frame)
        game.start(); display.gameOverNotified = false; display.message = null
        controls.onlinePending = pendingOnline; lastFrame = 0L; lastScoreCue = 0
        sound.play(SoundCue.GAME_START); display.postOnAnimation(frame)
    }
}

enum class OfflineControl { JUMP, START, RESTART, PAUSE, BACK }

class OfflineGameDisplay(context: Context) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    var snapshot = MiniGameSnapshot(false, false, 0, 0f, emptyList())
        set(value) { field = value; invalidate() }
    var message: String? = "OFFLINE-MODUS"
        set(value) { field = value; invalidate() }
    var gameOverNotified = false

    init { contentDescription = "Offline-Spielanzeige" }

    override fun onDraw(canvas: Canvas) {
        val d = resources.displayMetrics.density
        val outer = RectF(2*d, 2*d, width-7*d, height-9*d)
        paint.color = OfflinePalette.INK; canvas.drawRoundRect(outer, 22*d, 22*d, paint)
        val screen = RectF(outer.left+4*d, outer.top+4*d, outer.right-4*d, outer.bottom-4*d)
        paint.color = OfflinePalette.SKY; canvas.drawRoundRect(screen, 18*d, 18*d, paint)
        drawPixelPattern(canvas, screen, d)
        val currentMessage = message
        if (currentMessage != null) drawMessage(canvas, screen, currentMessage, d) else drawGame(canvas, screen, d)
    }

    private fun drawPixelPattern(canvas: Canvas, r: RectF, d: Float) {
        paint.color = 0x2844316F
        var x = r.left
        while (x < r.right) { canvas.drawRect(x, r.top, x+d, r.bottom, paint); x += 12*d }
    }

    private fun drawMessage(canvas: Canvas, r: RectF, text: String, d: Float) {
        paint.typeface = Typeface.DEFAULT_BOLD; paint.textAlign = Paint.Align.CENTER
        val lines = text.split('\n'); paint.textSize = 25*d; paint.color = OfflinePalette.INK
        lines.forEachIndexed { index, line -> canvas.drawText(line, r.centerX(), r.centerY() + (index-0.5f)*34*d, paint) }
        paint.textSize = 11*d; paint.color = OfflinePalette.VIOLET
        canvas.drawText("LOCAL // KEIN NETZ BENÖTIGT", r.centerX(), r.bottom-18*d, paint)
    }

    private fun drawGame(canvas: Canvas, r: RectF, d: Float) {
        val ground = r.bottom - 35*d
        paint.color = OfflinePalette.YELLOW; canvas.drawRect(r.left, ground, r.right, r.bottom, paint)
        paint.color = OfflinePalette.INK
        val playerX = r.left + r.width()*.2f
        val py = ground - 28*d - snapshot.playerY*r.height()*.55f
        canvas.drawRect(playerX, py, playerX+25*d, py+28*d, paint)
        paint.color = OfflinePalette.LIME; canvas.drawRect(playerX+15*d, py+5*d, playerX+31*d, py+13*d, paint)
        snapshot.obstacles.forEach {
            paint.color = OfflinePalette.ORANGE
            canvas.drawRect(r.left+it.x*r.width(), ground-it.height*r.height(), r.left+(it.x+it.width)*r.width(), ground, paint)
        }
        paint.typeface = Typeface.DEFAULT_BOLD; paint.textAlign = Paint.Align.LEFT
        paint.textSize = 17*d; paint.color = OfflinePalette.INK
        canvas.drawText("SCORE ${snapshot.score.toString().padStart(4, '0')}", r.left+15*d, r.top+27*d, paint)
        if (snapshot.gameOver) {
            paint.textAlign = Paint.Align.CENTER; paint.textSize = 31*d
            canvas.drawText("GAME OVER", r.centerX(), r.centerY(), paint)
            paint.textSize = 12*d; canvas.drawText("UNTEN NEUSTARTEN", r.centerX(), r.centerY()+27*d, paint)
        }
    }
}

class OfflineGameControls(context: Context, private val action: (OfflineControl) -> Unit) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var snapshot = MiniGameSnapshot(false, false, 0, 0f, emptyList())
    var onlinePending = false
        set(value) { field = value; invalidate() }

    init { isClickable = true; isFocusable = true; contentDescription = "Dino-Steuerung. Tippen zum Springen." }
    fun setState(value: MiniGameSnapshot) { snapshot = value; invalidate() }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.actionMasked != MotionEvent.ACTION_UP) return true
        val selected = when {
            onlinePending && event.x < width*.25f -> OfflineControl.BACK
            event.x > width*.76f -> OfflineControl.PAUSE
            snapshot.gameOver -> OfflineControl.RESTART
            snapshot.running -> OfflineControl.JUMP
            else -> OfflineControl.START
        }
        action(selected); performClick(); return true
    }

    override fun performClick(): Boolean { super.performClick(); return true }

    override fun onDraw(canvas: Canvas) {
        val d = resources.displayMetrics.density
        paint.color = OfflinePalette.INK; canvas.drawRoundRect(RectF(2*d,2*d,width-7*d,height-9*d), 22*d,22*d,paint)
        paint.color = OfflinePalette.VIOLET; canvas.drawRoundRect(RectF(6*d,6*d,width-11*d,height-13*d),18*d,18*d,paint)
        paint.typeface = Typeface.DEFAULT_BOLD; paint.textAlign = Paint.Align.CENTER
        paint.color = OfflinePalette.YELLOW; paint.textSize = 24*d
        val label = when { snapshot.gameOver -> "↻  NEUSTART"; snapshot.running -> "▲  SPRINGEN"; else -> "▶  START" }
        canvas.drawText(label, width/2f, height*.54f, paint)
        paint.textSize = 11*d; paint.color = Color.WHITE
        canvas.drawText("GANZE FLÄCHE = SPRUNG", width/2f, height*.68f, paint)
        paint.textAlign = Paint.Align.RIGHT; paint.color = OfflinePalette.LIME
        canvas.drawText(if (snapshot.running) "PAUSE" else "WEITER", width-24*d, 28*d, paint)
        if (onlinePending) { paint.textAlign = Paint.Align.LEFT; canvas.drawText("‹ ONLINE", 20*d, 28*d, paint) }
    }
}
