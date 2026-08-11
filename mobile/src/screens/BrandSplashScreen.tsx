import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import { AppBackground } from '../components/AppBackground';
import { BrandMark } from '../components/BrandMark';
import { colors } from '../constants/theme';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BrandSplash'>;

const SPLASH_MIN_MS = 2200;
const LOADER_SIZE = 86;
const LOADER_STROKE = 6;
const LOADER_RADIUS = (LOADER_SIZE - LOADER_STROKE) / 2;
const LOADER_CIRCUMFERENCE = 2 * Math.PI * LOADER_RADIUS;

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
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let progressListener: string | undefined;
    let resolvedRoute: RouteDecision | undefined;
    let loaderComplete = false;

    const navigateWhenReady = () => {
      if (!cancelled && loaderComplete && resolvedRoute) {
        navigation.replace(resolvedRoute);
      }
    };

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
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    progressListener = progressValue.addListener(({ value }) => {
      if (!cancelled) {
        setProgress(Math.min(100, Math.round(value)));
      }
    });

    Animated.timing(progressValue, {
      toValue: 100,
      duration: SPLASH_MIN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !cancelled) {
        loaderComplete = true;
        setProgress(100);
        navigateWhenReady();
      }
    });

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

      resolvedRoute = next;
      navigateWhenReady();
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      if (progressListener) {
        progressValue.removeListener(progressListener);
      }
    };
  }, [
    captionOpacity,
    loaderOpacity,
    markOpacity,
    markScale,
    navigation,
    progressValue,
    wordOpacity,
    wordTranslate,
  ]);

  const progressOffset = LOADER_CIRCUMFERENCE * (1 - progress / 100);

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
          <BrandMark size={88} />
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

        <Animated.View style={[styles.loaderWrap, { opacity: loaderOpacity }]}>
          <Svg width={LOADER_SIZE} height={LOADER_SIZE} viewBox={`0 0 ${LOADER_SIZE} ${LOADER_SIZE}`}>
            <Circle
              cx={LOADER_SIZE / 2}
              cy={LOADER_SIZE / 2}
              r={LOADER_RADIUS}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={LOADER_STROKE}
              fill="transparent"
            />
            <Circle
              cx={LOADER_SIZE / 2}
              cy={LOADER_SIZE / 2}
              r={LOADER_RADIUS}
              stroke="#FFFFFF"
              strokeWidth={LOADER_STROKE}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${LOADER_CIRCUMFERENCE} ${LOADER_CIRCUMFERENCE}`}
              strokeDashoffset={progressOffset}
              rotation="-90"
              originX={LOADER_SIZE / 2}
              originY={LOADER_SIZE / 2}
            />
          </Svg>
          <Text style={styles.loaderText}>{progress}%</Text>
        </Animated.View>
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
    width: 116,
    height: 116,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
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
  loaderWrap: {
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  loaderText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
