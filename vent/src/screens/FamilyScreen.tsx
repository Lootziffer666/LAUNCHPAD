import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { FamilyMember, MOCK_CONFLICTS, FAMILY_MEMBERS } from '../data/mockData';

interface FamilyScreenProps {
  members: FamilyMember[];
}

export const FamilyScreen: React.FC<FamilyScreenProps> = ({ members }) => {
  const [activeTab, setActiveTab] = useState('Mitglieder');

  const currentUser = FAMILY_MEMBERS.find(m => m.isCurrentSessionOccupied);
  const currentUserName = currentUser?.name ?? '';

  const isCurrentUserBlocker = (blockedBy: string) =>
    currentUserName.startsWith(blockedBy) || blockedBy === currentUserName.split(' ')[0];

  const getConflictBannerText = (gameTitle: string, blockedBy: string, wasSessionInterrupted?: boolean) => {
    if (isCurrentUserBlocker(blockedBy)) {
      return wasSessionInterrupted
        ? `${gameTitle}: Deine Session hat eine andere Sitzung unterbrochen.`
        : `${gameTitle}: Du spielst dieses Spiel – kein anderes Mitglied wurde unterbrochen.`;
    }
    return wasSessionInterrupted
      ? `${gameTitle}: Eine aktive Session wurde durch ${blockedBy} unterbrochen.`
      : `${gameTitle} wird gerade von ${blockedBy} gespielt. Kein Slot verfügbar.`;
  };

  const getConflictStatusLabel = (blockedBy: string, wasSessionInterrupted?: boolean) => {
    if (isCurrentUserBlocker(blockedBy)) {
      return wasSessionInterrupted ? 'Sitzung unterbrochen' : 'Deine aktive Session';
    }
    return wasSessionInterrupted ? 'Session unterbrochen' : 'Slot belegt';
  };

  const MOCK_SHARED_STATS = [
    { label: 'Gesamtspiele', value: '412' },
    { label: 'Verfügbare Slots', value: '2/3' },
    { label: 'Konflikte', value: MOCK_CONFLICTS.length.toString() },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle as any}>Family</Text>
          <Text style={styles.pageMeta as any}>Steam Family Group • Aktiv</Text>
        </View>

        {/* Status Metrics */}
        <View style={styles.metricsRow}>
          {MOCK_SHARED_STATS.map((stat, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={typography.roles.numeric.sm as any}>{stat.value}</Text>
              <Text style={styles.metricLabel as any}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Conflict Alert if any */}
        {MOCK_CONFLICTS.length > 0 && (
          <TouchableOpacity style={[
            styles.conflictBanner,
            !MOCK_CONFLICTS[0].wasSessionInterrupted && styles.conflictBannerInfo,
          ]}>
            <View style={[
              styles.conflictIcon,
              !MOCK_CONFLICTS[0].wasSessionInterrupted && styles.conflictIconInfo,
            ]}>
              <Text style={{ color: colors.canvas.default, fontWeight: 'bold' }}>!</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.conflictTitle as any}>
                {MOCK_CONFLICTS[0].wasSessionInterrupted ? 'Bibliotheks-Konflikt' : 'Session-Status'}
              </Text>
              <Text style={styles.conflictText as any}>
                {getConflictBannerText(
                  MOCK_CONFLICTS[0].gameTitle,
                  MOCK_CONFLICTS[0].blockedBy,
                  MOCK_CONFLICTS[0].wasSessionInterrupted,
                )}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {['Mitglieder', 'Bibliothek', 'Konflikte'].map(tab => (
            <Chip
              key={tab}
              title={tab}
              selected={activeTab === tab}
              onPress={() => setActiveTab(tab)}
            />
          ))}
        </View>

        {/* Content based on Tab */}
        {activeTab === 'Mitglieder' && (
          <View style={styles.section}>
            {members.map(member => (
              <View key={member.id} style={styles.memberCard}>
                <View style={[styles.avatar, { backgroundColor: member.color }]} />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={typography.roles.card.title.md as any}>{member.name}</Text>
                    <Text style={[typography.roles.meta.md, { color: colors.text.tertiary }] as any}>{member.role}</Text>
                  </View>
                  <Text style={[typography.roles.body.md, { color: member.status === 'Online' ? colors.semantic.success.default : colors.text.tertiary }] as any}>
                    {member.status} • {member.activity}
                  </Text>
                </View>
                <Button title="Manage" variant="secondary" size="S" onPress={() => { /* TODO: open member management */ }} />
              </View>
            ))}
            <Button title="Mitglied einladen" variant="primary" size="M" onPress={() => { /* TODO: invite member flow */ }} containerStyle={{ marginTop: 12 }} />
          </View>
        )}

        {activeTab === 'Konflikte' && (
          <View style={styles.section}>
            {MOCK_CONFLICTS.map(conflict => (
              <View key={conflict.id} style={[
                styles.memberCard,
                { borderColor: conflict.wasSessionInterrupted ? colors.semantic.warning.default : colors.stroke.subtle },
              ]}>
                <View style={styles.memberInfo}>
                  <Text style={typography.roles.card.title.md as any}>{conflict.gameTitle}</Text>
                  <Text style={typography.roles.body.md as any}>
                    Status: {getConflictStatusLabel(conflict.blockedBy, conflict.wasSessionInterrupted)}
                  </Text>
                  <Text style={styles.conflictMeta as any}>{conflict.reason}</Text>
                  {!conflict.wasSessionInterrupted && (
                    <Text style={[typography.roles.meta.md, { color: colors.semantic.success.default, marginTop: 2 }] as any}>
                      Keine Session wurde unterbrochen
                    </Text>
                  )}
                </View>
                <Button title="Info" variant="secondary" size="S" onPress={() => { /* TODO: show conflict detail */ }} />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Bibliothek' && (
          <View style={styles.placeholderSection}>
            <Text style={typography.roles.body.md as any}>Hier werden geteilte Bibliotheksinhalte und deren Verfügbarkeit angezeigt.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  container: { paddingHorizontal: layout.screen.paddingX, paddingVertical: layout.screen.paddingY },
  header: { marginBottom: 24 },
  pageTitle: { ...typography.roles.display.md, color: colors.text.primary },
  pageMeta: { ...typography.roles.meta.md, color: colors.text.secondary },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { ...typography.roles.meta.md, color: colors.text.tertiary, marginTop: 4 },
  conflictBanner: {
    flexDirection: 'row',
    backgroundColor: colors.semantic.warning.default + '15',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.semantic.warning.default,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  conflictBannerInfo: {
    backgroundColor: colors.surface.secondary,
    borderColor: colors.stroke.subtle,
  },
  conflictIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.semantic.warning.default, justifyContent: 'center', alignItems: 'center' },
  conflictIconInfo: { backgroundColor: colors.text.tertiary },
  conflictTitle: { ...typography.roles.card.title.sm, color: colors.text.primary },
  conflictText: { ...typography.roles.body.md, color: colors.text.secondary },
  conflictMeta: { ...typography.roles.meta.md, color: colors.text.tertiary, marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  section: { gap: 12 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  memberInfo: { flex: 1, gap: 2 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  placeholderSection: { padding: 40, alignItems: 'center' },
});
