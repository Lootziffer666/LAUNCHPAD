// File: app/src/main/kotlin/org/fossify/home/helpers/PresenceTrust.kt
// LAUNCHPAD "Presence Trust" — the general core the Papa-Modus is the first special case of.
//
// Idea: instead of hard modes ("kid" vs "papa"), the device continuously scores how TRUSTED the
// current environment is from several weak signals (home WiFi, the parent's device nearby via
// NFC/BT, time-of-day, GPS geofence, a recent unlock, a valid supervised tag). No single signal is
// decisive, so the system stays robust — a dropped WiFi costs points but the environment can still
// clear the threshold. See docs/guides/PRESENCE_TRUST.md for the full design (profiles + per-app
// trust thresholds). This file is the PURE scoring kernel (no Android deps) so it is unit-tested
// and can be wired into enforcement incrementally.

package org.fossify.home.helpers

/** One presence signal and how much trust it contributes when present. */
data class TrustSignal(val id: String, val weight: Int, val present: Boolean)

object PresenceTrust {

    // Reference weights (0..100 scale). Tunable per family later; these are sensible defaults.
    const val WEIGHT_HOME_WIFI = 40
    const val WEIGHT_PARENT_DEVICE = 35 // parent phone reachable via BT/NFC
    const val WEIGHT_HOME_GEOFENCE = 15 // GPS says "at home"
    const val WEIGHT_TIME_WINDOW = 10 // within an expected daytime window
    const val WEIGHT_SUPERVISED_TAG = 60 // a freshly redeemed, signed Papa tag (strong on its own)
    // "Child present" signal (Luke's idea, age 6): an occasional, transparent camera check confirms
    // a child is actually using the device — a positive presence signal, not covert surveillance.
    const val WEIGHT_CHILD_PRESENT = 30

    /** Default trust needed to treat the environment as "trusted". */
    const val DEFAULT_THRESHOLD = 55

    /** Sum the weights of the present signals, clamped to 0..100. */
    fun score(signals: List<TrustSignal>): Int =
        signals.filter { it.present }.sumOf { it.weight }.coerceIn(0, 100)

    fun isTrusted(score: Int, threshold: Int = DEFAULT_THRESHOLD): Boolean = score >= threshold

    /**
     * Convenience for the Papa-Modus environment: a valid supervised tag is trusted on its own, and
     * home WiFi / parent-device proximity reinforce it. This mirrors how SupervisedOverride behaves
     * today (a signed tag activates; the WiFi geofence gates staying active) but expressed as a
     * score so extra signals can be added without new branches.
     */
    fun supervisedScore(
        supervisedTag: Boolean,
        homeWifi: Boolean,
        parentDeviceNearby: Boolean = false,
        homeGeofence: Boolean = false
    ): Int = score(
        listOf(
            TrustSignal("supervised_tag", WEIGHT_SUPERVISED_TAG, supervisedTag),
            TrustSignal("home_wifi", WEIGHT_HOME_WIFI, homeWifi),
            TrustSignal("parent_device", WEIGHT_PARENT_DEVICE, parentDeviceNearby),
            TrustSignal("home_geofence", WEIGHT_HOME_GEOFENCE, homeGeofence)
        )
    )
}
