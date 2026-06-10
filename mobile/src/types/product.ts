export type ApiProduct = {
  id?: string | number;
  name?: string;
  price?: string | number;
  description?: string;
  category?: string;
  image?: string;
  image_url?: string;
  image_urls?: string[];
  stock?: number;
  installment_enabled?: boolean;
  installment_duration_months?: number;
  minimum_deposit_percentage?: number;
  fine_percentage_on_default?: number;
  minimum_wallet_balance_required?: number;
  grace_period_days?: number;
};

export type ProductItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  priceValue: number;
  priceLabel: string;
  monthlyLabel: string;
  imageUri: string | null;
  imageUris: string[];
  stock: number;
  installmentEnabled: boolean;
  installmentDurationMonths: number;
  minimumDepositPercentage: number;
  finePercentageOnDefault: number;
  minimumWalletBalanceRequired: number;
  gracePeriodDays: number;
};
