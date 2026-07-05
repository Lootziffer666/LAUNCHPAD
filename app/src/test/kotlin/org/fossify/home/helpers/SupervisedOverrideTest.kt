// Unit tests for the pure Papa-Modus token + window logic. No Android — plain JVM (javax.crypto).

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class SupervisedOverrideTest {

    private val secret = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
    private val otherSecret = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

    @Test
    fun signIsDeterministicAndSecretDependent() {
        val a = SupervisedOverride.sign(secret, "hello")
        assertEquals("HMAC must be stable", a, SupervisedOverride.sign(secret, "hello"))
        assertEquals("HMAC-SHA256 is 32 bytes → 64 hex chars", 64, a.length)
        assert(a != SupervisedOverride.sign(otherSecret, "hello")) { "different secret → different sig" }
    }

    @Test
    fun validTokenRoundTrips() {
        val now = 1_000_000L
        val expiry = now + 60_000L
        val token = SupervisedOverride.buildToken(secret, expiry, "abcd")
        assertEquals(expiry, SupervisedOverride.verifyToken(secret, token, now))
    }

    @Test
    fun expiredTokenRejected() {
        val expiry = 1_000_000L
        val token = SupervisedOverride.buildToken(secret, expiry, "abcd")
        assertNull("at expiry", SupervisedOverride.verifyToken(secret, token, expiry))
        assertNull("past expiry", SupervisedOverride.verifyToken(secret, token, expiry + 1))
    }

    @Test
    fun wrongSecretRejected() {
        val token = SupervisedOverride.buildToken(secret, 2_000_000L, "abcd")
        assertNull(SupervisedOverride.verifyToken(otherSecret, token, 1_000_000L))
    }

    @Test
    fun tamperedTokenRejected() {
        val token = SupervisedOverride.buildToken(secret, 2_000_000L, "abcd")
        // Flip the expiry to buy more time but keep the old signature.
        val tampered = token.replace("2000000", "9000000")
        assertNull(SupervisedOverride.verifyToken(secret, tampered, 1_000_000L))
    }

    @Test
    fun malformedTokensRejected() {
        val now = 1_000_000L
        assertNull(SupervisedOverride.verifyToken(secret, "", now))
        assertNull(SupervisedOverride.verifyToken(secret, "garbage", now))
        assertNull(SupervisedOverride.verifyToken(secret, "LPO1.2000000.abcd", now)) // no sig
        assertNull(SupervisedOverride.verifyToken(secret, "XXXX.2000000.abcd.deadbeef", now)) // bad version
    }

    @Test
    fun grantedUntilIsCappedByTokenExpiry() {
        val now = 1_000_000L
        // Window shorter than token life → window wins.
        assertEquals(now + 60L * 60_000L, SupervisedOverride.grantedUntil(now + 10_000_000L, now, 60))
        // Window longer than token life → token expiry wins.
        assertEquals(now + 5_000L, SupervisedOverride.grantedUntil(now + 5_000L, now, 180))
    }

    @Test
    fun deepLinkCarriesToken() {
        val token = SupervisedOverride.buildToken(secret, 2_000_000L, "abcd")
        val link = SupervisedOverride.deepLink(token)
        assert(link.startsWith("launchpad://papa?t=")) { "unexpected link: $link" }
        assert(link.endsWith(token)) { "token must be preserved verbatim" }
        assertNotNull(token)
    }
}
