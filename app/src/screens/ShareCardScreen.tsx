import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import { cacheDirectory, downloadAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';

const API_BASE = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.snoozestake.com/api';

const CARD_TYPES = [
  { id: 'weekly', label: 'Weekly Report', emoji: '📊', endpoint: '/share/weekly-card' },
  { id: 'streak', label: 'Streak Achievement', emoji: '🔥', endpoint: '/share/streak-card' },
  { id: 'death', label: 'Streak Death', emoji: '⚰️', endpoint: '/share/death-card' },
  { id: 'charity', label: 'Charity Impact', emoji: '💝', endpoint: '/share/charity-card' },
];

export function ShareCardScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const generateCard = async (cardType: typeof CARD_TYPES[0]) => {
    setLoading(cardType.id);
    try {
      const fileUri = `${cacheDirectory}snoozestake-${cardType.id}.png`;

      const result = await downloadAsync(
        `${API_BASE}${cardType.endpoint}`,
        fileUri,
        { headers: { 'Content-Type': 'application/json' } }
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
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
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
    minHeight: 120,
  },
  cardEmoji: { fontSize: 40, marginBottom: spacing.sm },
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
  },
  infoText: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 20 },
});
