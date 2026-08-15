package org.fossify.home.helpers

import org.junit.Assert.*
import org.junit.Test

class ParentCommandChannelTest {
    private val key = ByteArray(32) { it.toByte() }
    private val now = 1_700_000_000_000L
    private fun command(type: ParentCommandType = ParentCommandType.ADD_TIME) = ParentCommand("parent", type, 30, now, "nonce-1")

    @Test fun validThirtyMinuteCommand() = assertNotNull(ParentCommandCodec.verify(ParentCommandCodec.sign(command(), key), key, "parent", now, emptySet()))
    @Test fun invalidSignature() = assertNull(ParentCommandCodec.verify(ParentCommandCodec.sign(command(), key), ByteArray(32) { 9 }, "parent", now, emptySet()))
    @Test fun wrongParent() = assertNull(ParentCommandCodec.verify(ParentCommandCodec.sign(command(), key), key, "mama", now, emptySet()))
    @Test fun replayIsRejected() = assertNull(ParentCommandCodec.verify(ParentCommandCodec.sign(command(), key), key, "parent", now, setOf("nonce-1")))
    @Test fun expiredTimestamp() = assertNull(ParentCommandCodec.verify(ParentCommandCodec.sign(command(), key), key, "parent", now + 11 * 60_000, emptySet()))
    @Test fun unlimitedAndLockCommandsRoundTrip() {
        assertEquals(ParentCommandType.UNLIMITED_TODAY, ParentCommandCodec.verify(ParentCommandCodec.sign(command(ParentCommandType.UNLIMITED_TODAY), key), key, "parent", now, emptySet())?.type)
        assertEquals(ParentCommandType.LOCK_NOW, ParentCommandCodec.verify(ParentCommandCodec.sign(command(ParentCommandType.LOCK_NOW), key), key, "parent", now, emptySet())?.type)
    }
}
