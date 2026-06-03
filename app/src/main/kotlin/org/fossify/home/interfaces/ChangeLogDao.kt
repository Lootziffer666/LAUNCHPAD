// File: app/src/main/kotlin/org/fossify/home/interfaces/ChangeLogDao.kt

package org.fossify.home.interfaces

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import org.fossify.home.databases.ChangeLogEntity

@Dao
interface ChangeLogDao {

    @Insert
    suspend fun insertAll(entries: List<ChangeLogEntity>)

    /** Returns the N most recent distinct batch IDs, newest first. */
    @Query("SELECT batchId FROM change_log GROUP BY batchId ORDER BY MAX(timestamp) DESC LIMIT :n")
    suspend fun getRecentBatchIds(n: Int): List<String>

    @Query("SELECT * FROM change_log WHERE batchId = :batchId ORDER BY id ASC")
    suspend fun getByBatch(batchId: String): List<ChangeLogEntity>

    @Query("DELETE FROM change_log WHERE batchId = :batchId")
    suspend fun deleteByBatch(batchId: String)

    @Query("SELECT COUNT(*) FROM change_log")
    suspend fun count(): Int
}
