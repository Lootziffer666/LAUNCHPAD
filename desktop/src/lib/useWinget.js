/* ============================================================
   useWinget — React hook/store for tracking winget install states.

   Listens to onWingetProgress events from the main process and
   provides per-wingetId status to UI components. Falls back
   gracefully when window.launchpad is unavailable (browser dev mode).
   ============================================================ */
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

// Global in-memory store (singleton, shared across all hook consumers)
const store = {
  // wingetId -> { status: 'not_installed'|'installing'|'installed'|'failed', line?: string }
  state: {},
  listeners: new Set(),

  getSnapshot() {
    return store.state;
  },

  subscribe(listener) {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
  },

  _notify() {
    // Create a new object reference so useSyncExternalStore detects change
    store.state = { ...store.state };
    for (const fn of store.listeners) fn();
  },

  update(wingetId, status, line) {
    store.state[wingetId] = { status, line: line || '' };
    store._notify();
  },

  wingetAvailable: null, // null = unchecked, true/false after check
};

// One-time setup: subscribe to progress events from main process
let eventSubscribed = false;

function ensureEventListener() {
  if (eventSubscribed) return;
  eventSubscribed = true;

  if (typeof window === 'undefined' || !window.launchpad) return;
  if (!window.launchpad.onWingetProgress) return;

  window.launchpad.onWingetProgress((payload) => {
    if (payload && payload.wingetId) {
      store.update(payload.wingetId, payload.status, payload.line);
    }
  });
}

/**
 * Hook: returns the install status for a specific wingetId.
 * @param {string} wingetId
 * @returns {{ status: string, line: string }}
 */
export function useWingetStatus(wingetId) {
  useEffect(() => { ensureEventListener(); }, []);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const entry = snapshot[wingetId];
  return entry || { status: 'not_installed', line: '' };
}

/**
 * Hook: provides winget actions and availability.
 * @returns {{ available: boolean|null, check, install, getStatus }}
 */
export function useWinget() {
  const [available, setAvailable] = useState(store.wingetAvailable);

  useEffect(() => {
    ensureEventListener();
    if (store.wingetAvailable !== null) {
      setAvailable(store.wingetAvailable);
      return;
    }
    if (!window.launchpad || !window.launchpad.wingetCheck) {
      store.wingetAvailable = false;
      setAvailable(false);
      return;
    }
    window.launchpad.wingetCheck().then((result) => {
      store.wingetAvailable = result.available;
      setAvailable(result.available);
    }).catch(() => {
      store.wingetAvailable = false;
      setAvailable(false);
    });
  }, []);

  const install = useCallback((wingetId) => {
    if (!window.launchpad || !window.launchpad.wingetInstall) return;
    store.update(wingetId, 'installing', '');
    window.launchpad.wingetInstall(wingetId);
  }, []);

  const getStatus = useCallback((wingetId) => {
    const entry = store.state[wingetId];
    return entry ? entry.status : 'not_installed';
  }, []);

  return { available, install, getStatus };
}

export default useWinget;
