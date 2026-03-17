import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={['#0A0515', '#120A24', '#0D0D1A', '#050510']}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.gradient}
    >
      {/* Subtle purple glow overlay */}
      <View style={styles.glowOverlay} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Purple ambient glow at top-right
    borderTopRightRadius: 200,
    opacity: 0.3,
  },
});
