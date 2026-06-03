package org.fossify.home.interfaces

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import org.fossify.home.databases.AllowedApp
import org.fossify.home.databases.WeekScheduleEntry
import org.fossify.home.databases.AppTimeLimit
import org.fossify.home.databases.AuditEvent
import org.fossify.home.databases.CryptoCashTransaction
import org.fossify.home.databases.ParentCommand
import org.fossify.home.databases.Zusage
import org.fossify.home.databases.DogeRequest
import org.fossify.home.databases.ExploreAllowlistEntry
import org.fossify.home.databases.ExploreBlocklistEntry
import org.fossify.home.databases.ExploreSuggestion

// All @Query SQL below references the REAL column/table names declared in
// LaunchpadEntities.kt (Room column name == Kotlin field name). Room/KSP validates
// these against the entity schema at compile time.

// ─── WeekSchedule DAO ────────────────────────────────────────────────────────

@Dao
interface WeekScheduleDao {
    @Query("SELECT * FROM week_schedule")
    suspend fun getAll(): List<WeekScheduleEntry>

    @Query("SELECT * FROM week_schedule WHERE dayOfWeek = :day LIMIT 1")
    suspend fun getForDay(day: Int): WeekScheduleEntry?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: WeekScheduleEntry)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(entries: List<WeekScheduleEntry>)
}

// ─── AllowedApp DAO ───────────────────────────────────────────────────────────

@Dao
interface AllowedAppDao {
    @Query("SELECT * FROM allowed_apps WHERE enabled = 1")
    suspend fun getAllEnabledApps(): List<AllowedApp>

    @Query("SELECT * FROM allowed_apps")
    suspend fun getAll(): List<AllowedApp>

    @Query("SELECT EXISTS(SELECT 1 FROM allowed_apps WHERE packageName = :pkg AND enabled = 1)")
    suspend fun isAppAllowed(pkg: String): Boolean

    @Query("SELECT category FROM allowed_apps WHERE packageName = :pkg LIMIT 1")
    suspend fun getAppCategory(pkg: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApp(app: AllowedApp)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(apps: List<AllowedApp>)

    @Update
    suspend fun updateApp(app: AllowedApp)

    @Query("UPDATE allowed_apps SET enabled = :enabled WHERE packageName = :pkg")
    suspend fun setEnabled(pkg: String, enabled: Boolean)

    @Query("DELETE FROM allowed_apps WHERE packageName = :pkg")
    suspend fun deleteApp(pkg: String)

    @Query("DELETE FROM allowed_apps")
    suspend fun deleteAll()
}

// ─── AppTimeLimit DAO ─────────────────────────────────────────────────────────

@Dao
interface AppTimeLimitDao {
    @Query("SELECT * FROM app_time_limits")
    suspend fun getAll(): List<AppTimeLimit>

    @Query("SELECT * FROM app_time_limits WHERE packageName = :pkg LIMIT 1")
    suspend fun getForApp(pkg: String): AppTimeLimit?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(limit: AppTimeLimit)

    @Query("DELETE FROM app_time_limits WHERE packageName = :pkg")
    suspend fun delete(pkg: String)

    @Query("DELETE FROM app_time_limits")
    suspend fun deleteAll()
}

// ─── AuditEvent DAO ───────────────────────────────────────────────────────────

@Dao
interface AuditEventDao {
    @Query("SELECT * FROM audit_events ORDER BY createdAt DESC LIMIT :limit")
    suspend fun getRecent(limit: Int = 100): List<AuditEvent>

    @Query("SELECT * FROM audit_events WHERE acknowledged = 0 ORDER BY createdAt DESC")
    suspend fun getUnacknowledged(): List<AuditEvent>

    @Query("SELECT COUNT(*) FROM audit_events WHERE acknowledged = 0 AND severity = 'CRITICAL'")
    suspend fun countUnacknowledgedCritical(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: AuditEvent)

    @Query("UPDATE audit_events SET acknowledged = 1 WHERE id = :id")
    suspend fun acknowledge(id: String)

    @Query("UPDATE audit_events SET acknowledged = 1")
    suspend fun acknowledgeAll()

    @Query("DELETE FROM audit_events WHERE createdAt < :before")
    suspend fun deleteOlderThan(before: Long)
}

// ─── CryptoCash DAO ───────────────────────────────────────────────────────────

@Dao
interface CryptoCashDao {
    @Query("SELECT * FROM crypto_cash_tx WHERE deleted = 0 ORDER BY createdAt ASC")
    suspend fun getAllTransactions(): List<CryptoCashTransaction>

    @Query("SELECT * FROM crypto_cash_tx WHERE deleted = 0 ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLastTransaction(): CryptoCashTransaction?

    @Query("SELECT * FROM crypto_cash_tx WHERE deleted = 0 ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLatestBalance(): CryptoCashTransaction?

    @Query(
        "SELECT COALESCE((SELECT balanceAfter FROM crypto_cash_tx " +
            "WHERE deleted = 0 ORDER BY createdAt DESC LIMIT 1), 0)"
    )
    suspend fun getCurrentBalance(): Int

    @Query("SELECT * FROM crypto_cash_tx WHERE deleted = 0 AND createdAt BETWEEN :from AND :to ORDER BY createdAt ASC")
    suspend fun getTransactionsBetween(from: Long, to: Long): List<CryptoCashTransaction>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(tx: CryptoCashTransaction)

    @Query("UPDATE crypto_cash_tx SET deleted = 1 WHERE id = :id")
    suspend fun softDelete(id: String)

    @Query(
        "SELECT COALESCE(-SUM(deltaMinutes), 0) FROM crypto_cash_tx " +
            "WHERE deleted = 0 AND type = 'SPEND' " +
            "AND reasonText = 'Nutzung: ' || :pkg AND createdAt >= :todayMidnight"
    )
    suspend fun getTodaySpentMinutesForApp(pkg: String, todayMidnight: Long): Int
}

// ─── ParentCommand DAO ────────────────────────────────────────────────────────

@Dao
interface ParentCommandDao {
    @Query("SELECT * FROM parent_commands WHERE status = 'PENDING' ORDER BY createdAt ASC")
    suspend fun getPendingCommands(): List<ParentCommand>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommand(cmd: ParentCommand)

    @Query("UPDATE parent_commands SET status = :status, appliedAt = :at WHERE commandId = :id")
    suspend fun markApplied(id: String, status: String, at: Long)
}

// ─── Explore DAO ──────────────────────────────────────────────────────────────

@Dao
interface ExploreDao {
    @Query("SELECT * FROM explore_allowlist")
    suspend fun getAllowedDomains(): List<ExploreAllowlistEntry>

    @Query("SELECT * FROM explore_allowlist WHERE domain = :domain LIMIT 1")
    suspend fun findAllowedByDomain(domain: String): ExploreAllowlistEntry?

    @Query("SELECT EXISTS(SELECT 1 FROM explore_allowlist WHERE domain = :domain)")
    suspend fun isDomainAllowed(domain: String): Boolean

    @Query("SELECT * FROM explore_blocklist")
    suspend fun getBlockedPatterns(): List<ExploreBlocklistEntry>

    @Query("SELECT * FROM explore_suggestions")
    suspend fun getSuggestions(): List<ExploreSuggestion>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllowedDomain(entry: ExploreAllowlistEntry)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBlockedPattern(entry: ExploreBlocklistEntry)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSuggestion(entry: ExploreSuggestion)
}

// ─── Zusage DAO ───────────────────────────────────────────────────────────────

@Dao
interface ZusageDao {
    @Query("SELECT * FROM zusagen ORDER BY createdAt DESC")
    suspend fun getAllZusagen(): List<Zusage>

    @Query("SELECT * FROM zusagen WHERE status = :status ORDER BY createdAt DESC")
    suspend fun getZusagenByStatus(status: String): List<Zusage>

    @Query("SELECT * FROM zusagen WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): Zusage?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertZusage(zusage: Zusage)

    @Update
    suspend fun updateZusage(zusage: Zusage)

    @Query("UPDATE zusagen SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: String, status: String)
}

// ─── DogeRequest DAO ──────────────────────────────────────────────────────────

@Dao
interface DogeRequestDao {
    @Query("SELECT * FROM doge_requests ORDER BY requestedAt DESC")
    suspend fun getAllRequests(): List<DogeRequest>

    @Query("SELECT * FROM doge_requests WHERE decision = :decision ORDER BY requestedAt DESC")
    suspend fun getByDecision(decision: String): List<DogeRequest>

    @Query("SELECT * FROM doge_requests WHERE decision IS NULL ORDER BY requestedAt DESC")
    suspend fun getPending(): List<DogeRequest>

    @Query("SELECT * FROM doge_requests WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): DogeRequest?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRequest(request: DogeRequest)

    @Update
    suspend fun updateRequest(request: DogeRequest)
}
