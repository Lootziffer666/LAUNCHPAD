package org.fossify.home.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MiniGameTest {
    @Test
    fun startsScoresAndRestartsWithoutNetworkOrClockDependencies() {
        val game = MiniGame { 0f }
        game.start()

        repeat(20) { game.update(.05f) }

        assertTrue(game.score > 0)
        assertTrue(game.snapshot().obstacles.isNotEmpty())
        game.start()
        assertEquals(0, game.score)
        assertFalse(game.gameOver)
    }

    @Test
    fun jumpMovesPlayerAndPauseFreezesSimulation() {
        val game = MiniGame { 0f }
        game.start()
        game.jump()
        val airborne = game.update(.05f)
        assertTrue(airborne.playerY > 0f)

        game.pause()
        val pausedScore = game.score
        repeat(10) { game.update(.05f) }
        assertEquals(pausedScore, game.score)
    }
}
