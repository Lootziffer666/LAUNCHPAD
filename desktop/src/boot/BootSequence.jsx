/* ============================================================
   LAUNCHPAD — boot player.
   Plays one boot clip (a video from the manifest, or a built-in CSS
   fallback) for its duration, then hands off to the shell. The long
   "controller" gag adds a punchline near the end. Reduced motion gets
   a static frame. The clip itself is chosen by lib/bootAnimations.js.
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { durationOf } from '../lib/bootAnimations.js';

const GLYPH = { rocket: '🚀', warp: '🚀', daddy: '💜', controller: '🎮' };
const asset = (s) => (s && s.startsWith('/') ? s : `/${s}`);

export function BootSequence({ clip, kidName = 'Jake', reduceMotion = false, onDone = () => {} }) {
  const doneRef = useRef(false);
  const dur = durationOf(clip);
  const variant = (clip && clip.variant) || 'rocket';
  const isVideo = !!(clip && clip.src);
  const [punch, setPunch] = useState(false);

  useEffect(() => {
    const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone(); } };
    // Safety timer so a stalled/silent video can never wedge the boot.
    const id = setTimeout(finish, dur + (isVideo ? 1200 : 300));
    let pid;
    if (clip && clip.gag && variant === 'controller') {
      pid = setTimeout(() => setPunch(true), Math.max(0, dur - 2600));
    }
    return () => { clearTimeout(id); if (pid) clearTimeout(pid); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const caption = punch
    ? '😏 … brauchst du gar nicht. Reingelegt!'
    : String((clip && clip.caption) || 'LAUNCHPAD').replace('{name}', kidName);

  return (
    <div className={`boot boot-${variant} ${reduceMotion ? 'noanim' : ''} ${clip && clip.warm ? 'boot-warm' : ''}`}>
      {isVideo ? (
        <video
          className="boot-video"
          src={asset(clip.src)}
          autoPlay
          muted
          playsInline
          onEnded={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
        />
      ) : (
        <div className="boot-stage">
          <div className="boot-orbit"></div>
          <div className="boot-glyph">{GLYPH[variant] || '🚀'}</div>
        </div>
      )}
      <div className={`boot-caption ${clip && clip.warm ? 'warm' : ''}`}>{caption}</div>
      {!isVideo && <div className="boot-bar"><i style={{ animationDuration: `${dur}ms` }}></i></div>}
    </div>
  );
}
