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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { saveCar, getCurrentUser } from '../utils/storage';
import { generateId } from '../utils/qr';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';

export default function RegisterScreen() {
  const router = useRouter();
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
        ownerName: ownerName.trim(),
        carNumber: carNumber.trim().toUpperCase(),
        phoneNumber: phoneNumber.trim(),
        carModel: carModel.trim() || undefined,
        carColor: carColor.trim() || undefined,
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerIndicator} />
            <Text style={styles.headerTitle}>REGISTER VEHICLE</Text>
            <Text style={styles.headerSubtitle}>
              Link your vehicle details to generate a secure, privacy-safe QR code
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
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
            <InputField
              label="Vehicle Model (Optional)"
              value={carModel}
              onChangeText={setCarModel}
              placeholder="e.g. Tesla Model 3"
            />
            <InputField
              label="Vehicle Color (Optional)"
              value={carColor}
              onChangeText={setCarColor}
              placeholder="e.g. Space Grey"
            />

            {errors.general && (
              <Text style={styles.generalError}>{errors.general}</Text>
            )}

            <View style={styles.buttonContainer}>
              <GradientButton
                title="Generate Secure QR"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </Animated.View>
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
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  headerIndicator: {
    width: 20,
    height: 3,
    backgroundColor: Colors.primary,
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
  form: {
    gap: Spacing.sm,
  },
  generalError: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
