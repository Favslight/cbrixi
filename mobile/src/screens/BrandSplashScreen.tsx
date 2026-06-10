import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppBackground } from '../components/AppBackground';
import { CbrixiLogo } from '../components/CbrixiLogo';
import { colors } from '../constants/theme';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BrandSplash'>;

export function BrandSplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 1800);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <AppBackground>
      <View style={styles.container}>
        <CbrixiLogo width={230} height={42} />
        <Text style={styles.caption}>Premium Gadgets Simplified</Text>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
