/* ============================================================
   LAUNCHPAD — child profile (theme, accent, name, sound, motion)
   Replaces the prototype's design-time useTweaks. localStorage now;
   M2 re-backs this on window.launchpad.getProfile/setProfile (IPC),
   keeping this exact [profile, setField] surface so callers don't change.
   ============================================================ */
import React from 'react';

const PROFILE_KEY = 'launchpad.profile.v1';

export const PROFILE_DEFAULTS = {
  theme: 'space', // 'space' | 'midnight' | 'aurora'
  accent: '#38bdf8',
  kidName: 'Jake',
  sound: true,
  reduceMotion: false,
};

function loadProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return raw && typeof raw === 'object' ? { ...PROFILE_DEFAULTS, ...raw } : { ...PROFILE_DEFAULTS };
  } catch (e) {
    return { ...PROFILE_DEFAULTS };
  }
}

export function useProfile() {
  const [profile, setProfile] = React.useState(loadProfile);

  const setField = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits
      : { [keyOrEdits]: val };
    setProfile((prev) => {
      const next = { ...prev, ...edits };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch (e) {
        /* ignore quota / disabled storage */
      }
      return next;
    });
  }, []);

  return [profile, setField];
}

export default useProfile;
