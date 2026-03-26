import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      {/* Deep dark base */}
      <LinearGradient
        colors={['#0A0515', '#0D0820', '#080510', '#000000']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Top-right purple radial glow */}
      <View style={styles.glowTopRight} />
      {/* Bottom-left violet glow */}
      <View style={styles.glowBottomLeft} />
      {/* Subtle center bloom */}
      <View style={styles.glowCenter} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(108, 60, 225, 0.18)',
    // Soft falloff via opacity only — RN doesn't support radial gradient natively
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  glowCenter: {
    position: 'absolute',
    top: '35%',
    left: '20%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(88, 28, 220, 0.07)',
  },
});
