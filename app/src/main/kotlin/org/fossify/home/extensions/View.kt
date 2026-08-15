package org.fossify.home.extensions

import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.core.content.ContextCompat
import org.fossify.home.R

fun View.animateScale(
    from: Float,
    to: Float,
    duration: Long,
) = animate()
    .scaleX(to)
    .scaleY(to)
    .setDuration(duration)
    .setInterpolator(AccelerateDecelerateInterpolator())
    .withStartAction {
        scaleX = from
        scaleY = from
    }

fun View.setupDrawerBackground() {
    background = ContextCompat.getDrawable(context, R.drawable.lp_drawer_background)
}
