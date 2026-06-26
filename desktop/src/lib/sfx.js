/* ============================================================
   LAUNCHPAD — SFX (Web Audio, synthesized, no asset files)
   SFX.swipe()/open()/close()/select()/launch()/back()
   Gate playback on profile.sound via SFX.enabled.
   ============================================================ */

let ctx = null;
export const SFX = { enabled: true };

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// a short tonal blip with envelope
function tone({ f0, f1, dur = 0.16, type = 'sine', gain = 0.14, delay = 0 }) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// soft filtered-noise whoosh
function whoosh({ dur = 0.22, gain = 0.05 } = {}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur);
}

SFX.swipe = () => { if (!SFX.enabled) return; whoosh({ dur: 0.18, gain: 0.045 }); tone({ f0: 540, f1: 760, dur: 0.1, type: 'triangle', gain: 0.05 }); };
SFX.select = () => { if (!SFX.enabled) return; tone({ f0: 660, f1: 880, dur: 0.08, type: 'square', gain: 0.05 }); };
SFX.open = () => { if (!SFX.enabled) return; tone({ f0: 440, f1: 880, dur: 0.16, type: 'sine', gain: 0.1 }); tone({ f0: 660, f1: 1320, dur: 0.18, type: 'sine', gain: 0.05, delay: 0.04 }); };
SFX.close = () => { if (!SFX.enabled) return; tone({ f0: 700, f1: 320, dur: 0.16, type: 'sine', gain: 0.09 }); };
SFX.back = () => { if (!SFX.enabled) return; tone({ f0: 520, f1: 300, dur: 0.12, type: 'triangle', gain: 0.07 }); };
SFX.launch = () => {
  if (!SFX.enabled) return;
  whoosh({ dur: 0.5, gain: 0.06 });
  tone({ f0: 330, f1: 990, dur: 0.5, type: 'sawtooth', gain: 0.06 });
  tone({ f0: 660, f1: 1320, dur: 0.45, type: 'sine', gain: 0.05, delay: 0.06 });
};

SFX.doorOpen = () => {
  if (!SFX.enabled) return;
  // Dramatic ascending 3-tone chord like a magical portal opening
  tone({ f0: 330, f1: 660, dur: 0.28, type: 'sine', gain: 0.12 });
  tone({ f0: 440, f1: 880, dur: 0.26, type: 'sine', gain: 0.10, delay: 0.08 });
  tone({ f0: 550, f1: 1100, dur: 0.30, type: 'triangle', gain: 0.08, delay: 0.16 });
  whoosh({ dur: 0.4, gain: 0.05 });
};

SFX.magic = () => {
  if (!SFX.enabled) return;
  // Short sparkle/chime for hover effects
  tone({ f0: 1200, f1: 1800, dur: 0.06, type: 'sine', gain: 0.06 });
  tone({ f0: 1600, f1: 2400, dur: 0.05, type: 'sine', gain: 0.04, delay: 0.03 });
  tone({ f0: 2000, f1: 2800, dur: 0.04, type: 'triangle', gain: 0.03, delay: 0.06 });
};

SFX.meow = () => {
  if (!SFX.enabled) return;
  // Rising + falling formant — a small cat meow
  tone({ f0: 520, f1: 1100, dur: 0.18, type: 'sine', gain: 0.13 });
  tone({ f0: 1100, f1: 750, dur: 0.14, type: 'sine', gain: 0.10, delay: 0.17 });
  tone({ f0: 800, f1: 500, dur: 0.10, type: 'triangle', gain: 0.05, delay: 0.29 });
};

SFX.purr = () => {
  if (!SFX.enabled) return;
  // Soft low-frequency rumble with gentle tremolo
  tone({ f0: 28, f1: 32, dur: 0.7, type: 'sawtooth', gain: 0.05 });
  tone({ f0: 56, f1: 60, dur: 0.7, type: 'triangle', gain: 0.03, delay: 0.05 });
  tone({ f0: 84, f1: 90, dur: 0.5, type: 'sine', gain: 0.025, delay: 0.1 });
};

export default SFX;
