import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';

type ChipType = 'filter' | 'state' | 'semantic' | 'action';
type ChipSize = 'S' | 'M';

interface ChipProps {
  title: string;
  type?: ChipType;
  size?: ChipSize;
  selected?: boolean;
  onPress?: () => void;
  stateColorKey?: 'success' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  title,
  type = 'filter',
  size = 'M',
  selected = false,
  onPress,
  stateColorKey = 'info',
  style,
}) => {
  const isPressable = !!onPress;

  const getContainerStyle = ({ pressed }: { pressed?: boolean }): ViewStyle[] => {
    let baseStyle: ViewStyle = {};
    const sizeStyle = type === 'filter' ? styles[`filterSize${size}`] : styles[`stateSize${size}`];

    switch (type) {
      case 'filter':
        if (selected) {
          baseStyle = {
            backgroundColor: colors.accent.primary.soft,
            borderWidth: 1,
            borderColor: colors.accent.primary.default,
          };
        } else {
          baseStyle = {
            backgroundColor: colors.surface.secondary,
            borderWidth: 1,
            borderColor: colors.stroke.default,
          };
        }
        break;
      case 'state':
        baseStyle = {
          backgroundColor: selected ? (colors.semantic as any)[stateColorKey].default : (colors.semantic as any)[stateColorKey].soft,
        };
        break;
      case 'semantic':
        baseStyle = {
          backgroundColor: selected ? (colors.semantic as any)[stateColorKey].default : colors.surface.tertiary,
        };
        break;
      case 'action':
        baseStyle = {
          backgroundColor: pressed ? colors.surface.secondary : colors.surface.primary,
          borderWidth: 1,
          borderColor: colors.stroke.default,
        };
        break;
    }

    return [styles.container, sizeStyle, baseStyle, ...(style ? [style] : [])] as ViewStyle[];
  };

  const getTextStyle = (): TextStyle[] => {
    let textStyle: TextStyle = {};
    const fontStyle = type === 'filter' || size === 'M' || type === 'action' ? typography.roles.meta.md : typography.roles.meta.sm;

    switch (type) {
      case 'filter':
        textStyle = { color: selected ? colors.accent.primary.default : colors.text.secondary };
        break;
      case 'state':
      case 'semantic':
        textStyle = { color: selected ? colors.text.inverse : colors.text.primary };
        break;
      case 'action':
        textStyle = { color: colors.text.primary };
        break;
    }

    return [fontStyle, textStyle];
  };

  const content = <Text style={getTextStyle()}>{title}</Text>;

  if (isPressable) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => getContainerStyle({ pressed })}>
        {content}
      </Pressable>
    );
  }

  return <View style={getContainerStyle({})}>{content}</View>;
};

import { View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSizeS: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  filterSizeM: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  stateSizeS: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: radii.md, // 12
  },
  stateSizeM: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radii.md, // 12
  },
});
