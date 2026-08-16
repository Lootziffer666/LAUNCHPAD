@file:Suppress(
    "MagicNumber", // Dimensions below reproduce the supplied 8 dp game-menu grid.
    "TooManyFunctions", // Central factory keeps the visual contract consistent across activities.
)

package org.fossify.home.ui

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.Button
import android.widget.CompoundButton
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.widget.Toolbar
import androidx.core.graphics.ColorUtils
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/** Native implementation of the full-screen game-menu language used by management flows. */
object GameMenuUi {
    const val BACKGROUND = 0xFF081425.toInt()
    const val LOWEST = 0xFF040E1F.toInt()
    const val HIGH = 0xFF1F2A3C.toInt()
    const val INK = 0xFF1E293B.toInt()
    const val PANEL = 0xFFF8FAFC.toInt()
    const val BLUE = 0xFF3164B3.toInt()
    const val YELLOW = 0xFFFFCC00.toInt()
    const val GREEN = 0xFF48D0B0.toInt()
    const val RED = 0xFFE3350D.toInt()
    const val TEXT = 0xFFD8E3FB.toInt()
    const val MUTED = 0xFF5C4039.toInt()

    fun install(activity: Activity, title: String, bottomNavigation: View? = null): LinearLayout {
        WindowCompat.setDecorFitsSystemWindows(activity.window, false)
        activity.window.statusBarColor = HIGH
        activity.window.navigationBarColor = HIGH
        WindowCompat.getInsetsController(activity.window, activity.window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        val root = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(BACKGROUND)
        }
        val header = header(activity, title)
        root.addView(header, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, activity.dp(62)))
        val content = GameMenuContentLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(activity.dp(24), activity.dp(24), activity.dp(24), activity.dp(30))
        }
        val scroll = ScrollView(activity).apply {
            isFillViewport = true
            setBackgroundColor(LOWEST)
            background = DotGridDrawable(activity)
            addView(content)
        }
        root.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        bottomNavigation?.let {
            root.addView(
                it,
                LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, activity.dp(80)),
            )
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        activity.setContentView(root)
        return content
    }

    /** Applies the same shell to existing XML screens without replacing their IDs or listeners. */
    fun migrateExisting(activity: Activity, root: View, toolbar: Toolbar? = null) {
        WindowCompat.setDecorFitsSystemWindows(activity.window, false)
        activity.window.statusBarColor = HIGH
        activity.window.navigationBarColor = HIGH
        WindowCompat.getInsetsController(activity.window, activity.window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        root.background = DotGridDrawable(activity)
        toolbar?.apply {
            background = outlined(activity, HIGH, INK, 4f, 0f)
            setTitleTextColor(TEXT)
            navigationIcon?.setTint(TEXT)
        }
        styleTree(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
    }

    fun styleChoice(button: Button, selected: Boolean) {
        button.setTextColor(if (selected) 0xFF241A00.toInt() else Color.WHITE)
        button.background = PressedGameDrawable(button.context, if (selected) YELLOW else BLUE)
    }

    fun styleAdded(view: View) = styleTree(view)

    fun title(context: Context, text: String) = TextView(context).apply {
        this.text = text.uppercase()
        textSize = 24f
        setTextColor(TEXT)
        typeface = Typeface.DEFAULT_BOLD
        letterSpacing = .04f
        setPadding(0, 0, 0, context.dp(12))
    }

    fun section(context: Context, text: String) = TextView(context).apply {
        this.text = text.uppercase()
        textSize = 15f
        setTextColor(YELLOW)
        typeface = Typeface.DEFAULT_BOLD
        letterSpacing = .08f
        setPadding(0, context.dp(20), 0, context.dp(8))
    }

    fun body(context: Context, text: String) = TextView(context).apply {
        this.text = text
        textSize = 14f
        setTextColor(TEXT)
        setLineSpacing(0f, 1.25f)
        setPadding(0, 0, 0, context.dp(8))
    }

    fun field(context: Context, hintText: String) = EditText(context).apply {
        hint = hintText
        textSize = 15f
        setTextColor(INK)
        setHintTextColor(ColorUtils.setAlphaComponent(MUTED, 180))
        setPadding(context.dp(16), context.dp(14), context.dp(16), context.dp(14))
        background = outlined(context, PANEL, INK, 3f, 8f)
        layoutParams = marginParams(context, bottom = 12)
    }

    fun field(context: Context) = field(context, "")

    fun rawButton(context: Context, accent: Int = BLUE) = Button(context).apply {
        isAllCaps = false
        textSize = 13f
        setTextColor(Color.WHITE)
        typeface = Typeface.DEFAULT_BOLD
        stateListAnimator = null
        elevation = 0f
        background = PressedGameDrawable(context, accent)
        setPadding(context.dp(12), context.dp(10), context.dp(12), context.dp(10))
    }

    fun button(context: Context, label: String, accent: Int = BLUE, click: () -> Unit) =
        Button(context).apply {
            text = label.uppercase()
            isAllCaps = false
            textSize = 14f
            setTextColor(if (accent == YELLOW) 0xFF241A00.toInt() else Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = .06f
            stateListAnimator = null
            elevation = 0f
            setPadding(context.dp(16), context.dp(13), context.dp(16), context.dp(13))
            background = PressedGameDrawable(context, accent)
            layoutParams = marginParams(context, bottom = 12)
            setOnClickListener { click() }
        }

    fun card(context: Context, accent: Int = BLUE, build: LinearLayout.() -> Unit): View {
        val shadow = FrameLayout(context).apply {
            setPadding(0, 0, context.dp(4), context.dp(6))
            background = rounded(context, INK, 12f)
            layoutParams = marginParams(context, bottom = 12)
        }
        val inner = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(context.dp(20), context.dp(16), context.dp(20), context.dp(16))
            background = outlined(context, PANEL, accent, 4f, 12f)
            build()
        }
        shadow.addView(
            inner,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            ),
        )
        return shadow
    }

    fun actionRow(
        context: Context,
        title: String,
        detail: String = "",
        symbol: String = "◆",
        accent: Int = BLUE,
        click: () -> Unit,
    ): View = card(context, accent) {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        addView(TextView(context).apply {
            text = symbol
            textSize = 26f
            setTextColor(accent)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(context.dp(46), context.dp(46)))
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(context.dp(12), 0, context.dp(8), 0)
            addView(panelText(context, title, strong = true))
            if (detail.isNotBlank()) addView(panelText(context, detail))
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        addView(panelText(context, "›", strong = true).apply {
            textSize = 26f
            gravity = Gravity.CENTER
        })
    }.apply {
        isClickable = true
        isFocusable = true
        setOnClickListener { click() }
    }

    fun toggleRow(
        context: Context,
        title: String,
        detail: String = "",
        enabled: Boolean,
        onToggle: (Boolean) -> Unit,
    ): View = card(context, if (enabled) GREEN else BLUE) {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(panelText(context, title, strong = true))
            if (detail.isNotBlank()) addView(panelText(context, detail))
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        addView(TextView(context).apply {
            text = if (enabled) "AN" else "AUS"
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = .08f
            gravity = Gravity.CENTER
            setTextColor(if (enabled) 0xFF073D32.toInt() else TEXT)
            background = outlined(context, if (enabled) GREEN else HIGH, INK, 2f, 16f)
        }, LinearLayout.LayoutParams(context.dp(64), context.dp(34)))
    }.apply {
        isClickable = true
        isFocusable = true
        setOnClickListener { onToggle(!enabled) }
    }

    fun valueRow(
        context: Context,
        title: String,
        value: String,
        detail: String = "",
        accent: Int = BLUE,
        click: () -> Unit,
    ): View = card(context, accent) {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(panelText(context, title, strong = true))
            if (detail.isNotBlank()) addView(panelText(context, detail))
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        addView(TextView(context).apply {
            text = value
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(INK)
            background = outlined(context, YELLOW, INK, 2f, 16f)
            setPadding(context.dp(12), 0, context.dp(12), 0)
        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, context.dp(34)))
    }.apply {
        isClickable = true
        isFocusable = true
        setOnClickListener { click() }
    }

    fun emptyState(context: Context, text: String) = panelText(context, text).apply {
        setTextColor(ColorUtils.setAlphaComponent(INK, 180))
        gravity = Gravity.CENTER
        setPadding(context.dp(8), context.dp(16), context.dp(8), context.dp(16))
    }

    fun panelText(context: Context, text: String, strong: Boolean = false) = TextView(context).apply {
        this.text = text
        textSize = if (strong) 16f else 14f
        setTextColor(INK)
        if (strong) typeface = Typeface.DEFAULT_BOLD
        setPadding(0, context.dp(4), 0, context.dp(4))
    }

    data class Action(
        val label: String,
        val symbol: String = "◆",
        val accent: Int = BLUE,
        val onClick: () -> Unit,
    )

    class GameActionMenu internal constructor(private val dialog: AlertDialog) {
        fun dismiss() = dialog.dismiss()
    }

    fun showActionMenu(
        activity: Activity,
        title: String,
        actions: List<Action>,
        onDismiss: () -> Unit = {},
    ): GameActionMenu {
        val content = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(activity.dp(18), activity.dp(16), activity.dp(18), activity.dp(10))
            background = outlined(activity, PANEL, INK, 4f, 12f)
            addView(panelText(activity, title.uppercase(), strong = true).apply {
                textSize = 19f
                letterSpacing = .06f
                setPadding(0, 0, 0, activity.dp(12))
            })
        }
        val shadow = FrameLayout(activity).apply {
            setPadding(0, 0, activity.dp(5), activity.dp(7))
            background = rounded(activity, INK, 12f)
            addView(ScrollView(activity).apply {
                isFillViewport = true
                addView(content)
            })
        }
        lateinit var dialog: AlertDialog
        actions.forEach { action ->
            content.addView(button(activity, "${action.symbol}  ${action.label}", action.accent) {
                dialog.dismiss()
                action.onClick()
            })
        }
        dialog = AlertDialog.Builder(activity).setView(shadow).create()
        dialog.setOnDismissListener { onDismiss() }
        dialog.show()
        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            decorView.setPadding(activity.dp(18), 0, activity.dp(18), 0)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            setDimAmount(.62f)
        }
        return GameActionMenu(dialog)
    }

    fun showNumberChoice(
        activity: Activity,
        title: String,
        values: IntRange,
        current: Int,
        onSelected: (Int) -> Unit,
    ): GameActionMenu = showActionMenu(
        activity,
        title,
        values.map { value ->
            Action(
                label = value.toString(),
                symbol = if (value == current) "●" else "○",
                accent = if (value == current) YELLOW else BLUE,
                onClick = { onSelected(value) },
            )
        },
    )

    fun styleDialog(dialog: AlertDialog) {
        dialog.setOnShowListener {
            val window = dialog.window ?: return@setOnShowListener
            styleDialogWindow(window)
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.apply {
                setTextColor(INK); typeface = Typeface.DEFAULT_BOLD
            }
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(BLUE)
        }
    }

    fun styleShownDialog(dialog: AlertDialog) {
        dialog.window?.let(::styleDialogWindow)
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.apply {
            setTextColor(INK)
            typeface = Typeface.DEFAULT_BOLD
        }
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(BLUE)
        dialog.getButton(AlertDialog.BUTTON_NEUTRAL)?.setTextColor(BLUE)
    }

    @Suppress("CyclomaticComplexMethod") // Existing view types and product roles are orthogonal.
    internal fun styleTree(view: View) {
        val idName = if (view.id == View.NO_ID) "" else runCatching {
            view.resources.getResourceEntryName(view.id)
        }.getOrDefault("")
        when (view) {
            is EditText -> {
                view.setTextColor(INK)
                view.setHintTextColor(ColorUtils.setAlphaComponent(MUTED, 180))
                view.background = outlined(view.context, PANEL, INK, 3f, 8f)
            }
            is CompoundButton -> {
                view.setTextColor(TEXT)
                view.background = ColorDrawable(Color.TRANSPARENT)
                view.buttonTintList = ColorStateList(
                    arrayOf(
                        intArrayOf(android.R.attr.state_checked),
                        intArrayOf(),
                    ),
                    intArrayOf(GREEN, BLUE),
                )
            }
            is Button -> {
                view.setTextColor(Color.WHITE)
                view.stateListAnimator = null
                if (view.background !is PressedGameDrawable) {
                    view.background = PressedGameDrawable(view.context, BLUE)
                }
            }
            is TextView -> when {
                idName.contains("sec_") || idName.endsWith("_label") && view.textSize <= 15f -> {
                    view.setTextColor(YELLOW)
                    view.typeface = Typeface.DEFAULT_BOLD
                    view.letterSpacing = .06f
                }
                idName.contains("badge") -> view.setTextColor(INK)
                else -> view.setTextColor(TEXT)
            }
        }
        if (view is ViewGroup) {
            if (idName == "em_dashboard") {
                view.background = outlined(view.context, PANEL, BLUE, 4f, 12f)
                (view.layoutParams as? ViewGroup.MarginLayoutParams)?.apply {
                    leftMargin = view.context.dp(24)
                    rightMargin = view.context.dp(24)
                    topMargin = view.context.dp(16)
                    bottomMargin = view.context.dp(16)
                }
            }
            if (idName.startsWith("em_row_") || idName.endsWith("_holder")) {
                view.background = outlined(view.context, HIGH, INK, 3f, 8f)
                view.setPadding(view.context.dp(16), view.context.dp(12), view.context.dp(16), view.context.dp(12))
                (view.layoutParams as? ViewGroup.MarginLayoutParams)?.apply {
                    leftMargin = view.context.dp(16)
                    rightMargin = view.context.dp(16)
                    topMargin = view.context.dp(4)
                    bottomMargin = view.context.dp(8)
                }
            }
            for (index in 0 until view.childCount) styleTree(view.getChildAt(index))
            if (idName == "em_dashboard") stylePanelText(view)
        }
    }

    private fun stylePanelText(view: View) {
        if (view is TextView) {
            val name = if (view.id == View.NO_ID) "" else runCatching {
                view.resources.getResourceEntryName(view.id)
            }.getOrDefault("")
            if (!name.contains("badge")) view.setTextColor(INK)
        }
        if (view is ViewGroup) {
            for (index in 0 until view.childCount) stylePanelText(view.getChildAt(index))
        }
    }

    private fun styleDialogWindow(window: Window) {
        window.decorView.setPadding(window.decorView.context.dp(20), 0, window.decorView.context.dp(20), 0)
        window.setBackgroundDrawable(outlined(window.decorView.context, PANEL, INK, 4f, 12f))
        window.navigationBarColor = HIGH
    }

    fun headerView(context: Context, title: String) = header(context, title)

    private fun header(context: Context, title: String) = LinearLayout(context).apply {
        gravity = Gravity.CENTER_VERTICAL
        setPadding(context.dp(16), 0, context.dp(16), 0)
        background = outlined(context, HIGH, INK, 4f, 0f)
        addView(TextView(context).apply {
            text = "◆"
            textSize = 20f
            setTextColor(YELLOW)
        })
        addView(TextView(context).apply {
            text = title.uppercase()
            textSize = 20f
            setTextColor(TEXT)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = .08f
            setPadding(context.dp(10), 0, 0, 0)
        })
        addView(TextView(context).apply {
            text = "SYS  ●"
            textSize = 12f
            setTextColor(GREEN)
            gravity = Gravity.END
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
    }

    private fun marginParams(context: Context, bottom: Int) = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
    ).apply { setMargins(0, 0, 0, context.dp(bottom)) }

    private fun outlined(context: Context, fill: Int, stroke: Int, width: Float, radius: Float) =
        GradientDrawable().apply {
            setColor(fill)
            cornerRadius = radius * context.resources.displayMetrics.density
            setStroke((width * context.resources.displayMetrics.density).toInt(), stroke)
        }

    private fun rounded(context: Context, color: Int, radius: Float) = GradientDrawable().apply {
        setColor(color)
        cornerRadius = radius * context.resources.displayMetrics.density
    }
}

private class GameMenuContentLayout(context: Context) : LinearLayout(context)

private class DotGridDrawable(context: Context) : android.graphics.drawable.Drawable() {
    private val density = context.resources.displayMetrics.density
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = GameMenuUi.HIGH }
    override fun draw(canvas: Canvas) {
        canvas.drawColor(GameMenuUi.LOWEST)
        var x = 8f * density
        while (x < bounds.width()) {
            var y = 8f * density
            while (y < bounds.height()) {
                canvas.drawCircle(x, y, 1.5f * density, paint)
                y += 16f * density
            }
            x += 16f * density
        }
    }
    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(filter: android.graphics.ColorFilter?) { paint.colorFilter = filter }
    @Deprecated("Deprecated in Android") override fun getOpacity() = android.graphics.PixelFormat.OPAQUE
}

private class PressedGameDrawable(
    context: Context,
    private val accent: Int,
) : android.graphics.drawable.Drawable() {
    private val density = context.resources.displayMetrics.density
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    override fun draw(canvas: Canvas) {
        val pressed = state.contains(android.R.attr.state_pressed)
        val shift = if (pressed) 2f * density else 0f
        val shadowX = if (pressed) 2f * density else 4f * density
        val shadowY = if (pressed) 2f * density else 6f * density
        paint.color = GameMenuUi.INK
        canvas.drawRoundRect(
            RectF(shadowX, shadowY, bounds.width().toFloat(), bounds.height().toFloat()),
            10f * density,
            10f * density,
            paint,
        )
        paint.color = accent
        canvas.drawRoundRect(
            RectF(0f, shift, bounds.width() - 4f * density, bounds.height() - 6f * density + shift),
            10f * density,
            10f * density,
            paint,
        )
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 4f * density
        paint.color = GameMenuUi.INK
        canvas.drawRoundRect(
            RectF(
                2f * density,
                shift + 2f * density,
                bounds.width() - 6f * density,
                bounds.height() - 8f * density + shift,
            ),
            8f * density,
            8f * density,
            paint,
        )
        paint.style = Paint.Style.FILL
    }
    override fun isStateful() = true
    override fun onStateChange(state: IntArray): Boolean { invalidateSelf(); return true }
    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(filter: android.graphics.ColorFilter?) { paint.colorFilter = filter }
    @Deprecated("Deprecated in Android") override fun getOpacity() = android.graphics.PixelFormat.TRANSLUCENT
}

private fun Context.dp(value: Int) = (value * resources.displayMetrics.density).toInt()
