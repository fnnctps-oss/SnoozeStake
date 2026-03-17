import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAlarmStore } from '../store/alarmStore';
import { alarmApi } from '../services/api';
import { Alarm } from '../types';
import { Icon } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function LiquidGlassAlarmCard({
  item,
  onPress,
  onToggle,
}: {
  item: Alarm;
  onPress: () => void;
  onToggle: () => void;
}) {
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.liquidCard, !item.isEnabled && styles.alarmDisabled]}>
        <LinearGradient
          colors={['rgba(108, 60, 225, 0.22)', 'rgba(139, 92, 246, 0.08)', 'rgba(108, 60, 225, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Top glass highlight */}
        <View style={styles.glassHighlight} />
        <View style={styles.alarmRow}>
          <View style={styles.alarmInfo}>
            <Text style={[styles.alarmTime, !item.isEnabled && styles.textDisabled]}>
              {formatTime(item.time)}
            </Text>
            <Text style={[styles.alarmLabel, !item.isEnabled && styles.textDisabled]}>
              {item.label}
            </Text>
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <Text
                  key={d}
                  style={[
                    styles.dayBadge,
                    item.daysOfWeek.includes(i) && styles.dayActive,
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.penaltyRow}>
              <Text style={styles.penaltyText}>
                ${Number(item.snoozeBasePenalty).toFixed(2)} per snooze
              </Text>
              {item.useEscalatingPenalty && (
                <Text style={styles.escalatingBadge}>Escalating</Text>
              )}
              {item.noEscapeMode && (
                <Text style={styles.noEscapeBadge}>No Escape</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.isEnabled}
            onValueChange={onToggle}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(108,60,225,0.5)' }}
            thumbColor={item.isEnabled ? colors.primaryLight : colors.textMuted}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function AlarmListScreen({ navigation }: any) {
  const { alarms, setAlarms, toggleAlarm } = useAlarmStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadAlarms = async () => {
    try {
      const { alarms: data } = await alarmApi.list();
      setAlarms(data);
    } catch {
      // Silently fail on refresh
    }
  };

  useEffect(() => {
    loadAlarms();
  }, []);

  const handleToggle = async (alarm: Alarm) => {
    toggleAlarm(alarm.id);
    try {
      await alarmApi.toggle(alarm.id);
    } catch {
      toggleAlarm(alarm.id);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlarms();
    setRefreshing(false);
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <LiquidGlassAlarmCard
      item={item}
      onPress={() => navigation.navigate('CreateAlarm', { alarm: item })}
      onToggle={() => handleToggle(item)}
    />
  );

  return (
    <GradientBackground>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderAlarm}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="alarm-outline" size={64} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first alarm and put real money on the line!
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlarm')}
      >
        <Icon name="add" size={28} color={colors.text} />
      </TouchableOpacity>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
    paddingTop: spacing.md,
  },
  liquidCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    padding: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmDisabled: {
    opacity: 0.5,
  },
  alarmInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  alarmTime: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  alarmLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textDisabled: {
    color: colors.textMuted,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dayBadge: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  dayActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    color: colors.primaryLight,
  },
  penaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  penaltyText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    fontWeight: '600',
  },
  escalatingBadge: {
    fontSize: fontSize.xs,
    color: colors.warning,
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  noEscapeBadge: {
    fontSize: fontSize.xs,
    color: colors.danger,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(108, 60, 225, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(108, 60, 225, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});
