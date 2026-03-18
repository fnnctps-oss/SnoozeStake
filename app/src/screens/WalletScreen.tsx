import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Icon } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { paymentApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, borderRadius } from '../utils/theme';

const TOP_UP_AMOUNTS = [5, 10, 20, 50, 100];

export function WalletScreen({ navigation }: any) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const updateUser = useAuthStore((s) => s.updateUser);

  const fetchData = useCallback(async () => {
    try {
      const [wallet, history] = await Promise.all([
        paymentApi.getWallet(),
        paymentApi.getHistory(),
      ]);
      setWalletData(wallet);
      setTransactions(history.transactions);
    } catch (err) {
      console.warn('Failed to fetch wallet data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTopUp = async () => {
    setLoading(true);
    try {
      // 1. Create PaymentIntent on server
      const { clientSecret } = await paymentApi.createPaymentIntent(selectedAmount);

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'SnoozeStake',
        style: 'alwaysDark',
        defaultBillingDetails: {},
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        setLoading(false);
        return;
      }

      // 3. Present Payment Sheet
      const { error: payError } = await presentPaymentSheet();

      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Payment Failed', payError.message);
        }
      } else {
        // Payment succeeded — update wallet locally
        Alert.alert('Success! 🎉', `$${selectedAmount}.00 added to your wallet`);
        updateUser({
          walletBalance: Number(walletData?.walletBalance || 0) + selectedAmount,
        });
        // Refresh data
        await fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'WALLET_TOPUP': return 'add-circle-outline';
      case 'SNOOZE_PENALTY': return 'alarm-outline';
      case 'FRIEND_TRANSFER': return 'people-outline';
      default: return 'cash-outline';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'WALLET_TOPUP': return colors.accent;
      case 'SNOOZE_PENALTY': return colors.danger;
      case 'FRIEND_TRANSFER': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
        <Icon name={getTransactionIcon(item.type)} size={18} color={getTransactionColor(item.type)} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[
        styles.txAmount,
        { color: item.type === 'WALLET_TOPUP' ? colors.accent : colors.danger },
      ]}>
        {item.type === 'WALLET_TOPUP' ? '+' : '-'}${Number(item.amount).toFixed(2)}
      </Text>
    </View>
  );

  const balance = Number(walletData?.walletBalance || 0);
  const totalSnoozed = Number(walletData?.totalSnoozed || 0);
  const totalSaved = Number(walletData?.totalSaved || 0);

  return (
    <GradientBackground>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <GlassCard variant="purple" style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="trending-down-outline" size={14} color={colors.danger} />
                  <Text style={styles.statText}>${totalSnoozed.toFixed(2)} snoozed</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="trending-up-outline" size={14} color={colors.accent} />
                  <Text style={styles.statText}>${totalSaved.toFixed(2)} saved</Text>
                </View>
              </View>
            </GlassCard>

            {/* Top Up Section */}
            <Text style={styles.sectionTitle}>Add Funds</Text>
            <View style={styles.amountRow}>
              {TOP_UP_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amountButton, selectedAmount === amt && styles.amountSelected]}
                  onPress={() => setSelectedAmount(amt)}
                >
                  <Text style={[styles.amountText, selectedAmount === amt && styles.amountTextSelected]}>
                    ${amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.topUpButton, loading && styles.topUpButtonDisabled]}
              onPress={handleTopUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Icon name="card-outline" size={20} color="#000" />
                  <Text style={styles.topUpButtonText}>Add ${selectedAmount}.00</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Transaction History */}
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.length === 0 && (
              <Text style={styles.emptyText}>No transactions yet. Top up your wallet to get started!</Text>
            )}
          </>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingTop: 100,
    paddingBottom: 120,
  },
  balanceCard: {
    alignItems: 'center' as const,
    paddingVertical: 28,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 24,
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  amountRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 16,
  },
  amountButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center' as const,
  },
  amountSelected: {
    backgroundColor: 'rgba(108, 60, 225, 0.3)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  amountText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  amountTextSelected: {
    color: colors.text,
  },
  topUpButton: {
    flexDirection: 'row' as const,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  topUpButtonDisabled: {
    opacity: 0.6,
  },
  topUpButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  txRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  txDesc: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  txDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 20,
  },
});
