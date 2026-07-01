import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { colors } from '../constants/theme';
import {
  cartItemLineTotal,
  cartItemUnitPrice,
  checkoutCart,
  deleteCartItem,
  fetchCart,
  toNaira,
  updateCartItemQuantity,
} from '../services/cart';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';
import type { CartItem } from '../services/cart';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const fallbackProductImage = require('../../assets/images/smartphone.png');

function PaymentCard({
  title,
  subtitle,
  amount,
  active,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  amount: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.paymentCard,
        active && styles.paymentCardActive,
        disabled && styles.paymentCardDisabled,
      ]}
    >
      <View style={styles.paymentCardHeader}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <View style={[styles.radio, active && styles.radioActive, disabled && styles.radioDisabled]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
      </View>
      <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      <Text style={styles.paymentAmount}>{amount}</Text>
    </Pressable>
  );
}

export function CartScreen({ navigation, route }: Props) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [externalEmail, setExternalEmail] = useState('');
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'INSTALLMENT'>(
    route.params?.initialPaymentMode ?? 'FULL',
  );

  const loadCart = useCallback(async (isRefresh = false) => {
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
      const items = await fetchCart(token);
      setCartItems(items);
    } catch {
      setError('Unable to load cart right now.');
      setCartItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadCart().catch(() => undefined);
    }, [loadCart]),
  );

  useEffect(() => {
    const installmentAllowed =
      cartItems.length > 0 && cartItems.every((item) => item.installment_enabled !== false);
    if (!installmentAllowed && paymentMode === 'INSTALLMENT') {
      setPaymentMode('FULL');
    }
  }, [cartItems, paymentMode]);

  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + cartItemLineTotal(item), 0),
    [cartItems],
  );

  const totalQuantity = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  const installmentAllowed =
    cartItems.length > 0 && cartItems.every((item) => item.installment_enabled !== false);
  const installmentMonths = useMemo(() => {
    const months = cartItems
      .map((item) => item.installment_duration_months || 6)
      .filter((value) => value > 0);
    return months.length ? Math.max(...months) : 6;
  }, [cartItems]);
  const ensureToken = async (): Promise<string | null> => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return null;
    }
    return token;
  };

  const updateQuantity = async (itemId: string, nextQuantity: number) => {
    if (nextQuantity < 1) return;

    const token = await ensureToken();
    if (!token) return;

    setUpdatingId(itemId);
    setError('');
    try {
      await updateCartItemQuantity(token, itemId, nextQuantity);
      setCartItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item)),
      );
    } catch {
      setError('Failed to update item quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (item: CartItem) => {
    const token = await ensureToken();
    if (!token) return;

    const itemId = item.cart_item_id ?? item.id;
    setUpdatingId(itemId);
    setError('');
    try {
      await deleteCartItem(token, itemId, item.product_id);
      setCartItems((current) =>
        current.filter(
          (cartItem) =>
            (cartItem.cart_item_id ?? cartItem.id) !== itemId && cartItem.product_id !== item.product_id,
        ),
      );
      await loadCart(true);
    } catch (removeError) {
      setError(
        removeError && typeof removeError === 'object' && 'message' in removeError
          ? String((removeError as { message?: string }).message)
          : 'Failed to remove item.',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const proceedToCheckout = async () => {
    if (!cartItems.length) {
      Alert.alert('Cart is empty', 'Add at least one product before checkout.');
      return;
    }

    if (paymentMode === 'INSTALLMENT' && !externalEmail.trim()) {
      setError('Please provide an email to verify your installment plan.');
      return;
    }

    if (paymentMode === 'INSTALLMENT' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalEmail.trim())) {
      setError('Please provide an email to verify your installment plan.');
      return;
    }

    const token = await ensureToken();
    if (!token) return;

    setSubmitting(true);
    setError('');
    try {
      const response = await checkoutCart(token, paymentMode, externalEmail.trim() || undefined);
      const orderId = response.order?.order?.id;
      if (!response.success || !orderId) {
        throw new Error(response.message || 'Checkout failed.');
      }

      if (paymentMode === 'INSTALLMENT') {
        Alert.alert(
          'Installment request pending admin approval',
          'Payment will be enabled on your Orders page after your Cbrilliance email is approved.',
        );
        navigation.navigate('Orders');
        return;
      }

      navigation.navigate('Payment', {
        orderId,
        total,
        mode: paymentMode,
        action: 'order',
      });
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCart(true)} tintColor={colors.primary} />}
            ListHeaderComponent={
              <View>
                <View style={styles.topBar}>
                  <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.headerTitle}>Cart</Text>
                  <View style={styles.backButton}>
                    <Ionicons name="cart-outline" size={16} color={colors.textPrimary} />
                  </View>
                </View>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                {loading ? <Text style={styles.loadingText}>Loading cart...</Text> : null}

                {!loading && cartItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="bag-outline" size={38} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>Pick a product from Home or the product modal to start shopping.</Text>
                    <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('Home')}>
                      <Text style={styles.emptyButtonText}>Start Shopping</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => {
              const lineTotal = cartItemLineTotal(item);
              const unitPrice = cartItemUnitPrice(item);

              return (
                <View style={styles.itemCard}>
                  <View style={styles.itemImageWrap}>
                    <Image
                      source={
                        item.image_url
                          ? { uri: item.image_url }
                          : item.image
                            ? { uri: item.image }
                            : fallbackProductImage
                      }
                      resizeMode="cover"
                      style={styles.itemImage}
                    />
                  </View>

                  <View style={styles.itemBody}>
                    <View style={styles.itemTopRow}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Pressable
                        disabled={updatingId === (item.cart_item_id ?? item.id)}
                        onPress={() => removeItem(item)}
                        style={[styles.removeButton, updatingId === (item.cart_item_id ?? item.id) && styles.disabled]}
                      >
                        {updatingId === (item.cart_item_id ?? item.id) ? (
                          <Text style={styles.removeLoadingText}>...</Text>
                        ) : (
                          <Ionicons name="trash-outline" size={16} color="#FCA5A5" />
                        )}
                      </Pressable>
                    </View>

                    <Text style={styles.itemPrice}>{toNaira(unitPrice)}</Text>

                    <View style={styles.qtyRow}>
                      <Pressable
                        disabled={updatingId === item.id || item.quantity <= 1}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        style={styles.qtyButton}
                      >
                        <Ionicons name="remove" size={16} color={colors.textPrimary} />
                      </Pressable>
                      <View style={styles.qtyCountBox}>
                        <Text style={styles.qtyCountText}>
                          {updatingId === item.id ? '...' : item.quantity}
                        </Text>
                      </View>
                      <Pressable
                        disabled={updatingId === item.id}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        style={styles.qtyButton}
                      >
                        <Ionicons name="add" size={16} color={colors.textPrimary} />
                      </Pressable>
                    </View>

                    {item.installment_enabled ? (
                      <View style={styles.installmentPill}>
                    <Text style={styles.installmentPillText}>
                      Financing available ({item.minimum_deposit_percentage}% deposit)
                    </Text>
                  </View>
                    ) : null}

                    <Text style={styles.lineTotal}>{toNaira(lineTotal)}</Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              <View>
                {cartItems.length > 0 ? (
                  <>
                    <View style={styles.paymentSection}>
                      <Text style={styles.sectionTitle}>Payment Method</Text>
                      <View style={styles.paymentGrid}>
                        <PaymentCard
                          title="Full Payment"
                          subtitle="Pay the total amount now."
                          amount={toNaira(total)}
                          active={paymentMode === 'FULL'}
                          onPress={() => setPaymentMode('FULL')}
                        />
                      <PaymentCard
                        title="EasyBuy"
                        subtitle={`Split over ${installmentMonths} months after approval.`}
                        amount="Approval required"
                        active={paymentMode === 'INSTALLMENT'}
                        disabled={!installmentAllowed}
                        onPress={() => setPaymentMode('INSTALLMENT')}
                      />
                    </View>

                    {paymentMode === 'INSTALLMENT' && installmentAllowed ? (
                      <View style={styles.emailSection}>
                        <Text style={styles.emailLabel}>Cbrilliance email for approval</Text>
                      <TextInput
                        value={externalEmail}
                        onChangeText={(value) => setExternalEmail(value)}
                        placeholder="user@cbrilliance.io"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                          style={styles.emailInput}
                        />
                    <Text style={styles.emailHelp}>
                      Cbrixi will use this email to review and approve your installment plan.
                    </Text>
                      </View>
                    ) : null}

                    {paymentMode === 'INSTALLMENT' && installmentAllowed ? (
                      <View style={styles.paymentHint}>
                        <Text style={styles.paymentHintTitle}>Installment setup</Text>
                          <Text style={styles.paymentHintText}>
                            Payment starts after admin approval.
                          </Text>
                          <Text style={styles.paymentHintText}>
                            The backend will calculate the required deposit and remaining balance.
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.summaryCard}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total</Text>
                        <Text style={styles.summaryValue}>{toNaira(total)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Items</Text>
                        <Text style={styles.summaryValue}>{totalQuantity}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={proceedToCheckout}
                      disabled={submitting}
                      style={({ pressed }) => [
                        styles.checkoutButton,
                        pressed && styles.pressed,
                        submitting && styles.disabled,
                      ]}
                    >
                      <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            }
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
            <Pressable style={styles.bottomNavItemActive}>
              <View style={styles.activeCartBubble}>
                <Ionicons name="cart" size={18} color={colors.background} />
              </View>
            </Pressable>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Orders')}>
              <Ionicons name="receipt-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Orders</Text>
            </Pressable>
          </View>
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
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
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
  emptyState: {
    marginTop: 24,
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
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 12,
  },
  itemImageWrap: {
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  removeButton: {
    padding: 2,
  },
  removeLoadingText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  itemPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCountBox: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCountText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  installmentPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
  },
  installmentPillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  lineTotal: {
    color: '#93C5FD',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  paymentSection: {
    marginTop: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  emailSection: {
    marginTop: 12,
    gap: 8,
  },
  emailLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  emailInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    color: colors.textPrimary,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  emailHelp: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  paymentCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(2,6,23,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  paymentCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  paymentCardDisabled: {
    opacity: 0.45,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  paymentSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  paymentAmount: {
    color: '#93C5FD',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioDisabled: {
    borderColor: 'rgba(148,163,184,0.2)',
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
  },
  paymentHint: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    gap: 4,
  },
  paymentHintTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentHintText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  checkoutButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  checkoutButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
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
    width: 60,
    height: 60,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCartBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bottomLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },
});
