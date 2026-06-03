// File: app/src/main/kotlin/org/fossify/home/activities/PairingActivity.kt
// M4: launcher-side pairing screen. Renders the pairing QR (parent app scans it), accepts the
// returned RSA-encrypted session key, and applies commands (encrypted via the session key, or
// plaintext for testing) through CommandProcessor. UI is built programmatically.

package org.fossify.home.activities

import android.Manifest
import android.content.ContentValues
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.text.InputType
import android.util.TypedValue
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import org.json.JSONObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.fossify.home.databases.AppsDatabase
import org.fossify.home.helpers.CommandProcessor
import org.fossify.home.helpers.PairingManager

@Suppress("MagicNumber", "TooManyFunctions") // UI built programmatically
class PairingActivity : AppCompatActivity() {
    private lateinit var database: AppsDatabase
    private lateinit var pairing: PairingManager
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private lateinit var statusView: TextView
    private lateinit var qrView: ImageView

    private val writePermLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) saveTestQr() else toast("Schreibrecht verweigert — Test-Modus nicht möglich")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        database = AppsDatabase.getInstance(this)
        pairing = PairingManager(this)

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        setContentView(ScrollView(this).apply { addView(content) })

        content.addView(heading("Kopplung mit Eltern-Gerät"))

        // Show local IP so parent can enter it in the companion app
        val localIp = org.fossify.home.helpers.LaunchpadServer.getLocalIp(this)
        if (localIp != null) {
            content.addView(TextView(this).apply {
                text = "📡 Jakes Gerät IP: $localIp:${org.fossify.home.helpers.LaunchpadServer.PORT}"
                textSize = 15f
                setPadding(0, 0, 0, 8)
            })
        }

        statusView = TextView(this).apply { setPadding(0, 8, 0, 16) }
        content.addView(statusView)

        qrView = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(qrSizePx(), qrSizePx())
        }
        content.addView(qrView)

        content.addView(button("QR neu anzeigen") { showQr(reset = false) })
        content.addView(button("Neu koppeln (Reset)") {
            pairing.unpair()
            showQr(reset = true)
            toast("Kopplung zurückgesetzt")
        })
        content.addView(button("🧪 Test-Modus (selbes Gerät)") { startTestMode() })

        // Step 2: receive the parent's encrypted session key.
        content.addView(heading("Sitzungsschlüssel (vom Eltern-Gerät)", 16f))
        val sessionInput = editText("Base64 des verschlüsselten Schlüssels")
        content.addView(sessionInput)
        content.addView(button("Schlüssel empfangen") {
            val ok = pairing.receiveSessionKey(sessionInput.text.toString().trim())
            toast(if (ok) "Gekoppelt ✓" else "Schlüssel ungültig")
            refreshStatus()
        })

        // Step 3: apply commands.
        content.addView(heading("Befehl anwenden", 16f))
        val commandInput = editText("Verschlüsselter Befehl (Base64) oder Klartext-JSON").apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE
            minLines = 3
        }
        content.addView(commandInput)
        content.addView(button("Verschlüsselt anwenden") {
            val decrypted = pairing.decryptCommand(commandInput.text.toString().trim())
            if (decrypted == null) {
                toast("Entschlüsselung fehlgeschlagen (gekoppelt?)")
            } else {
                applyCommand(decrypted)
            }
        })
        content.addView(button("Klartext testen") {
            applyCommand(commandInput.text.toString().trim())
        })

        showQr(reset = false)
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    @Suppress("TooGenericExceptionCaught") // broad catch: intentional fail-safe on QR render
    private fun showQr(reset: Boolean) {
        val payload = pairing.getOrCreateQrPayload(reset)
        try {
            qrView.setImageBitmap(renderQr(payload, qrSizePx()))
        } catch (e: Exception) {
            android.util.Log.w("LAUNCHPAD", "QR render failed", e)
            toast("QR konnte nicht erzeugt werden")
        }
        refreshStatus()
    }

    private fun refreshStatus() {
        statusView.text = if (pairing.isPaired()) {
            "Status: gekoppelt mit ${pairing.pairedParentId() ?: "Eltern"} ✓"
        } else {
            "Status: noch nicht gekoppelt. Eltern-App den QR scannen lassen."
        }
    }

    private fun applyCommand(json: String) {
        if (json.isBlank()) {
            toast("Kein Befehl eingegeben")
            return
        }
        scope.launch {
            val result = withContext(Dispatchers.IO) {
                CommandProcessor(this@PairingActivity, database, pairing.pairedParentId() ?: "parent")
                    .apply(json)
            }
            toast(result.message)
        }
    }

    private fun startTestMode() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                saveTestQr()
            } else {
                writePermLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        } else {
            saveTestQr()
        }
    }

    @Suppress("TooGenericExceptionCaught")
    private fun saveTestQr() {
        try {
            val base = pairing.getOrCreateQrPayload(reset = false)
            val localhostPayload = JSONObject(base).apply { put("ip", "127.0.0.1") }.toString()
            val bitmap = renderQr(localhostPayload, qrSizePx())
            val filename = "launchpad_pairing.png"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, "image/png")
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: error("MediaStore insert returned null")
                contentResolver.openOutputStream(uri)?.use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                contentResolver.update(uri, values, null, null)
            } else {
                @Suppress("DEPRECATION")
                val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                dir.mkdirs()
                java.io.File(dir, filename).outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            }
            toast("QR gespeichert → Downloads/$filename — Companion: 'Von Datei verbinden'")
        } catch (e: Exception) {
            android.util.Log.e("LAUNCHPAD", "saveTestQr failed", e)
            toast("Test-Modus nicht möglich: ${e.message?.take(50)}")
        }
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

    private fun heading(text: String, size: Float = 20f) = TextView(this).apply {
        this.text = text
        textSize = size
        setPadding(0, 24, 0, 8)
    }

    private fun editText(hintText: String) = EditText(this).apply {
        hint = hintText
        inputType = InputType.TYPE_CLASS_TEXT
    }

    private fun button(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 8, 0, 8) }
        setOnClickListener { onClick() }
    }

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
