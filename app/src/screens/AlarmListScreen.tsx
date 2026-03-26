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
import { BlurView } from 'expo-blur';
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
    return { timeStr: `${hour}:${m.toString().padStart(2, '0')}`, period };
  };

  const { timeStr, period } = formatTime(item.time);
  const activeDays = DAYS.filter((_, i) => item.daysOfWeek.includes(i));
  const daysLabel = activeDays.length === 7
    ? 'Every day'
    : activeDays.length === 5 && !item.daysOfWeek.includes(0) && !item.daysOfWeek.includes(6)
      ? 'Weekdays'
      : activeDays.join(', ');

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.cardOuter, !item.isEnabled && styles.cardDisabled]}>
        {/* Real blur layer — the core of the glass effect */}
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
        {/* White tint overlay */}
        <View style={[StyleSheet.absoluteFill, styles.cardTint]} />
        {/* Top gloss line */}
        <View style={styles.cardGloss} />

        <View style={styles.cardInner}>
          {/* Time + Toggle row */}
          <View style={styles.topRow}>
            <View style={styles.timeBlock}>
              <Text style={[styles.timeText, !item.isEnabled && styles.dimmed]}>
                {timeStr}
              </Text>
              <Text style={[styles.periodText, !item.isEnabled && styles.dimmed]}>
                {period}
              </Text>
            </View>
            <Switch
              value={item.isEnabled}
              onValueChange={onToggle}
              trackColor={{
                false: 'rgba(255,255,255,0.20)',
                true: 'rgba(255,255,255,0.45)',
              }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="rgba(255,255,255,0.20)"
            />
          </View>

          {/* Label */}
          <Text style={[styles.labelText, !item.isEnabled && styles.dimmed]}>
            {item.label}
          </Text>

          {/* Days */}
          {daysLabel ? (
            <Text style={styles.daysText}>{daysLabel}</Text>
          ) : null}

          {/* Penalty + Tags */}
          <View style={styles.bottomRow}>
            <Text style={styles.penaltyText}>
              ${Number(item.snoozeBasePenalty).toFixed(2)} / snooze
            </Text>
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
          </View>
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
    } catch {}
  };

  useEffect(() => { loadAlarms(); }, []);

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

  return (
    <GradientBackground>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlarmCard
            item={item}
            onPress={() => navigation.navigate('CreateAlarm', { alarm: item })}
            onToggle={() => handleToggle(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.5)"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="alarm-outline" size={48} color="rgba(255,255,255,0.20)" />
            </View>
            <Text style={styles.emptyTitle}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>Tap + to set your first alarm</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateAlarm')} activeOpacity={0.85}>
        <LinearGradient
          colors={['#A855F7', '#6C3CE1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 14,
    paddingBottom: 110,
    paddingTop: 10,
  },

  // ── Alarm Card ──────────────────────────────────
  cardOuter: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    // Shadow for depth
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  cardTint: {
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  cardGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
    zIndex: 2,
  },
  cardInner: {
    padding: 22,
    paddingTop: 20,
  },
  cardDisabled: {
    opacity: 0.40,
  },

  // Time
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timeText: {
    fontSize: 54,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 58,
  },
  periodText: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
    marginBottom: 8,
  },
  dimmed: {
    opacity: 0.45,
  },

  labelText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.70)',
    marginBottom: 4,
  },
  daysText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: '500',
    marginBottom: 14,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  penaltyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagOrange: {
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
  tagRed: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 130,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 8,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
