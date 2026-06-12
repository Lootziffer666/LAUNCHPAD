import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface StatusBadgeGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const StatusBadgeGroup: React.FC<StatusBadgeGroupProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6, // Typically small gap between badges
  },
});
