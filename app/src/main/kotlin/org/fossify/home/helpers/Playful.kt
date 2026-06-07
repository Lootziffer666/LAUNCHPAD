// File: app/src/main/kotlin/org/fossify/home/helpers/Playful.kt
// LAUNCHPAD "verspielt & bunt": warm, sunny palette + tiny view helpers for the programmatic
// child-facing screens. The palette now ADAPTS to the wallpaper: Playful.palette(context) reads
// the system wallpaper's primary colour and derives a soft, readable, kid-friendly scheme from it
// (light tinted background, dark ink, one vivid accent). Falls back to the cosy coral defaults for
// greyscale wallpapers or on devices before API 27. Only look & wording change — every protection
// (whitelist, time budget, cool-down, impulse brake) stays exactly as it was.

@file:Suppress("MagicNumber", "TooManyFunctions") // colour math constants; small cohesive helper

package org.fossify.home.helpers

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.widget.ImageView
import android.widget.LinearLayout
import kotlin.math.abs
import kotlin.math.roundToInt

object Playful {
    // Fallback "cosy coral" palette (used for greyscale wallpapers / API < 27).
    const val CREAM = "#FFF7EC"     // sunny page background
    const val PEACH = "#FFE7CE"     // soft card / panel tint
    const val CORAL = "#FF7A59"     // primary playful accent
    const val CORAL_DARK = "#E85D3D"
    const val SUN = "#FFC53D"       // happy yellow — SEMANTIC: "time is getting low"
    const val MINT = "#2BB673"      // SEMANTIC: "plenty of time" / positive
    const val SKY = "#4FB0E5"
    const val GRAPE = "#A06CD5"
    const val INK = "#4A3A2E"       // warm dark-brown text
    const val INK_SOFT = "#9B8779"  // muted warm text
    const val CARD = "#FFFFFF"
    const val LINE = "#EFE2D2"      // soft warm divider

    /** A resolved colour scheme. Chrome (bg/accent/ink…) adapts to the wallpaper; the semantic
     *  status colours [MINT]/[SUN] stay constant so the child keeps learning what they mean. */
    data class Pal(
        val bg: Int,
        val card: Int,
        val accent: Int,
        val accentDark: Int,
        val accentSoft: Int,
        val ink: Int,
        val inkSoft: Int,
        val line: Int,
    )

    fun color(hex: String): Int = Color.parseColor(hex)

    /** The wallpaper-adapted palette for this context (cosy coral fallback when unavailable). */
    fun palette(context: Context): Pal {
        val seed = wallpaperSeed(context) ?: return defaultPal()
        return derive(seed)
    }

    /** The cosy coral fallback, as raw ARGB ints (pure — safe to use off-device). */
    fun defaultPal(): Pal = Pal(
        bg = 0xFFFFF7EC.toInt(),
        card = 0xFFFFFFFF.toInt(),
        accent = 0xFFFF7A59.toInt(),
        accentDark = 0xFFE85D3D.toInt(),
        accentSoft = 0xFFFFE7CE.toInt(),
        ink = 0xFF4A3A2E.toInt(),
        inkSoft = 0xFF9B8779.toInt(),
        line = 0xFFEFE2D2.toInt(),
    )

    /**
     * Derive a warm, readable scheme from a [seed] wallpaper colour. Pure (no Android calls) so it
     * is unit-testable. Guarantees: the background is always light and the ink always dark, whatever
     * the wallpaper, so text stays legible. Near-greyscale seeds keep the cosy coral default.
     */
    fun derive(seed: Int): Pal {
        val hsl = toHsl(seed)
        val h = hsl[0]
        val s0 = hsl[1]
        if (s0 < 0.08f) return defaultPal() // no meaningful hue (grey/black/white) → stay cosy
        val accentS = s0.coerceIn(0.55f, 0.85f)
        return Pal(
            bg = hslColor(h, (s0 * 0.5f).coerceIn(0.15f, 0.45f), 0.965f),
            card = 0xFFFFFFFF.toInt(),
            accent = hslColor(h, accentS, 0.58f),
            accentDark = hslColor(h, accentS, 0.46f),
            accentSoft = hslColor(h, (s0 * 0.6f).coerceIn(0.25f, 0.5f), 0.90f),
            ink = hslColor(h, (s0 * 0.4f).coerceIn(0.15f, 0.4f), 0.22f),
            inkSoft = hslColor(h, (s0 * 0.35f).coerceIn(0.1f, 0.35f), 0.52f),
            line = hslColor(h, (s0 * 0.4f).coerceIn(0.1f, 0.4f), 0.90f),
        )
    }

    @Suppress("TooGenericExceptionCaught", "SwallowedException")
    private fun wallpaperSeed(context: Context): Int? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1) return null
        return try {
            WallpaperManager.getInstance(context)
                .getWallpaperColors(WallpaperManager.FLAG_SYSTEM)
                ?.primaryColor?.toArgb()
        } catch (e: Exception) {
            null
        }
    }

    // --- pure HSL helpers (operate on ARGB ints; no android.graphics.Color) ---

    private fun toHsl(color: Int): FloatArray {
        val r = ((color shr 16) and 0xFF) / 255f
        val g = ((color shr 8) and 0xFF) / 255f
        val b = (color and 0xFF) / 255f
        val max = maxOf(r, g, b)
        val min = minOf(r, g, b)
        val l = (max + min) / 2f
        val d = max - min
        var h = 0f
        var s = 0f
        if (d != 0f) {
            s = d / (1f - abs(2f * l - 1f))
            h = when (max) {
                r -> 60f * (((g - b) / d) % 6f)
                g -> 60f * (((b - r) / d) + 2f)
                else -> 60f * (((r - g) / d) + 4f)
            }
            if (h < 0f) h += 360f
        }
        return floatArrayOf(h, s, l)
    }

    private fun hslColor(h: Float, s: Float, l: Float): Int {
        val c = (1f - abs(2f * l - 1f)) * s
        val hp = (((h % 360f) + 360f) % 360f) / 60f
        val x = c * (1f - abs(hp % 2f - 1f))
        val r1: Float; val g1: Float; val b1: Float
        when {
            hp < 1f -> { r1 = c; g1 = x; b1 = 0f }
            hp < 2f -> { r1 = x; g1 = c; b1 = 0f }
            hp < 3f -> { r1 = 0f; g1 = c; b1 = x }
            hp < 4f -> { r1 = 0f; g1 = x; b1 = c }
            hp < 5f -> { r1 = x; g1 = 0f; b1 = c }
            else -> { r1 = c; g1 = 0f; b1 = x }
        }
        val m = l - c / 2f
        val r = ((r1 + m) * 255f).roundToInt().coerceIn(0, 255)
        val g = ((g1 + m) * 255f).roundToInt().coerceIn(0, 255)
        val b = ((b1 + m) * 255f).roundToInt().coerceIn(0, 255)
        return (0xFF shl 24) or (r shl 16) or (g shl 8) or b
    }

    fun dp(context: Context, value: Int): Int =
        TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), context.resources.displayMetrics
        ).toInt()

    /** A friendly mascot image [sizeDp] tall, centered in a vertical LinearLayout. */
    fun mascot(context: Context, resId: Int, sizeDp: Int): ImageView =
        ImageView(context).apply {
            setImageResource(resId)
            val px = dp(context, sizeDp)
            layoutParams = LinearLayout.LayoutParams(px, px).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
        }

    /** Rounded solid background from a hex string. */
    fun roundedBg(context: Context, hex: String, radiusDp: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color(hex))
            cornerRadius = dp(context, radiusDp).toFloat()
        }

    /** Rounded solid background from a resolved ARGB int (used with [Pal]). */
    fun roundedBg(context: Context, colorInt: Int, radiusDp: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(colorInt)
            cornerRadius = dp(context, radiusDp).toFloat()
        }
}
