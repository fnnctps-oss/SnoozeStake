import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [morningReport, setMorningReport] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [battleAlerts, setBattleAlerts] = useState(true);
  const [groupAlerts, setGroupAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Call API to delete, then logout
            logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.section}>
        <SettingToggle
          label="Morning Report"
          description="Daily summary at noon"
          value={morningReport}
          onToggle={setMorningReport}
        />
        <SettingToggle
          label="Weekly Report"
          description="Sunday evening summary"
          value={weeklyReport}
          onToggle={setWeeklyReport}
        />
        <SettingToggle
          label="Battle Updates"
          description="Challenge and result notifications"
          value={battleAlerts}
          onToggle={setBattleAlerts}
        />
        <SettingToggle
          label="Group Alerts"
          description="When group members snooze"
          value={groupAlerts}
          onToggle={setGroupAlerts}
        />
      </View>

      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.section}>
        <SettingToggle
          label="Dark Mode"
          description="Use dark theme"
          value={darkMode}
          onToggle={setDarkMode}
        />
      </View>

      {/* Account Info */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Timezone</Text>
          <Text style={styles.infoValue}>{user?.timezone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Referral Code</Text>
          <Text style={styles.infoValue}>{user?.referralCode}</Text>
        </View>
      </View>

      {/* Danger Zone */}
      <Text style={styles.sectionTitle}>Danger Zone</Text>
      <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
        <Text style={styles.dangerText}>Delete Account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SnoozeStake v1.0.0</Text>
    </ScrollView>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceLight, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  toggleDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  dangerText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.md },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xl,
  },
});
