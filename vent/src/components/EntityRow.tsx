import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';
import { shadows } from '../theme/spacing';
import { PriceStack, PriceStackProps } from './PriceStack';
import { Check } from 'lucide-react-native';

export type EntityRowVariant = 'compact' | 'standard' | 'media';

export interface EntityRowProps {
  title: string;
  meta: string;
  contextText?: string;
  coverUrl?: string;
  variant?: EntityRowVariant;
  selected?: boolean;
  onPressRow?: () => void;
  onPressAction?: () => void;
  priceStackProps?: PriceStackProps;
}

export const EntityRow: React.FC<EntityRowProps> = ({
  title,
  meta,
  contextText,
  coverUrl,
  variant = 'standard',
  selected = false,
  onPressRow,
  onPressAction,
  priceStackProps,
}) => {
  const isMedia = variant === 'media';

  const renderLeft = () => {
    if (!isMedia || !coverUrl) return null;
    return (
      <View style={styles.mediaContainer}>
        <Image source={{ uri: coverUrl }} style={styles.coverImage} />
        {selected && (
          <View style={styles.selectedOverlay}>
            <Check size={20} color={colors.canvas.default} strokeWidth={3} />
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.titleMetaGroup}>
        <Text style={typography.roles.card.title.sm as any} numberOfLines={1}>
          {title}
        </Text>
        <Text style={typography.roles.meta.md as any} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {contextText && (
        <Text style={[typography.roles.body.sm, styles.contextText] as any} numberOfLines={1}>
          {contextText}
        </Text>
      )}
    </View>
  );

  const renderRight = () => {
    if (!priceStackProps) return null;
    return (
      <View style={styles.rightContainer}>
        <PriceStack {...priceStackProps} size={isMedia ? 'standard' : 'compact'} />
      </View>
    );
  };

  const renderActionZone = () => {
    if (!onPressAction) return null;
    return (
      <TouchableOpacity style={styles.actionZone} onPress={onPressAction}>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Check size={14} color={colors.canvas.default} strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    );
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'compact':
        return styles.containerCompact;
      case 'media':
        return styles.containerMedia;
      case 'standard':
      default:
        return styles.containerStandard;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        getContainerStyle(),
        selected && styles.containerSelected,
      ]}
      onPress={onPressRow}
      activeOpacity={0.7}
    >
      {renderLeft()}
      {renderContent()}
      {renderRight()}
      {renderActionZone()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md, // 12
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    ...shadows.sm,
  },
  containerCompact: {
    padding: 12,
    gap: 12,
  },
  containerStandard: {
    padding: 16,
    gap: 16,
  },
  containerMedia: {
    padding: 8,
    paddingRight: 16,
    gap: 12,
  },
  containerSelected: {
    borderColor: colors.accent.primary.default,
    backgroundColor: colors.surface.secondary,
  },
  mediaContainer: {
    width: 106,
    height: 60,
    borderRadius: radii.sm, // 10
    overflow: 'hidden',
    backgroundColor: colors.surface.tertiary,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(198, 90, 70, 0.8)', // Primary Accent with opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  titleMetaGroup: {
    gap: 2,
  },
  contextText: {
    color: colors.text.secondary,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionZone: {
    marginLeft: 8,
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.stroke.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.primary.default,
    borderColor: colors.accent.primary.default,
  },
});
