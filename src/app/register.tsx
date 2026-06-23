import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spacing, FontSize, BorderRadius } from '../constants/theme';
import { saveCar, getCurrentUser } from '../utils/storage';
import { generateId } from '../utils/qr';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { ArrowLeft } from 'lucide-react-native';

import { sanitizeInput } from '../utils/security';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [authChecked, setAuthChecked] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setAuthChecked(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!carNumber.trim()) newErrors.carNumber = 'Car number is required';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (phoneNumber.trim().length < 7) newErrors.phoneNumber = 'Enter a valid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const id = generateId();
      await saveCar({
        id,
        ownerName: sanitizeInput(ownerName.trim()),
        carNumber: sanitizeInput(carNumber.trim().toUpperCase()),
        phoneNumber: sanitizeInput(phoneNumber.trim()),
        carModel: sanitizeInput(carModel.trim()) || undefined,
        carColor: sanitizeInput(carColor.trim()) || undefined,
        createdAt: Date.now(),
      });
      router.replace(`/qrview?id=${id}`);
    } catch (error) {
      setErrors({ general: 'Failed to save car. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>Register Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Link your vehicle details to generate a secure, privacy-safe QR code.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Owner Name"
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Full name"
              error={errors.ownerName}
            />
            <InputField
              label="Plate Number"
              value={carNumber}
              onChangeText={(text) => setCarNumber(text.toUpperCase())}
              placeholder="e.g. ABC 1234"
              error={errors.carNumber}
            />
            <InputField
              label="Contact Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number for emergency contact"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />

            {/* Optional Fields side by side */}
            <View style={styles.rowGrid}>
              <View style={styles.gridCol}>
                <InputField
                  label="Model (Optional)"
                  value={carModel}
                  onChangeText={setCarModel}
                  placeholder="e.g. Model 3"
                />
              </View>
              <View style={styles.gridCol}>
                <InputField
                  label="Color (Optional)"
                  value={carColor}
                  onChangeText={setCarColor}
                  placeholder="e.g. White"
                />
              </View>
            </View>

            {errors.general && (
              <Text style={[styles.generalError, { color: colors.danger }]}>{errors.general}</Text>
            )}

            <View style={styles.buttonContainer}>
              <GradientButton
                title="Generate Secure QR"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerBarTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  descText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  form: {
    gap: Spacing.xs,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  generalError: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
