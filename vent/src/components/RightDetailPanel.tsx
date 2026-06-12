import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { layout } from '../theme/spacing';

interface RightDetailPanelProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const RightDetailPanel: React.FC<RightDetailPanelProps> = ({
  header,
  footer,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Sticky Header */}
      {header && <View style={styles.header}>{header}</View>}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.contentWrap}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Sticky Footer Actions */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 400,
    backgroundColor: colors.surface.primary,
    borderLeftWidth: 1,
    borderColor: colors.stroke.subtle,
    ...shadows.lg,
    // Usually absolute positioned or flex item taking up side Space
    top: 0,
    bottom: 0,
    right: 0,
  },
  header: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: colors.stroke.subtle,
    backgroundColor: colors.surface.primary,
  },
  contentWrap: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 24, // Section Gap 24
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: colors.stroke.subtle,
    backgroundColor: colors.surface.primary,
  },
});
