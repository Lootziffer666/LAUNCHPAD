import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { OpportunityCard } from '../components/OpportunityCard';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/Button';
import { FAMILY_MEMBERS, Game } from '../data/mockData';

interface HomeScreenProps {
  onNavigateToGame: (id: string) => void;
  onSimulateSync: () => void;
  games: Game[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToGame, onSimulateSync, games }) => {
  const saleOpportunity = games.find(g => g.discount && (g.statusState === 'near' || g.statusState === 'under'));
  const familyOpportunity = games.find(g => g.isShared);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header Section with VENT Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../VENT_Symbol.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting as any}>Guten Morgen,</Text>
              <Text style={styles.userName as any}>Commander</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Sync Sim" variant="secondary" size="S" onPress={onSimulateSync} />
            <IconButton icon="bell" onPress={() => {}} />
          </View>
        </View>

        {/* Summary / Metric Section */}
        <View style={styles.summaryRow}>
          <View style={styles.metricTile}>
            <Text style={typography.roles.numeric.md as any}>
              {games.filter(g => g.statusState === 'under').length}
            </Text>
            <Text style={styles.metricLabel as any}>Zielpreise erreicht</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={typography.roles.numeric.md as any}>
              {games.filter(g => g.hasUpdate).length}
            </Text>
            <Text style={styles.metricLabel as any}>Updates</Text>
          </View>
        </View>

        {/* Action Queue / Opportunities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle as any}>Opportunities</Text>
          <View style={styles.grid}>
            {saleOpportunity && (
              <OpportunityCard
                title={saleOpportunity.title}
                reason={saleOpportunity.statusState === 'under' ? 'DEIN ZIELPREIS WURDE ERREICHT!' : `Historischer Bestpreis erreicht. ${saleOpportunity.familyOwnedCount} Personen besitzen es.`}
                value={saleOpportunity.discount || saleOpportunity.price}
                meta="Limitierte Chance"
                onPress={() => onNavigateToGame(saleOpportunity.id)}
              />
            )}
            {familyOpportunity && (
              <OpportunityCard
                title={familyOpportunity.title}
                reason={`${familyOpportunity.sharedBy} spielt das gerade nicht. Du könntest per Family Sharing einsteigen.`}
                value="Frei"
                meta="Shared Access verfügbar"
                onPress={() => onNavigateToGame(familyOpportunity.id)}
              />
            )}
          </View>
        </View>

        {/* Family Snapshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle as any}>Family Snapshot</Text>
          <View style={styles.familyCard}>
            {FAMILY_MEMBERS.map(member => (
              <View key={member.id} style={styles.familyMember}>
                <View style={[styles.avatar, { backgroundColor: member.color }]}>
                  {member.isCurrentSessionOccupied && <View style={styles.activeIndicator} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.roles.card.title.md as any}>{member.name}</Text>
                  <Text style={[typography.roles.meta.md, { color: member.status === 'Online' ? colors.semantic.success.default : colors.text.tertiary }] as any}>
                    {member.status} • {member.activity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  container: { paddingHorizontal: layout.screen.paddingX, paddingVertical: layout.screen.paddingY },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 32, height: 32 },
  greeting: { ...typography.roles.body.md, color: colors.text.secondary },
  userName: { ...typography.roles.display.md, color: colors.text.primary },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  metricTile: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
  },
  metricLabel: { ...typography.roles.meta.md, color: colors.text.secondary, marginTop: 4 },
  section: { marginBottom: 32 },
  sectionTitle: { ...typography.roles.section.title, marginBottom: 16, color: colors.text.primary },
  grid: { gap: 12 },
  familyCard: {
    backgroundColor: colors.surface.primary,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    gap: 16
  },
  familyMember: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, position: 'relative' },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.semantic.success.default,
    borderWidth: 2,
    borderColor: colors.surface.primary
  }
});
