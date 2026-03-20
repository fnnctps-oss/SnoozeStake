import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { snoozeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';

// Map tone IDs to bundled assets
const TONE_FILES: Record<string, any> = {
  classic: require('../../assets/tones/classic.wav'),
  gentle: require('../../assets/tones/gentle.mp3'),
  rooster: require('../../assets/tones/rooster.mp3'),
  digital: require('../../assets/tones/digital.wav'),
  birds: require('../../assets/tones/birds.mp3'),
  ocean: require('../../assets/tones/ocean.mp3'),
  chime: require('../../assets/tones/chime.wav'),
  buzzer: require('../../assets/tones/buzzer.wav'),
};

// --- Broken Glass Visual Component ---
function BrokenGlassVisual({ penalty }: { penalty: number }) {
  const shards = [
    // Large shards
    { w: 32, h: 48, rot: '-25deg', x: -60, y: -30, colors: ['#FF3B30', '#8B5CF6'] as const },
    { w: 28, h: 42, rot: '35deg', x: 55, y: -25, colors: ['#8B5CF6', '#FF3B30'] as const },
    { w: 24, h: 36, rot: '-55deg', x: -45, y: 20, colors: ['#FF3B30', 'transparent'] as const },
    { w: 26, h: 40, rot: '50deg', x: 50, y: 25, colors: ['#8B5CF6', 'transparent'] as const },
    // Medium shards
    { w: 18, h: 28, rot: '15deg', x: -30, y: -50, colors: ['#FF3B30', '#6B21A8'] as const },
    { w: 16, h: 24, rot: '-40deg', x: 35, y: -45, colors: ['#6B21A8', '#FF3B30'] as const },
    { w: 20, h: 30, rot: '65deg', x: -70, y: 5, colors: ['#FF3B30', '#4C1D95'] as const },
    { w: 14, h: 22, rot: '-70deg', x: 70, y: 0, colors: ['#4C1D95', '#FF3B30'] as const },
    // Small shards - scattered further
    { w: 10, h: 16, rot: '20deg', x: -80, y: -15, colors: ['#FF3B30', 'transparent'] as const },
    { w: 8, h: 14, rot: '-30deg', x: 80, y: -10, colors: ['#8B5CF6', 'transparent'] as const },
    { w: 12, h: 18, rot: '45deg', x: -20, y: -55, colors: ['#FF3B30', '#8B5CF6'] as const },
    { w: 10, h: 14, rot: '-60deg', x: 25, y: 50, colors: ['#8B5CF6', '#FF3B30'] as const },
    // Tiny accent shards
    { w: 6, h: 10, rot: '70deg', x: -50, y: -45, colors: ['#FF6B6B', 'transparent'] as const },
    { w: 7, h: 12, rot: '-15deg', x: 60, y: 40, colors: ['#A78BFA', 'transparent'] as const },
    { w: 8, h: 10, rot: '30deg', x: 0, y: -60, colors: ['#FF3B30', 'transparent'] as const },
  ];

  return (
    <View style={glassStyles.container}>
      {/* Central bowl / broken orb */}
      <View style={glassStyles.bowlOuter}>
        <LinearGradient
          colors={['#FF3B30', '#8B5CF6', '#4C1D95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={glassStyles.bowlGradient}
        >
          {/* Crack lines */}
          <View style={glassStyles.crackLine1} />
          <View style={glassStyles.crackLine2} />
          <View style={glassStyles.crackLine3} />
        </LinearGradient>
      </View>

      {/* Glass shards flying outward */}
      {shards.map((shard, i) => (
        <View
          key={i}
          style={[
            glassStyles.shardWrapper,
            {
              transform: [
                { translateX: shard.x },
                { translateY: shard.y },
                { rotate: shard.rot },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[...shard.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              glassStyles.shard,
              {
                width: shard.w,
                height: shard.h,
                opacity: shard.w > 20 ? 0.8 : 0.5,
              },
            ]}
          />
        </View>
      ))}

      {/* Glass card overlay */}
      <View style={glassStyles.card}>
        <View style={glassStyles.cardInner}>
          <Text style={glassStyles.failedLabel}>MISSION FAILED</Text>
          <Text style={glassStyles.failedTitle}>You Snoozed</Text>
          <View style={glassStyles.chargedRow}>
            <Text style={glassStyles.chargedAmount}>-${penalty.toFixed(2)}</Text>
            <Text style={glassStyles.chargedLabel}>Charged</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const glassStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginVertical: 8,
  },
  bowlOuter: {
    position: 'absolute',
    width: 90,
    height: 45,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    overflow: 'hidden',
    opacity: 0.6,
  },
  bowlGradient: {
    flex: 1,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
  },
  crackLine1: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
    left: 30,
    top: 2,
    transform: [{ rotate: '15deg' }],
  },
  crackLine2: {
    position: 'absolute',
    width: 1.5,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    left: 50,
    top: 5,
    transform: [{ rotate: '-20deg' }],
  },
  crackLine3: {
    position: 'absolute',
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    left: 42,
    top: 0,
    transform: [{ rotate: '5deg' }],
  },
  shardWrapper: {
    position: 'absolute',
  },
  shard: {
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  cardInner: {
    alignItems: 'center',
  },
  failedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 3,
    marginBottom: 2,
  },
  failedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  chargedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  chargedAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF3B30',
  },
  chargedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,59,48,0.7)',
  },
});

// --- Main Screen ---

export function AlarmRingingScreen({ navigation, route }: any) {
  const alarm = route.params?.alarm;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snoozeCount, setSnoozeCount] = useState(route.params?.snoozeCount || 0);
  const [totalPenalty, setTotalPenalty] = useState(route.params?.totalPenalty || 0);
  const [loading, setLoading] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);
  const playerRef = useRef<AudioPlayer | null>(null);

  // Calculate next snooze cost
  const basePenalty = Number(alarm?.snoozeBasePenalty || 1);
  const nextCost = alarm?.useEscalatingPenalty
    ? basePenalty * Math.pow(2, snoozeCount)
    : basePenalty;

  // Play alarm tone and vibrate
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    Vibration.vibrate([500, 500], true);

    // Start alarm sound
    const startSound = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });

        const toneId = alarm?.soundUrl || 'classic';
        let source: any;

        if (TONE_FILES[toneId]) {
          source = TONE_FILES[toneId];
        } else if (toneId?.startsWith('file://') || toneId?.startsWith('content://')) {
          source = { uri: toneId };
        } else {
          source = TONE_FILES.classic;
        }

        const player = createAudioPlayer(source);
        player.loop = true;
        player.volume = 1.0;
        playerRef.current = player;
        player.play();
      } catch (err) {
        console.warn('Error playing alarm sound:', err);
      }
    };

    startSound();

    return () => {
      clearInterval(timer);
      Vibration.cancel();
      if (playerRef.current) {
        playerRef.current.release();
        playerRef.current = null;
      }
    };
  }, []);

  const stopSound = () => {
    Vibration.cancel();
    if (playerRef.current) {
      try {
        playerRef.current.release();
      } catch {}
      playerRef.current = null;
    }
  };

  const handleSnooze = async () => {
    if (!alarm) return;
    if (snoozeCount >= (alarm.maxSnoozes || 5)) {
      Alert.alert('Max Snoozes', 'You must wake up now!');
      return;
    }

    setLoading(true);
    try {
      const result = await snoozeApi.snooze(alarm.id, snoozeCount + 1);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const newSnoozeCount = snoozeCount + 1;
      const penaltyAmount = Number(result.snoozeEvent.penaltyAmount);
      setSnoozeCount(newSnoozeCount);
      setTotalPenalty((p: number) => p + penaltyAmount);
      updateUser({ walletBalance: Number(result.walletBalance) });

      // Schedule the alarm to fire again after snooze duration
      const snoozeMins = alarm.snoozeDurationMinutes || 5;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Alarm — ${alarm.label || 'Wake Up!'}`,
          body: `Snoozed ${newSnoozeCount}x — $${(totalPenalty + penaltyAmount).toFixed(2)} spent. Wake up!`,
          sound: true,
          data: {
            alarmId: alarm.id,
            type: 'alarm',
            snoozeCount: newSnoozeCount,
            totalPenalty: totalPenalty + penaltyAmount,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: snoozeMins * 60,
          repeats: false,
        },
      });

      stopSound();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Cannot Snooze', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    stopSound();

    if (alarm?.wakeUpTaskType && alarm.wakeUpTaskType !== 'NONE') {
      navigation.replace('WakeUpTask', {
        alarm,
        snoozeCount,
        totalPenalty,
      });
    } else {
      try {
        await snoozeApi.wake({
          alarmId: alarm.id,
          snoozeCount,
          totalPenalty,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Non-critical
      }
      navigation.goBack();
    }
  };

  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={styles.container}>
      {/* Top: Time + Label */}
      <View style={styles.topSection}>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
        <Text style={styles.alarmLabel}>{alarm?.label || 'Alarm'}</Text>

        {snoozeCount > 0 && (
          <View style={styles.snoozeInfoBadge}>
            <Text style={styles.snoozeInfoText}>
              Snoozed {snoozeCount}x
            </Text>
          </View>
        )}
      </View>

      {/* Middle: Broken glass visual if snoozed */}
      {snoozeCount > 0 && <BrokenGlassVisual penalty={totalPenalty} />}

      {/* Buttons */}
      <View style={styles.buttonSection}>
        {/* Snooze Button */}
        <TouchableOpacity
          style={[styles.snoozeButtonOuter, loading && styles.buttonDisabled]}
          onPress={handleSnooze}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF3B30', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.snoozeGradient}
          >
            {/* Glass overlay */}
            <View style={styles.glassOverlay} />
            <Text style={styles.snoozeButtonText}>SNOOZE</Text>
            <Text style={styles.snoozeCost}>${nextCost.toFixed(2)}</Text>
            {alarm?.useEscalatingPenalty && snoozeCount < (alarm.maxSnoozes || 5) - 1 && (
              <Text style={styles.nextWarning}>
                Next: ${(basePenalty * Math.pow(2, snoozeCount + 1)).toFixed(2)}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.dismissButtonOuter}
          onPress={handleDismiss}
          activeOpacity={0.8}
        >
          {/* Green glow behind */}
          <View style={styles.dismissGlow} />
          <View style={styles.dismissInner}>
            <Text style={styles.dismissButtonText}>I'M AWAKE</Text>
            {alarm?.wakeUpTaskType !== 'NONE' && (
              <Text style={styles.taskHint}>Complete task to dismiss</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* No-escape warning */}
      {alarm?.noEscapeMode && (
        <View style={styles.noEscapeRow}>
          <Icon name="warning-outline" size={14} color="#FF3B30" />
          <Text style={styles.noEscapeWarning}>
            No-Escape Mode: closing the app will auto-charge ${nextCost.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050510',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: 80,
    paddingBottom: 40,
  },

  // --- Top Section ---
  topSection: {
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  alarmLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  snoozeInfoBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
  },
  snoozeInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },

  // --- Buttons ---
  buttonSection: {
    gap: 16,
  },

  // Snooze
  snoozeButtonOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  snoozeGradient: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  snoozeButtonText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  snoozeCost: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  nextWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
  },

  // Dismiss
  dismissButtonOuter: {
    borderRadius: 20,
    position: 'relative',
    overflow: 'visible',
  },
  dismissGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: '#00E676',
    opacity: 0.15,
  },
  dismissInner: {
    backgroundColor: '#050510',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00E676',
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00E676',
    letterSpacing: 3,
  },
  taskHint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,230,118,0.5)',
    marginTop: 4,
  },

  // No-escape
  noEscapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  noEscapeWarning: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '600',
    opacity: 0.8,
  },
});
