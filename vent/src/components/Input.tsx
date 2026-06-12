import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Search } from 'lucide-react-native';

export type InputType = 'default' | 'localSearch' | 'globalSearch';
export type InputSize = 'S' | 'M' | 'L';

interface InputProps {
  type?: InputType;
  size?: InputSize;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  type = 'default',
  size = 'M',
  placeholder,
  value,
  onChangeText,
  containerStyle,
}) => {
  const isSearch = type === 'localSearch' || type === 'globalSearch';

  const getContainerStyle = () => {
    switch (size) {
      case 'S':
        return styles.containerS;
      case 'L':
        return styles.containerL;
      case 'M':
      default:
        return styles.containerM;
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case 'S':
        return typography.roles.body.sm;
      case 'M':
      case 'L':
      default:
        return typography.roles.body.md;
    }
  };

  return (
    <View style={[styles.container, getContainerStyle(), containerStyle]}>
      {isSearch && (
        <View style={styles.iconWrap}>
          <Search size={size === 'S' ? 16 : 20} color={colors.text.tertiary} />
        </View>
      )}
      <TextInput
        style={[styles.input, getTextStyle() as any, { color: colors.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
  },
  containerS: {
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  containerM: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  containerL: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
