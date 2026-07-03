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
}

// In-memory product store for the admin dashboard.
// In production, replace with a real database (e.g. Prisma + PostgreSQL).
export const products: Product[] = [
  { id: '1', name: 'CBRIXI Smartwatch Series X', price: 'N299', description: 'Track your health, fitness, and stay connected.', image: '/images/smartwatch.png', image_urls: ['/images/smartwatch.png'], category: 'Smart Watches', createdAt: '2026-03-01', gradient: 'from-blue-500/20 to-purple-500/20', minimum_deposit_percentage: 20, installment_duration_months: 12, installment_enabled: true },
  { id: '2', name: 'CBRIXI Pro Earbuds', price: 'N149', description: 'Studio-quality sound with active noise cancellation.', image: '/images/earbuds.png', image_urls: ['/images/earbuds.png'], category: 'Audio Devices', createdAt: '2026-03-01', gradient: 'from-purple-500/20 to-pink-500/20', minimum_deposit_percentage: 15, installment_duration_months: 6, installment_enabled: true },
  { id: '3', name: 'CBRIXI AI Glasses', price: 'N499', description: 'Augmented reality wearable with integrated AI assistant.', image: '/images/glasses.png', image_urls: ['/images/glasses.png'], category: 'Accessories', createdAt: '2026-03-01', gradient: 'from-cyan-500/20 to-blue-500/20', minimum_deposit_percentage: 25, installment_duration_months: 18, installment_enabled: true },
  { id: '4', name: 'CBRIXI Vision Laptop', price: 'N1299', description: 'Neural processor laptop for maximum creative performance.', image: '/images/laptop.png', image_urls: ['/images/laptop.png'], category: 'Smart Home', createdAt: '2026-03-02', gradient: 'from-emerald-500/20 to-cyan-500/20', minimum_deposit_percentage: 30, installment_duration_months: 24, installment_enabled: true },
  { id: '5', name: 'CBRIXI Smart Phone Z', price: 'N899', description: 'Professional camera system and ultra-efficient chipset.', image: '/images/smartphone.png', image_urls: ['/images/smartphone.png'], category: 'Smart Phones', createdAt: '2026-03-02', gradient: 'from-orange-500/20 to-red-500/20', minimum_deposit_percentage: 20, installment_duration_months: 12, installment_enabled: true },
  { id: '6', name: 'CBRIXI Home Speaker', price: 'N199', description: 'Room-filling spatial audio with built-in voice assistant.', image: '/images/speaker.png', image_urls: ['/images/speaker.png'], category: 'Audio Devices', createdAt: '2026-03-03', gradient: 'from-fuchsia-500/20 to-purple-500/20', minimum_deposit_percentage: 10, installment_duration_months: 6, installment_enabled: true },
];
