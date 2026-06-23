import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { getApiUrl, setCurrentUser } from '../utils/storage';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (isSignUp && !name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    const payload = isSignUp ? { name, email, password } : { email, password };

    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        await setCurrentUser(data.user, data.token);
        router.replace('/');
      } else {
        setErrors({ general: data.error || 'Authentication failed. Please check credentials.' });
      }
    } catch (err) {
      setErrors({ general: 'Network connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.05)', 'transparent']}
        style={styles.bgGradient}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerIndicator} />
            <Text style={styles.headerTitle}>QRNOTE SECURITY</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUp
                ? 'Create a secure account to generate vehicle QR codes'
                : 'Sign in to access your registered vehicle dashboard'}
            </Text>
          </View>

          {/* Form Card */}
          <GlassCard style={styles.formCard}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, !isSignUp && styles.activeTabButton]}
                onPress={() => {
                  setIsSignUp(false);
                  setErrors({});
                }}
              >
                <Text style={[styles.tabButtonText, !isSignUp && styles.activeTabButtonText]}>
                  SIGN IN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, isSignUp && styles.activeTabButton]}
                onPress={() => {
                  setIsSignUp(true);
                  setErrors({});
                }}
              >
                <Text style={[styles.tabButtonText, isSignUp && styles.activeTabButtonText]}>
                  SIGN UP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View style={styles.inputsContainer}>
              {isSignUp && (
                <InputField
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  error={errors.name}
                />
              )}
              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                error={errors.email}
              />
              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                error={errors.password}
              />

              {errors.general && <Text style={styles.generalError}>{errors.general}</Text>}

              <View style={styles.buttonContainer}>
                <GradientButton
                  title={isSignUp ? 'Create Account' : 'Sign In'}
                  onPress={handleSubmit}
                  loading={loading}
                />
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  bgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  headerIndicator: {
    width: 20,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  formCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: 2,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm - 2,
  },
  activeTabButton: {
    backgroundColor: Colors.surfaceLighter,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  activeTabButtonText: {
    color: Colors.textPrimary,
  },
  inputsContainer: {
    gap: Spacing.xs,
  },
  generalError: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
