import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';
import { shadows } from '../theme/spacing';
import { IconButton } from './IconButton';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: React.ReactNode; // e.g. <IconButton/>, <Button/>
  style?: ViewStyle;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  actions,
  style,
}) => {
  if (selectedCount === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.countBlock}>
        <Text style={styles.countText}>{selectedCount}</Text>
        <IconButton size="S" onPress={onClearSelection}>
          {/* Close / clear selection placeholder icon */}
          <Text style={{ ...typography.roles.meta.md, color: colors.text.secondary }}>✕</Text>
        </IconButton>
      </View>

      <View style={styles.actionsContainer}>
        {actions}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radii.lg, // 18
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.stroke.default,
    ...shadows.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBlock: {
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    ...typography.roles.numeric.md,
    color: colors.text.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Actions Gap 8
  },
});
