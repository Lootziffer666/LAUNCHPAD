package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import java.nio.charset.StandardCharsets
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class ParentCommandChannelTest {
    private val key = ByteArray(32) { it.toByte() }
    private val now = 1_700_000_000_000L

    private fun command(type: ParentCommandType = ParentCommandType.ADD_TIME) = ParentCommand(
        parentId = "parent",
        type = type,
        minutes = 30,
        timestamp = now,
        nonce = "nonce-1"
    )

    @Test
    fun validThirtyMinuteCommand() {
        val payload = ParentCommandCodec.sign(command(), key)
        assertNotNull(ParentCommandCodec.verify(payload, key, "parent", now, emptySet()))
    }

    @Test
    fun invalidSignature() {
        val payload = ParentCommandCodec.sign(command(), key)
        assertNull(
            ParentCommandCodec.verify(
                payload,
                ByteArray(32) { 9 },
                "parent",
                now,
                emptySet()
            )
        )
    }

    @Test
    fun wrongParent() {
        val payload = ParentCommandCodec.sign(command(), key)
        assertNull(ParentCommandCodec.verify(payload, key, "mama", now, emptySet()))
    }

    @Test
    fun replayIsRejected() {
        val payload = ParentCommandCodec.sign(command(), key)
        assertNull(
            ParentCommandCodec.verify(payload, key, "parent", now, setOf("nonce-1"))
        )
    }

    @Test
    fun expiredTimestamp() {
        val payload = ParentCommandCodec.sign(command(), key)
        val expiredNow = now + 11 * 60_000
        assertNull(ParentCommandCodec.verify(payload, key, "parent", expiredNow, emptySet()))
    }

    @Test
    fun webBundleDataRoundTrip() {
        val command = ParentCommand(
            parentId = "parent",
            type = ParentCommandType.ALLOW_WEB_BUNDLE,
            minutes = 0,
            timestamp = now,
            nonce = "web-1",
            data = "wikipedia.org\nscratch.mit.edu"
        )
        val payload = ParentCommandCodec.sign(command, key)
        val verified = ParentCommandCodec.verify(payload, key, "parent", now, emptySet())
        assertEquals(command.type, verified?.type)
        assertEquals(command.data, verified?.data)
    }

    @Test
    fun paddedLegacyCompanionPayloadIsAccepted() {
        val body = "parent|ADD_TIME|30|$now|legacy-padding"
        val mac = Mac.getInstance("HmacSHA256").apply {
            init(SecretKeySpec(key, "HmacSHA256"))
        }
        val signature = Base64.getUrlEncoder()
            .encodeToString(mac.doFinal(body.toByteArray(StandardCharsets.UTF_8)))
        val payload = ParentCommandCodec.PREFIX + Base64.getUrlEncoder()
            .encodeToString("$body|$signature".toByteArray(StandardCharsets.UTF_8))

        val verified = ParentCommandCodec.verify(payload, key, "parent", now, emptySet())
        assertEquals(ParentCommandType.ADD_TIME, verified?.type)
        assertEquals(30, verified?.minutes)
    }

    @Test
    fun unlimitedAndLockCommandsRoundTrip() {
        val unlimited = command(ParentCommandType.UNLIMITED_TODAY)
        val unlimitedPayload = ParentCommandCodec.sign(unlimited, key)
        assertEquals(
            ParentCommandType.UNLIMITED_TODAY,
            ParentCommandCodec.verify(unlimitedPayload, key, "parent", now, emptySet())?.type
        )

        val lock = command(ParentCommandType.LOCK_NOW)
        val lockPayload = ParentCommandCodec.sign(lock, key)
        assertEquals(
            ParentCommandType.LOCK_NOW,
            ParentCommandCodec.verify(lockPayload, key, "parent", now, emptySet())?.type
        )
    }
}
