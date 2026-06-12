import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { EntityRow } from '../components/EntityRow';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { Game } from '../data/mockData';

interface LibraryScreenProps {
  onNavigateToGame: (id: string) => void;
  games: Game[];
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ onNavigateToGame, games }) => {
  const [activeFilter, setActiveFilter] = useState('Alle');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    return games.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilter === 'Alle') return true;
      if (activeFilter === 'Installiert') return item.isInstalled;
      if (activeFilter === 'Shared') return item.isShared;
      if (activeFilter === 'Updates') return item.hasUpdate;
      return true;
    });
  }, [activeFilter, searchQuery, games]);

  const updateCount = games.filter((g) => g.hasUpdate).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle as any}>Library</Text>
          <Text style={styles.pageMeta as any}>
            {filteredData.length} von {games.length} Spielen
            {updateCount > 0 && ` • ${updateCount} Updates verfügbar`}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <Input
            type="localSearch"
            placeholder="Bibliothek durchsuchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ flex: 1 }}
          />
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['Alle', 'Installiert', 'Shared', 'Updates'].map((f) => (
              <Chip key={f} title={f} selected={activeFilter === f} onPress={() => setActiveFilter(f)} />
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredData.map((item) => (
            <EntityRow
              key={item.id}
              title={item.title}
              meta={`${item.meta} • ${item.isShared ? 'Shared by ' + item.sharedBy : 'Eigener Besitz'}`}
              coverUrl={item.coverUrl}
              variant="media"
              contextText={item.reason}
              onPressRow={() => onNavigateToGame(item.id)}
              priceStackProps={{
                currentPrice: item.isInstalled
                  ? item.hasUpdate
                    ? 'Update!'
                    : 'Installiert'
                  : 'Bereit',
                state: item.hasUpdate ? 'near' : 'under',
              }}
            />
          ))}

          {filteredData.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={typography.roles.body.md as any}>Keine Spiele in "{activeFilter}".</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  container: { flex: 1, paddingHorizontal: layout.screen.paddingX, paddingVertical: layout.screen.paddingY },
  header: { marginBottom: 20 },
  pageTitle: { ...typography.roles.display.md, color: colors.text.primary },
  pageMeta: { ...typography.roles.meta.md, color: colors.text.secondary },
  controlsRow: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  listContainer: { gap: 12, paddingBottom: 100 },
  emptyState: { padding: 40, alignItems: 'center' },
});
