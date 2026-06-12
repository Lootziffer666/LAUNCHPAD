import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'S' | 'M' | 'L';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'M',
  disabled = false,
  style,
  containerStyle,
}) => {
  const getContainerStyle = ({ pressed }: { pressed: boolean }): ViewStyle[] => {
    let baseStyle: ViewStyle = {};
    const sizeStyle = styles[`size${size}`];

    switch (variant) {
      case 'primary':
        baseStyle = {
          backgroundColor: disabled
            ? colors.surface.secondary
            : pressed
            ? colors.accent.primary.hover
            : colors.accent.primary.default,
        };
        break;
      case 'secondary':
        baseStyle = {
          backgroundColor: disabled ? colors.surface.secondary : colors.surface.primary,
          borderWidth: 1,
          borderColor: disabled ? colors.stroke.subtle : colors.stroke.default,
        };
        break;
      case 'ghost':
        baseStyle = {
          backgroundColor: pressed ? colors.surface.tertiary : 'transparent',
        };
        break;
      case 'danger':
        baseStyle = {
          backgroundColor: disabled
            ? colors.surface.secondary
            : pressed
            ? colors.semantic.danger.soft
            : colors.semantic.danger.default,
        };
        break;
    }

    if (disabled) {
      baseStyle.opacity = 0.48;
    }

    return [styles.container, sizeStyle, baseStyle, style, containerStyle].filter(Boolean) as ViewStyle[];
  };

  const getTextStyle = (): TextStyle[] => {
    let textStyle: TextStyle = {};
    const fontStyle = styles[`text${size}`];

    switch (variant) {
      case 'primary':
        textStyle = { color: colors.text.inverse };
        break;
      case 'secondary':
        textStyle = { color: colors.text.primary };
        break;
      case 'ghost':
        textStyle = { color: colors.text.secondary };
        break;
      case 'danger':
        textStyle = { color: colors.text.inverse };
        break;
    }

    if (disabled && variant !== 'primary' && variant !== 'danger') {
      textStyle = { color: colors.text.secondary };
    }

    return [fontStyle, textStyle];
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => getContainerStyle({ pressed })}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeS: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.md, // 12
  },
  sizeM: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radii.md, // 12
  },
  sizeL: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14, // Spec defined 14
  },
  textS: {
    ...typography.roles.meta.md, // 13/18
  },
  textM: {
    ...typography.roles.body.strong, // 14/20
  },
  textL: {
    ...typography.roles.body.strong, // 14/20
  },
});
