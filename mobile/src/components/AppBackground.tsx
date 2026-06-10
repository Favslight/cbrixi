import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients } from '../constants/theme';

export function AppBackground({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={gradients.appBackground} style={styles.container}>
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    top: -120,
    left: -60,
  },
  overlayBottom: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(29, 78, 216, 0.12)',
    bottom: -160,
    right: -90,
  },
  content: {
    flex: 1,
  },
});
