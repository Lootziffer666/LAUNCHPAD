// File: app/src/main/kotlin/org/fossify/home/helpers/LaunchpadConstants.kt
// M1: LAUNCHPAD config keys and constants

package org.fossify.home.helpers

object LaunchpadConstants {
    // Launcher modes
    const val MODE_KID = "kid"
    const val MODE_PARENT = "parent"

    // Lockdown levels
    const val LOCKDOWN_SOFT = "soft" // PIN-gating only
    const val LOCKDOWN_DEVICE_OWNER = "device_owner" // M5+: hard lock via Device Admin

    // Krypto-Cash defaults
    const val DEFAULT_WEEK_CAP_MINUTES = 120
    const val DEFAULT_SCHOOL_DAY_CAP_MINUTES = 60
    const val DEFAULT_COOLDOWN_DURATION_MINUTES = 15
    const val DEFAULT_EXPIRE_UNUSED_AFTER_DAYS = 30

    // Impulsbremse defaults
    const val DEFAULT_IMPULSE_SECONDS = 7
    const val DEFAULT_IMPULSE_REOPEN_WINDOW_MIN = 3

    // "Papa-Modus" supervised override — how long one NFC/QR tap lifts the rules by default.
    // A single scan grants min(token-expiry, now + this window). The parent can change it.
    const val DEFAULT_OVERRIDE_WINDOW_MINUTES = 180
    // Deep-link / NDEF scheme that both the NFC tag and the QR code carry.
    const val OVERRIDE_URI_SCHEME = "launchpad"
    const val OVERRIDE_URI_HOST = "papa"
    // Token wire format version (see SupervisedOverride).
    const val OVERRIDE_TOKEN_VERSION = "LPO1"

    // Auto-update: default release feed (parent pushes a GitHub Release → child's phone picks it up).
    const val DEFAULT_UPDATE_FEED_URL =
        "https://api.github.com/repos/Lootziffer666/LAUNCHPAD/releases/latest"
    // Don't poll the feed more than once per this interval during normal use.
    const val UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000L // 24h

    // Time-limit warning toast vibration
    const val DEFAULT_VIBRATION_MS = 300

    // Transaction types
    const val TX_TYPE_EARN = "EARN"
    const val TX_TYPE_SPEND = "SPEND"
    const val TX_TYPE_EXPIRE = "EXPIRE"
    const val TX_TYPE_CORRECTION = "CORRECTION"

    // App categories
    const val CATEGORY_ACTIVE_LEISURE = "ACTIVE_LEISURE" // High-stimulation: games, YouTube
    const val CATEGORY_CREATIVE = "CREATIVE" // Creative tools: drawing, music
    const val CATEGORY_LEARNING = "LEARNING" // Educational: school apps
    const val CATEGORY_COOLDOWN = "COOLDOWN" // Low-stimulation: audiobooks, drawing, LEGO
    const val CATEGORY_COMMUNICATION = "COMMUNICATION" // Messaging, video calls
    const val CATEGORY_NEUTRAL = "NEUTRAL" // System, clock, calendar

    // Command types
    const val COMMAND_ADJUST_TIME = "adjust_time"
    const val COMMAND_TOGGLE_APP = "toggle_app"
    const val COMMAND_SET_COOLDOWN_RULES = "set_cooldown_rules"
    const val COMMAND_CLEAR_CACHE = "clear_cache"

    // Command status
    const val CMD_STATUS_PENDING = "PENDING"
    const val CMD_STATUS_DELIVERED = "DELIVERED"
    const val CMD_STATUS_APPLIED = "APPLIED"
    const val CMD_STATUS_REJECTED = "REJECTED"
    const val CMD_STATUS_EXPIRED = "EXPIRED"
    const val CMD_STATUS_CONFLICT = "CONFLICT"

    // Zusage status
    const val ZUSAGE_ACTIVE = "ACTIVE"
    const val ZUSAGE_FULFILLED = "FULFILLED"
    const val ZUSAGE_EXPIRED = "EXPIRED"
    const val ZUSAGE_REVOKED = "REVOKED"

    // Doge request status
    const val DOGE_APPROVED = "APPROVED"
    const val DOGE_REJECTED = "REJECTED"
    const val DOGE_EXPIRED = "EXPIRED"

    // Block reason codes — used in LaunchDecision.reason and AppBlockedActivity.
    const val REASON_NOT_ALLOWED = "not_allowed"
    const val REASON_COOLDOWN = "cooldown"
    const val REASON_NO_BUDGET = "no_budget"
    const val REASON_MIN_THRESHOLD = "min_threshold"
    const val REASON_LOCKDOWN = "lockdown"
    const val REASON_SCHEDULE_WINDOW = "schedule_window"
    const val REASON_APP_DAILY_LIMIT = "app_daily_limit"
    const val REASON_SCHOOL_MODE = "school_mode"

    // Audit / tamper event types
    const val AUDIT_TIME_CHANGED = "TIME_CHANGED"
    const val AUDIT_TIMEZONE_CHANGED = "TIMEZONE_CHANGED"
    const val AUDIT_USAGE_ACCESS_REVOKED = "USAGE_ACCESS_REVOKED"
    const val AUDIT_REBOOT = "REBOOT"
    const val AUDIT_SERVICE_GAP = "SERVICE_GAP"
    const val AUDIT_LOCKDOWN_TRIGGERED = "LOCKDOWN_TRIGGERED"
    const val AUDIT_LOCKDOWN_CLEARED = "LOCKDOWN_CLEARED"
    const val AUDIT_EXCEPTION_GRANTED = "EXCEPTION_GRANTED"

    // Audit severities
    const val SEVERITY_INFO = "INFO"
    const val SEVERITY_WARNING = "WARNING"
    const val SEVERITY_CRITICAL = "CRITICAL"

    // Tamper detection: a service gap larger than this (ms) while enforcement is on is
    // treated as Doze/kill suppression worth recording.
    const val TAMPER_GAP_THRESHOLD_MS = 300_000L // 5 min
    // Wall-vs-monotonic drift beyond this (ms) between two ticks means the clock was changed.
    const val TAMPER_TIME_DRIFT_TOLERANCE_MS = 60_000L // 1 min

    // Explore categories
    const val EXPLORE_CATEGORY_EDUCATIONAL = "EDUCATIONAL"
    const val EXPLORE_CATEGORY_CREATIVE = "CREATIVE"
    const val EXPLORE_CATEGORY_ENTERTAINMENT = "ENTERTAINMENT"
    const val EXPLORE_CATEGORY_COMMUNICATION = "COMMUNICATION"

    // QR pairing
    const val QR_VERSION = "1"
    const val QR_PAIRING_NONCE_LENGTH_BYTES = 16
    const val QR_PAIRING_KEY_LENGTH_BYTES = 32 // AES-256

    // Cool-down allowed packages. NOTE: must be `val` not `const val` — Kotlin `const`
    // only permits primitives and String, never a List.
    val COOLDOWN_ALLOWED_PACKAGES = listOf(
        // Audiobooks
        "org.librarysimplified.r2.simplereader",
        "com.audible.application",
        // Drawing
        "com.ibis.paintx",
        "com.medibang.android.paint",
        // LEGO
        "com.lego.common"
    )
}

object LaunchpadPrefs {
    // SharedPreferences keys
    const val PREF_LAUNCHER_MODE = "launcher_mode" // kid or parent
    const val PREF_PARENT_LOCK_TYPE = "parent_lock_type" // PIN, etc
    const val PREF_PARENT_LOCK_HASH = "parent_lock_hash"
    const val PREF_BASE_TIME_MINUTES = "base_time_minutes"
    const val PREF_WEEK_CAP_MINUTES = "week_cap_minutes"
    const val PREF_SCHOOL_DAY_CAP_MINUTES = "school_day_cap_minutes"
    const val PREF_COOLDOWN_MINUTES = "cooldown_minutes"
    const val PREF_LOCKDOWN_LEVEL = "lockdown_level"
    const val PREF_PARENT_MODE_ACTIVE = "parent_mode_active"
    const val PREF_PARENT_MODE_ACTIVATED_AT = "parent_mode_activated_at"
    const val PREF_LAST_SYNC_QR = "last_sync_qr"
    const val PREF_COOLDOWN_RULES_JSON = "cooldown_rules_json"
    const val PREF_COOLDOWN_UNTIL = "cooldown_until" // epoch ms; cool-down active while now < value
    const val PREF_KIOSK_ENABLED = "kiosk_enabled" // M3: lock-task kiosk mode (device owner only)
    // Master "Kindermodus" switch. OFF by default so the launcher behaves normally during
    // setup (all apps visible, no launch gate, no time metering). The parent turns it ON in
    // Eltern-Modus after configuring the whitelist + PIN + time budget.
    const val PREF_ENFORCEMENT_ENABLED = "enforcement_enabled"
    const val PREF_SETUP_DONE = "setup_done"
    const val PREF_SCHOOL_MODE_UNTIL = "school_mode_until" // epoch ms; active while now < value (0 = off)
    const val PREF_CHILD_NAME = "child_name" // display name shown across the launcher (default "Jake")
    // Strict foreground block (default OFF): the tracking service also blocks NON-whitelisted
    // apps that reach the foreground via side channels (links, notifications, recents). Essential
    // packages (launcher, system UI, phone/dialer, settings, IME) are never blocked. Opt-in
    // because it must be device-tested (esp. emergency dialling) before being relied upon.
    const val PREF_STRICT_FOREGROUND_BLOCK = "strict_foreground_block"

    // Impulsbremse: short calming countdown before re-opening a high-stimulation (ACTIVE_LEISURE)
    // app. Skips the first open and only fires on a rapid re-open within the reopen window.
    const val PREF_IMPULSE_ENABLED = "impulse_enabled" // master on/off (default ON)
    const val PREF_IMPULSE_SECONDS = "impulse_seconds" // countdown length
    const val PREF_IMPULSE_REOPEN_WINDOW_MIN = "impulse_reopen_window_min" // "first open free" window

    // Time-limit warning toasts + optional vibration
    const val PREF_VIBRATION_ENABLED = "vibration_enabled" // reinforce time warnings with a buzz
    const val PREF_VIBRATION_MS = "vibration_ms" // buzz length = strength

    // Tamper detection: protective lockdown blocks coin-gated apps until a parent reviews.
    const val PREF_TAMPER_LOCKDOWN = "tamper_lockdown"
    // Tracks whether Usage Access was granted before, to detect later revocation.
    const val PREF_USAGE_WAS_GRANTED = "usage_was_granted"
    // Heartbeat for service-gap / clock-drift reconciliation (wall clock + monotonic uptime).
    const val PREF_HEARTBEAT_WALL = "heartbeat_wall"
    const val PREF_HEARTBEAT_ELAPSED = "heartbeat_elapsed"

    // PIN rate limiting: consecutive wrong attempts and the epoch-ms lockout end time.
    const val PREF_PIN_FAIL_COUNT = "pin_fail_count"
    const val PREF_PIN_LOCKED_UNTIL = "pin_locked_until"

    // PIN recovery: salted SHA-256 hash of the recovery code (XXXX-XXXX-XXXX format).
    const val PREF_RECOVERY_HASH = "parent_recovery_hash"
    const val PREF_RECOVERY_SALT = "parent_recovery_salt"

    // M4: QR pairing — launcher keypair (Base64), AES session key, paired parent identity
    const val PREF_PAIR_PRIVATE_KEY = "pair_private_key" // PKCS8 Base64
    const val PREF_PAIR_PUBLIC_KEY = "pair_public_key" // X509 Base64
    const val PREF_PAIR_SESSION_KEY = "pair_session_key" // AES raw Base64
    const val PREF_PAIR_PARENT_ID = "pair_parent_id"
    const val PREF_PAIR_NONCE = "pair_nonce"

    // New-app review: snapshot of known launchable packages + the not-yet-reviewed set, so a
    // parent can allow/deny apps that appeared (e.g. installed via Family Link). Default-deny
    // keeps them unusable until reviewed; this just surfaces them instead of letting them sit.
    const val PREF_KNOWN_PACKAGES = "known_packages"
    const val PREF_PENDING_REVIEW_PACKAGES = "pending_review_packages"
    const val PREF_LAST_APP_SCAN = "last_app_scan"

    // "Papa-Modus" supervised override. The override is deliberately kept OUT of the
    // Krypto-Cash ledger and the shared audit/report/sync: while it's active, apps launch
    // without draining budget and nothing is written to the mother-visible history. Rationale:
    // the father supervises in person and prioritises supervised use over strict gating.
    // - SECRET: HMAC key (hex). A tag/QR is only honoured if it was signed with this secret,
    //   so the child can't self-issue a grant. Provisioned once in Papa-Modus setup.
    // - UNTIL: epoch ms; override active while now < value.
    // - WINDOW_MIN: how long a single valid scan lifts the rules.
    const val PREF_OVERRIDE_SECRET_HEX = "supervised_override_secret"
    const val PREF_OVERRIDE_UNTIL = "supervised_override_until"
    const val PREF_OVERRIDE_WINDOW_MIN = "supervised_override_window_min"
    // Local-only, never synced: timestamp of the last supervised session, so the father alone
    // can see "Papa-Modus was last used at X" in his own setup screen.
    const val PREF_OVERRIDE_LAST_USED = "supervised_override_last_used"
    // WiFi geofence (opt-in): Papa-Modus only counts as active while connected to one of these
    // saved home-network SSIDs. Leaving the network ends the session (a proxy for "too far from
    // dad"). Reading the SSID needs location permission + location services on (Android 9+).
    const val PREF_OVERRIDE_REQUIRE_WIFI = "supervised_override_require_wifi"
    const val PREF_OVERRIDE_WIFI_SSIDS = "supervised_override_wifi_ssids"

    // Auto-update: parent-configurable release feed, auto-check toggle, last-check timestamp.
    const val PREF_UPDATE_FEED_URL = "update_feed_url"
    const val PREF_UPDATE_AUTO_CHECK = "update_auto_check" // default ON
    const val PREF_UPDATE_LAST_CHECK = "update_last_check"

    // Dedicated SharedPreferences file for LAUNCHPAD (separate from commons config).
    const val PREFS_FILE = "launchpad_prefs"
}
