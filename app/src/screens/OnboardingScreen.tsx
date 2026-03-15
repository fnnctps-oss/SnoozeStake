import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { Icon } from '../components/Icon';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    iconName: 'alarm-outline',
    iconColor: '#6C3CE1',
    title: 'Set Your Alarms',
    description: 'Create alarms with real money on the line. Choose how much each snooze costs you.',
  },
  {
    id: '2',
    iconName: 'wallet-outline',
    iconColor: '#FF6B6B',
    title: 'Pay to Snooze',
    description: 'Every snooze deducts from your wallet. 75% goes to your savings, charity, or a friend. 25% platform fee.',
  },
  {
    id: '3',
    iconName: 'flame',
    iconColor: '#FF6B35',
    title: 'Build Streaks & Compete',
    description: 'Track your no-snooze streak, challenge friends to battles, and share your progress!',
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '20' }]}>
              <Icon name={item.iconName} size={64} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex < SLIDES.length - 1 ? 'Next' : 'Get Started'}
        </Text>
        <Icon
          name={currentIndex < SLIDES.length - 1 ? 'arrow-forward' : 'checkmark'}
          size={20}
          color={colors.text}
        />
      </TouchableOpacity>

      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skip} onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 60,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 30,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
