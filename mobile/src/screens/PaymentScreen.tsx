import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { colors } from '../constants/theme';
import {
  fetchMyOrders,
  getDepositScheduleItem,
  getPaymentSchedule,
  initiateManualTransfer,
  toNaira,
  type ManualTransferResponse,
  type OrderItem,
  type PaymentScheduleItem,
  type UserOrder,
} from '../services/orders';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

function Spinner({ small }: { small?: boolean }) {
  return <ActivityIndicator color={colors.textPrimary} size={small ? 'small' : 'large'} />;
}

function fmtMonth(value?: string | null, fallback?: number) {
  if (!value) return fallback ? `Month ${fallback}` : 'Selected month';
  return new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getItemName(item: OrderItem) {
  return item.name ?? item.product_name ?? 'Product';
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.infoRow, highlight && styles.infoRowHighlight]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

export function PaymentScreen({ navigation, route }: Props) {
  const { orderId, action = 'order', installmentId = null, label: routeLabel, total } = route.params;

  const [order, setOrder] = useState<UserOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bankDetails, setBankDetails] = useState<ManualTransferResponse | null>(null);

  const loadOrder = useCallback(async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    setLoadingOrder(true);
    setError('');
    try {
      const orders = await fetchMyOrders(token);
      const found = orders.find((candidate) => candidate.id === orderId) ?? null;
      if (!found) {
        setError('Order not found.');
      }
      setOrder(found);
    } catch {
      setError('Unable to load this order.');
      setOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  }, [navigation, orderId]);

  useEffect(() => {
    loadOrder().catch(() => undefined);
  }, [loadOrder]);

  const selectedInstallment = useMemo<PaymentScheduleItem | null>(() => {
    if (!order || !installmentId) return null;
    return getPaymentSchedule(order).find((item) => item.id === installmentId) ?? null;
  }, [installmentId, order]);

  const paymentSummary = useMemo(() => {
    if (!order) {
      return {
        title: 'Bank payment',
        label: routeLabel ?? 'Payment',
        amount: total ?? 0,
        helper: 'Load an order to continue.',
      };
    }

    if (action === 'installment' && selectedInstallment) {
      const summaryLabel = selectedInstallment.payment_label ?? fmtMonth(selectedInstallment.due_date, selectedInstallment.installment_number);
      return {
        title: 'Month payment',
        label: summaryLabel,
        amount: Number(selectedInstallment.remaining_amount ?? selectedInstallment.amount ?? order.next_payment_amount ?? 0),
        helper: `This invoice is for ${summaryLabel}. It will wait for admin approval after you submit it.`,
      };
    }

    if (action === 'complete') {
      return {
        title: 'Complete installment payment',
        label: routeLabel ?? 'Complete payment',
        amount: Number(order.remaining_balance ?? 0),
        helper: 'This invoice covers the remaining balance. Admin approval will mark the remaining installments as settled.',
      };
    }

    const depositItem = order.payment_mode === 'INSTALLMENT' ? getDepositScheduleItem(order) : null;

    return {
      title: order.payment_mode === 'INSTALLMENT' ? 'Deposit payment' : 'Order payment',
      label: routeLabel ?? depositItem?.payment_label ?? (order.payment_mode === 'INSTALLMENT' ? 'First deposit' : 'Full order'),
      amount: Number(depositItem?.remaining_amount ?? depositItem?.amount ?? order.deposit_amount ?? order.total_amount ?? total ?? 0),
      helper: 'This bank invoice will be submitted for admin approval.',
    };
  }, [action, order, routeLabel, selectedInstallment, total]);

  const handleBankTransfer = async () => {
    if (!order) return;

    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    if (action === 'installment' && !installmentId) {
      setError('Installment ID is missing for this payment.');
      return;
    }

    setProcessing(true);
    setError('');
    setNotice('');
    try {
      const data = await initiateManualTransfer(token, {
        orderId: order.id,
        installmentId: action === 'installment' ? installmentId : null,
      });
      setBankDetails(data);
      setNotice('Invoice created. Use these details for transfer; the payment is now awaiting admin approval.');
    } catch (transferError) {
      const message =
        transferError && typeof transferError === 'object' && 'message' in transferError
          ? String((transferError as { message?: string }).message)
          : 'Could not generate transfer instructions.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Pressable style={styles.backLink} onPress={() => navigation.navigate('Orders')}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              <Text style={styles.backText}>Back to Orders</Text>
            </Pressable>

            <Text style={styles.title}>Bank Checkout</Text>
            <Text style={styles.subtitle}>Review the order and create a bank invoice for admin approval.</Text>

            {notice ? <Text style={styles.noticeTextTop}>{notice}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loadingOrder ? (
              <View style={styles.loadingCard}>
                <Spinner />
                <Text style={styles.loadingText}>Loading order...</Text>
              </View>
            ) : order ? (
              <>
                <View style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Order summary</Text>
                      <Text style={styles.orderId}>Order {order.id}</Text>
                    </View>
                    <View style={styles.modeBadge}>
                      <Text style={styles.modeBadgeText}>{order.payment_mode}</Text>
                    </View>
                  </View>

                  {(order.order_items ?? []).map((item, index) => (
                    <View key={item.id ?? `${order.id}-item-${index}`} style={styles.productRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName} numberOfLines={1}>{getItemName(item)}</Text>
                        <Text style={styles.productMeta}>Qty {item.quantity ?? 1}</Text>
                      </View>
                      <Text style={styles.productAmount}>{toNaira(item.amount ?? item.price ?? item.price_at_purchase)}</Text>
                    </View>
                  ))}

                  <View style={styles.summaryGrid}>
                    <InfoRow label="Total" value={toNaira(order.total_amount)} />
                    <InfoRow label="Paid" value={toNaira(order.paid_amount)} />
                    <InfoRow label="Remaining" value={toNaira(order.remaining_balance)} />
                  </View>
                </View>

                <View style={styles.bankCard}>
                  <View style={styles.bankHeader}>
                    <View style={styles.bankIcon}>
                      <Ionicons name="business-outline" size={20} color="#C084FC" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankTitle}>Bank invoice</Text>
                      <Text style={styles.bankSubtitle}>{paymentSummary.helper}</Text>
                    </View>
                  </View>

                  <View style={styles.bankRows}>
                    <InfoRow label="Invoice Type" value={paymentSummary.title} />
                    <InfoRow label="Payment Label" value={paymentSummary.label} />
                    <InfoRow label="Invoice Amount" value={toNaira(paymentSummary.amount)} highlight />
                  </View>

                  {bankDetails ? (
                    <>
                      <View style={styles.bankRows}>
                        <InfoRow label="Bank Name" value={bankDetails.bank_name} />
                        <InfoRow label="Account Name" value={bankDetails.account_name} />
                        <InfoRow label="Account Number" value={bankDetails.account_number} />
                        <InfoRow label="Amount" value={toNaira(bankDetails.amount)} highlight />
                        <InfoRow label="Invoice Reference" value={bankDetails.reference} highlight />
                      </View>

                      <View style={styles.noticeBox}>
                        <Text style={styles.noticeTitle}>Transfer narration</Text>
                        <Text style={styles.noticeText}>
                          Use the invoice reference as your transfer narration. Admin will review the bank transfer before updating the order.
                        </Text>
                      </View>

                      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Orders')}>
                        <Text style={styles.primaryButtonText}>Return to Orders</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={handleBankTransfer}
                      disabled={processing}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.pressed,
                        processing && styles.disabled,
                      ]}
                    >
                      {processing ? (
                        <View style={styles.loadingRow}>
                          <Spinner small />
                          <Text style={styles.primaryButtonText}>Creating invoice...</Text>
                        </View>
                      ) : (
                        <Text style={styles.primaryButtonText}>Create bank invoice</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 18,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginBottom: 12,
  },
  noticeTextTop: {
    color: '#34D399',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  orderCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  orderId: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  modeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(148,163,184,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  modeBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(2,6,23,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 10,
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  productMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  productAmount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryGrid: {
    gap: 10,
  },
  bankCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  bankHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  bankIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,132,252,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.2)',
  },
  bankTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  bankSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  bankRows: {
    gap: 10,
    marginBottom: 12,
  },
  infoRow: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(2,6,23,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  infoRowHighlight: {
    borderColor: 'rgba(59,130,246,0.22)',
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  infoValueHighlight: {
    color: '#93C5FD',
  },
  noticeBox: {
    marginTop: 2,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.16)',
  },
  noticeTitle: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeText: {
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },
});
