import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Bell, ArrowLeft, Share2, Heart, Plus } from 'lucide-react-native';

export type IconButtonSize = 'S' | 'M' | 'L';

interface IconButtonProps {
  icon?: string;
  size?: IconButtonSize;
  onPress: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, size = 'M', onPress, children, style }) => {
  const getContainerStyle = () => {
    switch (size) {
      case 'S': return styles.containerS;
      case 'L': return styles.containerL;
      case 'M':
      default:
        return styles.containerM;
    }
  };

  const renderIcon = () => {
    const iconSize = size === 'S' ? 16 : size === 'L' ? 24 : 20;
    const color = colors.text.secondary;

    switch (icon) {
      case 'bell': return <Bell size={iconSize} color={color} />;
      case 'arrow-left': return <ArrowLeft size={iconSize} color={color} />;
      case 'share-2': return <Share2 size={iconSize} color={color} />;
      case 'heart': return <Heart size={iconSize} color={color} />;
      case 'plus': return <Plus size={iconSize} color={color} />;
      default: return <Text style={{ ...typography.roles.body.md, color } as any}>{icon}</Text>;
    }
  };

  return (
    <TouchableOpacity style={[getContainerStyle(), style]} onPress={onPress}>
      {children || renderIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  containerS: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerM: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerL: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
