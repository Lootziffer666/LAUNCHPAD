// File: app/src/main/kotlin/org/fossify/home/helpers/Playful.kt
// LAUNCHPAD "verspielt & bunt": warm, sunny palette + tiny view helpers for the programmatic
// child-facing screens. Replaces the dark-navy "control console" look with a friendly one.
// Mirrors the lp_* colours in res/values/colors.xml. Only the look & wording change here —
// every protection (whitelist, time budget, cool-down, impulse brake) stays exactly as it was.

package org.fossify.home.helpers

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.widget.ImageView
import android.widget.LinearLayout

object Playful {
    const val CREAM = "#FFF7EC"     // sunny page background
    const val PEACH = "#FFE7CE"     // soft card / panel tint
    const val CORAL = "#FF7A59"     // primary playful accent
    const val CORAL_DARK = "#E85D3D"
    const val SUN = "#FFC53D"       // happy yellow
    const val MINT = "#2BB673"      // positive / "go"
    const val SKY = "#4FB0E5"
    const val GRAPE = "#A06CD5"
    const val INK = "#4A3A2E"       // warm dark-brown text
    const val INK_SOFT = "#9B8779"  // muted warm text
    const val CARD = "#FFFFFF"
    const val LINE = "#EFE2D2"      // soft warm divider

    fun color(hex: String): Int = Color.parseColor(hex)

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

    /** Rounded solid background with [radiusDp] corners. */
    fun roundedBg(context: Context, hex: String, radiusDp: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color(hex))
            cornerRadius = dp(context, radiusDp).toFloat()
        }
}
