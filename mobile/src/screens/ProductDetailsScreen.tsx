import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { colors } from '../constants/theme';
import { addToCart, toNaira } from '../services/cart';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';
import type { ProductItem } from '../types/product';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const fallbackProductImage = require('../../assets/images/smartphone.png');

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailChip}>
      <Text style={styles.detailChipLabel}>{label}</Text>
      <Text style={styles.detailChipValue}>{value}</Text>
    </View>
  );
}

function PlanCard({
  title,
  subtitle,
  amount,
  active,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
  amount: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.planCard,
        active && styles.planCardActive,
        disabled && styles.planCardDisabled,
      ]}
    >
      <View style={styles.planCardHeader}>
        <Text style={styles.planTitle}>{title}</Text>
        <View style={[styles.radio, active && styles.radioActive, disabled && styles.radioDisabled]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
      </View>
      <Text style={styles.planSubtitle}>{disabled ? 'Not available for this product.' : subtitle}</Text>
      <Text style={[styles.planAmount, active && styles.planAmountActive]}>{amount}</Text>
    </Pressable>
  );
}

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { product } = route.params;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [selectedPlan, setSelectedPlan] = useState<'FULL' | 'INSTALLMENT'>(
    product.installmentEnabled &&
      product.installmentDurationMonths > 0 &&
      product.minimumDepositPercentage > 0
      ? 'INSTALLMENT'
      : 'FULL',
  );
  const [busyAction, setBusyAction] = useState<'cart' | 'buy' | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = useMemo(() => {
    if (product.imageUris.length) {
      return product.imageUris;
    }
    return product.imageUri ? [product.imageUri] : [];
  }, [product.imageUri, product.imageUris]);

  const canUseInstallment =
    product.installmentEnabled &&
    product.installmentDurationMonths > 0 &&
    product.minimumDepositPercentage > 0;

  const firstPayment = useMemo(() => {
    if (!canUseInstallment) {
      return null;
    }
    return Math.round((product.priceValue * product.minimumDepositPercentage) / 100);
  }, [canUseInstallment, product.minimumDepositPercentage, product.priceValue]);

  const installmentMonthlyEstimate = useMemo(() => {
    if (!canUseInstallment) {
      return product.priceLabel;
    }

    const months = product.installmentDurationMonths;
    const monthly = product.priceValue / months;
    return `${toNaira(monthly)}/mo`;
  }, [canUseInstallment, product.installmentDurationMonths, product.priceLabel, product.priceValue]);
  const imageHeight = Math.min(Math.max(height * 0.24, 170), 240);
  const contentBottomPadding = 132 + insets.bottom;
  const actionsBottom = Math.max(12, insets.bottom + 10);

  const openCart = (plan: 'FULL' | 'INSTALLMENT') => {
    navigation.navigate('Cart', { initialPaymentMode: plan });
  };

  const ensureToken = async (): Promise<string | null> => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return null;
    }
    return token;
  };

  const handleAddToCart = async () => {
    if (busyAction) return;
    setBusyAction('cart');

    try {
      const token = await ensureToken();
      if (!token) return;

      await addToCart(token, product.id, 1);
      Alert.alert('Added to cart', `${product.name} has been added to your cart.`);
    } catch {
      Alert.alert('Could not add item', 'Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleBuyNow = async () => {
    if (busyAction) return;
    setBusyAction('buy');

    try {
      const token = await ensureToken();
      if (!token) return;

      await addToCart(token, product.id, 1);
      openCart(selectedPlan);
    } catch {
      Alert.alert('Could not continue', 'Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Product Details</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.imageSection}>
            <View style={styles.imageCard}>
              <Image
                source={images[selectedImageIndex] ? { uri: images[selectedImageIndex] } : fallbackProductImage}
                resizeMode="cover"
                style={[styles.mainImage, { height: imageHeight }]}
              />
            </View>

            {images.length > 1 ? (
              <>
                <View style={styles.galleryMetaRow}>
                  <Text style={styles.galleryMetaText}>Image {selectedImageIndex + 1} of {images.length}</Text>
                  <Text style={styles.galleryMetaText}>{product.category}</Text>
                </View>
                <View style={styles.thumbnailRow}>
                  {images.map((imageUri, index) => {
                    const active = index === selectedImageIndex;
                    return (
                      <Pressable
                        key={`${imageUri}-${index}`}
                        onPress={() => setSelectedImageIndex(index)}
                        style={[styles.thumbnail, active && styles.thumbnailActive]}
                      >
                        <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.thumbnailImage} />
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.priceLabel}>{product.priceLabel}</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.detailGrid}>
              <DetailChip label="Category" value={product.category} />
              {canUseInstallment ? (
                <>
                  <DetailChip label="Duration" value={`${product.installmentDurationMonths} months`} />
                  <DetailChip label="Min Deposit" value={`${product.minimumDepositPercentage}%`} />
                  <DetailChip
                    label="First Payment"
                    value={firstPayment !== null ? toNaira(firstPayment) : '—'}
                  />
                </>
              ) : (
                <DetailChip label="Installment" value="Unavailable" />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Setup</Text>
            <PlanCard
              title="Full Payment"
              subtitle="Pay the full amount now and complete your order immediately."
              amount={product.priceLabel}
              active={selectedPlan === 'FULL'}
              onPress={() => setSelectedPlan('FULL')}
            />
            <PlanCard
              title="EasyBuy Option"
              subtitle={
                canUseInstallment
                  ? `First payment ${firstPayment !== null ? toNaira(firstPayment) : '—'} (${product.minimumDepositPercentage}%), ${product.installmentDurationMonths} months.`
                  : 'Installment unavailable'
              }
              amount={installmentMonthlyEstimate}
              active={selectedPlan === 'INSTALLMENT'}
              disabled={!canUseInstallment}
              onPress={() => setSelectedPlan('INSTALLMENT')}
            />

            {selectedPlan === 'INSTALLMENT' && canUseInstallment ? (
              <View style={styles.installmentBox}>
                <Text style={styles.installmentTitle}>Installment details</Text>
                <Text style={styles.installmentText}>
                  First payment: {firstPayment !== null ? toNaira(firstPayment) : '—'} (
                  {product.minimumDepositPercentage}%)
                </Text>
                <Text style={styles.installmentText}>
                  Duration: {product.installmentDurationMonths} months
                </Text>
                <Text style={styles.installmentText}>
                  Submit your Cbrilliance email at checkout for approval before payment is collected.
                </Text>
              </View>
            ) : null}
          </View>
          </ScrollView>

          <View style={[styles.actionsBar, { bottom: actionsBottom }]}>
            <Pressable
              onPress={handleAddToCart}
              disabled={!!busyAction}
              style={({ pressed }) => [
                styles.iconAction,
                pressed && styles.pressed,
                busyAction && styles.disabled,
              ]}
            >
              {busyAction === 'cart' ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Ionicons name="cart-outline" size={20} color={colors.textPrimary} />
              )}
            </Pressable>

            <Pressable
              onPress={handleBuyNow}
              disabled={!!busyAction}
              style={({ pressed }) => [
                styles.buyNowButton,
                pressed && styles.pressed,
                busyAction && styles.disabled,
              ]}
            >
              {busyAction === 'buy' ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Ionicons name="bag-check-outline" size={18} color={colors.textPrimary} />
              )}
              <Text style={styles.buyNowText}>{busyAction === 'buy' ? 'Adding...' : 'Buy Now'}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  imageCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  imageSection: {
    marginTop: 2,
  },
  mainImage: {
    width: '100%',
  },
  galleryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  galleryMetaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 0,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    opacity: 0.7,
  },
  thumbnailActive: {
    borderColor: colors.primary,
    opacity: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginTop: 18,
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  priceLabel: {
    color: '#93C5FD',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailChip: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  detailChipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  detailChipValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  planCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 10,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  planCardDisabled: {
    opacity: 0.45,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  planTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
  },
  planSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  planAmount: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  planAmountActive: {
    color: '#93C5FD',
  },
  installmentBox: {
    marginTop: 8,
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    gap: 6,
  },
  installmentTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  installmentText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  actionsBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconAction: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  buyNowButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyNowText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },
});
