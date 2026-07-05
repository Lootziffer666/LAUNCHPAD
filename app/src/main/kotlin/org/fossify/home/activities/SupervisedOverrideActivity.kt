// File: app/src/main/kotlin/org/fossify/home/activities/SupervisedOverrideActivity.kt
// LAUNCHPAD "Papa-Modus": the entry point a scanned QR or a tapped NFC tag lands on. Both carry
// the same launchpad://papa?t=<token> URI. We verify the HMAC-signed token against the launcher's
// secret and, if valid, start the supervised override window. Nothing here touches the ledger or
// the shared audit — the override is intentionally invisible to the mother-side history.

package org.fossify.home.activities

import android.graphics.Color
import android.nfc.NdefMessage
import android.nfc.NfcAdapter
import android.os.Bundle
import android.os.Parcelable
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.fossify.home.extensions.goHome
import org.fossify.home.helpers.ChildProfile
import org.fossify.home.helpers.SupervisedOverride
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Suppress("MagicNumber") // UI built programmatically
class SupervisedOverrideActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handle()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handle()
    }

    private fun handle() {
        val token = tokenFromIntent()
        if (token == null) {
            render(ok = false, message = "Kein gültiger Papa-Code erkannt.")
            return
        }
        val until = SupervisedOverride.redeemToken(this, token)
        if (until == null) {
            // Neutral wording on purpose — no hint about how the code is built.
            render(ok = false, message = "Dieser Code gilt hier nicht (oder ist abgelaufen).")
            return
        }
        val name = ChildProfile.name(this)
        val clock = SimpleDateFormat("HH:mm", Locale.GERMANY).format(Date(until))
        render(
            ok = true,
            message = "👋 Papa-Modus ist an, $name!\nAlle Apps sind frei bis $clock."
        )
    }

    /** Token from a VIEW deep link (QR) or an NFC NDEF URI record. */
    private fun tokenFromIntent(): String? {
        intent?.dataString?.let { SupervisedOverride.tokenFromUriString(it)?.let { t -> return t } }
        // NFC: the tag may arrive as NDEF messages rather than a resolved data URI.
        val raw = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            intent?.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES, Parcelable::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent?.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
        }
        raw?.forEach { p ->
            (p as? NdefMessage)?.records?.forEach { rec ->
                val uri = try {
                    rec.toUri()?.toString()
                } catch (e: RuntimeException) {
                    android.util.Log.w("LAUNCHPAD", "NDEF record parse failed", e)
                    null
                }
                SupervisedOverride.tokenFromUriString(uri)?.let { return it }
            }
        }
        return null
    }

    private fun render(ok: Boolean, message: String) {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(if (ok) Color.parseColor("#0F3D2E") else Color.parseColor("#3D0F0F"))
            setPadding(48, 48, 48, 48)
        }
        root.addView(TextView(this).apply {
            text = message
            textSize = 22f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
        })
        root.addView(Button(this).apply {
            text = "OK"
            setOnClickListener { goHome() }
        })
        setContentView(root)
    }
}
