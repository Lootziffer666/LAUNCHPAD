// File: app/src/main/kotlin/org/fossify/home/helpers/LedgerGuard.kt
// LAUNCHPAD: serialize all Krypto-Cash balance mutations.
//
// Every balance change is a read-modify-write: read getCurrentBalance(), then insert a row whose
// balanceAfter = balance + delta. Those two steps are NOT atomic, and they run from several
// contexts at once — the metering service (its own HandlerThread), parent commands over the LAN
// server, and the Eltern-Modus UI. Without serialization two concurrent writers can both read the
// same balance and clobber each other (a lost earn or spend, and a balanceAfter snapshot that no
// longer matches the running sum). A single process-wide Mutex funnels every mutation through one
// critical section, which is enough because they all share the one AppsDatabase instance.
//
// Rule: any code that does getCurrentBalance() followed by insertTransaction() must do both inside
// LedgerGuard.mutex.withLock { … }.

package org.fossify.home.helpers

import kotlinx.coroutines.sync.Mutex

object LedgerGuard {
    val mutex = Mutex()
}
