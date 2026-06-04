// File: app/src/main/kotlin/org/fossify/home/helpers/BackupCrypto.kt
// Passphrase-based encryption for LAUNCHPAD backups (settings/whitelist/limits export).
// AES-256-GCM with a PBKDF2WithHmacSHA256-derived key. Uses java.util.Base64 (minSdk 26) so the
// round-trip is unit-testable on a plain JVM — see LaunchpadBackupCryptoTests.
//
// Blob layout (Base64-encoded): version(1) ‖ salt(16) ‖ iv(12) ‖ ciphertext+GCM-tag

@file:Suppress("MagicNumber") // crypto sizes are documented constants

package org.fossify.home.helpers

import java.security.GeneralSecurityException
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

object BackupCrypto {
    private const val VERSION: Byte = 1
    private const val SALT_LEN = 16
    private const val IV_LEN = 12
    private const val GCM_TAG_BITS = 128
    private const val KEY_BITS = 256
    private const val PBKDF2_ITERATIONS = 120_000
    private const val HEADER_LEN = 1 + SALT_LEN + IV_LEN

    /** Encrypt [plaintext] under [passphrase]; returns a Base64 blob (never null). */
    fun encrypt(plaintext: String, passphrase: String): String {
        val salt = randomBytes(SALT_LEN)
        val iv = randomBytes(IV_LEN)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, deriveKey(passphrase, salt), GCMParameterSpec(GCM_TAG_BITS, iv))
        val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        val blob = byteArrayOf(VERSION) + salt + iv + ciphertext
        return Base64.getEncoder().encodeToString(blob)
    }

    /**
     * Decrypt a blob produced by [encrypt]. Returns null on a wrong passphrase, tampered data
     * (GCM tag mismatch), or a malformed/old-version blob — never throws.
     */
    fun decrypt(blob: String, passphrase: String): String? {
        return try {
            val bytes = Base64.getDecoder().decode(blob)
            if (bytes.size <= HEADER_LEN || bytes[0] != VERSION) return null
            val salt = bytes.copyOfRange(1, 1 + SALT_LEN)
            val iv = bytes.copyOfRange(1 + SALT_LEN, HEADER_LEN)
            val ciphertext = bytes.copyOfRange(HEADER_LEN, bytes.size)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, deriveKey(passphrase, salt), GCMParameterSpec(GCM_TAG_BITS, iv))
            String(cipher.doFinal(ciphertext), Charsets.UTF_8)
        } catch (e: GeneralSecurityException) {
            null // wrong passphrase or tampered ciphertext
        } catch (e: IllegalArgumentException) {
            null // not valid Base64
        }
    }

    private fun deriveKey(passphrase: String, salt: ByteArray): SecretKey {
        val spec = PBEKeySpec(passphrase.toCharArray(), salt, PBKDF2_ITERATIONS, KEY_BITS)
        val keyBytes = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            .generateSecret(spec).encoded
        return SecretKeySpec(keyBytes, "AES")
    }

    private fun randomBytes(n: Int): ByteArray = ByteArray(n).also { SecureRandom().nextBytes(it) }
}
