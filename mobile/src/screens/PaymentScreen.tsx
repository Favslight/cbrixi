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
import { ScreenPreloader } from '../components/ScreenPreloader';
import { colors } from '../constants/theme';
import {
  confirmManualPayment,
  fetchMyOrders,
  getDepositScheduleItem,
  getPaymentSchedule,
  initiateManualInvoice,
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
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [invoice, setInvoice] = useState<ManualTransferResponse | null>(null);
  const [intentChecked, setIntentChecked] = useState(false);
  const [confirmedIntent, setConfirmedIntent] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createInvoice = useCallback(
    async (orderData: UserOrder) => {
      const token = await storage.getString(storage.keys.userToken);
      if (!token) return;

      setLoadingInvoice(true);
      setError('');
      const result = await initiateManualInvoice(token, {
        orderId: orderData.id,
        installmentId: action === 'installment' ? installmentId : null,
      });
      setLoadingInvoice(false);

      if (result.success && result.invoice) {
        setInvoice(result.invoice);
        setError('');
      } else {
        setInvoice(null);
        setError(result.error || 'Could not generate payment invoice.');
      }
    },
    [action, installmentId],
  );

  const loadOrder = useCallback(async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    if (!orderId) {
      navigation.navigate('Orders');
      return;
    }

    setLoadingOrder(true);
    setError('');
    try {
      const orders = await fetchMyOrders(token);
      const found = orders.find((candidate) => candidate.id === orderId) ?? null;
      if (!found) {
        setError('Order not found.');
        setOrder(null);
        return;
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

  useEffect(() => {
    if (!confirmedIntent || !order || invoice || loadingInvoice || submitted || error) {
      return;
    }
    createInvoice(order).catch(() => undefined);
  }, [confirmedIntent, createInvoice, error, invoice, loadingInvoice, order, submitted]);

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
      const summaryLabel =
        selectedInstallment.payment_label ??
        fmtMonth(selectedInstallment.due_date, selectedInstallment.installment_number);
      return {
        title: 'Month payment',
        label: summaryLabel,
        amount: Number(
          selectedInstallment.remaining_amount ??
            selectedInstallment.amount ??
            order.next_payment_amount ??
            0,
        ),
        helper: `This invoice is for ${summaryLabel}. Submit for admin review only after you have completed the bank transfer.`,
      };
    }

    if (action === 'complete') {
      return {
        title: 'Complete installment payment',
        label: routeLabel ?? 'Complete payment',
        amount: Number(order.remaining_balance ?? 0),
        helper:
          'This invoice covers the remaining balance. Submit for admin review only after you have transferred the funds.',
      };
    }

    const depositItem = order.payment_mode === 'INSTALLMENT' ? getDepositScheduleItem(order) : null;

    return {
      title: order.payment_mode === 'INSTALLMENT' ? 'Deposit payment' : 'Order payment',
      label:
        routeLabel ??
        depositItem?.payment_label ??
        (order.payment_mode === 'INSTALLMENT' ? 'First deposit' : 'Full order'),
      amount: Number(
        depositItem?.remaining_amount ??
          depositItem?.amount ??
          order.deposit_amount ??
          order.total_amount ??
          total ??
          0,
      ),
      helper: 'Submit for admin review only after you have completed the bank transfer.',
    };
  }, [action, order, routeLabel, selectedInstallment, total]);

  const handleSubmitPayment = async () => {
    if (!order || !transferConfirmed || !invoice) return;

    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    setProcessing(true);
    setError('');
    setNotice('');

    const result = await confirmManualPayment(token, {
      reference: invoice.reference,
      orderId: order.id,
      installmentId: action === 'installment' ? installmentId : null,
    });

    setProcessing(false);

    if (result.success) {
      setSubmitted(true);
      setNotice('Payment submitted for admin review. Keep your transfer reference safe.');
    } else {
      setError(result.error || 'Could not submit payment for review.');
    }
  };

  const isLoading = loadingOrder || (confirmedIntent && loadingInvoice && !invoice);

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
            <Text style={styles.subtitle}>
              {confirmedIntent
                ? 'Use the invoice reference as your transfer narration, then confirm after paying.'
                : 'Review the amount and confirm you intend to make this bank transfer before continuing.'}
            </Text>

            {notice ? <Text style={styles.noticeTextTop}>{notice}</Text> : null}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                {order && confirmedIntent && !invoice && !loadingInvoice ? (
                  <Pressable onPress={() => createInvoice(order)} style={styles.retryLink}>
                    <Text style={styles.retryLinkText}>Retry invoice generation</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.loadingCard}>
                <ScreenPreloader
                  fullScreen={false}
                  markSize={40}
                  message={loadingInvoice ? 'Generating invoice...' : 'Loading order...'}
                />
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
                        <Text style={styles.productName} numberOfLines={1}>
                          {getItemName(item)}
                        </Text>
                        <Text style={styles.productMeta}>Qty {item.quantity ?? 1}</Text>
                      </View>
                      <Text style={styles.productAmount}>
                        {toNaira(item.amount ?? item.price ?? item.price_at_purchase)}
                      </Text>
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
                      <Text style={styles.bankTitle}>
                        {confirmedIntent ? 'Payment invoice' : 'Confirm payment'}
                      </Text>
                      <Text style={styles.bankSubtitle}>{paymentSummary.helper}</Text>
                    </View>
                  </View>

                  <View style={styles.bankRows}>
                    <InfoRow label="Invoice Type" value={paymentSummary.title} />
                    <InfoRow label="Payment Label" value={paymentSummary.label} />
                    <InfoRow
                      label="Amount to pay now"
                      value={toNaira(invoice?.amount ?? paymentSummary.amount)}
                      highlight
                    />
                  </View>

                  {!confirmedIntent ? (
                    <>
                      <View style={styles.noticeBox}>
                        <Text style={styles.noticeTitle}>Before you continue</Text>
                        <Text style={styles.noticeText}>
                          On the next step you will receive a payment invoice with a unique reference
                          to use as your transfer narration. Admin is notified only after you confirm
                          you have completed the transfer.
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => setIntentChecked((value) => !value)}
                        style={styles.checkRow}
                      >
                        <View style={[styles.checkbox, intentChecked && styles.checkboxChecked]}>
                          {intentChecked ? (
                            <Ionicons name="checkmark" size={14} color={colors.textPrimary} />
                          ) : null}
                        </View>
                        <Text style={styles.checkText}>
                          I confirm I want to proceed with a bank transfer of{' '}
                          <Text style={styles.checkEm}>{toNaira(paymentSummary.amount)}</Text> for
                          this order.
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          if (!intentChecked) return;
                          setConfirmedIntent(true);
                        }}
                        disabled={!intentChecked}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          pressed && styles.pressed,
                          !intentChecked && styles.disabled,
                        ]}
                      >
                        <Text style={styles.primaryButtonText}>Continue to bank transfer</Text>
                      </Pressable>
                    </>
                  ) : !submitted ? (
                    <>
                      {invoice ? (
                        <View style={styles.bankRows}>
                          <InfoRow label="Bank Name" value={invoice.bank_name} />
                          <InfoRow label="Account Name" value={invoice.account_name} />
                          <InfoRow label="Account Number" value={invoice.account_number} />
                          <InfoRow label="Amount" value={toNaira(invoice.amount)} highlight />
                          <InfoRow
                            label="Invoice Reference"
                            value={invoice.reference}
                            highlight
                          />
                        </View>
                      ) : (
                        <View style={styles.noticeBox}>
                          <Text style={styles.noticeTitle}>Invoice unavailable</Text>
                          <Text style={styles.noticeText}>
                            Invoice could not be loaded. Please retry or contact support.
                          </Text>
                        </View>
                      )}

                      <View style={styles.noticeBox}>
                        <Text style={styles.noticeTitle}>Transfer narration</Text>
                        <Text style={styles.noticeText}>
                          Copy the invoice reference and paste it as your bank transfer narration.
                          Transfer the exact amount, then confirm below.
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => setTransferConfirmed((value) => !value)}
                        disabled={!invoice}
                        style={[styles.checkRow, !invoice && styles.disabled]}
                      >
                        <View
                          style={[styles.checkbox, transferConfirmed && styles.checkboxChecked]}
                        >
                          {transferConfirmed ? (
                            <Ionicons name="checkmark" size={14} color={colors.textPrimary} />
                          ) : null}
                        </View>
                        <Text style={styles.checkText}>
                          I have transferred{' '}
                          <Text style={styles.checkEm}>
                            {toNaira(invoice?.amount ?? paymentSummary.amount)}
                          </Text>{' '}
                          using reference{' '}
                          <Text style={styles.checkEm}>{invoice?.reference ?? '—'}</Text>.
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={handleSubmitPayment}
                        disabled={processing || !transferConfirmed || !invoice}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          pressed && styles.pressed,
                          (processing || !transferConfirmed || !invoice) && styles.disabled,
                        ]}
                      >
                        {processing ? (
                          <View style={styles.loadingRow}>
                            <Spinner small />
                            <Text style={styles.primaryButtonText}>Submitting...</Text>
                          </View>
                        ) : (
                          <Text style={styles.primaryButtonText}>I have made payment</Text>
                        )}
                      </Pressable>
                    </>
                  ) : (
                    <>
                      {invoice ? (
                        <View style={styles.bankRows}>
                          <InfoRow
                            label="Invoice Reference"
                            value={invoice.reference}
                            highlight
                          />
                        </View>
                      ) : null}
                      <View style={styles.successBox}>
                        <Text style={styles.successTitle}>Submitted for admin review</Text>
                        <Text style={styles.successText}>
                          Admin will verify your bank transfer and approve the payment. You can track
                          status from your orders page.
                        </Text>
                      </View>
                      <Pressable
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Orders')}
                      >
                        <Text style={styles.primaryButtonText}>Return to Orders</Text>
                      </Pressable>
                    </>
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
  errorBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
  },
  retryLink: {
    marginTop: 8,
  },
  retryLinkText: {
    color: '#FECACA',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
    marginBottom: 12,
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
  successBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
  },
  successTitle: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  successText: {
    color: '#A7F3D0',
    fontSize: 12,
    lineHeight: 18,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(2,6,23,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  checkEm: {
    color: colors.textPrimary,
    fontWeight: '700',
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
