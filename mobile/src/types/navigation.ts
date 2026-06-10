export type RootStackParamList = {
  BrandSplash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Favorites: undefined;
  Cart: {
    initialPaymentMode?: 'FULL' | 'INSTALLMENT';
  } | undefined;
  ProductDetails: {
    product: import('./product').ProductItem;
  };
  Payment: {
    orderId: string;
    total: number;
    mode: 'FULL' | 'INSTALLMENT';
  };
};
