import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import { sanitizeInput } from '../../utils/security';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';
import { decodeQRData, decodePhone, decodeCarNumber, QRData } from '../../utils/qr';
import { saveAlert, getApiUrl } from '../../utils/storage';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import InputField from '../../components/InputField';
import { useAppTheme } from '../../hooks/useAppTheme';
import LoadingIndicator from '../../components/LoadingIndicator';
import { 
  Shield, 
  ArrowLeft, 
  Check, 
  ParkingCircle, 
  Lightbulb, 
  AlertTriangle, 
  Info 
} from 'lucide-react-native';

const ALERT_TYPES = [
  { type: 'parking', label: 'Parking Issue', icon: ParkingCircle, colorKey: 'primary' },
  { type: 'lights', label: 'Lights On', icon: Lightbulb, colorKey: 'warning' },
  { type: 'emergency', label: 'Emergency', icon: AlertTriangle, colorKey: 'danger' },
  { type: 'general', label: 'General Alert', icon: Info, colorKey: 'accent' },
] as const;

export default function ScanScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof ALERT_TYPES[number]['type'] | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  // License plate verification
  const [verifyPlate, setVerifyPlate] = useState('');
  const [verified, setVerified] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Custom Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>>([]);

  const showCustomAlert = (title: string, message: string, buttons?: typeof alertButtons) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || []);
    setAlertVisible(true);
  };

  useEffect(() => {
    if (data) {
      // Simulate loading sequence for premium verification/checks
      const timer = setTimeout(() => {
        const decoded = decodeQRData(data);
        setQrData(decoded);
        setDataLoaded(true);
      }, 1500); // 1.5s delay to show the loading car SVG
      return () => clearTimeout(timer);
    } else {
      setDataLoaded(true);
    }
  }, [data]);

  if (!dataLoaded) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingIndicator message="Loading vehicle profile..." size={100} />
      </View>
    );
  }

  if (!qrData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Invalid or corrupt QR code data.</Text>
        <TouchableOpacity 
          style={[styles.anotherAlertBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.anotherAlertText, { color: colors.textPrimary }]}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSendAlert = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      // Fetch status of unread alerts for this car
      const statusRes = await fetch(getApiUrl(`/api/alerts/status?carId=${qrData.id}`));
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        // If there are unread alerts, restrict observers to sending an alert every 1 minute
        if (statusData.hasUnread && statusData.lastTimestamp > 0) {
          const elapsed = Date.now() - statusData.lastTimestamp;
          if (elapsed < 60000) {
            const waitTime = Math.ceil((60000 - elapsed) / 1000);
            showCustomAlert(
              'Alert Rate Limited',
              `An alert was already routed to the owner. Please wait ${waitTime} seconds before sending another, or wait for them to open the app.`
            );
            setLoading(false);
            return;
          }
        }
      }

      const typeLabel = ALERT_TYPES.find((t) => t.type === selectedType)?.label || 'Alert';
      const sanitizedNote = sanitizeInput(note.trim());
      const newAlert = {
        id: Math.random().toString(36).substring(7),
        carId: qrData.id,
        message: typeLabel,
        alertType: selectedType,
        senderNote: sanitizedNote || undefined,
        timestamp: Date.now(),
        read: false,
      };

      await saveAlert(newAlert);
      setAlertSent(true);
      setNote('');
      setSelectedType(null);
    } catch (e) {
      showCustomAlert('Error', 'Failed to submit alert. Please try again.');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.replace('/')} 
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Shield size={18} color={colors.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.headerBarTitle, { color: colors.textMuted }]}>Secure Contact Portal</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

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
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Send an alert regarding vehicle:</Text>
            <View style={[styles.carBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.carPlate, { color: colors.textPrimary }]}>*** {qrData.cn}</Text>
              {qrData.cm && (
                <Text style={[styles.carModel, { color: colors.textSecondary }]}>
                  {qrData.cm} {qrData.cc ? `· ${qrData.cc}` : ''}
                </Text>
              )}
            </View>
          </View>

          {alertSent ? (
            <GlassCard style={[styles.successCard, { borderColor: colors.success }]}>
              <View style={[styles.successDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.successTitle, { color: colors.success }]}>ALERT ROUTED SECURELY</Text>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                The vehicle owner has been notified. Thank you for maintaining safety.
              </Text>
              <TouchableOpacity
                style={[styles.anotherAlertBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                onPress={() => setAlertSent(false)}
              >
                <Text style={[styles.anotherAlertText, { color: colors.textPrimary }]}>Send Another Alert</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <GlassCard style={[styles.card, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. CHOOSE ISSUE</Text>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select the option that matches the issue:</Text>

              {/* Alert Type Selection Grid */}
              <View style={styles.typeGrid}>
                {ALERT_TYPES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedType === item.type;
                  
                  const alertTypeColors: Record<string, string> = {
                    primary: colors.primary,
                    warning: colors.warning,
                    danger: colors.danger,
                    accent: colors.accent,
                  };
                  const typeColor = alertTypeColors[item.colorKey];
                  
                  return (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.typeChip,
                        { 
                          backgroundColor: isSelected ? colors.surfaceLight : colors.surface,
                          borderColor: isSelected ? typeColor : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedType(item.type)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.chipContent}>
                        <Icon 
                          size={18} 
                          color={isSelected ? typeColor : colors.textMuted} 
                        />
                        <Text
                          style={[
                            styles.chipLabel,
                            { color: isSelected ? colors.textPrimary : colors.textSecondary },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Message Field */}
              <View style={styles.fieldContainer}>
                <TextInput
                  style={[
                    styles.textArea, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }
                  ]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Additional details (optional)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
              </View>

              <TouchableOpacity
                onPress={handleSendAlert}
                disabled={!selectedType || loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={selectedType ? [colors.primary, colors.primaryDark] : [colors.surfaceLight, colors.surfaceLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.verifyBtn,
                    { opacity: selectedType ? 1 : 0.5 }
                  ]}
                >
                  <View style={styles.chipContent}>
                    <Text style={{ color: selectedType ? '#FFFFFF' : colors.textMuted, fontWeight: '700', fontSize: FontSize.sm + 1 }}>
                      Send Alert Securely
                    </Text>
                    {selectedType && <Check size={16} color="#FFFFFF" />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* Emergency Section */}
          <GlassCard style={[styles.card, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. EMERGENCY CONTACT</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
              To prevent automated data harvesting, you must verify the full license plate number of the vehicle to reveal the emergency number.
            </Text>

            {verified ? (
              <View style={[styles.verifiedBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                <Text style={[styles.verifiedLabel, { color: colors.success }]}>UNLOCKED EMERGENCY CONTACT:</Text>
                <Text style={[styles.phoneNumberText, { color: colors.textPrimary }]}>{revealedPhone}</Text>
                
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.success }]}
                    onPress={() => {
                      showCustomAlert('Call Owner', `Do you want to dial ${revealedPhone}?`, [
                        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                        { text: 'Call', onPress: () => Linking.openURL(`tel:${revealedPhone}`), style: 'default' }
                      ]);
                    }}
                  >
                    <Text style={styles.callBtnText}>Call Owner</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.verifyForm}>
                <TextInput
                  style={[
                    styles.verifyInput,
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }
                  ]}
                  value={verifyPlate}
                  onChangeText={(t) => setVerifyPlate(t.toUpperCase())}
                  placeholder="Enter full license plate"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
                
                {verifyError ? (
                  <Text style={{ color: colors.danger, fontSize: FontSize.xs, marginBottom: Spacing.sm, textAlign: 'center' }}>
                    {verifyError}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.verifyBtn, { backgroundColor: colors.textPrimary }]}
                  onPress={handleVerifyPlate}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.verifyBtnText, { color: colors.textInverse }]}>
                    Verify & Reveal Phone
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        buttons={alertButtons}
      />
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerBarTitle: {
    fontSize: FontSize.xs - 1,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  backBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  carBadge: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl, // rounded-2xl
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  carPlate: {
    fontSize: FontSize.xxl - 2,
    fontWeight: '800',
    letterSpacing: 2,
  },
  carModel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  card: {
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: FontSize.xs,
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
    borderRadius: BorderRadius.xl, // rounded-2xl
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLabel: {
    fontSize: FontSize.xs + 1,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  textArea: {
    borderRadius: BorderRadius.xl, // rounded-2xl
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
    height: 80,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  successDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: FontSize.xs + 1,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  anotherAlertBtn: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
  },
  anotherAlertText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  verifiedBox: {
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
  },
  verifiedLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  phoneNumberText: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginVertical: Spacing.sm,
    letterSpacing: 1.5,
  },
  callBtn: {
    borderRadius: BorderRadius.md,
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
  verifyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: Spacing.md,
  },
  verifyBtn: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
