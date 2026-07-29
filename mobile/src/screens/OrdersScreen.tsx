import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { ScreenPreloader } from '../components/ScreenPreloader';
import { colors } from '../constants/theme';
import {
  fetchMyOrders,
  getDepositScheduleItem,
  getMonthlyScheduleItems,
  type PaymentScheduleItem,
  toNaira,
  type UserOrder,
} from '../services/orders';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

const CLEARED_ORDERS_KEY = 'cbrixi.mobile.clearedOrderIds';

function fmtDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtMonth(value?: string | null, fallback?: number) {
  if (!value) return fallback ? `Month ${fallback}` : 'Installment';
  return new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function statusLabel(status?: string) {
  switch (status) {
    case 'AWAITING_APPROVAL':
      return 'Pending admin approval';
    case 'PENDING':
      return 'Approved, payment pending';
    case 'PARTIALLY_PAID':
      return 'Partially paid';
    case 'PAID':
      return 'Paid';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status ?? 'Pending';
  }
}

function isPaidStatus(status?: string) {
  return String(status ?? '').toUpperCase() === 'PAID';
}

function isTerminalOrder(order: UserOrder) {
  return order.status === 'PAID' || order.status === 'REJECTED';
}

export function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [clearedOrderIds, setClearedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    storage.getString(CLEARED_ORDERS_KEY).then((stored) => {
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setClearedOrderIds(parsed.filter((id) => typeof id === 'string'));
        }
      } catch {
        storage.remove(CLEARED_ORDERS_KEY).catch(() => undefined);
      }
    }).catch(() => undefined);
  }, []);

  const loadOrders = useCallback(async (isRefresh = false) => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const nextOrders = await fetchMyOrders(token);
      setOrders(nextOrders);
    } catch {
      setError('Unable to load orders right now.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadOrders().catch(() => undefined);
    }, [loadOrders]),
  );

  const visibleOrders = useMemo(
    () => orders.filter((order) => !clearedOrderIds.includes(order.id)),
    [clearedOrderIds, orders],
  );

  const stats = useMemo(() => {
    const payable = visibleOrders.filter((order) => order.can_pay).length;
    const paid = visibleOrders.filter((order) => order.status === 'PAID').length;
    const outstanding = visibleOrders.reduce((sum, order) => sum + Number(order.remaining_balance ?? 0), 0);
    return { payable, paid, outstanding };
  }, [visibleOrders]);

  const persistClearedIds = (ids: string[]) => {
    setClearedOrderIds(ids);
    storage.setString(CLEARED_ORDERS_KEY, JSON.stringify(ids)).catch(() => undefined);
  };

  const clearOrder = (orderId: string) => {
    persistClearedIds(Array.from(new Set([...clearedOrderIds, orderId])));
  };

  const clearCompletedAndRejected = () => {
    const terminalIds = orders.filter(isTerminalOrder).map((order) => order.id);
    persistClearedIds(Array.from(new Set([...clearedOrderIds, ...terminalIds])));
  };

  const clearableOrders = visibleOrders.filter(isTerminalOrder).length;

  if (loading && orders.length === 0) {
    return <ScreenPreloader message="Loading orders..." />;
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={visibleOrders}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor={colors.primary} />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.topBar}>
                  <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.headerTitle}>Orders</Text>
                  <Pressable
                    disabled={clearableOrders === 0}
                    onPress={clearCompletedAndRejected}
                    style={[styles.clearIconButton, clearableOrders === 0 && styles.disabled]}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={clearableOrders === 0 ? colors.textMuted : '#FCA5A5'} />
                  </Pressable>
                </View>

                <Text style={styles.subtitle}>Track approvals, balances, installments, and payment history.</Text>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.statsGrid}>
                  <StatCard label="Orders" value={visibleOrders.length} />
                  <StatCard label="Can pay" value={stats.payable} />
                  <StatCard label="Paid" value={stats.paid} />
                  <StatCard label="Outstanding" value={toNaira(stats.outstanding)} />
                </View>

                {!loading && visibleOrders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={34} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No orders to show</Text>
                    <Text style={styles.emptyText}>Approved deposits and monthly payments will appear here.</Text>
                    <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('Home')}>
                      <Text style={styles.emptyButtonText}>Shop products</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                expanded={Boolean(expandedOrders[item.id])}
                onToggle={() => setExpandedOrders((current) => ({ ...current, [item.id]: !current[item.id] }))}
                onClear={() => clearOrder(item.id)}
                onPay={(input) => navigation.navigate('Payment', input)}
              />
            )}
          />

          <View style={styles.bottomNav}>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="home-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Home</Text>
            </Pressable>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Favorites')}>
              <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Wishlist</Text>
            </Pressable>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Cart</Text>
            </Pressable>
            <Pressable style={styles.bottomNavItemActive}>
              <Ionicons name="receipt" size={18} color={colors.textPrimary} />
              <Text style={[styles.bottomLabel, styles.bottomLabelActive]}>Orders</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onClear,
  onPay,
}: {
  order: UserOrder;
  expanded: boolean;
  onToggle: () => void;
  onClear: () => void;
  onPay: (input: RootStackParamList['Payment']) => void;
}) {
  const isInstallment = order.payment_mode === 'INSTALLMENT';
  const firstItem = order.order_items?.[0];
  const productLabel = firstItem
    ? `${firstItem.name ?? firstItem.product_name ?? 'Product'}${(order.order_items?.length ?? 0) > 1 ? ` +${(order.order_items?.length ?? 1) - 1}` : ''}`
    : 'Order items';

  return (
    <View style={styles.orderCard}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.badgeRow}>
            <StatusBadge status={order.status} />
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{order.payment_mode}</Text>
            </View>
          </View>
          <Text style={styles.orderTitle} numberOfLines={2}>{productLabel}</Text>
          <Text style={styles.orderId}>Order {order.id}</Text>
          {order.external_email && isInstallment ? (
            <Text style={styles.externalEmail}>Cbrilliance: {order.external_email}</Text>
          ) : null}
          {order.status === 'AWAITING_APPROVAL' ? (
            <Text style={styles.awaitingText}>Payment is disabled until admin approval.</Text>
          ) : null}
          {order.status === 'REJECTED' ? (
            <Text style={styles.rejectedText}>This installment request was rejected.</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Metric label="Total" value={toNaira(order.total_amount)} />
        <Metric label={isInstallment ? 'Deposit' : 'Paid'} value={toNaira(isInstallment ? order.deposit_amount : order.paid_amount)} />
        <Metric label="Remaining" value={toNaira(order.remaining_balance)} />
        <Metric label="Progress" value={`${Math.round(Number(order.payment_progress_percentage ?? 0))}%`} />
      </View>

      {isInstallment ? (
        <View style={styles.metricGrid}>
          <Metric label="Next payment" value={toNaira(order.next_payment_amount)} />
          <Metric label="Due date" value={fmtDate(order.next_payment_due_date)} />
        </View>
      ) : null}

      {!isInstallment && order.can_pay ? (
        <PayPanel
          title="Pay order"
          subtitle="Continue to bank checkout and submit this payment for admin approval."
          label="Bank checkout"
          onPress={() => onPay({ orderId: order.id, mode: order.payment_mode as 'FULL' | 'INSTALLMENT', action: 'order' })}
        />
      ) : null}

      <View style={styles.cardFooter}>
        <Pressable onPress={onToggle} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{expanded ? 'Hide details' : 'Show more'}</Text>
        </Pressable>
        {isTerminalOrder(order) ? (
          <Pressable onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.expandedContent}>
          <DetailSection title="Products">
            {(order.order_items ?? []).length ? (
              (order.order_items ?? []).map((item, index) => (
                <DetailRow
                  key={item.id ?? `${order.id}-item-${index}`}
                  title={item.name ?? item.product_name ?? 'Product'}
                  subtitle={`Qty ${item.quantity ?? 1}`}
                  value={toNaira(item.amount ?? item.price ?? item.price_at_purchase)}
                />
              ))
            ) : (
              <Text style={styles.emptyDetailText}>No product details</Text>
            )}
          </DetailSection>

          {isInstallment ? (
            <InstallmentSection order={order} onPay={onPay} />
          ) : null}

          <DetailSection title="Transactions">
            {(order.transactions ?? []).length ? (
              (order.transactions ?? []).map((item, index) => (
                <DetailRow
                  key={item.id ?? item.reference ?? `${order.id}-transaction-${index}`}
                  title={toNaira(item.amount)}
                  subtitle={`${item.payment_method ?? 'Payment'} - ${item.status ?? 'Pending'}`}
                  value={item.reference ?? ''}
                />
              ))
            ) : (
              <Text style={styles.emptyDetailText}>No transactions yet</Text>
            )}
          </DetailSection>
        </View>
      ) : null}
    </View>
  );
}

function InstallmentSection({
  order,
  onPay,
}: {
  order: UserOrder;
  onPay: (input: RootStackParamList['Payment']) => void;
}) {
  const depositItem = getDepositScheduleItem(order);
  const monthlyItems = getMonthlyScheduleItems(order);
  const canPayDeposit = order.can_pay_deposit === true && depositItem?.can_pay === true;
  const canPayComplete = Boolean(order.can_pay) && order.status !== 'PAID' && order.status !== 'REJECTED';

  return (
    <DetailSection title="Installment payments">
      {!depositItem && monthlyItems.length === 0 ? <Text style={styles.emptyDetailText}>No installments yet</Text> : null}

      {depositItem ? (
        <ScheduleRow
          item={depositItem}
          fallbackLabel="First deposit"
          disabled={!canPayDeposit}
          paid={isPaidStatus(depositItem.status)}
          onPress={() => onPay({ orderId: order.id, mode: 'INSTALLMENT', action: 'order', label: 'First deposit' })}
        />
      ) : null}

      {monthlyItems.map((item, index) => {
        const label = item.payment_label ?? fmtMonth(item.due_date, item.installment_number ?? index + 1);
        const installmentId = item.id ?? null;
        return (
          <ScheduleRow
            key={item.id ?? `${order.id}-schedule-${index}`}
            item={item}
            fallbackLabel={label}
            disabled={item.can_pay !== true || !installmentId}
            paid={isPaidStatus(item.status)}
            onPress={() => onPay({
              orderId: order.id,
              mode: 'INSTALLMENT',
              action: 'installment',
              installmentId,
              label,
            })}
          />
        );
      })}

      <PayPanel
        title="Pay complete"
        subtitle="Pays the remaining balance and completes every unpaid month after approval."
        label="Pay complete"
        disabled={!canPayComplete}
        onPress={() => onPay({ orderId: order.id, mode: 'INSTALLMENT', action: 'complete', label: 'Complete payment' })}
      />
    </DetailSection>
  );
}

function ScheduleRow({
  item,
  fallbackLabel,
  paid,
  disabled,
  onPress,
}: {
  item: PaymentScheduleItem;
  fallbackLabel: string;
  paid: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const label = item.payment_label ?? fallbackLabel;

  return (
    <View style={styles.scheduleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.scheduleTitle}>{label}</Text>
        <Text style={styles.scheduleMeta}>{toNaira(item.remaining_amount ?? item.amount)} - {item.status ?? 'Scheduled'}</Text>
      </View>
      {paid ? (
        <View style={styles.paidBadge}>
          <Text style={styles.paidBadgeText}>Paid</Text>
        </View>
      ) : (
        <Pressable disabled={disabled} onPress={onPress} style={[styles.smallPayButton, disabled && styles.disabled]}>
          <Text style={styles.smallPayText}>Pay</Text>
        </Pressable>
      )}
    </View>
  );
}

function PayPanel({
  title,
  subtitle,
  label,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.payPanel}>
      <View style={{ flex: 1 }}>
        <Text style={styles.payTitle}>{title}</Text>
        <Text style={styles.paySubtitle}>{subtitle}</Text>
      </View>
      <Pressable disabled={disabled} onPress={onPress} style={[styles.payButton, disabled && styles.disabled]}>
        <Text style={styles.payButtonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ title, subtitle, value }: { title: string; subtitle?: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailRowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.detailRowSubtitle}>{subtitle}</Text> : null}
      {value ? <Text style={styles.detailRowValue}>{value}</Text> : null}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status ?? '').toUpperCase();
  const style =
    normalized === 'PAID'
      ? styles.statusPaid
      : normalized === 'REJECTED'
        ? styles.statusRejected
        : normalized === 'AWAITING_APPROVAL'
          ? styles.statusWaiting
          : styles.statusPending;

  return (
    <View style={[styles.statusBadge, style]}>
      <Text style={styles.statusText}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(127,29,29,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginBottom: 8,
  },
  loadingText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    padding: 12,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  emptyState: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  emptyButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  orderCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusPaid: {
    borderColor: 'rgba(16,185,129,0.24)',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusRejected: {
    borderColor: 'rgba(239,68,68,0.24)',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  statusWaiting: {
    borderColor: 'rgba(245,158,11,0.24)',
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  statusPending: {
    borderColor: 'rgba(59,130,246,0.24)',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  modeBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(148,163,184,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  modeBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  orderTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  orderId: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  externalEmail: {
    color: '#93C5FD',
    fontSize: 12,
    marginTop: 6,
  },
  awaitingText: {
    color: '#FDE68A',
    fontSize: 12,
    marginTop: 6,
  },
  rejectedText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metric: {
    width: '48%',
    borderRadius: 14,
    padding: 10,
    backgroundColor: 'rgba(2,6,23,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  clearButton: {
    width: 84,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 12,
    gap: 10,
  },
  detailSection: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(2,6,23,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
    gap: 8,
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  detailRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.08)',
    paddingBottom: 8,
  },
  detailRowTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailRowSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  detailRowValue: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 3,
  },
  emptyDetailText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
  },
  scheduleTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  smallPayButton: {
    minWidth: 58,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  smallPayText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  paidBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  paidBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  payPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    marginTop: 8,
  },
  payTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  paySubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  payButton: {
    minHeight: 38,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  payButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    height: 58,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomNavItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  bottomLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
