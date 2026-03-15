import React, { useState, useEffect } from 'react';
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
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { snoozeApi } from '../services/api';

interface MathProblem {
  question: string;
  answer: number;
}

function generateMathProblem(difficulty: string): MathProblem {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  if (difficulty === 'EASY') {
    const a = rand(1, 20);
    const b = rand(1, 20);
    const op = Math.random() > 0.5 ? '+' : '-';
    return {
      question: `${a} ${op} ${b}`,
      answer: op === '+' ? a + b : a - b,
    };
  } else if (difficulty === 'MEDIUM') {
    const a = rand(2, 12);
    const b = rand(2, 12);
    return { question: `${a} × ${b}`, answer: a * b };
  } else {
    const a = rand(10, 50);
    const b = rand(2, 9);
    const c = rand(1, 20);
    return { question: `${a} × ${b} + ${c}`, answer: a * b + c };
  }
}

export function WakeUpTaskScreen({ navigation, route }: any) {
  const { alarm, snoozeCount, totalPenalty } = route.params;
  const [problem, setProblem] = useState<MathProblem>(
    generateMathProblem(alarm.wakeUpTaskDifficulty || 'EASY')
  );
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    Vibration.vibrate([300, 300], true);
    return () => Vibration.cancel();
  }, []);

  const handleSubmit = async () => {
    const userAnswer = parseInt(answer, 10);
    if (isNaN(userAnswer)) {
      Alert.alert('Error', 'Please enter a number');
      return;
    }

    if (userAnswer === problem.answer) {
      Vibration.cancel();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      try {
        await snoozeApi.wake({
          alarmId: alarm.id,
          snoozeCount,
          totalPenalty,
          taskCompleted: alarm.wakeUpTaskType,
        });
      } catch {
        // Non-critical
      }

      Alert.alert('Great job!', 'You solved it! Good morning!', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttempts((a) => a + 1);
      setAnswer('');

      if (attempts >= 2) {
        // Generate a new problem after 3 failed attempts
        setProblem(generateMathProblem(alarm.wakeUpTaskDifficulty || 'EASY'));
        setAttempts(0);
        Alert.alert('New Problem', "Here's a new one. Keep trying!");
      } else {
        Alert.alert('Wrong!', 'Try again. You need to get this right to dismiss.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solve to Dismiss</Text>
      <Text style={styles.subtitle}>
        {alarm.wakeUpTaskDifficulty || 'EASY'} Math Problem
      </Text>

      <View style={styles.problemCard}>
        <Text style={styles.problemText}>{problem.question} = ?</Text>
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

      <Text style={styles.attempts}>
        {attempts > 0 ? `Wrong attempts: ${attempts}/3` : 'Enter the correct answer'}
      </Text>
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
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  problemText: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.accent,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: fontSize.xxl,
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
  attempts: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
