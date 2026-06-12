/**
 * VENT Persistence Layer
 * Pattern inspired by: Depressurizer (bulk tag management), 
 *   batteryshark/steam-wishlist-tracker (state persistence),
 *   TCNOco/TcNo-Acc-Switcher (multi-profile management)
 *
 * Stores user preferences, decision states, target prices, custom tags
 * and account profiles locally using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DecisionState, AccountProfile, DEFAULT_ACCOUNT_PROFILES, ManualSet } from '../data/mockData';

const KEYS = {
  DECISION_STATES: 'vent:decision_states',
  TARGET_PRICES: 'vent:target_prices',
  CUSTOM_TAGS: 'vent:custom_tags',
  ACCOUNT_PROFILES: 'vent:account_profiles',
  ACTIVE_PROFILE_ID: 'vent:active_profile_id',
  MANUAL_SETS: 'vent:manual_sets',
  NOTIFICATIONS_ENABLED: 'vent:notifications_enabled',
  DARK_MODE: 'vent:dark_mode',
  HIDDEN_GAMES: 'vent:hidden_games',
  PRICE_ALERT_THRESHOLD: 'vent:price_alert_threshold',
};

// ─── Decision States ──────────────────────────────────────────────────────────

export async function loadDecisionStates(): Promise<Record<string, DecisionState>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DECISION_STATES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveDecisionState(gameId: string, state: DecisionState): Promise<void> {
  try {
    const existing = await loadDecisionStates();
    existing[gameId] = state;
    await AsyncStorage.setItem(KEYS.DECISION_STATES, JSON.stringify(existing));
  } catch (e) {
    console.warn('[Storage] saveDecisionState failed:', e);
  }
}

// ─── Target Prices ────────────────────────────────────────────────────────────

export async function loadTargetPrices(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TARGET_PRICES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveTargetPrice(gameId: string, price: string): Promise<void> {
  try {
    const existing = await loadTargetPrices();
    existing[gameId] = price;
    await AsyncStorage.setItem(KEYS.TARGET_PRICES, JSON.stringify(existing));
  } catch (e) {
    console.warn('[Storage] saveTargetPrice failed:', e);
  }
}

// ─── Custom Tags / Labels ─────────────────────────────────────────────────────

export async function loadCustomTags(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CUSTOM_TAGS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveCustomTags(gameId: string, tags: string[]): Promise<void> {
  try {
    const existing = await loadCustomTags();
    existing[gameId] = tags;
    await AsyncStorage.setItem(KEYS.CUSTOM_TAGS, JSON.stringify(existing));
  } catch (e) {
    console.warn('[Storage] saveCustomTags failed:', e);
  }
}

// ─── Manual Sets ──────────────────────────────────────────────────────────────

export async function loadManualSets(): Promise<ManualSet[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MANUAL_SETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveManualSets(sets: ManualSet[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.MANUAL_SETS, JSON.stringify(sets));
  } catch (e) {
    console.warn('[Storage] saveManualSets failed:', e);
  }
}

export async function addGameToSet(setId: string, gameId: string): Promise<ManualSet[]> {
  const sets = await loadManualSets();
  const target = sets.find((s) => s.id === setId);
  if (target && !target.gameIds.includes(gameId)) {
    target.gameIds.push(gameId);
    await saveManualSets(sets);
  }
  return sets;
}

export async function createManualSet(name: string): Promise<ManualSet> {
  const sets = await loadManualSets();
  const newSet: ManualSet = { id: `set-${Date.now()}`, name, gameIds: [] };
  sets.push(newSet);
  await saveManualSets(sets);
  return newSet;
}

// ─── Account Profiles ─────────────────────────────────────────────────────────

export async function loadAccountProfiles(): Promise<AccountProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACCOUNT_PROFILES);
    if (raw) return JSON.parse(raw);
    // First-run: seed with defaults
    await AsyncStorage.setItem(KEYS.ACCOUNT_PROFILES, JSON.stringify(DEFAULT_ACCOUNT_PROFILES));
    return DEFAULT_ACCOUNT_PROFILES;
  } catch {
    return DEFAULT_ACCOUNT_PROFILES;
  }
}

export async function saveAccountProfiles(profiles: AccountProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACCOUNT_PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.warn('[Storage] saveAccountProfiles failed:', e);
  }
}

export async function loadActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.ACTIVE_PROFILE_ID);
  } catch {
    return null;
  }
}

export async function saveActiveProfileId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_PROFILE_ID, id);
  } catch (e) {
    console.warn('[Storage] saveActiveProfileId failed:', e);
  }
}

export async function addAccountProfile(profile: Omit<AccountProfile, 'id' | 'createdAt'>): Promise<AccountProfile> {
  const profiles = await loadAccountProfiles();
  const newProfile: AccountProfile = {
    ...profile,
    id: `profile-${Date.now()}`,
    isActive: false,
    createdAt: new Date().toISOString(),
  };
  profiles.push(newProfile);
  await saveAccountProfiles(profiles);
  return newProfile;
}

export async function removeAccountProfile(id: string): Promise<void> {
  const profiles = await loadAccountProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  await saveAccountProfiles(filtered);
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function loadPreferences(): Promise<{
  notificationsEnabled: boolean;
  darkMode: boolean;
  priceAlertThreshold: number;
}> {
  try {
    const [notif, dark, threshold] = await Promise.all([
      AsyncStorage.getItem(KEYS.NOTIFICATIONS_ENABLED),
      AsyncStorage.getItem(KEYS.DARK_MODE),
      AsyncStorage.getItem(KEYS.PRICE_ALERT_THRESHOLD),
    ]);
    return {
      notificationsEnabled: notif !== 'false',
      darkMode: dark === 'true',
      priceAlertThreshold: threshold ? parseFloat(threshold) : 30,
    };
  } catch {
    return { notificationsEnabled: true, darkMode: false, priceAlertThreshold: 30 };
  }
}

export async function savePreference(
  key: 'notificationsEnabled' | 'darkMode' | 'priceAlertThreshold',
  value: boolean | number
): Promise<void> {
  const storageKey =
    key === 'notificationsEnabled'
      ? KEYS.NOTIFICATIONS_ENABLED
      : key === 'darkMode'
      ? KEYS.DARK_MODE
      : KEYS.PRICE_ALERT_THRESHOLD;
  try {
    await AsyncStorage.setItem(storageKey, String(value));
  } catch (e) {
    console.warn('[Storage] savePreference failed:', e);
  }
}

// ─── Hidden Games ─────────────────────────────────────────────────────────────

export async function loadHiddenGames(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HIDDEN_GAMES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleHiddenGame(gameId: string): Promise<string[]> {
  const hidden = await loadHiddenGames();
  const idx = hidden.indexOf(gameId);
  if (idx >= 0) hidden.splice(idx, 1);
  else hidden.push(gameId);
  await AsyncStorage.setItem(KEYS.HIDDEN_GAMES, JSON.stringify(hidden));
  return hidden;
}

// ─── Clear all data (for logout / cache clear) ────────────────────────────────

export async function clearAllUserData(): Promise<void> {
  try {
    await Promise.all(Object.values(KEYS).map(key => AsyncStorage.removeItem(key)));
  } catch (e) {
    console.warn('[Storage] clearAllUserData failed:', e);
  }
}
