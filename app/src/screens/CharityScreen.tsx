import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { charityApi } from '../services/api';

const CATEGORY_EMOJIS: Record<string, string> = {
  'Clean Water': '💧',
  'Education': '📚',
  'Environment': '🌍',
  'Health': '🏥',
  'Hunger': '🍽️',
  'Animals': '🐾',
  'Housing': '🏠',
};

export function CharityScreen() {
  const [charities, setCharities] = useState<any[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [{ charities: data }, impactData] = await Promise.all([
        charityApi.list(),
        charityApi.impact().catch(() => null),
      ]);
      setCharities(data);
      if (impactData) setImpact(impactData);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Impact Summary */}
      {impact && (
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Your Charity Impact</Text>
          <Text style={styles.impactAmount}>
            ${impact.totalDonated?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.impactSubtext}>
            donated from {impact.totalDonations || 0} snoozes
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Charities</Text>
      <FlatList
        data={charities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.charityCard}>
            <Text style={styles.charityEmoji}>
              {CATEGORY_EMOJIS[item.category] || '💝'}
            </Text>
            <View style={styles.charityInfo}>
              <Text style={styles.charityName}>{item.name}</Text>
              <Text style={styles.charityCategory}>{item.category}</Text>
              <Text style={styles.charityDesc} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No charities available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  impactCard: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  impactTitle: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
  impactAmount: { fontSize: fontSize.hero, fontWeight: '800', color: colors.accent, marginTop: spacing.xs },
  impactSubtext: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  list: { gap: spacing.sm, paddingBottom: 40 },
  charityCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  charityEmoji: { fontSize: 36 },
  charityInfo: { flex: 1 },
  charityName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  charityCategory: { fontSize: fontSize.xs, color: colors.primaryLight, marginTop: 2 },
  charityDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
