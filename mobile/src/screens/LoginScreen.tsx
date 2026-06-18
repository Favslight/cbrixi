import { useState } from 'react';
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
import { loginWithRoleFallback } from '../services/auth';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';
import { toErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (name: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError('');
    }
  };

  const toggleRememberMe = () => {
    setFormData((prev) => ({ ...prev, rememberMe: !prev.rememberMe }));
  };

  const onLogin = async () => {
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithRoleFallback({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result.role === 'user') {
        await storage.setString(storage.keys.userToken, result.token);
        if (result.profile) {
          await storage.setString(storage.keys.userData, JSON.stringify(result.profile));
        }
      } else {
        await storage.setString(storage.keys.adminToken, result.token);
        await storage.setString(storage.keys.adminName, result.adminName ?? 'Admin');
      }

      await storage.setString(storage.keys.onboardingSeen, 'true');
      navigation.replace('Home');
    } catch (loginError) {
      setError(toErrorMessage(loginError, 'Connection error. Please try again.'));
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping</Text>

            {!!error && <Text style={styles.errorBanner}>{error}</Text>}

            <View style={styles.form}>
              <TextField
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your email address"
              />

              <TextField
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your password"
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

              <View style={styles.rememberRow}>
                <Pressable style={styles.checkboxWrap} onPress={toggleRememberMe}>
                  <View style={[styles.checkbox, formData.rememberMe && styles.checkboxChecked]}>
                    {formData.rememberMe ? <Text style={styles.checkboxTick}>x</Text> : null}
                  </View>
                  <Text style={styles.rememberLabel}>Remember me</Text>
                </Pressable>

                <Text style={styles.forgotText}>Forgot Password?</Text>
              </View>

              <PrimaryButton label="Login Account" onPress={onLogin} loading={loading} />

              <View style={styles.separatorRow}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>or</Text>
                <View style={styles.separatorLine} />
              </View>

              <PrimaryButton
                label="Continue as Guest"
                variant="outline"
                onPress={() => navigation.replace('Home')}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{"Don't have an account?"}</Text>
              <Pressable onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
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
    gap: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  checkboxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  rememberLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  forgotText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '500',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.22)',
  },
  separatorText: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
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
