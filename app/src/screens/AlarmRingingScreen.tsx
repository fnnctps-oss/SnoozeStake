import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { snoozeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function AlarmRingingScreen({ navigation, route }: any) {
  const alarm = route.params?.alarm;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [loading, setLoading] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Calculate next snooze cost
  const basePenalty = Number(alarm?.snoozeBasePenalty || 1);
  const nextCost = alarm?.useEscalatingPenalty
    ? basePenalty * Math.pow(2, snoozeCount)
    : basePenalty;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    Vibration.vibrate([500, 500], true);
    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, []);

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
      setSnoozeCount((c) => c + 1);
      setTotalPenalty((p) => p + Number(result.snoozeEvent.penaltyAmount));
      updateUser({ walletBalance: Number(result.walletBalance) });

      // "Snooze" — go back, alarm will ring again after duration
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Cannot Snooze', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    Vibration.cancel();

    if (alarm?.wakeUpTaskType && alarm.wakeUpTaskType !== 'NONE') {
      navigation.replace('WakeUpTask', {
        alarm,
        snoozeCount,
        totalPenalty,
      });
    } else {
      // No task, just wake up
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
      <View style={styles.topSection}>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
        <Text style={styles.alarmLabel}>{alarm?.label || 'Alarm'}</Text>
        {snoozeCount > 0 && (
          <Text style={styles.snoozeInfo}>
            Snoozed {snoozeCount}x — ${totalPenalty.toFixed(2)} spent
          </Text>
        )}
      </View>

      <View style={styles.buttonSection}>
        {/* Snooze Button */}
        <TouchableOpacity
          style={[styles.snoozeButton, loading && styles.buttonDisabled]}
          onPress={handleSnooze}
          disabled={loading}
        >
          <Text style={styles.snoozeButtonText}>SNOOZE</Text>
          <Text style={styles.snoozeCost}>${nextCost.toFixed(2)}</Text>
          {alarm?.useEscalatingPenalty && snoozeCount < (alarm.maxSnoozes || 5) - 1 && (
            <Text style={styles.nextWarning}>
              Next: ${(basePenalty * Math.pow(2, snoozeCount + 1)).toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Dismiss Button */}
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>I'M AWAKE</Text>
          {alarm?.wakeUpTaskType !== 'NONE' && (
            <Text style={styles.taskHint}>Complete task to dismiss</Text>
          )}
        </TouchableOpacity>
      </View>

      {alarm?.noEscapeMode && (
        <Text style={styles.noEscapeWarning}>
          No-Escape Mode: closing the app will auto-charge ${nextCost.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: 80,
    paddingBottom: 60,
  },
  topSection: {
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
  },
  alarmLabel: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  snoozeInfo: {
    fontSize: fontSize.md,
    color: colors.danger,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  buttonSection: {
    gap: spacing.lg,
  },
  snoozeButton: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  snoozeButtonText: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
  },
  snoozeCost: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  nextWarning: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  dismissButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  dismissButtonText: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.background,
    letterSpacing: 2,
  },
  taskHint: {
    fontSize: fontSize.sm,
    color: 'rgba(0,0,0,0.6)',
    marginTop: spacing.xs,
  },
  noEscapeWarning: {
    fontSize: fontSize.xs,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});
