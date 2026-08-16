// File: app/src/main/kotlin/org/fossify/home/activities/EntdeckenActivity.kt
// LAUNCHPAD: Activity wrapper for the safe-browsing EntdeckenFragment.

package org.fossify.home.activities

import android.os.Bundle
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import org.fossify.home.R
import org.fossify.home.fragments.EntdeckenFragment
import org.fossify.home.ui.GameMenuUi
import org.fossify.home.ui.LaunchpadDestination
import org.fossify.home.ui.LaunchpadNavigation

class EntdeckenActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_entdecken)
        GameMenuUi.migrateExisting(this, findViewById(R.id.entdecken_root))
        findViewById<FrameLayout>(R.id.entdecken_header).addView(
            GameMenuUi.headerView(this, "Map"),
            FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
        )
        findViewById<FrameLayout>(R.id.entdecken_bottom_nav).addView(
            LaunchpadNavigation.view(this, LaunchpadDestination.MAP),
            FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
        )

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.entdecken_container, EntdeckenFragment())
                .commit()
        }
    }

    // Block back-press when WebView can go back
    @Deprecated("Deprecated in Java")
    @Suppress("GestureBackNavigation")
    override fun onBackPressed() {
        val fragment = supportFragmentManager.findFragmentById(R.id.entdecken_container)
        if (fragment is EntdeckenFragment) {
            // Let fragment handle it (WebView back navigation)
        }
        super.onBackPressed()
    }
}
