import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Home, Bookmark, Library, Users, Tag, Settings } from 'lucide-react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { SalesScreen } from './src/screens/SalesScreen';
import { GameDetailScreen } from './src/screens/GameDetailScreen';
import { CompareScreen } from './src/screens/CompareScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';
import { api } from './src/services/api';
import { loadParentalSettings } from './src/services/storage';
import { Game, FamilyMember } from './src/data/mockData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TABS = ['Home', 'Wishlist', 'Sales', 'Library', 'Family', 'Profile'] as const;
type Tab = typeof TABS[number];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [comparingGameIds, setComparingGameIds] = useState<string[] | null>(null);

  const [games, setGames] = useState<Game[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabledPages, setDisabledPages] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const [g, m, a, parental] = await Promise.all([
      api.getGames(),
      api.getFamilyMembers(),
      api.getActivities(),
      loadParentalSettings()
    ]);
    setGames(g);
    setMembers(m);
    setActivities(a);
    setDisabledPages(parental.disabledPages);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateToGame = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedGameId(id);
  };

  const startComparison = (ids: string[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setComparingGameIds(ids);
  };

  const changeTab = (tab: Tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // Parent-disabled pages disappear from the bottom bar; Home and Profile
  // (which hosts the PIN-gated parent area) can never be disabled.
  const visibleTabs = TABS.filter((tab) => !disabledPages.includes(tab));

  const handleParentalChange = (disabled: string[]) => {
    setDisabledPages(disabled);
    if (disabled.includes(activeTab)) {
      setActiveTab('Home');
    }
  };

  const simulatePriceDrop = async () => {
    await api.updateGame('1091500', {
      price: '19,99€',
      discount: '-66%',
      statusState: 'under',
      reason: 'Zielpreis erreicht!'
    });

    await api.addActivity({
      id: `a${Date.now()}`,
      gameId: '1091500',
      title: 'PREISALARM!',
      desc: 'Cyberpunk 2077 ist auf 19,99€ gefallen!',
      time: 'Gerade eben',
      type: 'price'
    });

    await loadData();
    alert('Simuliert: Cyberpunk 2077 Preissturz!');
  };

  const renderScreen = () => {
    if (loading) return <View style={styles.loading}><Text>Lade VENT...</Text></View>;

    if (comparingGameIds) {
      return (
        <CompareScreen
          gameIds={comparingGameIds}
          onBack={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setComparingGameIds(null);
          }}
        />
      );
    }

    if (selectedGameId) {
      return (
        <GameDetailScreen
          gameId={selectedGameId}
          onBack={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSelectedGameId(null);
          }}
        />
      );
    }

    switch (disabledPages.includes(activeTab) ? 'Home' : activeTab) {
      case 'Home':
        return <HomeScreen onNavigateToGame={navigateToGame} onSimulateSync={simulatePriceDrop} games={games} />;
      case 'Wishlist':
        return (
          <WishlistScreen
            onNavigateToGame={navigateToGame}
            onCompare={startComparison}
            games={games.filter(g => g.tags.includes('Wishlist'))}
            onRefresh={loadData}
          />
        );
      case 'Sales':
        return (
          <SalesScreen
            wishlistGames={games.filter(g => g.tags.includes('Wishlist'))}
            onNavigateToGame={navigateToGame}
          />
        );
      case 'Library':
        return <LibraryScreen onNavigateToGame={navigateToGame} games={games.filter(g => g.tags.includes('Library'))} />;
      case 'Family':
        return <FamilyScreen members={members} />;
      case 'Profile':
        return <SettingsScreen onParentalChange={handleParentalChange} />;
      default:
        return <HomeScreen onNavigateToGame={navigateToGame} onSimulateSync={simulatePriceDrop} games={games} />;
    }
  };

  const getTabIcon = (tabName: Tab, isActive: boolean) => {
    const color = isActive ? colors.text.primary : colors.text.tertiary;
    const size = 22;
    switch (tabName) {
      case 'Home': return <Home size={size} color={color} strokeWidth={isActive ? 2.5 : 1.5} />;
      case 'Wishlist': return <Bookmark size={size} color={color} strokeWidth={isActive ? 2.5 : 1.5} />;
      case 'Sales': return <Tag size={size} color={color} strokeWidth={isActive ? 2.5 : 1.5} />;
      case 'Library': return <Library size={size} color={color} strokeWidth={isActive ? 2.5 : 1.5} />;
      case 'Family': return <Users size={size} color={color} strokeWidth={isActive ? 2.5 : 1.5} />;
      case 'Profile': return <Settings size={size} color={color} strokeWidth={isActive ? 2.5 : 1.5} />;
      default: return <Home size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}

      {!selectedGameId && !comparingGameIds && (
        <View style={styles.bottomBar}>
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.navItem}
                onPress={() => changeTab(tab)}
              >
                <View style={[styles.indicator, isActive && styles.indicatorActive]} />
                <View style={styles.iconWrapper}>
                  {getTabIcon(tab, isActive)}
                </View>
                <Text style={[
                  styles.navText,
                  isActive ? styles.navTextActive : styles.navTextInactive
                ] as any}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas.default },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomBar: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.stroke.subtle,
    paddingBottom: 20,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 0 },
  indicator: { width: 32, height: 3, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: 'transparent', marginBottom: 6 },
  indicatorActive: { backgroundColor: colors.accent.primary.default },
  iconWrapper: { marginBottom: 4 },
  navText: { ...typography.roles.meta.md, fontSize: 10, fontWeight: '600' as const },
  navTextActive: { color: colors.text.primary },
  navTextInactive: { color: colors.text.tertiary, fontWeight: '500' as const },
});
