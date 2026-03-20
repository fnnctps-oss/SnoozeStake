import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NeonBorderCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderWidth?: number;
  colors?: string[];
  borderRadius?: number;
}

export function NeonBorderCard({
  children,
  style,
  borderWidth = 2,
  colors = ['#FF6EC7', '#8B5CF6', '#06B6D4'],
  borderRadius = 24,
}: NeonBorderCardProps) {
  return (
    <View style={[styles.wrapper, { borderRadius }, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradientBorder, { borderRadius }]}
      >
        <View
          style={[
            styles.inner,
            {
              borderRadius: borderRadius - borderWidth,
              margin: borderWidth,
            },
          ]}
        >
          {children}
        </View>
      </LinearGradient>
      {/* Outer glow */}
      <View
        style={[
          styles.glow,
          {
            borderRadius,
            shadowColor: colors[0],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  gradientBorder: {
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: 'rgba(10, 5, 21, 0.92)',
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 0,
    zIndex: -1,
  },
});
