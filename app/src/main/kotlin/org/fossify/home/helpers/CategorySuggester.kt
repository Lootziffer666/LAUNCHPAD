// File: app/src/main/kotlin/org/fossify/home/helpers/CategorySuggester.kt
// Static heuristic: suggests a category for a package name so the parent doesn't
// have to guess.  Covers the most common apps installed on children's devices.

package org.fossify.home.helpers

object CategorySuggester {

    /**
     * Returns a suggested [LaunchpadConstants] category for [packageName], or null
     * if no match is found (caller should fall back to CATEGORY_NEUTRAL).
     */
    fun suggest(packageName: String): String? {
        EXACT_MAP[packageName]?.let { return it }
        for ((prefix, category) in PREFIX_MAP) {
            // Segment-aware: "com.king" matches "com.king.x" but NOT "com.kingdom.x".
            if (packageName == prefix || packageName.startsWith("$prefix.")) return category
        }
        return null
    }

    /**
     * True if [packageName] is a known general-purpose web browser. LAUNCHPAD's web filter
     * (Entdecken-Modus blocklist) only applies to the built-in browser, so the parent should
     * be warned that a third-party browser gives unfiltered web access.
     */
    fun isKnownBrowser(packageName: String): Boolean {
        if (packageName in BROWSER_EXACT) return true
        return BROWSER_PREFIXES.any { packageName.startsWith(it) }
    }

    private val BROWSER_EXACT: Set<String> = setOf(
        "com.android.chrome",
        "com.sec.android.app.sbrowser",   // Samsung Internet
        "com.microsoft.emmx",             // Edge
        "com.brave.browser",
        "com.duckduckgo.mobile.android",
        "com.UCMobile.intl",              // UC Browser
        "com.kiwibrowser.browser",
        "com.vivaldi.browser",
        "com.yandex.browser",
        "mark.via.gp",                    // Via
        "com.ecosia.android"
    )

    private val BROWSER_PREFIXES: List<String> = listOf(
        "com.chrome.",        // beta/dev/canary
        "org.mozilla.",       // Firefox / Fenix / Focus
        "com.opera.",         // Opera / Opera Mini / GX
    )

    private val C = LaunchpadConstants

    // ─── Exact matches ────────────────────────────────────────────────────────

    private val EXACT_MAP: Map<String, String> = mapOf(
        // Video streaming → ACTIVE_LEISURE
        "com.google.android.youtube" to C.CATEGORY_ACTIVE_LEISURE,
        "com.google.android.apps.youtube.kids" to C.CATEGORY_ACTIVE_LEISURE,
        "com.netflix.mediaclient" to C.CATEGORY_ACTIVE_LEISURE,
        "com.amazon.avod.thirdpartyclient" to C.CATEGORY_ACTIVE_LEISURE,
        "com.disney.disneyplus" to C.CATEGORY_ACTIVE_LEISURE,
        "com.hulu.plus" to C.CATEGORY_ACTIVE_LEISURE,
        "tv.twitch.android.app" to C.CATEGORY_ACTIVE_LEISURE,

        // Music / audio leisure → ACTIVE_LEISURE
        "com.spotify.music" to C.CATEGORY_ACTIVE_LEISURE,
        "com.apple.android.music" to C.CATEGORY_ACTIVE_LEISURE,
        "com.soundcloud.android" to C.CATEGORY_ACTIVE_LEISURE,

        // Popular games → ACTIVE_LEISURE
        "com.mojang.minecraftpe" to C.CATEGORY_ACTIVE_LEISURE,
        "com.roblox.client" to C.CATEGORY_ACTIVE_LEISURE,
        "com.epicgames.fortnite" to C.CATEGORY_ACTIVE_LEISURE,
        "com.brawlstars" to C.CATEGORY_ACTIVE_LEISURE,
        "com.kiloo.subwaysurf" to C.CATEGORY_ACTIVE_LEISURE,
        "com.imangi.templerun2" to C.CATEGORY_ACTIVE_LEISURE,
        "com.halfbrick.fruitninjafree" to C.CATEGORY_ACTIVE_LEISURE,
        "com.outfit7.mytalkingtomfree" to C.CATEGORY_ACTIVE_LEISURE,

        // Creative tools → CREATIVE
        "com.ibis.paintx" to C.CATEGORY_CREATIVE,
        "com.medibang.android.paint.tablet" to C.CATEGORY_CREATIVE,
        "com.medibang.android.paint" to C.CATEGORY_CREATIVE,
        "com.sketchbook" to C.CATEGORY_CREATIVE,
        "com.adobe.psmobile" to C.CATEGORY_CREATIVE,

        // Communication → COMMUNICATION
        "com.whatsapp" to C.CATEGORY_COMMUNICATION,
        "org.thoughtcrime.securesms" to C.CATEGORY_COMMUNICATION,
        "org.telegram.messenger" to C.CATEGORY_COMMUNICATION,
        "com.discord" to C.CATEGORY_COMMUNICATION,
        "com.facetime.android" to C.CATEGORY_COMMUNICATION,

        // Learning → LEARNING
        "com.duolingo" to C.CATEGORY_LEARNING,
        "com.khanacademy.android" to C.CATEGORY_LEARNING,
        "com.memrise.android.memrisecompanion" to C.CATEGORY_LEARNING,
        "com.tynker.ide" to C.CATEGORY_LEARNING,
        "com.scratch.scratchjr" to C.CATEGORY_LEARNING,

        // Cooldown / restorative → COOLDOWN
        "com.audible.application" to C.CATEGORY_COOLDOWN,
        "org.librarysimplified.r2.simplereader" to C.CATEGORY_COOLDOWN,
        "com.amazon.kindle" to C.CATEGORY_COOLDOWN,
        "com.lego.common" to C.CATEGORY_COOLDOWN,
        "com.overdrive.mobile.android.mediaconsole" to C.CATEGORY_COOLDOWN,

        // System / utilities → NEUTRAL
        "com.android.chrome" to C.CATEGORY_NEUTRAL,
        "com.google.android.apps.maps" to C.CATEGORY_NEUTRAL,
        "com.google.android.calculator" to C.CATEGORY_NEUTRAL,
        "com.android.calculator2" to C.CATEGORY_NEUTRAL,
        "com.google.android.calendar" to C.CATEGORY_NEUTRAL,
        "com.google.android.deskclock" to C.CATEGORY_NEUTRAL,
        "com.google.android.keep" to C.CATEGORY_NEUTRAL,
        "com.samsung.android.calendar" to C.CATEGORY_NEUTRAL,
        "com.samsung.android.calculator" to C.CATEGORY_NEUTRAL,
    )

    // ─── Prefix rules (checked in order, first match wins) ───────────────────

    private val PREFIX_MAP: List<Pair<String, String>> = listOf(
        "com.supercell" to C.CATEGORY_ACTIVE_LEISURE,       // Clash of Clans, Clash Royale…
        "com.king" to C.CATEGORY_ACTIVE_LEISURE,             // Candy Crush family
        "com.rovio" to C.CATEGORY_ACTIVE_LEISURE,            // Angry Birds family
        "com.gameloft" to C.CATEGORY_ACTIVE_LEISURE,
        "com.ea.games" to C.CATEGORY_ACTIVE_LEISURE,
        "com.ea.android" to C.CATEGORY_ACTIVE_LEISURE,
        "com.miniclip" to C.CATEGORY_ACTIVE_LEISURE,
        "com.ubisoft" to C.CATEGORY_ACTIVE_LEISURE,
        "com.activision" to C.CATEGORY_ACTIVE_LEISURE,
        "com.bandainamco" to C.CATEGORY_ACTIVE_LEISURE,
        "com.sega" to C.CATEGORY_ACTIVE_LEISURE,
        "com.outfit7" to C.CATEGORY_ACTIVE_LEISURE,          // Talking Tom family
    )
}
