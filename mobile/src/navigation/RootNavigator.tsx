import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import { colors } from '../constants/theme';
import { BrandSplashScreen } from '../screens/BrandSplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { OrdersScreen } from '../screens/OrdersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navigation tree (always starts at Splash):
 *
 * BrandSplash
 *   ├─ (!onboarded) → Onboarding → Login → Home (Marketplace)
 *   ├─ (onboarded && !auth) → Login → Home
 *   └─ (auth) → Home
 *
 * Side stack from Home: Profile, Notifications, Favorites, Cart, Orders, ProductDetails, Payment, Signup
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="BrandSplash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="BrandSplash" component={BrandSplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="Payment" component={PaymentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
