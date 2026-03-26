import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Accelerometer, Pedometer } from 'expo-sensors';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { snoozeApi } from '../services/api';
import { checkAndNotifyAchievements } from '../services/achievements';
import { useAuthStore } from '../store/authStore';

// ===== MATH TASK =====
interface MathProblem { question: string; answer: number; }

function generateMathProblem(difficulty: string): MathProblem {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  if (difficulty === 'EASY') {
    const a = rand(1, 20), b = rand(1, 20);
    const op = Math.random() > 0.5 ? '+' : '-';
    return { question: `${a} ${op} ${b}`, answer: op === '+' ? a + b : a - b };
  } else if (difficulty === 'MEDIUM') {
    const a = rand(2, 12), b = rand(2, 12);
    return { question: `${a} × ${b}`, answer: a * b };
  } else {
    const a = rand(10, 50), b = rand(2, 9), c = rand(1, 20);
    return { question: `${a} × ${b} + ${c}`, answer: a * b + c };
  }
}

// ===== TYPING TASK =====
const TYPING_SENTENCES = [
  'The quick brown fox jumps over the lazy dog',
  'Every morning is a fresh start to be better',
  'Success is not final failure is not fatal',
  'Rise and grind the early bird catches the worm',
  'Discipline is choosing between what you want now and what you want most',
  'Good things come to those who wake up early',
  'Today is going to be an amazing productive day',
  'The secret of getting ahead is getting started',
];

function getTypingSentence(difficulty: string): string {
  const sentence = TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
  if (difficulty === 'EASY') return sentence.split(' ').slice(0, 5).join(' ');
  if (difficulty === 'MEDIUM') return sentence;
  return sentence + ' ' + TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
}

// ===== MAIN COMPONENT =====
export function WakeUpTaskScreen({ navigation, route }: any) {
  // Bug fix: safe-extract route params to prevent crash when params are missing
  const alarm = route.params?.alarm ?? null;
  const snoozeCount = route.params?.snoozeCount ?? 0;
  const totalPenalty = route.params?.totalPenalty ?? 0;
  const taskType = alarm?.wakeUpTaskType || 'MATH';
  const difficulty = alarm?.wakeUpTaskDifficulty || 'EASY';
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    Vibration.vibrate([300, 300], true);
    return () => Vibration.cancel();
  }, []);

  const completeTask = async () => {
    Vibration.cancel();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const result = await snoozeApi.wake({
        alarmId: alarm.id,
        snoozeCount,
        totalPenalty,
        taskCompleted: taskType,
      });
      // Check for newly unlocked achievements
      if (result) {
        const updatedData = {
          currentStreak: result.currentStreak ?? user?.currentStreak ?? 0,
          longestStreak: result.longestStreak ?? user?.longestStreak ?? 0,
          totalSaved: Number(result.moneySaved ?? 0) + Number(user?.totalSaved ?? 0),
        };
        updateUser({
          currentStreak: updatedData.currentStreak,
          longestStreak: updatedData.longestStreak,
          totalSaved: updatedData.totalSaved,
        });
        checkAndNotifyAchievements(updatedData);
      }
    } catch {}
    Alert.alert('Great job!', 'Good morning!', [
      { text: 'OK', onPress: () => navigation.popToTop() },
    ]);
  };

  // Bug fix: guard against missing alarm data
  if (!alarm) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No alarm data found.</Text>
        <TouchableOpacity style={styles.submitButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.submitText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (taskType === 'MATH') return <MathTask difficulty={difficulty} onComplete={completeTask} />;
  if (taskType === 'SHAKE_PHONE') return <ShakeTask difficulty={difficulty} onComplete={completeTask} />;
  if (taskType === 'TYPING_TEST') return <TypingTask difficulty={difficulty} onComplete={completeTask} />;
  if (taskType === 'WALK_STEPS') return <WalkTask difficulty={difficulty} onComplete={completeTask} />;

  // Fallback for QR_SCAN, PHOTO_SUNLIGHT, BARCODE_SCAN — show math as fallback
  return <MathTask difficulty={difficulty} onComplete={completeTask} />;
}

// ===== MATH COMPONENT =====
function MathTask({ difficulty, onComplete }: { difficulty: string; onComplete: () => void }) {
  const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);
  const [problem, setProblem] = useState(generateMathProblem(difficulty));
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);

  const handleSubmit = async () => {
    const userAnswer = parseInt(answer, 10);
    if (isNaN(userAnswer)) { Alert.alert('Error', 'Please enter a number'); return; }
    if (userAnswer === problem.answer) {
      onComplete();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttempts((a) => a + 1);
      setAnswer('');
      if (attempts >= 2) {
        setProblem(generateMathProblem(currentDifficulty));
        setAttempts(0);
      }
    }
  };

  const handleNext = () => {
    // Drop difficulty one level if possible
    const currentIndex = DIFFICULTIES.indexOf(currentDifficulty);
    let nextDiff = currentDifficulty;
    if (currentIndex > 0) {
      nextDiff = DIFFICULTIES[currentIndex - 1];
      setCurrentDifficulty(nextDiff);
    }
    setProblem(generateMathProblem(nextDiff));
    setAnswer('');
    setAttempts(0);
    setSkipsUsed((s) => s + 1);
  };

  const difficultyLabel = currentDifficulty === 'EASY' ? 'Easy' : currentDifficulty === 'MEDIUM' ? 'Medium' : 'Hard';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solve to Dismiss</Text>
      <Text style={styles.subtitle}>{difficultyLabel} Math Problem</Text>
      <View style={styles.taskCard}>
        <Text style={styles.mathText}>{problem.question} = ?</Text>
      </View>
      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={setAnswer}
        keyboardType="number-pad"
        placeholder="Your answer"
        placeholderTextColor={colors.textMuted}
        autoFocus
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>
          Next{currentDifficulty !== 'EASY' ? ' (easier)' : ''}
        </Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        {attempts > 0 ? `Wrong: ${attempts}/3` : skipsUsed > 0 ? `Skipped ${skipsUsed}x` : 'Enter the correct answer'}
      </Text>
    </View>
  );
}

// ===== SHAKE COMPONENT =====
function ShakeTask({ difficulty, onComplete }: { difficulty: string; onComplete: () => void }) {
  const targetDuration = difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 30;
  const [shakeTime, setShakeTime] = useState(0);
  const shakeTimeRef = useRef(0);
  const threshold = 2.5;
  // Bug fix: store latest callback in ref so the effect doesn't need it as a dep
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const targetDurationRef = useRef(targetDuration);
  targetDurationRef.current = targetDuration;

  useEffect(() => {
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > threshold) {
        shakeTimeRef.current += 0.1;
        setShakeTime(Math.floor(shakeTimeRef.current));
        if (shakeTimeRef.current >= targetDurationRef.current) {
          sub.remove();
          onCompleteRef.current();
        }
      }
    });
    Accelerometer.setUpdateInterval(100);
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.min(shakeTime / targetDuration, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shake Your Phone!</Text>
      <Text style={styles.subtitle}>Shake vigorously for {targetDuration} seconds</Text>
      <View style={styles.taskCard}>
        <Text style={styles.bigNumber}>{Math.floor(shakeTime)}s</Text>
        <Text style={styles.taskSubtext}>of {targetDuration}s</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>Keep shaking!</Text>
    </View>
  );
}

// ===== TYPING COMPONENT =====
function TypingTask({ difficulty, onComplete }: { difficulty: string; onComplete: () => void }) {
  const [sentence] = useState(getTypingSentence(difficulty));
  const [typed, setTyped] = useState('');

  const handleChange = (text: string) => {
    setTyped(text);
    if (text.toLowerCase().trim() === sentence.toLowerCase().trim()) {
      onComplete();
    }
  };

  const getCharColor = (index: number) => {
    if (index >= typed.length) return colors.textMuted;
    return typed[index].toLowerCase() === sentence[index].toLowerCase()
      ? colors.accent
      : colors.danger;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Type to Dismiss</Text>
      <Text style={styles.subtitle}>Type the sentence below exactly</Text>
      <View style={styles.taskCard}>
        <Text style={styles.typingTarget}>
          {sentence.split('').map((char, i) => (
            <Text key={i} style={{ color: getCharColor(i) }}>{char}</Text>
          ))}
        </Text>
      </View>
      <TextInput
        style={styles.input}
        value={typed}
        onChangeText={handleChange}
        placeholder="Start typing..."
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus
      />
      <Text style={styles.hint}>
        {typed.length}/{sentence.length} characters
      </Text>
    </View>
  );
}

// ===== WALK COMPONENT =====
function WalkTask({ difficulty, onComplete }: { difficulty: string; onComplete: () => void }) {
  const targetSteps = difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 50 : 100;
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState(true);
  // Bug fix: store latest callback and targetSteps in refs so effect doesn't need them as deps
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const targetStepsRef = useRef(targetSteps);
  targetStepsRef.current = targetSteps;

  useEffect(() => {
    let sub: any = null;
    Pedometer.isAvailableAsync().then((avail) => {
      if (!avail) {
        setAvailable(false);
        return;
      }
      sub = Pedometer.watchStepCount((result) => {
        setSteps(result.steps);
        if (result.steps >= targetStepsRef.current) {
          sub?.remove();
          onCompleteRef.current();
        }
      });
    });
    // Bug fix: cleanup now works correctly since sub is in outer scope
    return () => { sub?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!available) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pedometer Not Available</Text>
        <Text style={styles.subtitle}>Falling back to math task</Text>
        <MathTask difficulty={difficulty} onComplete={onComplete} />
      </View>
    );
  }

  const progress = Math.min(steps / targetSteps, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Walk to Dismiss</Text>
      <Text style={styles.subtitle}>Take {targetSteps} steps</Text>
      <View style={styles.taskCard}>
        <Text style={styles.bigNumber}>{steps}</Text>
        <Text style={styles.taskSubtext}>of {targetSteps} steps</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>Start walking!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mathText: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.accent,
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.accent,
  },
  taskSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  typingTarget: {
    fontSize: fontSize.lg,
    lineHeight: 28,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  submitText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  nextButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nextText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
});
