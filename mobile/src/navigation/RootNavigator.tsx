import { ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useBootstrapState } from '../hooks/useBootstrapState';
import type { RootStackParamList } from '../types/navigation';
import { AppBackground } from '../components/AppBackground';
import { colors } from '../constants/theme';
import { BrandSplashScreen } from '../screens/BrandSplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { OrdersScreen } from '../screens/OrdersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { loading, onboardingSeen, hasToken } = useBootstrapState();

  if (loading) {
    return (
      <AppBackground>
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      </AppBackground>
    );
  }

  const initialRouteName: keyof RootStackParamList = hasToken
    ? 'Home'
    : onboardingSeen
      ? 'Login'
      : 'BrandSplash';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
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

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
});
