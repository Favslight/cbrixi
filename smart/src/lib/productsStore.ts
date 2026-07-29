import type { ProductDiscountFields } from './pricing';

export interface ProductVariant extends ProductDiscountFields {
  id: string;
  product_id?: string;
  name: string;
  specs?: Record<string, string | number | boolean>;
  sku?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductSpecificationItem {
  key: string;
  value: string | number | boolean;
}

export interface ProductSpecificationSection {
  section: string;
  items: ProductSpecificationItem[];
}

export interface Product extends ProductDiscountFields {
  id: string;
  name: string;
  description: string;
  specifications?: ProductSpecificationSection[];
  image: string;
  category: string;
  createdAt: string;
  gradient: string;
  minimum_deposit_percentage: number;
  installment_duration_months: number;
  installment_enabled: boolean;
  image_public_id?: string;
  image_urls?: string[];
  image_public_ids?: string[];
  image_url?: string | null;
  display_order?: number | null;
  has_variants?: boolean;
  default_variant_id?: string | null;
  variant_price_min?: string | number;
  variant_price_max?: string | number;
  variants?: ProductVariant[];
  is_active?: boolean;
  in_stock?: boolean;
}

/** Mutable list used only by local Next.js stub API routes. Starts empty — no demo catalog. */
export const products: Product[] = [];
