// Unit tests for the LAN-server auth gate. Pure logic (string compare + MessageDigest), so these
// run on the plain JVM. The gate's contract: discovery/pairing endpoints stay open; once a device
// is paired (session key present) every control endpoint needs a matching Bearer token.

package org.fossify.home.helpers

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LaunchpadServerAuthTest {

    @Test
    fun discoveryAndPairingEndpointsAreOpen() {
        assertTrue(LaunchpadServer.isOpenEndpoint("/api/ip"))
        assertTrue(LaunchpadServer.isOpenEndpoint("/api/pair"))
        assertTrue(LaunchpadServer.isOpenEndpoint("/api/test-pair"))
    }

    @Test
    fun controlEndpointsAreNotOpen() {
        val controlPaths = listOf(
            "/api/status", "/api/pending", "/api/command", "/api/apps",
            "/api/apps/remove", "/api/apps/toggle", "/api/limits", "/api/export", "/api/import"
        )
        controlPaths.forEach { p ->
            assertFalse("$p must require auth", LaunchpadServer.isOpenEndpoint(p))
        }
    }

    @Test
    fun unpairedDeviceAllowsEverything() {
        // No session key yet → open, so the first pairing and the manual-IP fallback keep working.
        assertTrue(LaunchpadServer.authOk(null, null))
        assertTrue(LaunchpadServer.authOk("", "Bearer whatever"))
    }

    @Test
    fun pairedDeviceRequiresMatchingBearer() {
        val key = "c2Vzc2lvbktleUJhc2U2NA=="
        assertTrue("correct token", LaunchpadServer.authOk(key, "Bearer $key"))
        assertFalse("missing header", LaunchpadServer.authOk(key, null))
        assertFalse("wrong key", LaunchpadServer.authOk(key, "Bearer nope"))
        assertFalse("missing Bearer prefix", LaunchpadServer.authOk(key, key))
        assertFalse("empty header", LaunchpadServer.authOk(key, ""))
    }
}
