// File: app/src/main/kotlin/org/fossify/home/activities/PapaModusActivity.kt
// LAUNCHPAD "Papa-Modus" setup (parent side). Lets the father: create the launcher's secret,
// render the Papa-QR / share the link so it can be written to an NFC tag, set how long one scan
// lifts the rules, end an active session, and re-secure (invalidate old tags/QRs).
//
// Reached from Eltern-Modus (already PIN-gated). See SupervisedOverride for the honest scope.

package org.fossify.home.activities

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.util.TypedValue
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import org.fossify.home.helpers.SupervisedOverride
import org.fossify.home.ui.GameMenuUi
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class PapaModusActivity : AppCompatActivity() {

    // A tag the father writes once should keep working for years; the per-scan window (a separate
    // setting) is what actually bounds each session. A rotating QR uses a short life instead.
    private val permanentTagMinutes = 5L * 365 * 24 * 60
    private val rotatingQrMinutes = 10L

    private lateinit var statusView: TextView
    private lateinit var qrView: ImageView
    private lateinit var qrCaption: TextView
    private var currentLink: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val content = GameMenuUi.install(this, "Papa-Modus")

        content.addView(heading("Papa-Modus"))
        content.addView(body(
            "Ein NFC-Tag oder QR-Code bei dir hebt Jakes Regeln vorübergehend auf — alle Apps " +
                "sind frei, ohne dass Zeit verbraucht wird und ohne Eintrag im geteilten Verlauf. " +
                "Gedacht für betreutes Nutzen in deiner Anwesenheit."
        ))

        statusView = TextView(this).apply { setPadding(0, 16, 0, 8); textSize = 15f }
        content.addView(statusView)

        content.addView(button("⏱️ Dauer pro Scan festlegen") { showWindowDialog() })

        content.addView(heading("Code für NFC-Tag / QR", 17f))
        qrView = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(qrSizePx(), qrSizePx())
        }
        content.addView(qrView)
        qrCaption = TextView(this).apply { textSize = 12f; setPadding(0, 8, 0, 8) }
        content.addView(qrCaption)

        content.addView(button("🔗 Dauer-Code erzeugen (für festen Tag)") {
            generate(permanentTagMinutes, "Dauerhafter Tag/QR")
        })
        content.addView(button("🔄 Kurz-QR (10 Min gültig)") {
            generate(rotatingQrMinutes, "Kurzlebiger QR — nur die nächsten 10 Min scannbar")
        })
        content.addView(button("📤 Link teilen (auf NFC-Tag schreiben)") { shareLink() })

        content.addView(heading("WLAN-Geofence", 17f))
        content.addView(body(
            "Optional: Papa-Modus funktioniert nur in deinem WLAN. Verlässt Jake das Netz " +
                "(zu weit weg), enden die Freiheiten automatisch. Zum WLAN-Auslesen braucht Android " +
                "die Standort-Berechtigung — Standort muss dabei eingeschaltet sein."
        ))
        content.addView(button("📶 Dieses WLAN als Zuhause merken") { rememberWifi() })
        content.addView(button("🔀 WLAN-Bindung an/aus") { toggleGeofence() })
        content.addView(button("🗑️ Gemerkte WLANs löschen") {
            SupervisedOverride.clearAllowedSsids(this)
            toast("WLAN-Liste geleert")
            refreshStatus()
        })

        content.addView(heading("Verwaltung", 17f))
        content.addView(button("🛑 Papa-Modus jetzt beenden") {
            SupervisedOverride.stop(this)
            toast("Papa-Modus beendet")
            refreshStatus()
        })
        content.addView(button("🔐 Neu absichern (alte Tags/QRs ungültig)") { confirmRotate() })

        refreshStatus()
    }

    override fun onResume() {
        super.onResume()
        if (::statusView.isInitialized) refreshStatus()
    }

    private fun refreshStatus() {
        val sb = StringBuilder()
        if (SupervisedOverride.isActive(this)) {
            val until = SimpleDateFormat("HH:mm", Locale.GERMANY)
                .format(Date(SupervisedOverride.activeUntil(this)))
            sb.append("● AKTIV — frei bis $until\n")
        } else {
            sb.append("○ Gerade nicht aktiv\n")
        }
        sb.append("Dauer pro Scan: ${SupervisedOverride.windowMinutes(this)} Min\n")
        if (SupervisedOverride.requireWifi(this)) {
            val nets = SupervisedOverride.allowedSsids(this)
            sb.append(
                if (nets.isEmpty()) "WLAN-Bindung: AN, aber noch kein WLAN gemerkt ⚠️\n"
                else "WLAN-Bindung: AN — ${nets.joinToString(", ")}\n"
            )
        } else {
            sb.append("WLAN-Bindung: aus\n")
        }
        val last = SupervisedOverride.lastUsed(this)
        if (last > 0) {
            sb.append("Zuletzt genutzt: " +
                SimpleDateFormat("dd.MM. HH:mm", Locale.GERMANY).format(Date(last)))
        } else {
            sb.append("Noch nie genutzt")
        }
        statusView.text = sb.toString()
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    private fun rememberWifi() {
        if (!hasLocationPermission()) {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), REQ_LOCATION
            )
            return
        }
        val ssid = SupervisedOverride.rememberCurrentWifi(this)
        if (ssid == null) {
            toast("WLAN nicht lesbar — ist Standort an und du im WLAN?")
        } else {
            toast("Gemerkt: $ssid")
            refreshStatus()
        }
    }

    private fun toggleGeofence() {
        val next = !SupervisedOverride.requireWifi(this)
        if (next && SupervisedOverride.allowedSsids(this).isEmpty()) {
            toast("Erst ein WLAN merken, dann Bindung einschalten")
            return
        }
        SupervisedOverride.setRequireWifi(this, next)
        toast(if (next) "WLAN-Bindung an" else "WLAN-Bindung aus")
        refreshStatus()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_LOCATION &&
            grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
        ) {
            rememberWifi()
        } else if (requestCode == REQ_LOCATION) {
            toast("Ohne Standort-Berechtigung kann das WLAN nicht erkannt werden")
        }
    }

    private fun showWindowDialog() {
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
            setText(SupervisedOverride.windowMinutes(this@PapaModusActivity).toString())
        }
        AlertDialog.Builder(this)
            .setTitle("Minuten pro Scan (5–720)")
            .setView(input)
            .setPositiveButton("Speichern") { _, _ ->
                val min = input.text.toString().toIntOrNull()
                if (min == null) {
                    toast("Bitte eine Zahl eingeben")
                } else {
                    SupervisedOverride.setWindowMinutes(this, min)
                    refreshStatus()
                }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    @Suppress("TooGenericExceptionCaught") // fail-safe on QR render
    private fun generate(validForMinutes: Long, caption: String) {
        val grant = SupervisedOverride.mintGrant(this, validForMinutes)
        currentLink = grant.deepLink
        try {
            qrView.setImageBitmap(renderQr(grant.deepLink, qrSizePx()))
            qrCaption.text = caption
        } catch (e: Exception) {
            android.util.Log.w("LAUNCHPAD", "QR render failed", e)
            toast("QR konnte nicht erzeugt werden")
        }
    }

    private fun shareLink() {
        val link = currentLink
        if (link == null) {
            toast("Erst einen Code erzeugen")
            return
        }
        startActivity(
            Intent.createChooser(
                Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, "Papa-Modus Code")
                    putExtra(Intent.EXTRA_TEXT, link)
                },
                "Papa-Code teilen / auf NFC-Tag schreiben"
            )
        )
    }

    private fun confirmRotate() {
        AlertDialog.Builder(this)
            .setTitle("Neu absichern?")
            .setMessage(
                "Alle bisher erzeugten Tags und QR-Codes werden ungültig. Danach musst du einen " +
                    "neuen Code erzeugen und den Tag neu beschreiben."
            )
            .setPositiveButton("Neu absichern") { _, _ ->
                SupervisedOverride.rotateSecret(this)
                currentLink = null
                qrView.setImageBitmap(null)
                qrCaption.text = ""
                toast("Neuer Schlüssel gesetzt")
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun renderQr(text: String, size: Int): Bitmap {
        val matrix = QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, size, size)
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bmp.setPixel(x, y, if (matrix.get(x, y)) Color.BLACK else Color.WHITE)
            }
        }
        return bmp
    }

    private fun qrSizePx(): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 240f, resources.displayMetrics).toInt()

    private fun heading(text: String, size: Float = 22f) = TextView(this).apply {
        this.text = text
        textSize = size
        setPadding(0, 24, 0, 8)
    }

    private fun body(text: String) = TextView(this).apply {
        this.text = text
        textSize = 14f
        setPadding(0, 4, 0, 8)
    }

    private fun button(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 8, 0, 8) }
        setOnClickListener { onClick() }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

    private companion object {
        const val REQ_LOCATION = 4711
    }
}
