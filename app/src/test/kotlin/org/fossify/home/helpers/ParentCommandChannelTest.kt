package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

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
