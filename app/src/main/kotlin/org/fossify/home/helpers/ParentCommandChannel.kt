package org.fossify.home.helpers

import android.content.Context
import android.widget.Toast
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.databases.ExploreAllowlistEntry

private const val LEGACY_FIELD_COUNT = 6
private const val DATA_FIELD_COUNT = 7
private const val PARENT_ID_INDEX = 0
private const val TYPE_INDEX = 1
private const val MINUTES_INDEX = 2
private const val TIMESTAMP_INDEX = 3
private const val NONCE_INDEX = 4
private const val DATA_INDEX = 5
private const val COMMAND_TTL_MINUTES = 10
private const val MILLIS_PER_MINUTE = 60_000L
private const val MAX_STORED_NONCES = 100
private const val MAX_WEB_BUNDLE_DOMAINS = 20

enum class ParentCommandType { ADD_TIME, UNLIMITED_TODAY, LOCK_NOW, ALLOW_WEB_BUNDLE }

data class ParentCommand(
    val parentId: String,
    val type: ParentCommandType,
    val minutes: Int,
    val timestamp: Long,
    val nonce: String,
    val data: String = ""
)

data class ParentCommandResult(val accepted: Boolean, val message: String)

object ParentCommandCodec {
    const val PREFIX = "LP1:"

    fun sign(command: ParentCommand, secret: ByteArray): String {
        val baseFields = listOf(
            command.parentId,
            command.type.name,
            command.minutes.toString(),
            command.timestamp.toString(),
            command.nonce
        )
        val fields = if (command.data.isBlank()) {
            baseFields
        } else {
            baseFields + Base64.getUrlEncoder().withoutPadding()
                .encodeToString(command.data.toByteArray(StandardCharsets.UTF_8))
        }
        val body = fields.joinToString("|")
        val signature = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(hmac(body, secret))
        return PREFIX + Base64.getUrlEncoder().withoutPadding()
            .encodeToString("$body|$signature".toByteArray(StandardCharsets.UTF_8))
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
            String(
                Base64.getUrlDecoder().decode(payload.removePrefix(PREFIX)),
                StandardCharsets.UTF_8
            ).split('|')
        }.getOrNull() ?: return null
        if (fields.size != LEGACY_FIELD_COUNT && fields.size != DATA_FIELD_COUNT) return null
        if (fields[PARENT_ID_INDEX] != expectedParent) return null
        if (fields[NONCE_INDEX] in used) return null

        // Verify the HMAC bytes rather than reconstructing the complete encoded payload. This
        // accepts both padded and unpadded URL-safe Base64, keeping already-installed companions
        // compatible while the companion moves to canonical no-padding encoding.
        val body = fields.dropLast(1).joinToString("|")
        val suppliedSignature = runCatching {
            Base64.getUrlDecoder().decode(fields.last())
        }.getOrNull() ?: return null
        if (!MessageDigest.isEqual(hmac(body, secret), suppliedSignature)) return null

        val command = runCatching {
            val data = if (fields.size == DATA_FIELD_COUNT) {
                String(Base64.getUrlDecoder().decode(fields[DATA_INDEX]), StandardCharsets.UTF_8)
            } else {
                ""
            }
            ParentCommand(
                parentId = fields[PARENT_ID_INDEX],
                type = ParentCommandType.valueOf(fields[TYPE_INDEX]),
                minutes = fields[MINUTES_INDEX].toInt(),
                timestamp = fields[TIMESTAMP_INDEX].toLong(),
                nonce = fields[NONCE_INDEX],
                data = data
            )
        }.getOrNull() ?: return null
        val ttlMillis = COMMAND_TTL_MINUTES * MILLIS_PER_MINUTE
        if (kotlin.math.abs(now - command.timestamp) > ttlMillis) return null
        return command
    }

    private fun hmac(body: String, secret: ByteArray): ByteArray =
        Mac.getInstance("HmacSHA256").run {
            init(SecretKeySpec(secret, "HmacSHA256"))
            doFinal(body.toByteArray(StandardCharsets.UTF_8))
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

            ParentCommandType.ALLOW_WEB_BUNDLE -> applyWebBundle(command.data)
        }
        val recentNonces = (used + command.nonce).toList().takeLast(MAX_STORED_NONCES).toSet()
        prefs.edit().putStringSet(LaunchpadPrefs.PREF_PARENT_COMMAND_NONCES, recentNonces).apply()
        LaunchpadWidgetProvider.requestUpdate(context)
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        return ParentCommandResult(true, message)
    }

    private fun applyWebBundle(raw: String): String {
        val domains = normalizeDomains(raw)
        if (domains.isEmpty()) return "Keine gültigen Webseiten im SMS-Bundle."
        runBlocking(Dispatchers.IO) {
            val dao = AppsDatabase.getInstance(context).exploreDao()
            domains.forEach { domain ->
                dao.insertAllowedDomain(
                    ExploreAllowlistEntry(
                        domain = domain,
                        category = "PARENT_SMS"
                    )
                )
            }
        }
        return if (domains.size == 1) {
            "${domains.first()} freigegeben."
        } else {
            "${domains.size} Webseiten freigegeben."
        }
    }

    private fun normalizeDomains(raw: String): List<String> =
        raw.split(Regex("[\\s,;]+"))
            .asSequence()
            .map(::normalizeDomain)
            .filter { it.isNotBlank() && DOMAIN_REGEX.matches(it) && it.length <= 253 }
            .distinct()
            .take(MAX_WEB_BUNDLE_DOMAINS)
            .toList()

    private fun normalizeDomain(value: String): String =
        value.trim()
            .lowercase()
            .removePrefix("https://")
            .removePrefix("http://")
            .substringBefore('/')
            .substringBefore('?')
            .substringBefore('#')
            .removeSuffix(".")
            .removePrefix("www.")

    companion object {
        private val DOMAIN_REGEX = Regex(
            "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$"
        )
    }
}
