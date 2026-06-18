import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors } from '../constants/theme';
import { signupUser } from '../services/auth';
import type { RootStackParamList } from '../types/navigation';
import { toErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type SignupFormData = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
};

export function SignupScreen({ navigation }: Props) {
  const [formData, setFormData] = useState<SignupFormData>({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (!password) {
      return { label: '', score: 0, color: '#334155' };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: 'Weak', score, color: '#EF4444' };
    if (score === 3) return { label: 'Good', score, color: '#F59E0B' };
    if (score === 4) return { label: 'Strong', score, color: '#22C55E' };
    return { label: 'Very Strong', score, color: '#10B981' };
  }, [formData.password]);

  const updateField = (name: keyof SignupFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError('');
    }
  };

  const onSubmit = async () => {
    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    const payload = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };

    if (!payload.firstname || !payload.lastname || !payload.username || !payload.email || !payload.password) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await signupUser(payload);
      navigation.replace('Login');
    } catch (signupError) {
      setError(toErrorMessage(signupError, 'Connection error. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back to Sign In</Text>
            </Pressable>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Cbrixi and start shopping</Text>

            {!!error && <Text style={styles.errorBanner}>{error}</Text>}

            <View style={styles.form}>
              <TextField
                label="First Name"
                value={formData.firstname}
                onChangeText={(value) => updateField('firstname', value)}
                placeholder="John"
              />
              <TextField
                label="Last Name"
                value={formData.lastname}
                onChangeText={(value) => updateField('lastname', value)}
                placeholder="Doe"
              />
              <TextField
                label="Username"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="johndoe"
              />
              <TextField
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="john@example.com"
              />
              <TextField
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                placeholder="Create a strong password"
                rightElement={
                  <Pressable
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={21}
                      color={colors.textMuted}
                    />
                  </Pressable>
                }
              />

              {formData.password ? (
                <View style={styles.passwordStrengthWrap}>
                  <View style={styles.passwordStrengthHeader}>
                    <Text style={styles.passwordStrengthLabel}>Password Strength</Text>
                    <Text style={[styles.passwordStrengthValue, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                  <View style={styles.passwordStrengthTrack}>
                    <View
                      style={[
                        styles.passwordStrengthBar,
                        {
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              <Pressable
                style={styles.termsRow}
                onPress={() => updateField('agreeToTerms', !formData.agreeToTerms)}
              >
                <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxChecked]}>
                  {formData.agreeToTerms ? <Text style={styles.checkboxTick}>x</Text> : null}
                </View>
                <Text style={styles.termsText}>
                  I have read and agree to the Terms of Service and Privacy Policy.
                </Text>
              </Pressable>

              <PrimaryButton label="Sign Up" onPress={onSubmit} loading={submitting} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => navigation.replace('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
    paddingTop: 6,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
  },
  errorBanner: {
    color: '#FCA5A5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(127,29,29,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 13,
  },
  form: {
    gap: 12,
  },
  passwordStrengthWrap: {
    gap: 8,
    marginTop: -2,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordStrengthLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  passwordStrengthValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  passwordStrengthTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  passwordStrengthBar: {
    height: '100%',
    borderRadius: 999,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37,99,235,0.25)',
  },
  checkboxTick: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footerLink: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
});
