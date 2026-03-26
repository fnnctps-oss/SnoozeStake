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
import { scheduleAlarmNotifications, cancelAlarmNotifications } from '../services/notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AlarmCard({
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
    return { time: `${hour}:${m.toString().padStart(2, '0')}`, period };
  };

  const { time: timeStr, period } = formatTime(item.time);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.card, !item.isEnabled && styles.cardDisabled]}>
        {/* Glass highlight line at top */}
        <View style={styles.cardHighlight} />

        {/* Top row: time + period + toggle */}
        <View style={styles.cardTopRow}>
          <View style={styles.timeWrap}>
            <Text style={[styles.timeText, !item.isEnabled && styles.textDisabled]}>
              {timeStr}
            </Text>
            <Text style={[styles.periodText, !item.isEnabled && styles.textDisabled]}>
              {period}
            </Text>
          </View>
          <Switch
            value={item.isEnabled}
            onValueChange={onToggle}
            trackColor={{
              false: 'rgba(255,255,255,0.15)',
              true: 'rgba(255,255,255,0.35)',
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="rgba(255,255,255,0.15)"
          />
        </View>

        {/* Label */}
        <Text style={[styles.labelText, !item.isEnabled && styles.textDisabled]}>
          {item.label}
        </Text>

        {/* Days row */}
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

        {/* Tags row */}
        {(item.useEscalatingPenalty || item.noEscapeMode) && (
          <View style={styles.tagsRow}>
            {item.useEscalatingPenalty && (
              <View style={styles.tagOrange}>
                <Text style={styles.tagText}>Escalating</Text>
              </View>
            )}
            {item.noEscapeMode && (
              <View style={styles.tagRed}>
                <Text style={styles.tagText}>No Escape</Text>
              </View>
            )}
          </View>
        )}
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
    const newActive = !alarm.isEnabled;
    toggleAlarm(alarm.id);
    try {
      await alarmApi.toggle(alarm.id);
      if (newActive) {
        await scheduleAlarmNotifications({
          id: alarm.id,
          label: alarm.label,
          time: alarm.time,
          daysOfWeek: alarm.daysOfWeek,
          isActive: true,
        });
      } else {
        await cancelAlarmNotifications(alarm.id);
      }
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
    <AlarmCard
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="alarm-outline" size={52} color="rgba(255,255,255,0.25)" />
            </View>
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first alarm
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlarm')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#9B59F5', '#6C3CE1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
    paddingTop: spacing.sm,
  },

  // Alarm card — Apple liquid glass style
  card: {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    padding: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  cardDisabled: {
    opacity: 0.45,
  },

  // Time display
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  timeText: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 56,
  },
  periodText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  labelText: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  textDisabled: {
    color: 'rgba(255,255,255,0.30)',
  },

  // Days
  daysRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  dayBadge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dayActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.85)',
  },

  // Tag badges
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagOrange: {
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  tagRed: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty state
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: colors.textMuted,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
