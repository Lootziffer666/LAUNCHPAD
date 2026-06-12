import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';

type BadgeType = 'count' | 'discount' | 'new' | 'success';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'count', style }) => {
  const getContainerStyle = (): ViewStyle[] => {
    let baseStyle: ViewStyle = {};
    const sizeStyle = styles[`type_${type}`];

    switch (type) {
      case 'count':
        baseStyle = { backgroundColor: colors.surface.tertiary };
        break;
      case 'discount':
        baseStyle = { backgroundColor: colors.state.discount };
        break;
      case 'new':
        baseStyle = { backgroundColor: colors.accent.primary.default };
        break;
      case 'success':
        baseStyle = { backgroundColor: colors.semantic.success.default };
        break;
    }

    return [styles.container, sizeStyle, baseStyle, ...(style ? [style] : [])] as ViewStyle[];
  };

  const getTextStyle = () => {
    const isDarkBackground = type === 'discount' || type === 'new' || type === 'success';
    return [styles.text, { color: isDarkBackground ? colors.text.inverse : colors.text.primary }];
  };

  return (
    <View style={getContainerStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  type_count: {
    height: 20,
    paddingHorizontal: 8,
  },
  type_discount: {
    height: 22,
    paddingHorizontal: 8,
  },
  type_new: {
    height: 20,
    paddingHorizontal: 8,
  },
  type_success: {
    height: 20,
    paddingHorizontal: 8,
  },
  text: {
    ...typography.roles.meta.sm, // 12/16
  },
});
