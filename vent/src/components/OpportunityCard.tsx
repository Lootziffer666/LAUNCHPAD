import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';
import { shadows } from '../theme/spacing';

export type OpportunityCardSize = 'S' | 'M';

interface OpportunityCardProps {
  title: string;
  reason: string;
  value?: string;
  meta?: string;
  size?: OpportunityCardSize;
  onPress?: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  title,
  reason,
  value,
  meta,
  size = 'M',
  onPress,
}) => {
  const isSmall = size === 'S';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isSmall ? styles.containerS : styles.containerM,
        pressed && styles.containerPressed,
      ] as any}
    >
      <View style={styles.topSection}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {value && <Text style={styles.valueText}>{value}</Text>}
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.reasonText} numberOfLines={3}>
          {reason}
        </Text>
        {meta && <Text style={styles.metaText}>{meta}</Text>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.lg, // 18
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    ...shadows.sm,
    justifyContent: 'space-between',
  },
  containerS: {
    minHeight: 120,
    padding: 16,
    gap: 12,
  },
  containerM: {
    minHeight: 156,
    padding: 20,
    gap: 12,
  },
  containerHovered: {
    borderColor: colors.stroke.default,
    ...shadows.md,
  },
  containerPressed: {
    backgroundColor: colors.surface.secondary,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  bottomSection: {
    gap: 4,
  },
  title: {
    ...typography.roles.card.title.md,
    color: colors.text.primary,
    flex: 1,
  },
  valueText: {
    ...typography.roles.numeric.sm,
    color: colors.text.primary,
  },
  reasonText: {
    ...typography.roles.body.md,
    color: colors.text.secondary,
  },
  metaText: {
    ...typography.roles.meta.md,
    color: colors.text.tertiary,
  },
});
