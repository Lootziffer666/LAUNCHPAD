import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  loadAccountProfiles,
  saveActiveProfileId,
  loadActiveProfileId,
  removeAccountProfile,
  loadPreferences,
  savePreference,
  clearAllUserData,
} from '../services/storage';
import type { AccountProfile } from '../data/mockData';

export const SettingsScreen = () => {
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [priceAlertThreshold, setPriceAlertThreshold] = useState(30);

  useEffect(() => {
    Promise.all([loadAccountProfiles(), loadActiveProfileId(), loadPreferences()]).then(
      ([profs, activeId, prefs]) => {
        setProfiles(profs);
        setActiveProfileId(activeId ?? (profs[0]?.id ?? null));
        setNotificationsEnabled(prefs.notificationsEnabled);
        setDarkMode(prefs.darkMode);
        setPriceAlertThreshold(prefs.priceAlertThreshold);
      }
    );
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const handleSwitchProfile = async (profileId: string) => {
    setActiveProfileId(profileId);
    await saveActiveProfileId(profileId);
  };

  const handleRemoveProfile = (profile: AccountProfile) => {
    if (profiles.length <= 1) {
      Alert.alert('Fehler', 'Du brauchst mindestens ein Konto.');
      return;
    }
    Alert.alert(
      'Konto entfernen',
      `"${profile.displayName}" aus VENT entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            await removeAccountProfile(profile.id);
            const updated = profiles.filter((p) => p.id !== profile.id);
            setProfiles(updated);
            if (activeProfileId === profile.id) {
              setActiveProfileId(updated[0]?.id ?? null);
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Cache leeren',
      'Alle VENT-Daten (Zielpreise, Decision States, Tags) werden zurückgesetzt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await clearAllUserData();
            Alert.alert('Erledigt', 'Alle lokalen Daten wurden gelöscht.');
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await savePreference('notificationsEnabled', val);
  };

  const handleToggleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    await savePreference('darkMode', val);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle as any}>Settings</Text>
          <Text style={styles.pageMeta as any}>Account & App-Konfiguration</Text>
        </View>

        {/* Active Profile Section */}
        {activeProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle as any}>Aktives Profil</Text>
            <View style={styles.profileCard}>
              <View style={[styles.avatar, { backgroundColor: activeProfile.accentColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={typography.roles.card.title.md as any}>{activeProfile.displayName}</Text>
                <Text style={typography.roles.meta.md as any}>
                  {activeProfile.roleLabel ?? 'Steam Konto'}
                  {activeProfile.steamId ? ` • ${activeProfile.steamId}` : ''}
                </Text>
              </View>
              <Badge label="Active" type="success" />
            </View>
          </View>
        )}

        {/* Account Profiles (Multi-Account Switcher - pattern from TCNOco/TcNo-Acc-Switcher) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle as any}>Konten</Text>
          {profiles.map((profile) => (
            <View key={profile.id} style={styles.settingRow}>
              <View style={[styles.profileDot, { backgroundColor: profile.accentColor }]} />
              <View style={styles.settingLabelGroup}>
                <Text style={styles.settingLabel as any}>{profile.displayName}</Text>
                <Text style={styles.settingSubLabel as any}>
                  {profile.roleLabel ?? 'Steam Konto'}
                  {profile.steamId ? ` • ${profile.steamId.slice(-8)}` : ''}
                </Text>
              </View>
              <View style={styles.profileActions}>
                {activeProfileId === profile.id ? (
                  <Badge label="Aktiv" type="success" />
                ) : (
                  <Button
                    title="Wechseln"
                    variant="secondary"
                    size="S"
                    onPress={() => handleSwitchProfile(profile.id)}
                  />
                )}
                {profiles.length > 1 && (
                  <Button
                    title="✕"
                    variant="danger"
                    size="S"
                    onPress={() => handleRemoveProfile(profile)}
                  />
                )}
              </View>
            </View>
          ))}
          <Button
            title="+ Konto hinzufügen"
            variant="secondary"
            size="M"
            containerStyle={{ marginTop: 8 }}
            onPress={() => Alert.alert('Coming Soon', 'Steam OAuth-Login wird in einer zukünftigen Version verfügbar.')}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle as any}>Präferenzen</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingLabel as any}>Push-Benachrichtigungen</Text>
              <Text style={styles.settingSubLabel as any}>Preisalarme & Family Updates</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.stroke.default, true: colors.accent.secondary.default }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingLabel as any}>Dark Mode</Text>
              <Text style={styles.settingSubLabel as any}>Experimentelles Design</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: colors.stroke.default, true: colors.accent.secondary.default }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingLabel as any}>Preisalarm-Schwelle</Text>
              <Text style={styles.settingSubLabel as any}>
                Alert ab {priceAlertThreshold}% Rabatt
              </Text>
            </View>
            <View style={styles.thresholdButtons}>
              {[30, 50, 70].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.thresholdBtn, priceAlertThreshold === t && styles.thresholdBtnActive]}
                  onPress={async () => {
                    setPriceAlertThreshold(t);
                    await savePreference('priceAlertThreshold', t);
                  }}
                >
                  <Text
                    style={[
                      styles.thresholdBtnText,
                      priceAlertThreshold === t && styles.thresholdBtnTextActive,
                    ] as any}
                  >
                    {t}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* About / System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle as any}>System</Text>
          <View style={styles.aboutRow}>
            <Image
              source={require('../../VENT_Name.png')}
              style={styles.logoName}
              resizeMode="contain"
            />
            <Text style={styles.settingSubLabel as any}>Version 1.1.0 (Alpha)</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingLabel as any}>Daten-Quellen</Text>
              <Text style={styles.settingSubLabel as any}>
                CheapShark API (Preise) • Steam CDN (Assets)
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
            <Text style={[styles.settingLabel, { color: colors.semantic.danger.default }] as any}>
              Cache leeren
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  container: { paddingHorizontal: layout.screen.paddingX, paddingVertical: layout.screen.paddingY },
  header: { marginBottom: 32 },
  pageTitle: { ...typography.roles.display.md, color: colors.text.primary },
  pageMeta: { ...typography.roles.meta.md, color: colors.text.secondary },
  section: { marginBottom: 32 },
  sectionTitle: { ...typography.roles.section.title, color: colors.text.primary, marginBottom: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  profileDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke.subtle,
    gap: 8,
  },
  profileActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke.subtle,
  },
  aboutRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke.subtle,
    alignItems: 'flex-start',
    gap: 4,
  },
  logoName: { width: 100, height: 24, tintColor: colors.text.primary },
  settingLabelGroup: { flex: 1 },
  settingLabel: { ...typography.roles.card.title.md, color: colors.text.primary },
  settingSubLabel: { ...typography.roles.meta.md, color: colors.text.tertiary, marginTop: 2 },
  thresholdButtons: { flexDirection: 'row', gap: 6 },
  thresholdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.stroke.default,
    backgroundColor: colors.surface.secondary,
  },
  thresholdBtnActive: {
    borderColor: colors.accent.primary.default,
    backgroundColor: colors.accent.primary.soft,
  },
  thresholdBtnText: {
    ...typography.roles.meta.sm,
    color: colors.text.secondary,
  },
  thresholdBtnTextActive: {
    color: colors.accent.primary.default,
    fontWeight: '700' as const,
  },
});
