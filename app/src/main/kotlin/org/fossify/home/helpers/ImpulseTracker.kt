// File: app/src/main/kotlin/org/fossify/home/helpers/ImpulseTracker.kt
// LAUNCHPAD: in-memory "was this a rapid re-open?" tracker for the Impulsbremse.
//
// The first deliberate open of a high-stimulation app is always free. Only when the same
// package is launched again within the configured re-open window do we add the calming
// countdown — that is the impulsive "close it / open it again" loop we want to slow down.
//
// State lives only in the launcher process (a cold start resets it, which is fine: after a
// reboot the first open is genuinely a first open again).

package org.fossify.home.helpers

import java.util.concurrent.ConcurrentHashMap

object ImpulseTracker {
    private val lastOpenAt = ConcurrentHashMap<String, Long>()

    /**
     * Records this launch and reports whether it counts as a rapid re-open (i.e. the previous
     * open of [pkg] was less than [windowMs] ago). Always updates the timestamp so the next
     * call is measured from now.
     */
    fun isRapidReopen(pkg: String, windowMs: Long, now: Long = System.currentTimeMillis()): Boolean {
        val previous = lastOpenAt.put(pkg, now)
        return previous != null && (now - previous) < windowMs
    }
}
