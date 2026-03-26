import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { cacheDirectory, downloadAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { Icon } from '../components/Icon';

const API_BASE = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.snoozestake.com/api';

const CARD_TYPES = [
  { id: 'weekly', label: 'Weekly Report', iconName: 'bar-chart-outline', iconColor: '#3498DB', endpoint: '/share/weekly-card' },
  { id: 'streak', label: 'Streak Achievement', iconName: 'flame', iconColor: '#FF6B35', endpoint: '/share/streak-card' },
  { id: 'death', label: 'Streak Death', iconName: 'skull-outline', iconColor: '#E74C3C', endpoint: '/share/death-card' },
  { id: 'charity', label: 'Charity Impact', iconName: 'heart-outline', iconColor: '#E91E63', endpoint: '/share/charity-card' },
];

export function ShareCardScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const generateCard = async (cardType: typeof CARD_TYPES[0]) => {
    setLoading(cardType.id);
    try {
      const fileUri = `${cacheDirectory}snoozestake-${cardType.id}.png`;

      // Bug fix: removed wrong Content-Type request header — this is a file download,
      // sending 'application/json' as a request header can cause server to reject it
      const result = await downloadAsync(
        `${API_BASE}${cardType.endpoint}`,
        fileUri
      );

      setPreviewUri(result.uri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'image/png',
          dialogTitle: `Share your ${cardType.label}`,
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to generate card. Make sure you have activity to share.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Progress</Text>
      <Text style={styles.subtitle}>Generate a beautiful card to share on social media</Text>

      <View style={styles.cardGrid}>
        {CARD_TYPES.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.cardOption}
            onPress={() => generateCard(card)}
            disabled={loading !== null}
          >
            {loading === card.id ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : (
              <>
                <View style={[styles.cardIconWrap, { backgroundColor: card.iconColor + '20' }]}>
                  <Icon name={card.iconName} size={32} color={card.iconColor} />
                </View>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {previewUri && (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Last Generated</Text>
          <Image
            source={{ uri: previewUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={styles.infoBox}>
        <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          Every card includes your referral code. When someone downloads
          SnoozeStake through your card, you both get $1 free!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardOption: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    gap: spacing.sm,
  },
  cardIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600', textAlign: 'center' },
  previewSection: { marginTop: spacing.xl },
  previewTitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.sm },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 20, flex: 1 },
});
