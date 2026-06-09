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

export default SFX;
