import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';
import { decodeQRData, decodePhone, decodeCarNumber, QRData } from '../../utils/qr';
import { saveAlert } from '../../utils/storage';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import InputField from '../../components/InputField';

const ALERT_TYPES = [
  { type: 'parking', label: 'Parking Issue', color: Colors.primary },
  { type: 'lights', label: 'Lights On', color: Colors.warning },
  { type: 'emergency', label: 'Emergency', color: Colors.danger },
  { type: 'general', label: 'General Alert', color: Colors.accent },
] as const;

export default function ScanScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [selectedType, setSelectedType] = useState<typeof ALERT_TYPES[number]['type']>('parking');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  // License plate verification
  const [verifyPlate, setVerifyPlate] = useState('');
  const [verified, setVerified] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState('');
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    if (data) {
      const decoded = decodeQRData(data);
      setQrData(decoded);
    }
  }, [data]);

  if (!qrData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invalid or corrupt QR code data.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSendAlert = async () => {
    setLoading(true);
    try {
      const typeLabel = ALERT_TYPES.find((t) => t.type === selectedType)?.label || 'Alert';
      const newAlert = {
        id: Math.random().toString(36).substring(7),
        carId: qrData.id,
        message: `New issue reported: ${typeLabel}`,
        alertType: selectedType,
        senderNote: note.trim() || undefined,
        timestamp: Date.now(),
        read: false,
      };

      await saveAlert(newAlert);
      setAlertSent(true);
      setNote('');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPlate = () => {
    setVerifyError('');
    const fullPlate = decodeCarNumber(qrData.cf).replace(/\s+/g, '').toUpperCase();
    const inputPlate = verifyPlate.replace(/\s+/g, '').toUpperCase();

    if (!inputPlate) {
      setVerifyError('Please enter the plate number');
      return;
    }

    if (fullPlate === inputPlate) {
      const phone = decodePhone(qrData.p);
      setRevealedPhone(phone);
      setVerified(true);
    } else {
      setVerifyError('Incorrect license plate number. Verification failed.');
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
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIndicator} />
            <Text style={styles.logo}>SECURE CONTACT PORTAL</Text>
            <Text style={styles.subtitle}>Send an alert regarding vehicle:</Text>
            
            <View style={styles.carBadge}>
              <Text style={styles.carPlate}>*** {qrData.cn}</Text>
              {qrData.cm && (
                <Text style={styles.carModel}>
                  {qrData.cm} {qrData.cc ? `· ${qrData.cc}` : ''}
                </Text>
              )}
            </View>
          </View>

          {alertSent ? (
            <GlassCard style={styles.successCard}>
              <View style={styles.successDot} />
              <Text style={styles.successTitle}>ALERT ROUTED SECURELY</Text>
              <Text style={styles.successText}>
                The vehicle owner has been notified. Thank you for maintaining safety.
              </Text>
              <TouchableOpacity
                style={styles.anotherAlertBtn}
                onPress={() => setAlertSent(false)}
              >
                <Text style={styles.anotherAlertText}>Send Another Alert</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>1. CHOOSE ISSUE CATEGORY</Text>
              <Text style={styles.sectionDesc}>Select the option that matches the issue:</Text>

              {/* Alert Type Selection Grid */}
              <View style={styles.typeGrid}>
                {ALERT_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.typeChip,
                      { borderLeftColor: item.color },
                      selectedType === item.type && styles.selectedTypeChip,
                    ]}
                    onPress={() => setSelectedType(item.type)}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selectedType === item.type && { color: item.color },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Message Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
                <TextInput
                  style={styles.textArea}
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Blocking my exit, left window open, etc."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
              </View>

              <GradientButton
                title="Send Alert Securely"
                onPress={handleSendAlert}
                loading={loading}
              />
            </GlassCard>
          )}

          {/* Emergency Section */}
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>2. EMERGENCY CONTACT INFO</Text>
            <Text style={styles.sectionDesc}>
              To prevent automated data harvesting, you must verify the full license plate number of the vehicle to reveal the emergency number.
            </Text>

            {verified ? (
              <View style={styles.verifiedBox}>
                <Text style={styles.verifiedLabel}>UNLOCKED EMERGENCY CONTACT:</Text>
                <Text style={styles.phoneNumberText}>{revealedPhone}</Text>
                
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Alert.alert('Call', `Dialing ${revealedPhone}`)}
                  >
                    <Text style={styles.callBtnText}>Call Owner</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.verifyForm}>
                <InputField
                  label="Plate Number Verification"
                  value={verifyPlate}
                  onChangeText={setVerifyPlate}
                  placeholder="Enter full license plate number"
                  error={verifyError}
                />
                
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleVerifyPlate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyBtnText}>Verify & Reveal Phone</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          <View style={{ height: 40 }} />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerIndicator: {
    width: 20,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
    marginBottom: Spacing.sm,
  },
  logo: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  carBadge: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.card,
  },
  carPlate: {
    fontSize: FontSize.lg + 2,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  carModel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
    width: '48%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 3,
  },
  selectedTypeChip: {
    backgroundColor: Colors.surfaceLighter,
    borderColor: Colors.border,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs - 1,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  textArea: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    borderColor: Colors.border,
    borderWidth: 1.5,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
    height: 80,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  anotherAlertBtn: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  anotherAlertText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  verifiedBox: {
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderColor: Colors.success,
    borderWidth: 1,
  },
  verifiedLabel: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  phoneNumberText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginVertical: Spacing.sm,
    letterSpacing: 1.5,
  },
  callBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  verifyForm: {
    marginTop: Spacing.sm,
  },
  verifyBtn: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: Colors.accentLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
