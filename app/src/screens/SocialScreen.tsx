import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';

export function SocialScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>
          Snooze Battles, Accountability Groups, and Friend Challenges coming in Phase 2!
        </Text>
      </View>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>⚔️</Text>
          <View>
            <Text style={styles.featureTitle}>Snooze Battles</Text>
            <Text style={styles.featureDesc}>Challenge friends to a week-long competition</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🤝</Text>
          <View>
            <Text style={styles.featureTitle}>Accountability Groups</Text>
            <Text style={styles.featureDesc}>Get real-time snooze alerts from your group</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💸</Text>
          <View>
            <Text style={styles.featureTitle}>Friend Penalties</Text>
            <Text style={styles.featureDesc}>Your snooze money goes to your friend</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  featureList: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  featureIcon: { fontSize: 32 },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  featureDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
