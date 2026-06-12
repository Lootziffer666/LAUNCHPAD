import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Badge } from './Badge';

export type PriceStackSize = 'compact' | 'standard' | 'large';
export type PriceStackState = 'under' | 'near' | 'above';

export interface PriceStackProps {
  currentPrice: string;
  targetPrice?: string;
  discountBadge?: string;
  state?: PriceStackState;
  size?: PriceStackSize;
}

export const PriceStack: React.FC<PriceStackProps> = ({
  currentPrice,
  targetPrice,
  discountBadge,
  state,
  size = 'standard',
}) => {
  const getContainerStyle = () => {
    switch (size) {
      case 'compact':
        return styles.containerCompact;
      case 'standard':
        return styles.containerStandard;
      case 'large':
        return styles.containerLarge;
    }
  };

  const getCurrentPriceStyle = () => {
    switch (size) {
      case 'compact':
        return typography.roles.numeric.sm;
      case 'standard':
        return typography.roles.numeric.md;
      case 'large':
        return typography.roles.numeric.lg;
    }
  };

  const getTargetPriceStyle = () => {
    switch (size) {
      case 'compact':
      case 'standard':
        return typography.roles.meta.md;
      case 'large':
        return typography.roles.body.md;
    }
  };

  const getStateLabelStyle = () => {
    switch (size) {
      case 'compact':
        return typography.roles.meta.sm;
      case 'standard':
      case 'large':
        return typography.roles.meta.md;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'under':
        return colors.state.target.hit;
      case 'near':
        return colors.state.target.near;
      case 'above':
        return colors.state.target.miss;
      default:
        return colors.text.tertiary;
    }
  };

  const getStateLabelText = () => {
    switch (state) {
      case 'under':
        return 'erreicht';
      case 'near':
        return 'knapp dran';
      case 'above':
        return 'drüber';
      default:
        return '';
    }
  };

  const renderTopRow = () => (
    <View style={styles.row}>
      <Text style={[getCurrentPriceStyle(), { color: colors.text.primary }]}>{currentPrice}</Text>
      {discountBadge && (
        <View style={size === 'compact' ? styles.badgeSpaceCompact : styles.badgeSpaceStandard}>
          {/* Badge height needs to be overridden via style in real implementation or adjusted to 24 for large */}
          <Badge type="discount" label={discountBadge} />
        </View>
      )}
    </View>
  );

  const renderBottomRow = () => {
    if (!targetPrice) return null;
    return (
      <View style={styles.row}>
        <Text style={[getTargetPriceStyle(), { color: colors.text.secondary }]}>{targetPrice}</Text>
        {state && (
          <Text style={[getStateLabelStyle(), { color: getStateColor(), marginLeft: 6 }]}>
            {getStateLabelText()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={getContainerStyle()}>
      {renderTopRow()}
      {renderBottomRow()}
    </View>
  );
};

const styles = StyleSheet.create({
  containerCompact: {
    gap: 4,
  },
  containerStandard: {
    gap: 6,
  },
  containerLarge: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  badgeSpaceCompact: {
    marginLeft: 6,
  },
  badgeSpaceStandard: {
    marginLeft: 8,
  },
});
