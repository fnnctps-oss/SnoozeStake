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
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAlarmStore } from '../store/alarmStore';
import { alarmApi } from '../services/api';
import { Alarm } from '../types';
import { Icon } from '../components/Icon';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      toggleAlarm(alarm.id); // Revert on failure
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlarms();
    setRefreshing(false);
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <TouchableOpacity
      style={[styles.alarmCard, !item.isEnabled && styles.alarmDisabled]}
      onPress={() => navigation.navigate('CreateAlarm', { alarm: item })}
    >
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
        onValueChange={() => handleToggle(item)}
        trackColor={{ false: colors.surfaceLight, true: colors.primaryLight }}
        thumbColor={item.isEnabled ? colors.primary : colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
            <Icon name="alarm-outline" size={64} color={colors.textMuted} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  alarmCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    backgroundColor: colors.primary + '30',
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
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  noEscapeBadge: {
    fontSize: fontSize.xs,
    color: colors.danger,
    backgroundColor: colors.danger + '20',
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
