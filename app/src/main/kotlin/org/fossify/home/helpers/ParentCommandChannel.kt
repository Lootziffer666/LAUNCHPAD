package org.fossify.home.helpers

import android.content.Context
import android.widget.Toast
import java.nio.charset.StandardCharsets
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

private const val FIELD_COUNT = 6
private const val PARENT_ID_INDEX = 0
private const val TYPE_INDEX = 1
private const val MINUTES_INDEX = 2
private const val TIMESTAMP_INDEX = 3
private const val NONCE_INDEX = 4
private const val COMMAND_TTL_MINUTES = 10
private const val MILLIS_PER_MINUTE = 60_000L
private const val MAX_STORED_NONCES = 100

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
        return PREFIX + Base64.getUrlEncoder().withoutPadding()
            .encodeToString("$body|$signature".toByteArray())
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
        if (fields.size != FIELD_COUNT) return null
        if (fields[PARENT_ID_INDEX] != expectedParent) return null
        if (fields[NONCE_INDEX] in used) return null

        val command = runCatching {
            ParentCommand(
                fields[PARENT_ID_INDEX],
                ParentCommandType.valueOf(fields[TYPE_INDEX]),
                fields[MINUTES_INDEX].toInt(),
                fields[TIMESTAMP_INDEX].toLong(),
                fields[NONCE_INDEX]
            )
        }.getOrNull() ?: return null
        val ttlMillis = COMMAND_TTL_MINUTES * MILLIS_PER_MINUTE
        if (kotlin.math.abs(now - command.timestamp) > ttlMillis) return null
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
        val recentNonces = (used + command.nonce).toList().takeLast(MAX_STORED_NONCES).toSet()
        prefs.edit().putStringSet(LaunchpadPrefs.PREF_PARENT_COMMAND_NONCES, recentNonces).apply()
        LaunchpadWidgetProvider.requestUpdate(context)
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        return ParentCommandResult(true, message)
    }
}
