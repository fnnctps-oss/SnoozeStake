import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowAvatarProps {
  name?: string;
  size?: number;
  glowColors?: string[];
}

export function GlowAvatar({
  name = '?',
  size = 120,
  glowColors = ['#8B5CF6', '#06B6D4', '#8B5CF6'],
}: GlowAvatarProps) {
  const borderWidth = size * 0.04;
  const innerSize = size - borderWidth * 2;
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Glow shadow */}
      <View
        style={[
          styles.glowShadow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      {/* Gradient ring */}
      <LinearGradient
        colors={glowColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* Inner circle */}
        <View
          style={[
            styles.inner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.35 }]}>
            {initial}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowShadow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 10,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: '#1A1030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
