@file:Suppress("MagicNumber", "TooManyFunctions", "MaxLineLength")

package org.fossify.home.activities

import android.annotation.SuppressLint
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import org.fossify.commons.helpers.isTiramisuPlus
import org.fossify.commons.models.FAQItem
import org.fossify.home.BuildConfig
import org.fossify.home.R
import org.fossify.home.extensions.config
import org.fossify.home.helpers.MAX_COLUMN_COUNT
import org.fossify.home.helpers.MAX_ROW_COUNT
import org.fossify.home.helpers.MIN_COLUMN_COUNT
import org.fossify.home.helpers.MIN_ROW_COUNT
import org.fossify.home.receivers.LockDeviceAdminReceiver
import org.fossify.home.ui.GameMenuUi
import org.fossify.home.ui.LaunchpadDestination
import org.fossify.home.ui.LaunchpadNavigation
import java.util.Locale
import kotlin.system.exitProcess

/** Launcher settings rendered as part of the same handheld world as Quests and Gear. */
class SettingsActivity : SimpleActivity() {
    private lateinit var content: android.widget.LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        content = GameMenuUi.install(
            this,
            "Einstellungen",
            LaunchpadNavigation.view(this, LaunchpadDestination.GEAR),
        )
    }

    override fun onResume() {
        super.onResume()
        render()
    }

    private fun render() {
        content.removeAllViews()
        content.addView(GameMenuUi.title(this, "System-Menü"))
        content.addView(GameMenuUi.body(this, "Passe Gear und den App-Drawer an, ohne die Spielwelt zu verlassen."))

        content.addView(GameMenuUi.section(this, "Look & Feel"))
        content.addView(GameMenuUi.actionRow(
            this,
            title = "Aussehen anpassen",
            detail = "Farben und Lesbarkeit",
            symbol = "✦",
            accent = GameMenuUi.YELLOW,
        ) { startCustomizationActivity() })

        content.addView(GameMenuUi.section(this, "Allgemein"))
        addLanguageRows()
        content.addView(GameMenuUi.actionRow(
            this,
            title = "Ausgeblendete Apps",
            detail = "Versteckte Symbole verwalten",
            symbol = "◉",
        ) { startActivity(Intent(this, HiddenIconsActivity::class.java)) })
        addDoubleTapRow()

        content.addView(GameMenuUi.section(this, "App-Drawer"))
        content.addView(GameMenuUi.valueRow(
            this,
            title = "Spaltenanzahl",
            value = config.drawerColumnCount.toString(),
            detail = "Breite des Gear-Rasters",
        ) { chooseDrawerColumns() })
        content.addView(GameMenuUi.toggleRow(
            this,
            title = "Suchleiste",
            detail = "Apps direkt über Namen finden",
            enabled = config.showSearchBar,
        ) { enabled ->
            config.showSearchBar = enabled
            render()
        })
        if (config.showSearchBar) {
            content.addView(GameMenuUi.toggleRow(
                this,
                title = "Tastatur sofort öffnen",
                detail = "Fokus springt beim Öffnen in die Suche",
                enabled = config.autoShowKeyboardInAppDrawer,
            ) { enabled ->
                config.autoShowKeyboardInAppDrawer = enabled
                render()
            })
        }
        content.addView(GameMenuUi.toggleRow(
            this,
            title = "Drawer nach App-Start schließen",
            enabled = config.closeAppDrawer,
        ) { enabled ->
            config.closeAppDrawer = enabled
            render()
        })
        content.addView(GameMenuUi.toggleRow(
            this,
            title = "App-Namen anzeigen",
            detail = "Beschriftung unter den Gear-Kacheln",
            enabled = config.showDrawerAppLabels,
        ) { enabled ->
            config.showDrawerAppLabels = enabled
            render()
        })

        content.addView(GameMenuUi.section(this, "Startbildschirm"))
        content.addView(GameMenuUi.valueRow(
            this,
            title = "Zeilenanzahl",
            value = config.homeRowCount.toString(),
        ) { chooseHomeRows() })
        content.addView(GameMenuUi.valueRow(
            this,
            title = "Spaltenanzahl",
            value = config.homeColumnCount.toString(),
        ) { chooseHomeColumns() })
        content.addView(GameMenuUi.toggleRow(
            this,
            title = "App-Namen anzeigen",
            enabled = config.showHomeAppLabels,
        ) { enabled ->
            config.showHomeAppLabels = enabled
            render()
        })

        content.addView(GameMenuUi.section(this, "Launchpad"))
        content.addView(GameMenuUi.actionRow(
            this,
            title = "Eltern-Modus",
            detail = "Regeln, Zeit und Freigaben",
            symbol = "⚿",
            accent = GameMenuUi.RED,
        ) { startActivity(Intent(this, ElternModusActivity::class.java)) })
        content.addView(GameMenuUi.actionRow(
            this,
            title = "Über Launchpad",
            detail = "Version ${BuildConfig.VERSION_NAME}",
            symbol = "ⓘ",
        ) { launchAbout() })
    }

    private fun addLanguageRows() {
        if (isTiramisuPlus()) {
            content.addView(GameMenuUi.actionRow(
                this,
                title = "Sprache",
                detail = Locale.getDefault().displayLanguage,
                symbol = "文",
            ) { launchChangeAppLanguageIntent() })
        } else if (config.wasUseEnglishToggled || Locale.getDefault().language != "en") {
            content.addView(GameMenuUi.toggleRow(
                this,
                title = "Englische Sprache verwenden",
                enabled = config.useEnglish,
            ) { enabled ->
                config.useEnglish = enabled
                exitProcess(0)
            })
        }
    }

    private fun addDoubleTapRow() {
        val manager = getSystemService(DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val receiver = ComponentName(this, LockDeviceAdminReceiver::class.java)
        val enabled = manager.isAdminActive(receiver)
        content.addView(GameMenuUi.toggleRow(
            this,
            title = "Doppeltippen sperrt den Bildschirm",
            detail = "Schneller Ruhemodus auf Gear",
            enabled = enabled,
        ) {
            if (manager.isAdminActive(receiver)) {
                manager.removeActiveAdmin(receiver)
                render()
            } else {
                startActivity(Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, receiver)
                    putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, getString(R.string.lock_device_admin_hint))
                })
            }
        })
    }

    private fun chooseDrawerColumns() = GameMenuUi.showNumberChoice(
        this,
        "Spalten im App-Drawer",
        1..MAX_COLUMN_COUNT,
        config.drawerColumnCount,
    ) { value -> config.drawerColumnCount = value; render() }

    private fun chooseHomeRows() = GameMenuUi.showNumberChoice(
        this,
        "Zeilen auf Gear",
        MIN_ROW_COUNT..MAX_ROW_COUNT,
        config.homeRowCount,
    ) { value -> config.homeRowCount = value; render() }

    private fun chooseHomeColumns() = GameMenuUi.showNumberChoice(
        this,
        "Spalten auf Gear",
        MIN_COLUMN_COUNT..MAX_COLUMN_COUNT,
        config.homeColumnCount,
    ) { value -> config.homeColumnCount = value; render() }

    @SuppressLint("NewApi")
    private fun launchAbout() {
        val faqItems = ArrayList<FAQItem>()
        if (!resources.getBoolean(org.fossify.commons.R.bool.hide_google_relations)) {
            faqItems.add(
                FAQItem(
                    title = org.fossify.commons.R.string.faq_2_title_commons,
                    text = org.fossify.commons.R.string.faq_2_text_commons,
                ),
            )
            faqItems.add(
                FAQItem(
                    title = org.fossify.commons.R.string.faq_6_title_commons,
                    text = org.fossify.commons.R.string.faq_6_text_commons,
                ),
            )
        }
        startAboutActivity(
            appNameId = R.string.app_name,
            licenseMask = 0L,
            versionName = BuildConfig.VERSION_NAME,
            faqItems = faqItems,
            showFAQBeforeMail = true,
        )
    }
}
