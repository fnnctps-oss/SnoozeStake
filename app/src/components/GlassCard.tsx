import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { borderRadius, spacing } from '../utils/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'purple' | 'accent';
  intensity?: number;
}

export function GlassCard({ children, style, variant = 'default', intensity = 20 }: GlassCardProps) {
  const overlayColor =
    variant === 'purple'
      ? 'rgba(255,255,255,0.08)'
      : variant === 'accent'
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.08)';

  return (
    <View style={[styles.card, style, styles.forceOverflow]}>
      {/* Real backdrop blur — the core Apple glass effect */}
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      {/* White frosted overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
      {/* Top gloss highlight line */}
      <View style={styles.gloss} />
      {/* Children render directly here so gap/alignItems/flex work */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    padding: spacing.md,
  },
  // Always force overflow hidden so blur clips to border radius
  forceOverflow: {
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
    zIndex: 1,
  },
});
