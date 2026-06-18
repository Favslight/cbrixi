import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  rightElement?: ReactNode;
};

export function TextField({ label, error, rightElement, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, rightElement ? styles.inputWithAction : null, style]}
          {...props}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    color: colors.textPrimary,
    minHeight: 50,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputWrap: {
    position: 'relative',
  },
  inputWithAction: {
    paddingRight: 48,
  },
  rightElement: {
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 0,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
