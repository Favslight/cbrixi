import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppBackground } from '../components/AppBackground';
import { BrandMark } from '../components/BrandMark';
import { colors } from '../constants/theme';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BrandSplash'>;

const SPLASH_MIN_MS = 2200;

type RouteDecision = 'Onboarding' | 'Login' | 'Home';

async function resolvePostSplashRoute(): Promise<RouteDecision> {
  const [onboardingSeen, userToken, adminToken] = await Promise.all([
    storage.getString(storage.keys.onboardingSeen),
    storage.getString(storage.keys.userToken),
    storage.getString(storage.keys.adminToken),
  ]);

  const hasToken = Boolean(userToken || adminToken);
  const onboarded = onboardingSeen === 'true';

  if (!onboarded) {
    return 'Onboarding';
  }
  if (!hasToken) {
    return 'Login';
  }
  return 'Home';
}

export function BrandSplashScreen({ navigation }: Props) {
  const markScale = useRef(new Animated.Value(0.72)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordTranslate = useRef(new Animated.Value(12)).current;
  const captionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let navigateTimeout: ReturnType<typeof setTimeout> | undefined;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(markOpacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.spring(markScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(wordTranslate, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(captionOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();

    const startedAt = Date.now();

    (async () => {
      let next: RouteDecision = 'Onboarding';
      try {
        next = await resolvePostSplashRoute();
      } catch {
        next = 'Onboarding';
      }

      if (cancelled) {
        return;
      }

      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, SPLASH_MIN_MS - elapsed);

      navigateTimeout = setTimeout(() => {
        if (!cancelled) {
          navigation.replace(next);
        }
      }, wait);
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      if (navigateTimeout) {
        clearTimeout(navigateTimeout);
      }
    };
  }, [captionOpacity, markOpacity, markScale, navigation, wordOpacity, wordTranslate]);

  return (
    <AppBackground>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.markWrap,
            {
              opacity: markOpacity,
              transform: [{ scale: markScale }],
            },
          ]}
        >
          <BrandMark size={72} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: wordOpacity,
            transform: [{ translateY: wordTranslate }],
          }}
        >
          <Text style={styles.wordmark}>
            <Text style={styles.wordmarkLight}>CBRI</Text>
            <Text style={styles.wordmarkAccent}>XI</Text>
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.caption, { opacity: captionOpacity }]}>
          Premium Gadgets Simplified
        </Animated.Text>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  markWrap: {
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 4,
  },
  wordmarkLight: {
    color: '#FFFFFF',
  },
  wordmarkAccent: {
    color: '#FFFFFF',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 15,
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
