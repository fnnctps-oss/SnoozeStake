import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAlarmStore } from '../store/alarmStore';
import { alarmApi } from '../services/api';
import { WakeUpTaskType, TaskDifficulty, PenaltyDestination } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TASKS: { value: WakeUpTaskType; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'MATH', label: 'Math Problem' },
  { value: 'QR_SCAN', label: 'QR Code Scan' },
  { value: 'SHAKE_PHONE', label: 'Shake Phone' },
  { value: 'TYPING_TEST', label: 'Typing Test' },
  { value: 'BARCODE_SCAN', label: 'Barcode Scan' },
  { value: 'WALK_STEPS', label: 'Walk Steps' },
  { value: 'PHOTO_SUNLIGHT', label: 'Photo of Sunlight' },
];
const DIFFICULTIES: TaskDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const DESTINATIONS: { value: PenaltyDestination; label: string }[] = [
  { value: 'SAVINGS', label: 'My Savings Jar' },
  { value: 'CHARITY', label: 'Charity' },
  { value: 'FRIEND', label: 'A Friend' },
];

export function CreateAlarmScreen({ navigation, route }: any) {
  const existingAlarm = route.params?.alarm;
  const { addAlarm, updateAlarm, removeAlarm } = useAlarmStore();

  const [label, setLabel] = useState(existingAlarm?.label || '');
  const [hours, setHours] = useState(existingAlarm ? existingAlarm.time.split(':')[0] : '07');
  const [minutes, setMinutes] = useState(existingAlarm ? existingAlarm.time.split(':')[1] : '00');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    existingAlarm?.daysOfWeek || [1, 2, 3, 4, 5]
  );
  const [penalty, setPenalty] = useState(
    existingAlarm ? String(Number(existingAlarm.snoozeBasePenalty)) : '1'
  );
  const [escalating, setEscalating] = useState(existingAlarm?.useEscalatingPenalty || false);
  const [taskType, setTaskType] = useState<WakeUpTaskType>(existingAlarm?.wakeUpTaskType || 'NONE');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(existingAlarm?.wakeUpTaskDifficulty || 'EASY');
  const [destination, setDestination] = useState<PenaltyDestination>(existingAlarm?.penaltyDestination || 'SAVINGS');
  const [noEscape, setNoEscape] = useState(existingAlarm?.noEscapeMode || false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a label');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    const data = {
      label: label.trim(),
      time: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`,
      daysOfWeek: selectedDays,
      snoozeBasePenalty: parseFloat(penalty) || 1,
      useEscalatingPenalty: escalating,
      wakeUpTaskType: taskType,
      wakeUpTaskDifficulty: difficulty,
      penaltyDestination: destination,
      noEscapeMode: noEscape,
    };

    setSaving(true);
    try {
      if (existingAlarm) {
        const { alarm } = await alarmApi.update(existingAlarm.id, data);
        updateAlarm(existingAlarm.id, alarm);
      } else {
        const { alarm } = await alarmApi.create(data);
        addAlarm(alarm);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAlarm) return;
    Alert.alert('Delete Alarm', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await alarmApi.remove(existingAlarm.id);
            removeAlarm(existingAlarm.id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Time Picker */}
      <View style={styles.timeRow}>
        <TextInput
          style={styles.timeInput}
          value={hours}
          onChangeText={(t) => setHours(t.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="07"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={minutes}
          onChangeText={(t) => setMinutes(t.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Label */}
      <TextInput
        style={styles.input}
        placeholder="Alarm Label (e.g. Wake up for gym)"
        placeholderTextColor={colors.textMuted}
        value={label}
        onChangeText={setLabel}
      />

      {/* Days */}
      <Text style={styles.sectionTitle}>Repeat</Text>
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayButton, selectedDays.includes(i) && styles.daySelected]}
            onPress={() => toggleDay(i)}
          >
            <Text style={[styles.dayText, selectedDays.includes(i) && styles.dayTextSelected]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Penalty */}
      <Text style={styles.sectionTitle}>Snooze Penalty</Text>
      <View style={styles.penaltyRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.penaltyInput}
          value={penalty}
          onChangeText={setPenalty}
          keyboardType="decimal-pad"
          placeholder="1.00"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.perSnooze}>per snooze</Text>
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Escalating Penalty</Text>
          <Text style={styles.switchDesc}>Doubles each snooze: $1 → $2 → $4 → $8</Text>
        </View>
        <Switch
          value={escalating}
          onValueChange={setEscalating}
          trackColor={{ false: colors.surfaceLight, true: colors.danger + '80' }}
          thumbColor={escalating ? colors.danger : colors.textMuted}
        />
      </View>

      {/* Penalty destination with 75/25 info */}
      <Text style={styles.sectionTitle}>Penalty Goes To</Text>
      <Text style={styles.splitInfo}>75% to destination, 25% platform fee</Text>
      <View style={styles.optionRow}>
        {DESTINATIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.optionButton, destination === d.value && styles.optionSelected]}
            onPress={() => setDestination(d.value)}
          >
            <Text style={[styles.optionText, destination === d.value && styles.optionTextSelected]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wake-up task */}
      <Text style={styles.sectionTitle}>Wake-Up Task</Text>
      <View style={styles.optionGrid}>
        {TASKS.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.taskButton, taskType === t.value && styles.optionSelected]}
            onPress={() => setTaskType(t.value)}
          >
            <Text style={[styles.optionText, taskType === t.value && styles.optionTextSelected]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {taskType !== 'NONE' && (
        <>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View style={styles.optionRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.optionButton, difficulty === d && styles.optionSelected]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.optionText, difficulty === d && styles.optionTextSelected]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* No Escape Mode */}
      <View style={[styles.switchRow, { marginTop: spacing.lg }]}>
        <View>
          <Text style={styles.switchLabel}>No-Escape Mode</Text>
          <Text style={styles.switchDesc}>Auto-charge if you force close the app</Text>
        </View>
        <Switch
          value={noEscape}
          onValueChange={setNoEscape}
          trackColor={{ false: colors.surfaceLight, true: colors.danger + '80' }}
          thumbColor={noEscape ? colors.danger : colors.textMuted}
        />
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? 'Saving...' : existingAlarm ? 'Update Alarm' : 'Create Alarm'}
        </Text>
      </TouchableOpacity>

      {existingAlarm && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Alarm</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  timeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '700',
    textAlign: 'center',
    width: 100,
  },
  timeSeparator: { fontSize: fontSize.hero, color: colors.text, fontWeight: '700', marginHorizontal: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  splitInfo: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  daysRow: { flexDirection: 'row', gap: spacing.xs },
  dayButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  dayTextSelected: { color: colors.text },
  penaltyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dollarSign: { fontSize: fontSize.xl, color: colors.danger, fontWeight: '700' },
  penaltyInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.danger,
    fontSize: fontSize.xl,
    fontWeight: '700',
    width: 100,
    textAlign: 'center',
  },
  perSnooze: { fontSize: fontSize.sm, color: colors.textSecondary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  switchLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  switchDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  taskButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  optionSelected: { backgroundColor: colors.primary },
  optionText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  optionTextSelected: { color: colors.text },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.background },
  deleteButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteText: { fontSize: fontSize.md, fontWeight: '600', color: colors.danger },
});
