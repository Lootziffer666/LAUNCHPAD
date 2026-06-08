// Unit tests for the pure new-app diff. Pure (no Android), runs on the plain JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NewAppsTrackerTest {

    @Test
    fun flagsOnlyTrulyNewUnknownApps() {
        val known = setOf("a", "b")
        val current = setOf("a", "b", "c", "d")
        val allowed = setOf("d") // already whitelisted → not "new to review"
        assertEquals(setOf("c"), NewAppsTracker.computeNewPending(known, current, allowed, "self"))
    }

    @Test
    fun excludesSelfAndAllowed() {
        val result = NewAppsTracker.computeNewPending(
            known = emptySet(),
            current = setOf("self", "x", "y"),
            allowed = setOf("y"),
            selfPackage = "self"
        )
        assertEquals(setOf("x"), result)
    }

    @Test
    fun nothingNewWhenCurrentIsSubsetOfKnown() {
        assertTrue(
            NewAppsTracker.computeNewPending(setOf("a", "b"), setOf("a"), emptySet(), "self").isEmpty()
        )
    }
}
