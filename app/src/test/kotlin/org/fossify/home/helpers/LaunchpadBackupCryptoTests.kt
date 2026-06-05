// File: app/src/test/kotlin/org/fossify/home/helpers/LaunchpadBackupCryptoTests.kt
// Round-trip + failure-mode tests for BackupCrypto (AES-256-GCM + PBKDF2). Pure JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LaunchpadBackupCryptoTests {

    private val pass = "Eltern-PIN-1234"

    @Test
    fun roundTripRecoversPlaintext() {
        val plain = """{"allowedApps":[],"timeLimits":[],"settings":{"x":1}}"""
        val blob = BackupCrypto.encrypt(plain, pass)
        assertEquals(plain, BackupCrypto.decrypt(blob, pass))
    }

    @Test
    fun wrongPassphraseReturnsNull() {
        val blob = BackupCrypto.encrypt("geheim", pass)
        assertNull(BackupCrypto.decrypt(blob, "falsch"))
    }

    @Test
    fun tamperedBlobReturnsNull() {
        val blob = BackupCrypto.encrypt("geheim", pass)
        // Flip the last character (part of the GCM tag) → authentication must fail.
        val tampered = blob.dropLast(1) + if (blob.last() == 'A') 'B' else 'A'
        assertNull(BackupCrypto.decrypt(tampered, pass))
    }

    @Test
    fun malformedBlobReturnsNull() {
        assertNull(BackupCrypto.decrypt("nicht base64 !!!", pass))
        assertNull(BackupCrypto.decrypt("", pass))
    }

    @Test
    fun emptyPlaintextRoundTrips() {
        val blob = BackupCrypto.encrypt("", pass)
        assertEquals("", BackupCrypto.decrypt(blob, pass))
    }

    @Test
    fun unicodeRoundTrips() {
        val plain = "Jäke • Bildschirmzeit ⏱ — „Ausnahme\" 🪙"
        val blob = BackupCrypto.encrypt(plain, pass)
        assertEquals(plain, BackupCrypto.decrypt(blob, pass))
    }

    @Test
    fun sameInputProducesDifferentBlobs() {
        // Random salt + IV per call → ciphertext must differ even for identical input.
        val a = BackupCrypto.encrypt("geheim", pass)
        val b = BackupCrypto.encrypt("geheim", pass)
        assertNotEquals(a, b)
        assertEquals("geheim", BackupCrypto.decrypt(a, pass))
        assertEquals("geheim", BackupCrypto.decrypt(b, pass))
    }
}
