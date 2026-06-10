import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { API_BASE_URL } from '../services/api';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

type BankDetails = {
  reference: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  amount: number;
};

function Spinner({ small }: { small?: boolean }) {
  return <ActivityIndicator color={colors.textPrimary} size={small ? 'small' : 'large'} />;
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

function toDisplay(value: number): string {
  return `N${Math.round(value).toLocaleString()}`;
}

export function PaymentScreen({ navigation, route }: Props) {
  const { orderId, total, mode } = route.params;
  const amountDue = total;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  useEffect(() => {
    async function ensureSession() {
      const token = await storage.getString(storage.keys.userToken);
      if (!token) {
        navigation.replace('Login');
      }
    }

    ensureSession().catch(() => undefined);
  }, [navigation]);

  const handleBankTransfer = async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/payment/manual/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          installment_id: null,
        }),
      });

      const data = (await response.json()) as BankDetails & { message?: string };

      if (data.reference) {
        setBankDetails(data);
        return;
      }

      setError(data.message || 'Could not generate transfer instructions.');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    handleBankTransfer().catch(() => undefined);
    // Manual bank transfer is the only payment path for now.
  }, []);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              <Text style={styles.backText}>Back to Checkout</Text>
            </Pressable>

            <Text style={styles.title}>Payment</Text>
            <Text style={styles.subtitle}>Manual bank transfer is active for now.</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.amountCard}>
              <View>
                <Text style={styles.amountLabel}>
                  {mode === 'INSTALLMENT' ? 'Installment Amount' : 'Total Due'}
                </Text>
                <Text style={styles.amountValue}>{toDisplay(amountDue)}</Text>
                {mode === 'INSTALLMENT' ? (
                  <Text style={styles.amountHint}>The backend calculates the exact installment payment.</Text>
                ) : null}
              </View>
              <View style={styles.amountIcon}>
                <Ionicons name="card-outline" size={22} color={colors.primary} />
              </View>
            </View>

            {bankDetails ? (
              <View style={styles.bankCard}>
                <View style={styles.bankHeader}>
                  <View style={styles.bankIcon}>
                    <Ionicons name="business-outline" size={20} color="#C084FC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankTitle}>Bank Transfer Details</Text>
                    <Text style={styles.bankSubtitle}>
                      Transfer the exact amount below and use the reference code.
                    </Text>
                  </View>
                </View>

                <View style={styles.bankRows}>
                  <InfoRow label="Bank Name" value={bankDetails.bank_name} />
                  <InfoRow label="Account Name" value={bankDetails.account_name} />
                  <InfoRow label="Account Number" value={bankDetails.account_number} />
                  <InfoRow label="Amount" value={toDisplay(Number(bankDetails.amount))} highlight />
                  <InfoRow label="Reference" value={bankDetails.reference} highlight />
                </View>

                <View style={styles.noticeBox}>
                  <Text style={styles.noticeTitle}>Important</Text>
                  <Text style={styles.noticeText}>
                    Use the reference number in your transfer narration. An invoice has been sent to your email.
                  </Text>
                </View>

                <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
                  <Text style={styles.primaryButtonText}>Return to Home</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.bankCard}>
                <View style={styles.bankHeader}>
                  <View style={styles.bankIcon}>
                    <Ionicons name="business-outline" size={20} color="#C084FC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankTitle}>Generating Bank Details</Text>
                    <Text style={styles.bankSubtitle}>
                      We are preparing transfer instructions for this order.
                    </Text>
                  </View>
                </View>

                <View style={styles.bankRows}>
                  <InfoRow label="Order ID" value={String(orderId)} highlight />
                  <InfoRow label="Amount Due" value={toDisplay(amountDue)} highlight />
                  <InfoRow
                    label="Payment Type"
                    value={mode === 'INSTALLMENT' ? 'Installment deposit' : 'Full payment'}
                  />
                </View>

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
                      <Text style={styles.primaryButtonText}>Loading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Get Bank Details</Text>
                  )}
                </Pressable>
              </View>
            )}
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
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginBottom: 12,
  },
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 16,
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  amountValue: {
    color: '#93C5FD',
    fontSize: 32,
    fontWeight: '700',
  },
  amountHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  amountIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 14,
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
