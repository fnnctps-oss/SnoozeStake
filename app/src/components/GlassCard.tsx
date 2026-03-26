import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '../utils/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'purple' | 'accent';
}

export function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  const bgColor =
    variant === 'purple'
      ? 'rgba(255, 255, 255, 0.11)'
      : variant === 'accent'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.08)';

  const borderColor = 'rgba(255, 255, 255, 0.10)';

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor }, style]}>
      {/* Top gloss highlight — Apple liquid glass look */}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
