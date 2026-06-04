// File: app/src/test/kotlin/org/fossify/home/helpers/ForegroundPolicyTest.kt
// Pure-logic tests for the strict foreground block decision.

package org.fossify.home.helpers

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ForegroundPolicyTest {

    private val own = "org.fossify.home"
    private val essentials = setOf("com.android.systemui", "com.google.android.dialer")

    @Test
    fun blocksNonWhitelistedApp() {
        assertTrue(
            ForegroundPolicy.shouldBlock("com.random.game", own, isWhitelisted = false, essentials)
        )
    }

    @Test
    fun allowsWhitelistedApp() {
        assertFalse(
            ForegroundPolicy.shouldBlock("com.random.game", own, isWhitelisted = true, essentials)
        )
    }

    @Test
    fun neverBlocksOwnLauncher() {
        assertFalse(ForegroundPolicy.shouldBlock(own, own, isWhitelisted = false, essentials))
    }

    @Test
    fun neverBlocksDialerOrSystemUi() {
        assertFalse(
            ForegroundPolicy.shouldBlock("com.google.android.dialer", own, false, essentials)
        )
        assertFalse(
            ForegroundPolicy.shouldBlock("com.android.systemui", own, false, essentials)
        )
    }

    @Test
    fun blankPackageIsNotBlocked() {
        assertFalse(ForegroundPolicy.shouldBlock("", own, isWhitelisted = false, essentials))
    }
}
