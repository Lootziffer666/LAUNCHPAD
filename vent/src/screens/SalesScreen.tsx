/**
 * SalesScreen – Live Steam deals via CheapShark API
 *
 * Synergy: CheapShark (steam-wishlist-calculator, steam-deal-alert, ThePriceScout patterns)
 * Shows top discounts on Steam + flags wishlist games that are currently on sale.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { ProcessedDeal, fetchTopSteamDeals } from '../services/cheapshark';
import { Game } from '../data/mockData';

interface SalesScreenProps {
  wishlistGames: Game[];
  onNavigateToGame: (id: string) => void;
}

const MIN_SAVINGS_OPTIONS = [30, 50, 70, 90];

export const SalesScreen: React.FC<SalesScreenProps> = ({ wishlistGames, onNavigateToGame }) => {
  const [deals, setDeals] = useState<ProcessedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minSavings, setMinSavings] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'wishlist'>('all');

  const wishlistIds = new Set(wishlistGames.map((g) => g.id));

  const loadDeals = useCallback(
    async (savings = minSavings) => {
      try {
        const fetched = await fetchTopSteamDeals(25, savings);
        setDeals(fetched);
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [minSavings]
  );

  useEffect(() => {
    setLoading(true);
    loadDeals(minSavings);
  }, [minSavings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeals(minSavings);
  };

  const openInSteam = async (steamAppId: string) => {
    if (!steamAppId) return;
    const nativeUrl = `steam://openurl/https://store.steampowered.com/app/${steamAppId}`;
    const webUrl = `https://store.steampowered.com/app/${steamAppId}`;
    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(supported ? nativeUrl : webUrl);
    } catch {
      Linking.openURL(webUrl).catch(() =>
        Alert.alert('Fehler', 'Steam Store konnte nicht geöffnet werden.')
      );
    }
  };

  const handleDealPress = (deal: ProcessedDeal) => {
    // If this is a wishlist game, navigate to game detail
    if (deal.steamAppId && wishlistIds.has(deal.steamAppId)) {
      onNavigateToGame(deal.steamAppId);
    } else {
      openInSteam(deal.steamAppId);
    }
  };

  const filteredDeals = deals.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'wishlist') {
      return d.steamAppId && wishlistIds.has(d.steamAppId);
    }
    return true;
  });

  const wishlistDealsCount = deals.filter((d) => d.steamAppId && wishlistIds.has(d.steamAppId)).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle as any}>Sales</Text>
          <Text style={styles.pageMeta as any}>
            {loading ? 'Lädt...' : `${deals.length} aktuelle Angebote`}
            {wishlistDealsCount > 0 && ` • ${wishlistDealsCount} auf deiner Wishlist`}
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Input
            type="localSearch"
            placeholder="Spiel suchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ flex: 1 }}
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Chip
            title="Alle"
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <Chip
            title={`Wishlist (${wishlistDealsCount})`}
            selected={activeFilter === 'wishlist'}
            onPress={() => setActiveFilter('wishlist')}
          />
          {MIN_SAVINGS_OPTIONS.map((s) => (
            <Chip
              key={s}
              title={`≥${s}%`}
              selected={minSavings === s}
              onPress={() => setMinSavings(s)}
            />
          ))}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent.primary.default} />
            <Text style={styles.loadingText as any}>Lade Steam-Angebote...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent.primary.default}
              />
            }
          >
            {filteredDeals.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={typography.roles.body.md as any}>
                  {activeFilter === 'wishlist'
                    ? 'Keine Wishlist-Spiele aktuell im Angebot.'
                    : 'Keine Deals gefunden. Runterziehen zum Aktualisieren.'}
                </Text>
              </View>
            )}

            {filteredDeals.map((deal, idx) => {
              const isOnWishlist = deal.steamAppId && wishlistIds.has(deal.steamAppId);
              return (
                <TouchableOpacity
                  key={`${deal.steamAppId}-${idx}`}
                  style={[styles.dealCard, isOnWishlist && styles.dealCardWishlist]}
                  onPress={() => handleDealPress(deal)}
                  activeOpacity={0.75}
                >
                  <Image
                    source={{ uri: deal.thumb }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                  <View style={styles.dealInfo}>
                    <View style={styles.dealTitleRow}>
                      <Text style={styles.dealTitle as any} numberOfLines={1}>
                        {deal.title}
                      </Text>
                      {isOnWishlist && (
                        <View style={styles.wishlistBadge}>
                          <Text style={styles.wishlistBadgeText as any}>★</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceRow}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText as any}>
                          -{Math.round(deal.savingsPercent)}%
                        </Text>
                      </View>
                      <Text style={styles.salePrice as any}>${parseFloat(deal.salePrice).toFixed(2)}</Text>
                      <Text style={styles.normalPrice as any}>${parseFloat(deal.normalPrice).toFixed(2)}</Text>
                    </View>
                    {deal.steamRatingPercent && parseInt(deal.steamRatingPercent) > 0 && (
                      <Text style={styles.rating as any}>
                        ★ {deal.steamRatingPercent}% positiv
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.poweredBy}>
              <Text style={styles.poweredByText as any}>
                Preise via CheapShark API • Alle Preise in USD
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  container: { flex: 1, paddingHorizontal: layout.screen.paddingX, paddingVertical: layout.screen.paddingY },
  header: { marginBottom: 20 },
  pageTitle: { ...typography.roles.display.md, color: colors.text.primary },
  pageMeta: { ...typography.roles.meta.md, color: colors.text.secondary, marginTop: 4 },
  searchRow: { marginBottom: 12 },
  filterScroll: { gap: 8, paddingRight: 24, marginBottom: 20, height: 36 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { ...typography.roles.body.md, color: colors.text.secondary },
  listContainer: { gap: 10, paddingBottom: 100 },
  dealCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    overflow: 'hidden',
  },
  dealCardWishlist: {
    borderColor: colors.accent.primary.default,
    borderWidth: 1.5,
  },
  thumb: {
    width: 96,
    height: 60,
    backgroundColor: colors.surface.tertiary,
  },
  dealInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 6,
  },
  dealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealTitle: {
    ...typography.roles.card.title.sm,
    color: colors.text.primary,
    flex: 1,
  },
  wishlistBadge: {
    backgroundColor: colors.accent.primary.soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wishlistBadgeText: {
    ...typography.roles.meta.sm,
    color: colors.accent.primary.default,
    fontWeight: '700' as const,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: colors.accent.primary.default,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    ...typography.roles.meta.sm,
    color: colors.text.inverse,
    fontWeight: '700' as const,
  },
  salePrice: {
    ...typography.roles.numeric.sm,
    color: colors.text.primary,
  },
  normalPrice: {
    ...typography.roles.meta.md,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  rating: {
    ...typography.roles.meta.sm,
    color: colors.text.tertiary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  poweredBy: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  poweredByText: {
    ...typography.roles.meta.sm,
    color: colors.text.tertiary,
  },
});
