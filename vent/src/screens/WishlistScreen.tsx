import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, AlertButton } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';
import { EntityRow } from '../components/EntityRow';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { BulkActionBar } from '../components/BulkActionBar';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { Game } from '../data/mockData';

interface WishlistScreenProps {
  onNavigateToGame: (id: string) => void;
  onCompare: (ids: string[]) => void;
  // In a real app, we'd use a context/store. For now, we pass down or use local state + api.
  games: Game[];
  onRefresh: () => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({ onNavigateToGame, onCompare, games, onRefresh }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('Alle');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter-Logik für "Smart Sets"
  const filteredData = useMemo(() => {
    return games.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'Alle') return true;
      return item.tags.includes(activeTab);
    });
  }, [activeTab, searchQuery, games]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkTagChange = () => {
    const tags = ['Hot', 'Angebote', 'Erreichte Ziele', 'Family Overlap', 'Später'];

    const buttons: AlertButton[] = tags.map(tag => ({
      text: tag,
      onPress: async () => {
        await api.bulkUpdateTags(Array.from(selectedIds), tag, 'add');
        clearSelection();
        onRefresh(); // Trigger refresh in parent
      }
    }));
    buttons.push({ text: "Abbrechen", style: "cancel" });

    Alert.alert(
      "Tag ändern",
      "Wähle einen neuen Tag für die ausgewählten Titel:",
      buttons
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.pageTitle as any}>Wishlist</Text>
            <Text style={styles.pageMeta as any}>
              {filteredData.length} von {games.length} Titeln • {activeTab}
            </Text>
          </View>

          <View style={styles.controlsRow}>
            <Input
              type="localSearch"
              placeholder="Titel suchen..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={{ width: 220 }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {['Alle', 'Angebote', 'Erreichte Ziele', 'Family Overlap', 'Hot', 'Später'].map(tab => (
                <Chip
                  key={tab}
                  title={tab}
                  selected={activeTab === tab}
                  onPress={() => setActiveTab(tab)}
                />
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
            {filteredData.map(item => (
              <EntityRow
                key={item.id}
                title={item.title}
                meta={item.meta}
                coverUrl={item.coverUrl}
                variant="media"
                contextText={item.reason}
                selected={selectedIds.has(item.id)}
                onPressRow={() => {
                  if (selectedIds.size > 0) {
                    toggleSelection(item.id);
                  } else {
                    onNavigateToGame(item.id);
                  }
                }}
                onPressAction={() => toggleSelection(item.id)}
                priceStackProps={{
                  currentPrice: item.price,
                  targetPrice: item.targetPrice,
                  discountBadge: item.discount as any,
                  state: item.statusState,
                }}
              />
            ))}

            {filteredData.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={typography.roles.body.md as any}>Keine Titel in "{activeTab}" gefunden.</Text>
                <Button
                  title="Filter zurücksetzen"
                  variant="secondary"
                  size="S"
                  onPress={() => { setActiveTab('Alle'); setSearchQuery(''); }}
                  containerStyle={{ marginTop: 12 }}
                />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <View style={styles.bulkActionBarWrap}>
            <BulkActionBar
              selectedCount={selectedIds.size}
              onClearSelection={clearSelection}
              actions={
                <>
                  <Button
                    title="Vergleichen"
                    variant="primary"
                    onPress={() => onCompare(Array.from(selectedIds))}
                    size="S"
                  />
                  <Button title="Tag ändern" variant="secondary" onPress={handleBulkTagChange} size="S" />
                  <Button title="Entfernen" variant="danger" onPress={() => {
                    Alert.alert("Entfernen", `${selectedIds.size} Titel von der Wunschliste entfernen?`, [
                      { text: "Abbrechen", style: "cancel" },
                      { text: "Entfernen", style: "destructive", onPress: clearSelection }
                    ]);
                  }} size="S" />
                </>
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas.default },
  container: { flex: 1, flexDirection: 'row' },
  mainContent: { flex: 1, paddingHorizontal: layout.screen.paddingX, paddingVertical: layout.screen.paddingY },
  header: { marginBottom: 24 },
  pageTitle: { ...typography.roles.display.md, color: colors.text.primary, marginBottom: 4 },
  pageMeta: { ...typography.roles.meta.md, color: colors.text.secondary },
  controlsRow: { flexDirection: 'row', gap: 12, marginBottom: 24, alignItems: 'center' },
  filterScroll: { gap: 8, alignItems: 'center', paddingRight: 32 },
  listContainer: { gap: 12, paddingBottom: 120 },
  bulkActionBarWrap: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    left: 16,
    right: 16,
    zIndex: 100
  },
  emptyState: { padding: 40, alignItems: 'center' },
});
