import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../utils/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'purple' | 'accent';
}

export function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  const bgColor =
    variant === 'purple'
      ? 'rgba(108, 60, 225, 0.18)'
      : variant === 'accent'
        ? 'rgba(0, 230, 118, 0.08)'
        : colors.surface;

  const borderColor =
    variant === 'purple'
      ? 'rgba(139, 92, 246, 0.35)'
      : variant === 'accent'
        ? 'rgba(0, 230, 118, 0.15)'
        : colors.surfaceBorder;

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor }, style]}>
      {/* Top highlight for glass effect */}
      <View style={styles.highlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
});
