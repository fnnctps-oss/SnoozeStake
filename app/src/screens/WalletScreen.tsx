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
  Switch,
  Modal,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Icon } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { paymentApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, borderRadius } from '../utils/theme';

const TOP_UP_TIERS = [
  { amount: 10, label: '$10', badge: null },
  { amount: 25, label: '$25', badge: 'Most Popular' },
  { amount: 50, label: '$50', badge: null },
];

const AUTO_RELOAD_AMOUNTS = [10, 25, 50];
const LOW_BALANCE_THRESHOLD_WARN = 5;
const LOW_BALANCE_THRESHOLD_URGENT = 2;

export function WalletScreen({ navigation }: any) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [autoReload, setAutoReload] = useState(false);
  const [autoReloadAmount, setAutoReloadAmount] = useState(25);
  const [autoReloadThreshold, setAutoReloadThreshold] = useState(2);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  const fetchData = useCallback(async () => {
    try {
      const [wallet, history] = await Promise.all([
        paymentApi.getWallet(),
        paymentApi.getHistory(),
      ]);
      setWalletData(wallet);
      setTransactions(history.transactions);
      // Check for $0 balance
      if (Number(wallet.walletBalance) <= 0) {
        setShowEmptyModal(true);
      }
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

  const handleTopUp = async (amount?: number) => {
    const topUpAmount = amount || selectedAmount;
    setLoading(true);
    try {
      const { clientSecret } = await paymentApi.createPaymentIntent(topUpAmount);
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
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Payment Failed', payError.message);
        }
      } else {
        Alert.alert('Success!', `$${topUpAmount}.00 added to your wallet`);
        updateUser({
          walletBalance: Number(walletData?.walletBalance || 0) + topUpAmount,
        });
        setShowEmptyModal(false);
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

  // Determine warning level
  const warningLevel = balance <= 0 ? 'critical' : balance <= LOW_BALANCE_THRESHOLD_URGENT ? 'urgent' : balance <= LOW_BALANCE_THRESHOLD_WARN ? 'warning' : null;

  return (
    <GradientBackground>
      {/* $0 balance modal */}
      <Modal visible={showEmptyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Icon name="warning" size={48} color={colors.danger} />
            <Text style={styles.modalTitle}>Wallet Empty!</Text>
            <Text style={styles.modalDesc}>
              Your balance is $0. You won't be charged for snoozing until you add funds, but your alarms won't have stakes.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleTopUp(25)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalButtonText}>Add $25 Now</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEmptyModal(false)}>
              <Text style={styles.modalDismiss}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListHeaderComponent={
          <>
            {/* Low balance warning banner */}
            {warningLevel === 'warning' && (
              <View style={styles.bannerWarning}>
                <Icon name="alert-circle-outline" size={18} color="#000" />
                <Text style={styles.bannerText}>Low balance — add funds to keep your stakes active</Text>
              </View>
            )}
            {warningLevel === 'urgent' && (
              <View style={styles.bannerUrgent}>
                <Icon name="alert-circle" size={18} color="#fff" />
                <Text style={styles.bannerTextWhite}>Balance below $2 — snooze penalties may fail!</Text>
              </View>
            )}
            {warningLevel === 'critical' && (
              <View style={styles.bannerCritical}>
                <Icon name="close-circle" size={18} color="#fff" />
                <Text style={styles.bannerTextWhite}>$0 balance — add funds to activate alarm stakes</Text>
              </View>
            )}

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

            {/* Top Up Tiers */}
            <Text style={styles.sectionTitle}>Add Funds</Text>
            <View style={styles.tierRow}>
              {TOP_UP_TIERS.map((tier) => (
                <TouchableOpacity
                  key={tier.amount}
                  style={[
                    styles.tierCard,
                    selectedAmount === tier.amount && styles.tierCardSelected,
                    tier.badge ? styles.tierCardPopular : null,
                  ]}
                  onPress={() => setSelectedAmount(tier.amount)}
                >
                  {tier.badge && (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{tier.badge}</Text>
                    </View>
                  )}
                  <Text style={[styles.tierAmount, selectedAmount === tier.amount && styles.tierAmountSelected]}>
                    {tier.label}
                  </Text>
                  <Text style={styles.tierSubtext}>
                    {tier.amount === 10 ? 'Starter' : tier.amount === 25 ? 'Best Value' : 'Power User'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.topUpButton, loading && styles.topUpButtonDisabled]}
              onPress={() => handleTopUp()}
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

            {/* Auto-Reload */}
            <GlassCard style={styles.autoReloadCard}>
              <View style={styles.autoReloadHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoReloadTitle}>Auto-Reload</Text>
                  <Text style={styles.autoReloadDesc}>
                    Automatically top up when balance drops below ${autoReloadThreshold}
                  </Text>
                </View>
                <Switch
                  value={autoReload}
                  onValueChange={setAutoReload}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0, 230, 118, 0.4)' }}
                  thumbColor={autoReload ? colors.accent : colors.textMuted}
                />
              </View>

              {autoReload && (
                <View style={styles.autoReloadOptions}>
                  <Text style={styles.autoReloadLabel}>Reload amount:</Text>
                  <View style={styles.autoReloadRow}>
                    {AUTO_RELOAD_AMOUNTS.map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.autoReloadBtn,
                          autoReloadAmount === amt && styles.autoReloadBtnSelected,
                        ]}
                        onPress={() => setAutoReloadAmount(amt)}
                      >
                        <Text style={[
                          styles.autoReloadBtnText,
                          autoReloadAmount === amt && styles.autoReloadBtnTextSelected,
                        ]}>
                          ${amt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>

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
  // Banners
  bannerWarning: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(255, 176, 32, 0.9)',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  bannerUrgent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  bannerCritical: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: {
    flex: 1,
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerTextWhite: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    width: '100%',
  },
  modalTitle: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDismiss: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 8,
  },
  // Balance
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
  // Tiers
  tierRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
  },
  tierCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center' as const,
  },
  tierCardSelected: {
    backgroundColor: 'rgba(108, 60, 225, 0.3)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  tierCardPopular: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  badgeWrap: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tierAmount: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '700',
  },
  tierAmountSelected: {
    color: colors.text,
  },
  tierSubtext: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  topUpButton: {
    flexDirection: 'row' as const,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginBottom: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  topUpButtonDisabled: { opacity: 0.6 },
  topUpButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  // Auto-Reload
  autoReloadCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: 20,
  },
  autoReloadHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  autoReloadTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  autoReloadDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  autoReloadOptions: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  autoReloadLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  autoReloadRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  autoReloadBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center' as const,
  },
  autoReloadBtnSelected: {
    backgroundColor: 'rgba(108, 60, 225, 0.3)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  autoReloadBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  autoReloadBtnTextSelected: {
    color: colors.text,
  },
  // Transactions
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
