// File: app/src/test/kotlin/org/fossify/home/helpers/ChildProfileTest.kt
// Pure tests for the German genitive helper used for the configurable child name.

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Test

class ChildProfileTest {

    @Test
    fun regularNameGetsS() {
        assertEquals("Jakes", ChildProfile.possessive("Jake"))
        assertEquals("Mias", ChildProfile.possessive("Mia"))
        assertEquals("Lupos", ChildProfile.possessive("Lupo"))
    }

    @Test
    fun sibilantEndingGetsApostrophe() {
        assertEquals("Lukas'", ChildProfile.possessive("Lukas"))
        assertEquals("Max'", ChildProfile.possessive("Max"))
        assertEquals("Fritz'", ChildProfile.possessive("Fritz"))
    }

    @Test
    fun emptyStaysEmpty() {
        assertEquals("", ChildProfile.possessive(""))
    }
}
