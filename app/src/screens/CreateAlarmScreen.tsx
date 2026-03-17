import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAlarmStore } from '../store/alarmStore';
import { alarmApi } from '../services/api';
import { WakeUpTaskType, TaskDifficulty, PenaltyDestination } from '../types';
import { Icon } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ──────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TASKS: { value: WakeUpTaskType; label: string; icon: string }[] = [
  { value: 'NONE', label: 'None', icon: 'close-circle-outline' },
  { value: 'MATH', label: 'Math', icon: 'calculator-outline' },
  { value: 'SHAKE_PHONE', label: 'Shake', icon: 'phone-portrait-outline' },
  { value: 'TYPING_TEST', label: 'Typing', icon: 'text-outline' },
  { value: 'WALK_STEPS', label: 'Walk', icon: 'walk-outline' },
];
const DIFFICULTIES: TaskDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const DESTINATIONS: { value: PenaltyDestination; label: string; icon: string }[] = [
  { value: 'SAVINGS', label: 'My Savings', icon: 'wallet-outline' },
  { value: 'CHARITY', label: 'Charity', icon: 'heart-outline' },
  { value: 'FRIEND', label: 'A Friend', icon: 'person-outline' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0-59

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// ─── Alarm Tones ──────────────────────────────────────────────
const BUILTIN_TONES = [
  { id: 'radar', name: 'Radar', icon: 'radio-outline', file: require('../../assets/tones/radar.wav') },
  { id: 'apex', name: 'Apex', icon: 'trending-up-outline', file: require('../../assets/tones/apex.wav') },
  { id: 'beacon', name: 'Beacon', icon: 'flashlight-outline', file: require('../../assets/tones/beacon.wav') },
  { id: 'constellation', name: 'Constellation', icon: 'star-outline', file: require('../../assets/tones/constellation.wav') },
  { id: 'cosmic', name: 'Cosmic', icon: 'planet-outline', file: require('../../assets/tones/cosmic.wav') },
  { id: 'illuminate', name: 'Illuminate', icon: 'sunny-outline', file: require('../../assets/tones/illuminate.wav') },
  { id: 'nightowl', name: 'Night Owl', icon: 'moon-outline', file: require('../../assets/tones/nightowl.wav') },
  { id: 'presto', name: 'Presto', icon: 'musical-notes-outline', file: require('../../assets/tones/presto.wav') },
  { id: 'ripples', name: 'Ripples', icon: 'water-outline', file: require('../../assets/tones/ripples.wav') },
  { id: 'sencha', name: 'Sencha', icon: 'leaf-outline', file: require('../../assets/tones/sencha.wav') },
  { id: 'silk', name: 'Silk', icon: 'ribbon-outline', file: require('../../assets/tones/silk.wav') },
  { id: 'summit', name: 'Summit', icon: 'triangle-outline', file: require('../../assets/tones/summit.wav') },
];

// ─── Scroll Picker Component (uses ScrollView to avoid VirtualizedList nesting warning) ───
function ScrollPicker({
  data,
  selectedValue,
  onValueChange,
  formatLabel,
  width: pickerWidth = 80,
}: {
  data: number[];
  selectedValue: number;
  onValueChange: (val: number) => void;
  formatLabel?: (val: number) => string;
  width?: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = data.indexOf(selectedValue);

  useEffect(() => {
    // Scroll to initial position
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
    }, 50);
  }, []);

  const handleScrollEnd = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    if (data[clampedIndex] !== selectedValue) {
      onValueChange(data[clampedIndex]);
    }
    // Snap to nearest item
    scrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={[pickerStyles.container, { width: pickerWidth, height: PICKER_HEIGHT }]}>
      <View style={pickerStyles.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        nestedScrollEnabled
      >
        {data.map((item, index) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={`${item}-${index}`}
              style={[pickerStyles.item, { height: ITEM_HEIGHT }]}
              onPress={() => {
                onValueChange(item);
                scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  pickerStyles.itemText,
                  isSelected && pickerStyles.itemTextSelected,
                ]}
              >
                {formatLabel ? formatLabel(item) : String(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(108, 60, 225, 0.2)',
    borderRadius: borderRadius.md,
    zIndex: 1,
    pointerEvents: 'none',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textMuted,
  },
  itemTextSelected: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
});

// ─── Main Screen ──────────────────────────────────────────────
export function CreateAlarmScreen({ navigation, route }: any) {
  const existingAlarm = route.params?.alarm;
  const { addAlarm, updateAlarm, removeAlarm } = useAlarmStore();

  // Parse existing time
  const parseTime = () => {
    if (existingAlarm) {
      const [h, m] = existingAlarm.time.split(':').map(Number);
      return {
        hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
        minute: m,
        period: h >= 12 ? 'PM' as const : 'AM' as const,
      };
    }
    return { hour: 7, minute: 0, period: 'AM' as const };
  };

  const parsed = parseTime();
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);

  const [label, setLabel] = useState(existingAlarm?.label || '');
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

  // Tone state
  const [selectedTone, setSelectedTone] = useState(existingAlarm?.soundUrl || 'radar');
  const [customToneUri, setCustomToneUri] = useState<string | null>(null);
  const [customToneName, setCustomToneName] = useState<string | null>(null);
  const [playingTone, setPlayingTone] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const to24h = () => {
    let h = hour;
    if (period === 'AM' && h === 12) h = 0;
    else if (period === 'PM' && h !== 12) h += 12;
    return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // ─── Tone Playback ──────────────────────────
  const stopCurrentPlayer = () => {
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.release();
      }
    } catch {
      // Player may already be released
    }
    playerRef.current = null;
  };

  // Cleanup player on unmount
  useEffect(() => {
    return () => stopCurrentPlayer();
  }, []);

  const playTone = async (toneId: string) => {
    // Stop any currently playing
    stopCurrentPlayer();

    if (playingTone === toneId) {
      setPlayingTone(null);
      return;
    }

    try {
      await setAudioModeAsync({ playsInSilentMode: true });

      let source: any;
      if (toneId === 'custom' && customToneUri) {
        source = { uri: customToneUri };
      } else {
        const tone = BUILTIN_TONES.find((t) => t.id === toneId);
        if (!tone) return;
        source = tone.file;
      }

      const player = createAudioPlayer(source);
      playerRef.current = player;
      setPlayingTone(toneId);

      player.play();

      // Listen for playback completion
      const checkInterval = setInterval(() => {
        try {
          if (!player.playing) {
            setPlayingTone(null);
            clearInterval(checkInterval);
          }
        } catch {
          clearInterval(checkInterval);
          setPlayingTone(null);
        }
      }, 500);

      // Auto-clear after 5s max
      setTimeout(() => {
        clearInterval(checkInterval);
        if (playerRef.current === player) {
          try { player.pause(); } catch {}
          setPlayingTone(null);
        }
      }, 5000);
    } catch (err) {
      console.warn('Error playing tone:', err);
      setPlayingTone(null);
    }
  };

  const pickCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCustomToneUri(asset.uri);
        setCustomToneName(asset.name);
        setSelectedTone('custom');
      }
    } catch (err) {
      console.warn('Error picking sound:', err);
    }
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

    // Stop any preview playing
    if (playerRef.current) {
      playerRef.current.release();
      playerRef.current = null;
      setPlayingTone(null);
    }

    const data = {
      label: label.trim(),
      time: to24h(),
      daysOfWeek: selectedDays,
      snoozeBasePenalty: parseFloat(penalty) || 1,
      useEscalatingPenalty: escalating,
      wakeUpTaskType: taskType,
      wakeUpTaskDifficulty: difficulty,
      penaltyDestination: destination,
      noEscapeMode: noEscape,
      soundUrl: selectedTone === 'custom' ? customToneUri : selectedTone,
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
    <GradientBackground>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ─── Time Picker ─── */}
      <View style={styles.timeSection}>
        <View style={styles.pickerRow}>
          <ScrollPicker
            data={HOURS}
            selectedValue={hour}
            onValueChange={setHour}
            formatLabel={(v) => v.toString()}
            width={85}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <ScrollPicker
            data={MINUTES}
            selectedValue={minute}
            onValueChange={setMinute}
            formatLabel={(v) => v.toString().padStart(2, '0')}
            width={85}
          />
          <View style={styles.ampmContainer}>
            <TouchableOpacity
              style={[styles.ampmButton, period === 'AM' && styles.ampmActive]}
              onPress={() => setPeriod('AM')}
            >
              <Text style={[styles.ampmText, period === 'AM' && styles.ampmTextActive]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ampmButton, period === 'PM' && styles.ampmActive]}
              onPress={() => setPeriod('PM')}
            >
              <Text style={[styles.ampmText, period === 'PM' && styles.ampmTextActive]}>PM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Label ─── */}
      <TextInput
        style={styles.input}
        placeholder="Alarm Label (e.g. Wake up for gym)"
        placeholderTextColor={colors.textMuted}
        value={label}
        onChangeText={setLabel}
      />

      {/* ─── Days ─── */}
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

      {/* ─── Alarm Tone ─── */}
      <Text style={styles.sectionTitle}>Alarm Tone</Text>
      <View style={styles.toneList}>
        {BUILTIN_TONES.map((tone) => (
          <TouchableOpacity
            key={tone.id}
            style={[styles.toneItem, selectedTone === tone.id && styles.toneItemSelected]}
            onPress={() => setSelectedTone(tone.id)}
          >
            <View style={[styles.toneRadio, selectedTone === tone.id && styles.toneRadioActive]}>
              {selectedTone === tone.id && <View style={styles.toneRadioDot} />}
            </View>
            <Icon name={tone.icon} size={20} color={selectedTone === tone.id ? colors.primary : colors.textSecondary} />
            <Text style={[styles.toneName, selectedTone === tone.id && styles.toneNameSelected]}>
              {tone.name}
            </Text>
            <TouchableOpacity
              style={styles.tonePlayBtn}
              onPress={() => playTone(tone.id)}
            >
              <Icon
                name={playingTone === tone.id ? 'stop-circle' : 'play-circle'}
                size={28}
                color={playingTone === tone.id ? colors.danger : colors.primary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Custom Sound */}
        <TouchableOpacity
          style={[styles.toneItem, selectedTone === 'custom' && styles.toneItemSelected]}
          onPress={pickCustomSound}
        >
          <View style={[styles.toneRadio, selectedTone === 'custom' && styles.toneRadioActive]}>
            {selectedTone === 'custom' && <View style={styles.toneRadioDot} />}
          </View>
          <Icon name="folder-open-outline" size={20} color={selectedTone === 'custom' ? colors.primary : colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.toneName, selectedTone === 'custom' && styles.toneNameSelected]}>
              {customToneName || 'Choose from Device'}
            </Text>
            {customToneName && (
              <Text style={styles.toneSubtext}>Custom sound</Text>
            )}
          </View>
          {customToneUri && (
            <TouchableOpacity
              style={styles.tonePlayBtn}
              onPress={() => playTone('custom')}
            >
              <Icon
                name={playingTone === 'custom' ? 'stop-circle' : 'play-circle'}
                size={28}
                color={playingTone === 'custom' ? colors.danger : colors.primary}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Penalty ─── */}
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
        <View style={{ flex: 1 }}>
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

      {/* ─── Penalty Destination ─── */}
      <Text style={styles.sectionTitle}>Penalty Goes To</Text>
      <Text style={styles.splitInfo}>75% to destination, 25% platform fee</Text>
      <View style={styles.optionRow}>
        {DESTINATIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.optionButton, destination === d.value && styles.optionSelected]}
            onPress={() => setDestination(d.value)}
          >
            <Icon
              name={d.icon}
              size={18}
              color={destination === d.value ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.optionText, destination === d.value && styles.optionTextSelected]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Wake-Up Task ─── */}
      <Text style={styles.sectionTitle}>Wake-Up Task</Text>
      <View style={styles.optionGrid}>
        {TASKS.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.taskButton, taskType === t.value && styles.optionSelected]}
            onPress={() => setTaskType(t.value)}
          >
            <Icon
              name={t.icon}
              size={18}
              color={taskType === t.value ? colors.text : colors.textSecondary}
            />
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

      {/* ─── No Escape Mode ─── */}
      <View style={[styles.switchRow, { marginTop: spacing.lg }]}>
        <View style={{ flex: 1 }}>
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

      {/* ─── Save / Delete ─── */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Icon name={existingAlarm ? 'checkmark-circle-outline' : 'add-circle-outline'} size={22} color={colors.background} />
        <Text style={styles.saveText}>
          {saving ? 'Saving...' : existingAlarm ? 'Update Alarm' : 'Create Alarm'}
        </Text>
      </TouchableOpacity>

      {existingAlarm && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
          <Text style={styles.deleteText}>Delete Alarm</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    </GradientBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: 100, paddingTop: spacing.lg },

  // Time picker
  timeSection: {
    marginBottom: spacing.xl,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timeSeparator: {
    fontSize: 36,
    color: colors.text,
    fontWeight: '700',
  },
  ampmContainer: {
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  ampmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  ampmActive: {
    backgroundColor: 'rgba(108, 60, 225, 0.6)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  ampmText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textMuted,
  },
  ampmTextActive: {
    color: colors.text,
  },

  // Input
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },

  // Section
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

  // Days
  daysRow: { flexDirection: 'row', gap: spacing.xs },
  dayButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  daySelected: { backgroundColor: 'rgba(108, 60, 225, 0.6)', borderColor: 'rgba(139, 92, 246, 0.4)' },
  dayText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  dayTextSelected: { color: colors.text },

  // Tone selector
  toneList: {
    gap: spacing.xs,
  },
  toneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toneItemSelected: {
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  toneRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneRadioActive: {
    borderColor: colors.primary,
  },
  toneRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  toneName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toneNameSelected: {
    color: colors.text,
  },
  toneSubtext: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  tonePlayBtn: {
    padding: 4,
  },

  // Penalty
  penaltyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dollarSign: { fontSize: fontSize.xl, color: colors.danger, fontWeight: '700' },
  penaltyInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.danger,
    fontSize: fontSize.xl,
    fontWeight: '700',
    width: 100,
    textAlign: 'center',
  },
  perSnooze: { fontSize: fontSize.sm, color: colors.textSecondary },

  // Switches
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  switchLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  switchDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },

  // Options
  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  taskButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  optionSelected: { backgroundColor: 'rgba(108, 60, 225, 0.6)', borderColor: 'rgba(139, 92, 246, 0.4)' },
  optionText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  optionTextSelected: { color: colors.text },

  // Save / Delete
  saveButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { fontSize: fontSize.lg, fontWeight: '700', color: '#050510' },
  deleteButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  deleteText: { fontSize: fontSize.md, fontWeight: '600', color: colors.danger },
});
