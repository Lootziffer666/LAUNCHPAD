// File: app/src/main/java/org/fossify/home/databases/entities/LaunchpadEntities.kt
// M1: New Room entities for LAUNCHPAD system

package org.fossify.home.databases

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

// Whitelist: which apps are available in each category
@Entity(tableName = "allowed_apps")
data class AllowedApp(
    @PrimaryKey val packageName: String,
    val category: String, // ACTIVE_LEISURE, CREATIVE, LEARNING, COOLDOWN, COMMUNICATION, NEUTRAL
    val enabled: Boolean = true,
    val addedAt: Long = System.currentTimeMillis(),
    val addedBy: String = "parent" // "parent", "mama", "papa" etc — set at add time
)

// Per-app daily time cap (0 = no cap, enforced on top of the global coin budget)
@Entity(tableName = "app_time_limits")
data class AppTimeLimit(
    @PrimaryKey val packageName: String,
    val dailyMinutes: Int // 0 = no limit
)

// Audit log: tamper signals + notable system events shown to the parent
@Entity(tableName = "audit_events")
data class AuditEvent(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val createdAt: Long = System.currentTimeMillis(),
    val type: String, // TIME_CHANGED, USAGE_ACCESS_REVOKED, REBOOT, SERVICE_GAP, ...
    val severity: String, // INFO, WARNING, CRITICAL
    val message: String, // human-readable German
    val acknowledged: Boolean = false // parent has seen/resolved it
)

// Krypto-Cash ledger: immutable transaction log, no-regression enforcement
@Entity(tableName = "crypto_cash_tx")
data class CryptoCashTransaction(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val deltaMinutes: Int, // positive = earn, negative = spend
    val type: String, // EARN, SPEND, EXPIRE, CORRECTION
    val actor: String, // "jake", "parent_name", "system"
    val reasonType: String, // "task", "leisure_redeem", "expiration", "manual_adjustment", etc
    val reasonText: String, // "Completed math homework"
    val childVisibleText: String, // What Jake sees: "Mathe Hausaufgabe +10"
    val source: String, // "parent_app", "launcher_rule", "system"
    val createdAt: Long = System.currentTimeMillis(),
    val balanceAfter: Int, // Balance snapshot after transaction (for validation)
    val deleted: Boolean = false // Soft-delete for correction scenarios
)

// Parent commands: Eltern-Modus directives (time adjustments, app toggles, etc)
@Entity(tableName = "parent_commands")
data class ParentCommand(
    @PrimaryKey val commandId: String = UUID.randomUUID().toString(),
    val actor: String, // parent name
    val source: String, // "eltern_app", "qr_pairing", "local_menu"
    val type: String, // "adjust_time", "toggle_app", "set_cooldown_rules", "clear_cache", etc
    val payloadJson: String, // Serialized command parameters
    val reasonType: String, // "periodic_adjustment", "behavior_reward", "rule_update", etc
    val reasonText: String,
    val childVisibleText: String, // What Jake sees about the change
    val createdAt: Long = System.currentTimeMillis(),
    val status: String = "PENDING", // PENDING, DELIVERED, APPLIED, REJECTED, EXPIRED, CONFLICT
    val appliedAt: Long? = null
)

// Zusagen: Family commitments/promises to reduce conflict
@Entity(tableName = "zusagen")
data class Zusage(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val text: String, // "After homework, then 20 min Minecraft"
    val namedParent: String, // who made the promise
    val status: String, // ACTIVE, FULFILLED, EXPIRED, REVOKED
    val condition: String, // Optional: conditional trigger
    val createdAt: Long = System.currentTimeMillis(),
    val autoApproveAt: Long, // 24h auto-approval deadline
    val decidedAt: Long? = null,
    val reason: String? = null,
    val childVisibleText: String = text // What Jake sees
)

// Doge-Coins: Approvals for sog media (YouTube, short videos)
@Entity(tableName = "doge_requests")
data class DogeRequest(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val contentDescription: String, // "20 min YouTube - Minecraft tutorials"
    val requestedAt: Long = System.currentTimeMillis(),
    val decision: String? = null, // APPROVED, REJECTED, EXPIRED
    val decidedBy: String? = null, // parent name
    val reason: String? = null,
    val durationMinutes: Int? = null,
    val expiresAt: Long? = null
)

// Entdecken-Modus: Safe web corridor
@Entity(tableName = "explore_allowlist")
data class ExploreAllowlistEntry(
    @PrimaryKey val domain: String, // "youtube.com", "wikipedia.org", etc
    val addedAt: Long = System.currentTimeMillis(),
    val category: String? = null // optional: EDUCATIONAL, ENTERTAINMENT, COMMUNICATION
)

@Entity(tableName = "explore_blocklist")
data class ExploreBlocklistEntry(
    @PrimaryKey val pattern: String, // regex or wildcard pattern
    val reason: String, // "nsfw", "social_media", "darkweb", etc
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "explore_suggestions")
data class ExploreSuggestion(
    @PrimaryKey val url: String,
    val title: String,
    val description: String,
    val category: String, // EDUCATIONAL, CREATIVE, ENTERTAINMENT
    val status: String, // SUGGESTED, APPROVED, REJECTED
    val addedAt: Long = System.currentTimeMillis()
)

// Wochenplan: per-day time windows for ACTIVE_LEISURE apps.
// dayOfWeek uses java.util.Calendar constants (SUNDAY=1, MONDAY=2, …, SATURDAY=7).
@Entity(tableName = "week_schedule")
data class WeekScheduleEntry(
    @PrimaryKey val dayOfWeek: Int,
    val active: Boolean = false,
    val allowedFromHour: Int = 0,  // screens allowed from this hour (0 = unrestricted from start)
    val allowedUntilHour: Int = 24 // screens blocked at or after this hour (24 = unrestricted)
)

// Änderungsverlauf: one row per app per whitelist-management operation.
// Multiple rows sharing the same batchId belong to the same logical change (e.g. a bulk action).
@Entity(tableName = "change_log")
data class ChangeLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val batchId: String,           // groups rows from the same operation
    val timestamp: Long = System.currentTimeMillis(),
    val packageName: String,
    val label: String,             // human-readable app name captured at log time
    val prevCategory: String?,     // null = app was not in the whitelist
    val newCategory: String?       // null = app was removed from the whitelist
)
