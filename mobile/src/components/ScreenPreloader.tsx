import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from './BrandMark';
import { AppBackground } from './AppBackground';
import { colors } from '../constants/theme';

type ScreenPreloaderProps = {
  /** When false, renders as an overlay-friendly centered block without full background. */
  fullScreen?: boolean;
  markSize?: number;
  message?: string;
};

export function ScreenPreloader({
  fullScreen = true,
  markSize = 48,
  message,
}: ScreenPreloaderProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <View style={[styles.center, !fullScreen && styles.inlineCenter]}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <BrandMark size={markSize} />
      </Animated.View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );

  if (!fullScreen) {
    return content;
  }

  return <AppBackground>{content}</AppBackground>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  inlineCenter: {
    flex: 0,
    minHeight: 140,
    width: '100%',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
