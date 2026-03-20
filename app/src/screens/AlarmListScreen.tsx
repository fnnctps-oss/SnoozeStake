import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAlarmStore } from '../store/alarmStore';
import { alarmApi } from '../services/api';
import { Alarm } from '../types';
import { Icon } from '../components/Icon';
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
    return { display: `${hour}:${m.toString().padStart(2, '0')}`, period };
  };

  const { display, period } = formatTime(item.time);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <LinearGradient
        colors={['rgba(108, 60, 225, 0.15)', 'rgba(108, 60, 225, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.alarmCard, !item.isEnabled && styles.alarmDisabled]}
      >
        <View style={styles.alarmRow}>
          <View style={styles.alarmInfo}>
            <View style={styles.timeRow}>
              <Text style={[styles.alarmTime, !item.isEnabled && styles.textDisabled]}>
                {display}
              </Text>
              <Text style={[styles.periodText, !item.isEnabled && styles.textDisabled]}>
                {period}
              </Text>
            </View>

            {item.label ? (
              <Text style={[styles.alarmLabel, !item.isEnabled && styles.textDisabled]}>
                {item.label}
              </Text>
            ) : null}

            <View style={styles.badgeRow}>
              {item.useEscalatingPenalty && (
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>Escalating</Text>
                </View>
              )}
              {item.noEscapeMode && (
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>No Escape</Text>
                </View>
              )}
            </View>
          </View>

          <Switch
            value={item.isEnabled}
            onValueChange={onToggle}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.primaryLight }}
            thumbColor={item.isEnabled ? '#FFFFFF' : '#888'}
            ios_backgroundColor="rgba(255,255,255,0.15)"
          />
        </View>
      </LinearGradient>
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
      // Schedule or cancel notifications based on new state
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.screenTitle}>Alarms</Text>

        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarm}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryLight}
            />
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
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  alarmCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(108, 60, 225, 0.2)',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  alarmDisabled: {
    opacity: 0.5,
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  alarmTime: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 56,
  },
  periodText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  alarmLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  textDisabled: {
    color: colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: 8,
  },
  redBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  redBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
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
    bottom: 32,
    right: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
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
