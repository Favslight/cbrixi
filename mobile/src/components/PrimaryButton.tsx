import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline';
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'solid',
}: PrimaryButtonProps) {
  if (variant === 'outline') {
    return (
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        style={({ pressed }) => [
          styles.outlineButton,
          pressed && styles.pressed,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.outlineLabel}>{label}</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.baseButton, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      <LinearGradient colors={gradients.button} style={styles.gradient}>
        {loading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.solidLabel}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  solidLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  outlineButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(2,6,23,0.45)',
  },
  outlineLabel: {
    color: colors.textPrimary,
    fontWeight: '500',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.65,
  },
});
