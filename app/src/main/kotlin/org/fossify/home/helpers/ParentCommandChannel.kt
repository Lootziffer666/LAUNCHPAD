package org.fossify.home.helpers

import android.content.Context
import android.widget.Toast
import java.nio.charset.StandardCharsets
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

enum class ParentCommandType { ADD_TIME, UNLIMITED_TODAY, LOCK_NOW }

data class ParentCommand(
    val parentId: String,
    val type: ParentCommandType,
    val minutes: Int,
    val timestamp: Long,
    val nonce: String
)

data class ParentCommandResult(val accepted: Boolean, val message: String)

object ParentCommandCodec {
    const val PREFIX = "LP1:"

    fun sign(command: ParentCommand, secret: ByteArray): String {
        val body = listOf(
            command.parentId,
            command.type.name,
            command.minutes,
            command.timestamp,
            command.nonce
        ).joinToString("|")
        val mac = Mac.getInstance("HmacSHA256").apply {
            init(SecretKeySpec(secret, "HmacSHA256"))
        }
        val signature = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(mac.doFinal(body.toByteArray(StandardCharsets.UTF_8)))
        return PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString("$body|$signature".toByteArray())
    }

    fun verify(
        payload: String,
        secret: ByteArray,
        expectedParent: String,
        now: Long,
        used: Set<String>
    ): ParentCommand? {
        if (!payload.startsWith(PREFIX)) return null
        val fields = runCatching {
            String(Base64.getUrlDecoder().decode(payload.removePrefix(PREFIX))).split('|')
        }.getOrNull() ?: return null
        if (fields.size != 6 || fields[0] != expectedParent || fields[4] in used) return null
        val command = runCatching {
            ParentCommand(
                fields[0],
                ParentCommandType.valueOf(fields[1]),
                fields[2].toInt(),
                fields[3].toLong(),
                fields[4]
            )
        }.getOrNull() ?: return null
        if (kotlin.math.abs(now - command.timestamp) > 10 * 60_000L) return null
        return if (sign(command, secret) == payload) command else null
    }
}

interface ParentCommandTransport {
    fun send(payload: String): Boolean
}

/** Transport-independent validation and dispatch into the time/lock controllers. */
class ParentCommandController(private val context: Context) {
    private val prefs
        get() = context.getSharedPreferences(LaunchpadPrefs.PREFS_FILE, Context.MODE_PRIVATE)

    fun receive(payload: String, now: Long = System.currentTimeMillis()): ParentCommandResult {
        val secret = prefs.getString(LaunchpadPrefs.PREF_PAIR_SESSION_KEY, null)
            ?.let { Base64.getDecoder().decode(it) }
            ?: return ParentCommandResult(false, "Nicht gekoppelt")
        val used = prefs.getStringSet(LaunchpadPrefs.PREF_PARENT_COMMAND_NONCES, emptySet()) ?: emptySet()
        val expectedParent = prefs.getString(LaunchpadPrefs.PREF_PAIR_PARENT_ID, "parent") ?: "parent"
        val command = ParentCommandCodec.verify(payload, secret, expectedParent, now, used)
            ?: return ParentCommandResult(false, "Befehl nicht gültig")
        val budgets = TimeBudgetController(context)
        val message = when (command.type) {
            ParentCommandType.ADD_TIME -> {
                budgets.grantBonus(command.minutes)
                "${command.minutes} Minuten Bonuszeit erhalten."
            }

            ParentCommandType.UNLIMITED_TODAY -> {
                budgets.setUnlimitedToday(true)
                "Für heute freigegeben."
            }

            ParentCommandType.LOCK_NOW -> {
                budgets.setLocked(true)
                "Launchpad wurde von deinen Eltern gesperrt."
            }
        }
        val recentNonces = (used + command.nonce).toList().takeLast(100).toSet()
        prefs.edit().putStringSet(LaunchpadPrefs.PREF_PARENT_COMMAND_NONCES, recentNonces).apply()
        LaunchpadWidgetProvider.requestUpdate(context)
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        return ParentCommandResult(true, message)
    }
}
