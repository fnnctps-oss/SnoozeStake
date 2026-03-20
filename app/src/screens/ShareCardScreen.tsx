import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { cacheDirectory, downloadAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { Icon } from '../components/Icon';

const API_BASE = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.snoozestake.com/api';

const GLASS_BG = 'rgba(108, 60, 225, 0.08)';
const GLASS_BORDER = 'rgba(108, 60, 225, 0.2)';

const CARD_TYPES = [
  { id: 'weekly', label: 'Weekly Report', iconName: 'bar-chart-outline', iconColor: '#3498DB', endpoint: '/share/weekly-card' },
  { id: 'streak', label: 'Streak Achievement', iconName: 'flame', iconColor: '#FF6B35', endpoint: '/share/streak-card' },
  { id: 'death', label: 'Streak Death', iconName: 'skull-outline', iconColor: '#E74C3C', endpoint: '/share/death-card' },
  { id: 'charity', label: 'Charity Impact', iconName: 'heart-outline', iconColor: '#E91E63', endpoint: '/share/charity-card' },
];

export function ShareCardScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('weekly');

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

  const selectedCard = CARD_TYPES.find((c) => c.id === selectedType) || CARD_TYPES[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Share Card</Text>
        <Text style={styles.subtitle}>Generate a beautiful card to share on social media</Text>

        {/* Card Type Selector - Pill Buttons */}
        <View style={styles.pillRow}>
          {CARD_TYPES.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.pillButton, selectedType === card.id && styles.pillButtonActive]}
              onPress={() => setSelectedType(card.id)}
            >
              <Icon
                name={card.iconName}
                size={16}
                color={selectedType === card.id ? colors.text : colors.textSecondary}
              />
              <Text style={[styles.pillText, selectedType === card.id && styles.pillTextActive]}>
                {card.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview Area */}
        <View style={styles.previewCard}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <View style={[styles.previewIconWrap, { backgroundColor: selectedCard.iconColor + '20' }]}>
                <Icon name={selectedCard.iconName} size={48} color={selectedCard.iconColor} />
              </View>
              <Text style={styles.previewPlaceholderTitle}>{selectedCard.label}</Text>
              <Text style={styles.previewPlaceholderDesc}>Tap generate to create your card</Text>
            </View>
          )}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateButtonWrap}
          onPress={() => generateCard(selectedCard)}
          disabled={loading !== null}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6C3CE1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Icon name="sparkles-outline" size={20} color={colors.text} />
                <Text style={styles.generateText}>Generate & Share</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="information-circle-outline" size={18} color={colors.primaryLight} />
          <Text style={styles.infoText}>
            Every card includes your referral code. When someone downloads
            SnoozeStake through your card, you both get $1 free!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050510',
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: 60 },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  pillButtonActive: {
    backgroundColor: 'rgba(108, 60, 225, 0.4)',
    borderColor: colors.primaryLight,
  },
  pillText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.text,
  },
  previewCard: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: borderRadius.xl,
    minHeight: 220,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 220,
  },
  previewIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  previewPlaceholderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  previewPlaceholderDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  generateButtonWrap: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md + 2,
    borderRadius: borderRadius.lg,
  },
  generateText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 20, flex: 1 },
});
