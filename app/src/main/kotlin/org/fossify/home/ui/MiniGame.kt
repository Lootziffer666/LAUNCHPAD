@file:Suppress("MagicNumber")

package org.fossify.home.ui

data class RunnerObstacle(var x: Float, val width: Float, val height: Float)
data class MiniGameSnapshot(
    val running: Boolean,
    val gameOver: Boolean,
    val score: Int,
    val playerY: Float,
    val obstacles: List<RunnerObstacle>,
)

/** Rendering-independent endless-runner simulation, expressed in normalized screen units. */
class MiniGame(private val random: () -> Float = { kotlin.random.Random.nextFloat() }) {
    private var velocity = 0f
    private var playerY = 0f
    private var distance = 0f
    private var spawnIn = .9f
    private val obstacles = mutableListOf<RunnerObstacle>()
    var running = false; private set
    var gameOver = false; private set
    val score get() = distance.toInt()

    fun start() {
        velocity = 0f; playerY = 0f; distance = 0f; spawnIn = .85f
        obstacles.clear(); gameOver = false; running = true
    }

    fun pause() { running = false }
    fun resume() { if (!gameOver) running = true }
    fun jump() { if (running && playerY <= .01f) velocity = 1.38f }

    fun update(seconds: Float): MiniGameSnapshot {
        if (!running) return snapshot()
        val dt = seconds.coerceIn(0f, .05f)
        velocity -= 3.7f * dt
        playerY = (playerY + velocity * dt).coerceAtLeast(0f)
        if (playerY == 0f) velocity = 0f
        distance += dt * 10f
        spawnIn -= dt
        if (spawnIn <= 0f) {
            obstacles += RunnerObstacle(1.05f, .065f + random() * .035f, .12f + random() * .1f)
            spawnIn = .72f + random() * .75f
        }
        val speed = .48f + (distance / 500f).coerceAtMost(.22f)
        obstacles.forEach { it.x -= speed * dt }
        obstacles.removeAll { it.x + it.width < 0f }
        if (obstacles.any { it.x < .27f && it.x + it.width > .17f && playerY < it.height }) {
            running = false; gameOver = true
        }
        return snapshot()
    }

    fun snapshot() = MiniGameSnapshot(running, gameOver, score, playerY, obstacles.map { it.copy() })
}
