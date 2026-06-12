import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/spacing';

interface ActivityItem {
  id: string;
  gameId?: string;
  title: string;
  desc: string;
  time: string;
  type: string;
}

interface ActivityScreenProps {
  onNavigateToGame: (id: string) => void;
  activities: ActivityItem[];
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ onNavigateToGame, activities }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle as any}>Activity</Text>
          <Text style={styles.pageMeta as any}>Alle Benachrichtigungen & Events</Text>
        </View>

        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {activities.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.activityRow}
              onPress={() => item.gameId && onNavigateToGame(item.gameId)}
              disabled={!item.gameId}
            >
              <View style={styles.dotContainer}>
                <View style={[styles.dot, { backgroundColor: item.type === 'price' ? colors.accent.primary.default : colors.accent.secondary.default }]} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={typography.roles.card.title.md as any}>{item.title}</Text>
                  <Text style={typography.roles.meta.md as any}>{item.time}</Text>
                </View>
                <Text style={[typography.roles.body.md, { color: colors.text.secondary }] as any}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {activities.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={typography.roles.body.md as any}>Keine Aktivitäten vorhanden.</Text>
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
  header: { marginBottom: 24 },
  pageTitle: { ...typography.roles.display.md, color: colors.text.primary },
  pageMeta: { ...typography.roles.meta.md, color: colors.text.secondary },
  listContainer: { gap: 1 },
  activityRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke.subtle,
    gap: 16,
  },
  dotContainer: { paddingTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyState: { padding: 40, alignItems: 'center' },
});
