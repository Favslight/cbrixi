export type RootStackParamList = {
  BrandSplash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Favorites: undefined;
  Orders: undefined;
  Cart: {
    initialPaymentMode?: 'FULL' | 'INSTALLMENT';
  } | undefined;
  ProductDetails: {
    product: import('./product').ProductItem;
  };
  Payment: {
    orderId: string;
    mode: 'FULL' | 'INSTALLMENT';
    action?: 'order' | 'installment' | 'complete';
    installmentId?: string | null;
    label?: string;
    total?: number;
  };
};
