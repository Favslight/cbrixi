import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppBackground } from '../components/AppBackground';
import { colors } from '../constants/theme';
import { getFavoriteProducts, removeFavoriteProduct } from '../services/favorites';
import type { RootStackParamList } from '../types/navigation';
import type { ProductItem } from '../types/product';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

const fallbackProductImage = require('../../assets/images/smartphone.png');

export function FavoritesScreen({ navigation }: Props) {
  const [favorites, setFavorites] = useState<ProductItem[]>([]);

  const loadFavorites = useCallback(async () => {
    const list = await getFavoriteProducts();
    setFavorites(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites().catch(() => undefined);
    }, [loadFavorites]),
  );

  const onRemove = async (productId: string) => {
    const updated = await removeFavoriteProduct(productId);
    setFavorites(updated);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<Text style={styles.headerTitle}>Favorites</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>No favorite products yet. Tap heart on Home to add.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardImageWrap}>
                  <Image
                    source={item.imageUri ? { uri: item.imageUri } : fallbackProductImage}
                    resizeMode="cover"
                    style={styles.cardImage}
                  />
                  <Pressable style={styles.favoriteBadge} onPress={() => onRemove(item.id)}>
                    <Ionicons name="heart" size={14} color="#F87171" />
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
              </View>
            )}
          />

          <View style={styles.bottomNav}>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="home-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.bottomLabel}>Home</Text>
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <Ionicons name="heart" size={18} color={colors.textPrimary} />
              <Text style={[styles.bottomLabel, styles.bottomLabelActive]}>Wishlist</Text>
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
    paddingTop: 4,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 16,
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
