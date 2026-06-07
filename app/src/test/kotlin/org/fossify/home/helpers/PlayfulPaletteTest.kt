// Unit tests for the pure wallpaper→palette derivation in Playful. No Android calls involved,
// so these run on the plain JVM. The key guarantee for a child's device is legibility: whatever
// the wallpaper, the background must stay light and the ink dark.

@file:Suppress("MagicNumber")

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayfulPaletteTest {

    private fun r(c: Int) = (c shr 16) and 0xFF
    private fun g(c: Int) = (c shr 8) and 0xFF
    private fun b(c: Int) = c and 0xFF
    private fun lum(c: Int) = 0.299 * r(c) + 0.587 * g(c) + 0.114 * b(c)

    private val sampleSeeds = listOf(
        0xFF1565C0.toInt(), // blue
        0xFF2E7D32.toInt(), // green
        0xFFAD1457.toInt(), // pink
        0xFFF9A825.toInt(), // amber
        0xFF6A1B9A.toInt(), // purple
        0xFF00897B.toInt(), // teal
    )

    @Test
    fun greyscaleSeedKeepsCosyDefault() {
        // A near-greyscale wallpaper has no meaningful hue → stay on the warm coral default.
        assertEquals(Playful.defaultPal(), Playful.derive(0xFF808080.toInt()))
        assertEquals(Playful.defaultPal(), Playful.derive(0xFF222222.toInt()))
    }

    @Test
    fun backgroundAlwaysLight_inkAlwaysDark() {
        for (seed in sampleSeeds) {
            val p = Playful.derive(seed)
            assertTrue("bg should be light for ${seed.toUInt().toString(16)}", lum(p.bg) > 210)
            assertTrue("ink should be dark for ${seed.toUInt().toString(16)}", lum(p.ink) < 110)
            assertTrue("bg must be lighter than ink", lum(p.bg) > lum(p.ink))
            assertTrue("inkSoft sits between", lum(p.inkSoft) in lum(p.ink)..lum(p.bg))
        }
    }

    @Test
    fun everyColourIsOpaque() {
        val p = Playful.derive(0xFF1565C0.toInt())
        for (c in listOf(p.bg, p.card, p.accent, p.accentDark, p.accentSoft, p.ink, p.inkSoft, p.line)) {
            assertEquals(0xFF, (c ushr 24) and 0xFF)
        }
    }

    @Test
    fun accentReflectsSeedHue() {
        val blue = Playful.derive(0xFF1565C0.toInt()).accent
        assertTrue("accent of a blue wallpaper should be bluish", b(blue) > r(blue) && b(blue) > g(blue))
        val green = Playful.derive(0xFF2E7D32.toInt()).accent
        assertTrue("accent of a green wallpaper should be greenish", g(green) > r(green) && g(green) > b(green))
    }
}
