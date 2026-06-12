import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, Linking, Alert, TextInput } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { Badge } from '../components/Badge';
import { PriceStack } from '../components/PriceStack';
import { Chip } from '../components/Chip';
import { ALL_GAMES, DECISION_STATE_LABELS, DecisionState } from '../data/mockData';
import { api } from '../services/api';

interface GameDetailScreenProps {
  gameId: string;
  onBack: () => void;
}

export const GameDetailScreen: React.FC<GameDetailScreenProps> = ({ gameId, onBack }) => {
  const baseGame = ALL_GAMES.find((g) => g.id === gameId);
  const [game, setGame] = useState(baseGame);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(baseGame?.targetPrice ?? '');
  const [loadingLivePrice, setLoadingLivePrice] = useState(false);

  // Fetch live CheapShark price on mount
  useEffect(() => {
    if (!baseGame) return;
    setLoadingLivePrice(true);
    api.getLivePriceForGame(baseGame).then((enriched) => {
      setGame(enriched);
      setTargetInput(enriched.targetPrice ?? '');
      setLoadingLivePrice(false);
    });
  }, [gameId]);

  if (!game) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" onPress={onBack} />
          <Text style={styles.topBarTitle as any}>Fehler</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={typography.roles.body.md as any}>Spiel nicht gefunden.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openSteamStore = async () => {
    const nativeUrl = `steam://openurl/https://store.steampowered.com/app/${game.id}`;
    const webUrl = `https://store.steampowered.com/app/${game.id}`;
    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      if (supported) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Fehler', 'Der Steam Store konnte nicht geöffnet werden.');
      });
    }
  };

  const handleSaveTargetPrice = async () => {
    const trimmed = targetInput.trim();
    if (!trimmed) return;
    await api.setTargetPrice(game.id, trimmed);
    setGame((prev) => prev ? { ...prev, targetPrice: trimmed } : prev);
    setEditingTarget(false);
  };

  const handleDecisionStateChange = async (state: DecisionState) => {
    await api.setDecisionState(game.id, state === game.decisionState ? null : state);
    setGame((prev) => prev ? { ...prev, decisionState: state === prev.decisionState ? null : state } : prev);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={onBack} />
        <Text style={styles.topBarTitle as any} numberOfLines={1}>{game.title}</Text>
        <IconButton icon="share-2" onPress={() => openSteamStore()} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: game.coverUrl }} style={styles.heroImage} resizeMode="cover" />

        <View style={styles.content}>
          {/* Title & Meta */}
          <View style={styles.headerSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title as any}>{game.title}</Text>
              <Text style={styles.developer as any}>{game.developer} • {game.releaseDate ?? 'Release TBD'}</Text>
            </View>
            <Badge label={game.compatibility ?? 'Verified'} type="success" />
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Button
              title={game.isInstalled ? 'Spielen' : 'Im Store kaufen'}
              variant="primary"
              size="L"
              containerStyle={{ flex: 1 }}
              onPress={openSteamStore}
            />
            <IconButton icon="heart" onPress={() => {}} />
            <IconButton icon="plus" onPress={() => {}} />
          </View>

          {/* Decision State */}
          <View style={styles.card}>
            <Text style={styles.cardTitle as any}>Meine Entscheidung</Text>
            <View style={styles.decisionGrid}>
              {(Object.entries(DECISION_STATE_LABELS) as [NonNullable<DecisionState>, string][]).map(([key, label]) => (
                <Chip
                  key={key}
                  title={label}
                  selected={game.decisionState === key}
                  onPress={() => handleDecisionStateChange(key)}
                  size="S"
                />
              ))}
            </View>
          </View>

          {/* Price Decision Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle as any}>Preis & Zielpreis</Text>
              {loadingLivePrice && <Text style={styles.liveBadge as any}>🔄 Live</Text>}
              {!loadingLivePrice && game.isOnSale && <Text style={styles.saleBadge as any}>🔥 Im Sale</Text>}
            </View>
            <View style={styles.priceContainer}>
              <PriceStack
                currentPrice={game.price}
                targetPrice={game.targetPrice}
                discountBadge={game.discount as any}
                state={game.statusState}
              />
              <View style={styles.priceMeta}>
                <Text style={typography.roles.body.md as any}>{game.reason}</Text>
                {game.historicalLow && (
                  <Text style={[typography.roles.meta.md, { color: colors.text.tertiary }] as any}>
                    Hist. Tief: {game.historicalLow}
                  </Text>
                )}
              </View>
            </View>

            {/* Target Price Editor */}
            {editingTarget ? (
              <View style={styles.targetEditor}>
                <TextInput
                  style={styles.targetInput}
                  value={targetInput}
                  onChangeText={setTargetInput}
                  placeholder="z.B. 19.99"
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <Button title="Speichern" variant="primary" size="S" onPress={handleSaveTargetPrice} />
                <Button title="Abbruch" variant="secondary" size="S" onPress={() => setEditingTarget(false)} />
              </View>
            ) : (
              <Button
                title={game.targetPrice ? `Zielpreis: ${game.targetPrice} ändern` : 'Zielpreis setzen'}
                variant="secondary"
                size="S"
                containerStyle={{ marginTop: 12 }}
                onPress={() => setEditingTarget(true)}
              />
            )}
          </View>

          {/* Family Context */}
          <View style={styles.card}>
            <Text style={styles.cardTitle as any}>Family Context</Text>
            <Text style={styles.bodyText as any}>
              {game.familyOwnedCount > 0
                ? `${game.familyOwnedCount} Mitglieder besitzen dieses Spiel.`
                : 'Niemand in deiner Family besitzt dieses Spiel.'}
              {game.isShared && (
                <Text style={{ color: colors.semantic.success.default, fontWeight: '600' }}>
                  {' '}Verfügbar per Sharing.
                </Text>
              )}
            </Text>
            {game.ownedBy.length > 0 && (
              <View style={styles.avatarRow}>
                {game.ownedBy.map((name, i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniAvatar,
                      { backgroundColor: i % 2 === 0 ? colors.accent.secondary.default : colors.accent.primary.default },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle as any}>Über das Spiel</Text>
            <Text style={styles.bodyText as any}>{game.description}</Text>
            <View style={styles.tagRow}>
              {game.tags.map((tag) => (
                <Chip key={tag} title={tag} type="filter" size="S" />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
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
  topBarTitle: { ...typography.roles.card.title.md, flex: 1, color: colors.text.primary },
  container: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 200, backgroundColor: colors.surface.tertiary },
  content: { padding: layout.screen.paddingX, gap: 24 },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  title: { ...typography.roles.display.md, color: colors.text.primary },
  developer: { ...typography.roles.meta.md, color: colors.text.secondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  card: {
    backgroundColor: colors.surface.primary,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { ...typography.roles.card.title.md, color: colors.text.primary },
  liveBadge: { ...typography.roles.meta.sm, color: colors.accent.secondary.default },
  saleBadge: { ...typography.roles.meta.sm, color: colors.accent.primary.default, fontWeight: '700' as const },
  decisionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceMeta: { alignItems: 'flex-end', gap: 4 },
  targetEditor: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  targetInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: colors.stroke.default,
    borderRadius: 8,
    paddingHorizontal: 12,
    ...typography.roles.body.md,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
  },
  avatarRow: { flexDirection: 'row', gap: -8, marginTop: 12 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.surface.primary },
  section: { gap: 12 },
  sectionTitle: { ...typography.roles.section.title, color: colors.text.primary },
  bodyText: { ...typography.roles.body.md, color: colors.text.secondary, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
