import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { IconButton } from '../components/IconButton';
import { PriceStack } from '../components/PriceStack';
import { Badge } from '../components/Badge';
import { ALL_GAMES } from '../data/mockData';

interface CompareScreenProps {
  gameIds: string[];
  onBack: () => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({ gameIds, onBack }) => {
  const gamesToCompare = ALL_GAMES.filter((g) => gameIds.includes(g.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={onBack} />
        <Text style={styles.topBarTitle as any}>Vergleich ({gamesToCompare.length})</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.compareMatrix}>

          {/* Header Row: Covers & Titles */}
          <View style={styles.matrixRow}>
            <View style={styles.labelColumn} />
            {gamesToCompare.map((game) => (
              <View key={game.id} style={styles.gameColumn}>
                <Image source={{ uri: game.coverUrl }} style={styles.miniCover} />
                <Text style={styles.gameTitle as any} numberOfLines={2}>{game.title}</Text>
              </View>
            ))}
          </View>

          {/* Price Row */}
          <View style={styles.matrixRow}>
            <View style={styles.labelColumn}>
              <Text style={styles.rowLabel as any}>Preis</Text>
            </View>
            {gamesToCompare.map((game) => (
              <View key={game.id} style={styles.gameColumn}>
                <PriceStack
                  currentPrice={game.price}
                  targetPrice={game.targetPrice}
                  discountBadge={game.discount as any}
                  state={game.statusState}
                  size="compact"
                />
              </View>
            ))}
          </View>

          {/* Rating Row */}
          <View style={styles.matrixRow}>
            <View style={styles.labelColumn}>
              <Text style={styles.rowLabel as any}>Reviews</Text>
            </View>
            {gamesToCompare.map((game) => (
              <View key={game.id} style={styles.gameColumn}>
                <Text style={typography.roles.numeric.sm as any}>{game.rating ?? '—'}</Text>
                <Text style={typography.roles.meta.md as any}>Positiv</Text>
              </View>
            ))}
          </View>

          {/* Family Context Row */}
          <View style={styles.matrixRow}>
            <View style={styles.labelColumn}>
              <Text style={styles.rowLabel as any}>Family</Text>
            </View>
            {gamesToCompare.map((game) => (
              <View key={game.id} style={styles.gameColumn}>
                <Text style={typography.roles.numeric.sm as any}>{game.familyOwnedCount}</Text>
                <Text style={typography.roles.meta.md as any}>Besitzer</Text>
              </View>
            ))}
          </View>

          {/* Deck Compatibility Row */}
          <View style={styles.matrixRow}>
            <View style={styles.labelColumn}>
              <Text style={styles.rowLabel as any}>Deck</Text>
            </View>
            {gamesToCompare.map((game) => (
              <View key={game.id} style={styles.gameColumn}>
                <Badge label={game.compatibility ?? 'Unbekannt'} type="success" />
              </View>
            ))}
          </View>

          {/* Decision State Row */}
          <View style={styles.matrixRow}>
            <View style={styles.labelColumn}>
              <Text style={styles.rowLabel as any}>Decision</Text>
            </View>
            {gamesToCompare.map((game) => (
              <View key={game.id} style={styles.gameColumn}>
                <Text style={styles.decisionText as any} numberOfLines={2}>
                  {game.decisionState
                    ? game.decisionState.replace('_', ' ')
                    : '—'}
                </Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerInfo as any}>Tippe auf ein Spiel für Details</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke.subtle,
    backgroundColor: colors.surface.primary,
    gap: 12,
  },
  topBarTitle: { ...typography.roles.card.title.md, color: colors.text.primary },
  compareMatrix: {
    padding: 16,
  },
  matrixRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke.subtle,
    alignItems: 'center',
  },
  labelColumn: {
    width: 90,
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.roles.meta.md,
    color: colors.text.tertiary,
    textTransform: 'uppercase' as const,
  },
  gameColumn: {
    width: 160,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  miniCover: {
    width: 136,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surface.tertiary,
  },
  gameTitle: {
    ...typography.roles.card.title.sm,
    color: colors.text.primary,
  },
  decisionText: {
    ...typography.roles.meta.md,
    color: colors.text.secondary,
    textTransform: 'capitalize' as const,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.stroke.subtle,
    backgroundColor: colors.surface.secondary,
  },
  footerInfo: {
    ...typography.roles.meta.md,
    color: colors.text.tertiary,
  },
});
