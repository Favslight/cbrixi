import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';

/**
 * Prefer raster CBRIXI favicon (replaces SVG mark).
 * Synced from smart/public via `scripts/sync-favicon.ps1`.
 */
const faviconPng = require('../../assets/images/favicon.png');

type BrandMarkProps = {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
};

export function BrandMark({ size = 56, showWordmark = false, wordmarkSize = 28 }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <Image
        source={faviconPng}
        style={{ width: size, height: size, borderRadius: size * 0.25 }}
        resizeMode="contain"
        accessibilityLabel="CBRIXI"
      />
      {showWordmark ? (
        <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>
          <Text style={styles.wordmarkLight}>CBRI</Text>
          <Text style={styles.wordmarkAccent}>XI</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: 3.5,
  },
  wordmarkLight: {
    color: colors.textPrimary,
  },
  wordmarkAccent: {
    color: '#3B82F6',
  },
});
