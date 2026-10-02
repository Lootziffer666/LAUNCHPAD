// File: app/src/main/kotlin/org/fossify/home/fragments/EntdeckenFragment.kt
// M1: Safe web browsing (Entdecken-Modus) with domain allowlist/blocklist
//
// NOTE (LAUNCHPAD audit fix):
//  - WebViewClient callbacks (shouldInterceptRequest / shouldOverrideUrlLoading) are NOT
//    coroutine contexts, so they can no longer call a `suspend` filter directly. The allow/
//    block lists are now preloaded into memory once, and the per-request check is synchronous.
//  - Uses the real exploreDao() accessor (exploreAllowlistDao()/exploreBlocklistDao() never
//    existed) and the real entity field names.

package org.fossify.home.fragments

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.fossify.home.R
import org.fossify.home.databases.AppsDatabase
import java.net.URL
import kotlin.concurrent.thread

class EntdeckenFragment : Fragment() {
    private val tag = "EntdeckenFragment"

    private lateinit var webView: WebView
    private lateinit var database: AppsDatabase
    private val contentFilter = EntdeckenContentFilter()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_entdecken, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        database = AppsDatabase.getInstance(requireContext())
        webView = view.findViewById(R.id.webview_entdecken)

        configureWebView()
        loadInitialPage()

        // Preload allow/block lists off the main thread, then rebuild the start page with the
        // domains the parent actually allowed.
        thread {
            runBlocking(Dispatchers.IO) { contentFilter.preload(database) }
            if (isAdded) {
                requireActivity().runOnUiThread { loadInitialPage() }
            }
        }
    }

    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = false // M1: disabled; re-enable in M2 with Safe Browsing
            safeBrowsingEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        }
        webView.webViewClient = SafeWebViewClient()
        webView.webChromeClient = object : WebChromeClient() {}
        webView.removeJavascriptInterface("searchBoxJavaBridge_")
    }

    private fun loadInitialPage() {
        webView.setBackgroundColor(0xFF040E1F.toInt())
        val domains = contentFilter.allowedDomainSnapshot()
            .filter { it.matches(Regex("[A-Za-z0-9.-]+")) }
            .sorted()

        val links = if (domains.isEmpty()) {
            """
            <div class="empty">
              <div class="icon">◎</div>
              <h2>Noch nichts freigegeben</h2>
              <p>Eltern können sichere Webseiten in LAUNCHPAD freigeben. Danach erscheinen sie hier.</p>
            </div>
            """.trimIndent()
        } else {
            domains.joinToString(separator = "") { domain ->
                """<a class="site" href="https://$domain"><span>◎</span><strong>$domain</strong><b>›</b></a>"""
            }
        }

        val html = """
            <!doctype html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <style>
                * { box-sizing: border-box; }
                html, body { margin:0; min-height:100%; background:#040E1F; color:#D8E3FB;
                             font-family: sans-serif; }
                body { padding:20px 14px 28px; }
                h1 { margin:2px 4px 4px; font-size:24px; letter-spacing:.04em; }
                .lead { margin:0 4px 20px; color:#9FB0CE; font-size:14px; line-height:1.4; }
                .site { display:flex; align-items:center; gap:12px; margin:10px 0; padding:16px;
                        color:#D8E3FB; text-decoration:none; background:#1F2A3C;
                        border:2px solid #3164B3; border-radius:14px; }
                .site span { color:#48D0B0; font-size:22px; }
                .site strong { flex:1; overflow:hidden; text-overflow:ellipsis; }
                .site b { color:#FFCC00; font-size:24px; }
                .empty { margin-top:18vh; padding:24px; text-align:center; color:#9FB0CE; }
                .empty .icon { color:#48D0B0; font-size:46px; }
                .empty h2 { color:#D8E3FB; margin-bottom:8px; }
                .empty p { line-height:1.5; }
              </style>
            </head>
            <body>
              <h1>Entdecken</h1>
              <p class="lead">Nur von deinen Eltern freigegebene Seiten.</p>
              $links
            </body>
            </html>
        """.trimIndent()
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
    }

    private inner class SafeWebViewClient : WebViewClient() {
        override fun shouldInterceptRequest(
            view: WebView,
            request: WebResourceRequest
        ): WebResourceResponse? {
            val url = request.url.toString()
            val decision = contentFilter.shouldAllowUrl(url)
            if (!decision.allowed) {
                Log.w(tag, "Blocking URL: $url (${decision.reason})")
                val html = "<!DOCTYPE html><html><body><h1>Diese Seite ist nicht erlaubt.</h1>" +
                    "<p>Grund: ${decision.reason}</p></body></html>"
                return WebResourceResponse("text/html", "utf-8", html.byteInputStream())
            }
            return super.shouldInterceptRequest(view, request)
        }

        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest
        ): Boolean {
            val url = request.url.toString()
            val decision = contentFilter.shouldAllowUrl(url)
            if (!decision.allowed) {
                Log.w(tag, "Blocking navigation to: $url (${decision.reason})")
                return true // prevent navigation
            }
            return false
        }
    }
}

/**
 * Content filter: enforces allowlist and blocklist. Lists are preloaded into memory so the
 * per-request check (called from WebViewClient, a non-coroutine context) is synchronous.
 */
class EntdeckenContentFilter {
    private val tag = "EntdeckenContentFilter"

    data class FilterDecision(val allowed: Boolean, val reason: String?)

    @Volatile private var allowedDomains: Set<String> = emptySet()
    @Volatile private var dbBlockedPatterns: List<String> = emptyList()
    @Volatile private var loaded: Boolean = false

    private val hardBlockPatterns = listOf(
        "twitter.com", "x.com", "t.co", "tiktok.com",
        "instagram.com", "reddit.com", "redditmedia.com",
        "facebook.com", "fb.com", ".onion", "vk.com"
    )

    suspend fun preload(database: AppsDatabase) {
        allowedDomains = database.exploreDao().getAllowedDomains().map { it.domain }.toSet()
        dbBlockedPatterns = database.exploreDao().getBlockedPatterns().map { it.pattern }
        loaded = true
    }

    @Suppress("ReturnCount", "TooGenericExceptionCaught") // guard-style returns; broad fail-safe catch
    fun shouldAllowUrl(urlString: String): FilterDecision {
        if (urlString == "about:blank") return FilterDecision(true, null)
        return try {
            val url = URL(urlString)
            val domain = url.host ?: return FilterDecision(false, "No domain")

            if (url.protocol != "http" && url.protocol != "https") {
                return FilterDecision(false, "Invalid protocol: ${url.protocol}")
            }
            if (isBlocklisted(domain)) return FilterDecision(false, "Blocked domain")
            if (!isAllowlisted(domain)) return FilterDecision(false, "Domain not in allowlist")

            FilterDecision(true, null)
        } catch (e: Exception) {
            Log.e(tag, "Filter error: ${e.message}")
            FilterDecision(false, "Filter error")
        }
    }

    private fun isAllowlisted(domain: String): Boolean {
        if (!loaded) return false // default-deny until lists are loaded
        return allowedDomains.contains(extractBaseDomain(domain))
    }

    @Suppress("TooGenericExceptionCaught") // broad catch: invalid regex patterns fall back safely
    private fun isBlocklisted(domain: String): Boolean {
        for (pattern in hardBlockPatterns) {
            if (domain.endsWith(pattern)) return true
        }
        for (pattern in dbBlockedPatterns) {
            try {
                if (domain == pattern || domain.endsWith(pattern) || domain.matches(Regex(pattern))) {
                    return true
                }
            } catch (e: Exception) {
                Log.w(tag, "Invalid block pattern: $pattern", e)
                if (domain.endsWith(pattern)) return true
            }
        }
        return false
    }

    fun allowedDomainSnapshot(): Set<String> = allowedDomains.toSet()

    private fun extractBaseDomain(domain: String): String {
        val parts = domain.split(".")
        return if (parts.size >= 2) parts.takeLast(2).joinToString(".") else domain
    }
}
