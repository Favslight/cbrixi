import type { ProductDiscountFields } from './pricing';

export interface ProductVariant extends ProductDiscountFields {
  id: string;
  product_id?: string;
  name: string;
  specs?: Record<string, string | number | boolean>;
  sku?: string | null;
  stock: number;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface Product extends ProductDiscountFields {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  createdAt: string;
  gradient: string;
  minimum_deposit_percentage: number;
  installment_duration_months: number;
  fine_percentage_on_default: number;
  stock: number;
  installment_enabled: boolean;
  minimum_wallet_balance_required: number;
  grace_period_days: number;
  image_public_id?: string;
  image_urls?: string[];
  image_public_ids?: string[];
  image_url?: string | null;
  has_variants?: boolean;
  default_variant_id?: string | null;
  variant_price_min?: string | number;
  variant_price_max?: string | number;
  variants?: ProductVariant[];
}

// In-memory product store for the admin dashboard.
// In production, replace with a real database (e.g. Prisma + PostgreSQL).
export const products: Product[] = [
  { id: '1', name: 'CBRIXI Smartwatch Series X', price: 'N299', description: 'Track your health, fitness, and stay connected.', image: '/images/smartwatch.png', image_urls: ['/images/smartwatch.png'], category: 'Smart Watches', createdAt: '2026-03-01', gradient: 'from-blue-500/20 to-purple-500/20', minimum_deposit_percentage: 20, installment_duration_months: 12, fine_percentage_on_default: 5, stock: 50, installment_enabled: true, minimum_wallet_balance_required: 50, grace_period_days: 7 },
  { id: '2', name: 'CBRIXI Pro Earbuds', price: 'N149', description: 'Studio-quality sound with active noise cancellation.', image: '/images/earbuds.png', image_urls: ['/images/earbuds.png'], category: 'Audio Devices', createdAt: '2026-03-01', gradient: 'from-purple-500/20 to-pink-500/20', minimum_deposit_percentage: 15, installment_duration_months: 6, fine_percentage_on_default: 3, stock: 100, installment_enabled: true, minimum_wallet_balance_required: 30, grace_period_days: 5 },
  { id: '3', name: 'CBRIXI AI Glasses', price: 'N499', description: 'Augmented reality wearable with integrated AI assistant.', image: '/images/glasses.png', image_urls: ['/images/glasses.png'], category: 'Accessories', createdAt: '2026-03-01', gradient: 'from-cyan-500/20 to-blue-500/20', minimum_deposit_percentage: 25, installment_duration_months: 18, fine_percentage_on_default: 7, stock: 20, installment_enabled: true, minimum_wallet_balance_required: 100, grace_period_days: 10 },
  { id: '4', name: 'CBRIXI Vision Laptop', price: 'N1299', description: 'Neural processor laptop for maximum creative performance.', image: '/images/laptop.png', image_urls: ['/images/laptop.png'], category: 'Smart Home', createdAt: '2026-03-02', gradient: 'from-emerald-500/20 to-cyan-500/20', minimum_deposit_percentage: 30, installment_duration_months: 24, fine_percentage_on_default: 10, stock: 10, installment_enabled: true, minimum_wallet_balance_required: 200, grace_period_days: 14 },
  { id: '5', name: 'CBRIXI Smart Phone Z', price: 'N899', description: 'Professional camera system and ultra-efficient chipset.', image: '/images/smartphone.png', image_urls: ['/images/smartphone.png'], category: 'Smart Phones', createdAt: '2026-03-02', gradient: 'from-orange-500/20 to-red-500/20', minimum_deposit_percentage: 20, installment_duration_months: 12, fine_percentage_on_default: 5, stock: 30, installment_enabled: true, minimum_wallet_balance_required: 150, grace_period_days: 7 },
  { id: '6', name: 'CBRIXI Home Speaker', price: 'N199', description: 'Room-filling spatial audio with built-in voice assistant.', image: '/images/speaker.png', image_urls: ['/images/speaker.png'], category: 'Audio Devices', createdAt: '2026-03-03', gradient: 'from-fuchsia-500/20 to-purple-500/20', minimum_deposit_percentage: 10, installment_duration_months: 6, fine_percentage_on_default: 2, stock: 75, installment_enabled: true, minimum_wallet_balance_required: 40, grace_period_days: 3 },
];
