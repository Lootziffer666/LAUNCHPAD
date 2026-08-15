@file:Suppress("MagicNumber")

package org.fossify.home.ui

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import android.view.HapticFeedbackConstants
import android.view.View

enum class SoundCue { TIME_ADDED, APPROVED, WARNING, OFFLINE, ONLINE, GAME_START, SCORE, GAME_OVER }

interface SoundFeedback { fun play(cue: SoundCue) }

/** System-tone implementation: no bundled audio, network, telemetry, or asset dependency. */
class SystemSoundFeedback(context: Context, private val hapticView: () -> View?) : SoundFeedback {
    private val audio = context.getSystemService(AudioManager::class.java)
    private val handler = Handler(Looper.getMainLooper())

    override fun play(cue: SoundCue) {
        if (audio.ringerMode == AudioManager.RINGER_MODE_NORMAL) {
            val tone = when (cue) {
                SoundCue.WARNING, SoundCue.OFFLINE, SoundCue.GAME_OVER -> ToneGenerator.TONE_PROP_NACK
                SoundCue.ONLINE, SoundCue.APPROVED, SoundCue.TIME_ADDED -> ToneGenerator.TONE_PROP_ACK
                SoundCue.GAME_START, SoundCue.SCORE -> ToneGenerator.TONE_PROP_BEEP
            }
            ToneGenerator(AudioManager.STREAM_SYSTEM, 35).apply {
                startTone(tone, if (cue == SoundCue.SCORE) 45 else 100)
                handler.postDelayed({ release() }, 160)
            }
        }
        if (cue != SoundCue.SCORE) hapticView()?.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
    }
}
