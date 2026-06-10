import { storage } from './storage';
import type { ProductItem } from '../types/product';

type FavoriteList = ProductItem[];

function parseFavorites(raw: string | null): FavoriteList {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ProductItem => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<ProductItem>;
      return typeof candidate.id === 'string' && typeof candidate.name === 'string';
    });
  } catch {
    return [];
  }
}

export async function getFavoriteProducts(): Promise<FavoriteList> {
  const raw = await storage.getString(storage.keys.favoriteProducts);
  return parseFavorites(raw);
}

export async function setFavoriteProducts(products: FavoriteList): Promise<void> {
  await storage.setString(storage.keys.favoriteProducts, JSON.stringify(products));
}

export async function toggleFavoriteProduct(product: ProductItem): Promise<{ products: FavoriteList; isFavorite: boolean }> {
  const current = await getFavoriteProducts();
  const exists = current.some((entry) => entry.id === product.id);

  const updated = exists
    ? current.filter((entry) => entry.id !== product.id)
    : [product, ...current];

  await setFavoriteProducts(updated);

  return {
    products: updated,
    isFavorite: !exists,
  };
}

export async function removeFavoriteProduct(productId: string): Promise<FavoriteList> {
  const current = await getFavoriteProducts();
  const updated = current.filter((entry) => entry.id !== productId);
  await setFavoriteProducts(updated);
  return updated;
}
