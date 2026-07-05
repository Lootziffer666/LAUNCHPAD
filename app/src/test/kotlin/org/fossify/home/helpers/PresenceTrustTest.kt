// Unit tests for the pure Presence-Trust scorer. Plain JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PresenceTrustTest {

    @Test
    fun scoreSumsPresentWeightsAndClamps() {
        val signals = listOf(
            TrustSignal("a", 40, true),
            TrustSignal("b", 35, false),
            TrustSignal("c", 15, true)
        )
        assertEquals(55, PresenceTrust.score(signals))
        // Clamp to 100 even if weights overshoot.
        assertEquals(100, PresenceTrust.score(listOf(TrustSignal("x", 80, true), TrustSignal("y", 80, true))))
        assertEquals(0, PresenceTrust.score(listOf(TrustSignal("x", 80, false))))
    }

    @Test
    fun thresholdGate() {
        assertTrue(PresenceTrust.isTrusted(55))
        assertFalse(PresenceTrust.isTrusted(54))
        assertTrue(PresenceTrust.isTrusted(10, threshold = 10))
    }

    @Test
    fun supervisedTagIsTrustedOnItsOwn() {
        // A valid signed tag alone clears the default threshold — robustness by design.
        assertTrue(PresenceTrust.isTrusted(PresenceTrust.supervisedScore(supervisedTag = true, homeWifi = false)))
    }

    @Test
    fun weakEnvironmentIsNotTrusted() {
        // Only a "time window" style weak signal → below threshold.
        assertFalse(
            PresenceTrust.isTrusted(
                PresenceTrust.supervisedScore(supervisedTag = false, homeWifi = false, homeGeofence = true)
            )
        )
    }

    @Test
    fun droppedWifiStillTrustedWithParentDevice() {
        // The robustness case from the design: lose home WiFi but the parent's device is nearby.
        val score = PresenceTrust.supervisedScore(
            supervisedTag = false, homeWifi = false, parentDeviceNearby = true, homeGeofence = true
        )
        assertEquals(35 + 15, score)
        assertFalse("50 < 55 default", PresenceTrust.isTrusted(score))
        assertTrue("but a lower family threshold would trust it", PresenceTrust.isTrusted(score, threshold = 50))
    }
}
