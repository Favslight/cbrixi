import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppBackground } from '../components/AppBackground';
import { colors } from '../constants/theme';
import { getFavoriteProducts, toggleFavoriteProduct } from '../services/favorites';
import { fetchProducts } from '../services/products';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';
import type { ProductItem } from '../types/product';
import { toErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const fallbackProductImage = require('../../assets/images/smartphone.png');

function mapCategoryToChip(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('phone')) return 'Phones';
  if (c.includes('watch')) return 'Watches';
  if (c.includes('laptop')) return 'Laptops';
  if (c.includes('audio') || c.includes('earbud') || c.includes('speaker')) return 'Audio';
  if (c.includes('accessor')) return 'Accessories';
  return category;
}

export function HomeScreen({ navigation }: Props) {
  const [searchText, setSearchText] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('User');
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({});

  const loadProducts = useCallback(async (asRefresh = false) => {
    try {
      if (asRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const [userToken, adminToken, userData] = await Promise.all([
        storage.getString(storage.keys.userToken),
        storage.getString(storage.keys.adminToken),
        storage.getString(storage.keys.userData),
      ]);

      if (userData) {
        try {
          const parsed = JSON.parse(userData) as { firstname?: string; username?: string };
          setFirstName(parsed.firstname?.trim() || parsed.username?.trim() || 'User');
        } catch {
          setFirstName('User');
        }
      }

      const token = userToken || adminToken || undefined;
      const list = await fetchProducts(token);
      setProducts(list);
    } catch (fetchError) {
      setError(toErrorMessage(fetchError, 'Unable to load products right now.'));
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts().catch(() => undefined);
  }, [loadProducts]);

  useEffect(() => {
    async function loadFavorites() {
      const favorites = await getFavoriteProducts();
      const nextState = favorites.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {});
      setFavoriteIds(nextState);
    }

    loadFavorites().catch(() => undefined);
  }, []);

  const categoryChips = useMemo(() => {
    const dynamic = Array.from(new Set(products.map((p) => mapCategoryToChip(p.category))));
    const preferred = ['All', 'Phones', 'Watches', 'Laptops', 'Audio', 'Accessories'];

    const ordered = preferred.filter((chip) => chip === 'All' || dynamic.includes(chip));
    const extra = dynamic.filter((chip) => !ordered.includes(chip));
    return [...ordered, ...extra];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeChip !== 'All') {
      result = result.filter((item) => mapCategoryToChip(item.category) === activeChip);
    }

    const q = searchText.trim().toLowerCase();
    if (!q) {
      return result;
    }

    return result.filter((item) => {
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    });
  }, [products, activeChip, searchText]);

  const logout = async () => {
    await storage.multiRemove([
      storage.keys.userToken,
      storage.keys.adminToken,
      storage.keys.userData,
      storage.keys.adminName,
    ]);
    navigation.replace('Login');
  };

  const onToggleFavorite = async (product: ProductItem) => {
    const result = await toggleFavoriteProduct(product);
    setFavoriteIds((current) => ({
      ...current,
      [product.id]: result.isFavorite,
    }));
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProducts(true)} tintColor={colors.primary} />}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                <View style={styles.topRow}>
                  <Text style={styles.greetingText}>Hi {firstName}</Text>
                  <View style={styles.headerActions}>
                    <Pressable style={styles.iconButton}>
                      <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
                    </Pressable>
                    <Pressable style={styles.iconButton} onPress={logout}>
                      <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.searchWrap}>
                  <Ionicons name="search-outline" size={17} color={colors.textMuted} style={styles.searchIcon} />
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {categoryChips.map((chip) => {
                    const active = chip === activeChip;
                    return (
                      <Pressable key={chip} onPress={() => setActiveChip(chip)} style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.heroCard}>
                  <Text style={styles.heroTitle}>New Arrivals</Text>
                  <Text style={styles.heroSubTitle}>Premium tech from N14,999/month</Text>
                </View>

                <Text style={styles.sectionTitle}>Products</Text>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                {!loading && filteredProducts.length === 0 && (
                  <Text style={styles.emptyText}>No products found for this filter.</Text>
                )}
              </View>
            }
            renderItem={({ item }) => {
              return (
                <Pressable
                  style={styles.card}
                  onPress={() => navigation.navigate('ProductDetails', { product: item })}
                >
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={item.imageUri ? { uri: item.imageUri } : fallbackProductImage}
                      resizeMode="cover"
                      style={styles.cardImage}
                    />
                    <Pressable style={styles.favoriteBadge} onPress={() => onToggleFavorite(item)}>
                      <Ionicons
                        name={favoriteIds[item.id] ? 'heart' : 'heart-outline'}
                        size={14}
                        color={favoriteIds[item.id] ? '#F87171' : colors.textPrimary}
                      />
                    </Pressable>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                      {item.category}
                    </Text>
                    <Text style={styles.cardPrice}>{item.priceLabel}</Text>
                    <Text style={styles.cardMonthly}>{item.monthlyLabel}</Text>
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={loading ? <Text style={styles.loadingText}>Loading products...</Text> : null}
          />

          <View style={styles.bottomNav}>
            <Pressable style={styles.bottomNavItem}>
              <Ionicons name="home" size={18} color={colors.textPrimary} />
              <Text style={[styles.bottomLabel, styles.bottomLabelActive]}>Home</Text>
            </Pressable>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Favorites')}>
              <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Wishlist</Text>
            </Pressable>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Cart</Text>
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
    paddingBottom: 100,
  },
  headerContent: {
    paddingTop: 2,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greetingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  searchWrap: {
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(15,23,42,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  chipRow: {
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    minHeight: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  chipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#2563EB',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.textPrimary,
  },
  heroCard: {
    borderRadius: 14,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubTitle: {
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  loadingText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  columnWrap: {
    gap: 10,
  },
  card: {
    flex: 1,
    maxWidth: '50%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 10,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1E293B',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  cardBody: {
    paddingHorizontal: 9,
    paddingVertical: 10,
  },
  cardName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    minHeight: 30,
  },
  cardCategory: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  cardPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  cardMonthly: {
    color: '#60A5FA',
    fontSize: 10,
    marginTop: 1,
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
  bottomLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  bottomLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
