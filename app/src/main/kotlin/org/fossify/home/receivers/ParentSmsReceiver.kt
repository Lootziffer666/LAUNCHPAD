package org.fossify.home.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.fossify.home.helpers.ParentCommandController

class ParentSmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Telephony.Sms.Intents.getMessagesFromIntent(intent).joinToString("") { it.messageBody }
            .takeIf { it.startsWith("LP1:") }?.let { ParentCommandController(context).receive(it) }
    }
}
