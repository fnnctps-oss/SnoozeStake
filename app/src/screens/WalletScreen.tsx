import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { walletApi } from '../services/api';
import { Transaction } from '../types';

const TOP_UP_AMOUNTS = [5, 10, 20, 50];

export function WalletScreen() {
  const { user, updateUser } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { transactions: data } = await walletApi.transactions();
      setTransactions(data);
    } catch {
      // silent
    }
  };

  const handleTopUp = async (amount: number) => {
    setLoading(true);
    try {
      const { clientSecret } = await walletApi.topUp(amount);
      // In production, this would open Stripe Payment Sheet
      Alert.alert(
        'Payment',
        `Stripe Payment Sheet would open here for $${amount.toFixed(2)}.\n\nClient secret: ${clientSecret.slice(0, 20)}...`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'WALLET_TOPUP':
      case 'BATTLE_WIN':
      case 'FRIEND_TRANSFER':
        return colors.accent;
      case 'SNOOZE_PENALTY':
      case 'BATTLE_BET':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'WALLET_TOPUP':
      case 'BATTLE_WIN':
      case 'FRIEND_TRANSFER':
      case 'REFUND':
        return '+';
      default:
        return '-';
    }
  };

  return (
    <View style={styles.container}>
      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>
          ${Number(user?.walletBalance || 0).toFixed(2)}
        </Text>
        <View style={styles.subBalanceRow}>
          <Text style={styles.subBalance}>
            Savings: ${Number(user?.totalSaved || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Top-Up Options */}
      <Text style={styles.sectionTitle}>Add Money</Text>
      <View style={styles.topUpRow}>
        {TOP_UP_AMOUNTS.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.topUpButton}
            onPress={() => handleTopUp(amount)}
            disabled={loading}
          >
            <Text style={styles.topUpText}>${amount}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Amount */}
      <View style={styles.customRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.customInput}
          value={customAmount}
          onChangeText={setCustomAmount}
          keyboardType="decimal-pad"
          placeholder="Custom"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={styles.customButton}
          onPress={() => {
            const amount = parseFloat(customAmount);
            if (amount >= 1) handleTopUp(amount);
            else Alert.alert('Error', 'Minimum top-up is $1.00');
          }}
          disabled={loading}
        >
          <Text style={styles.customButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDesc} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={styles.transactionDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                { color: getTransactionColor(item.type) },
              ]}
            >
              {getTransactionSign(item.type)}${Number(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  balanceAmount: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  subBalanceRow: { marginTop: spacing.sm },
  subBalance: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  topUpRow: { flexDirection: 'row', gap: spacing.sm },
  topUpButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  topUpText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accent },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dollarSign: { fontSize: fontSize.xl, color: colors.accent, fontWeight: '700' },
  customInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  customButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  customButtonText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  transactionInfo: { flex: 1, marginRight: spacing.md },
  transactionDesc: { fontSize: fontSize.sm, color: colors.text },
  transactionDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  transactionAmount: { fontSize: fontSize.md, fontWeight: '700' },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
