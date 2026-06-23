import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getCarById, getCurrentUser } from '../utils/storage';
import { CarProfile } from '../types/car';
import { encodeCarToQR, getBaseWebUrl } from '../utils/qr';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';

export default function QRViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [car, setCar] = useState<CarProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setAuthChecked(true);
        if (id) {
          getCarById(id).then(setCar);
        }
      }
    });
  }, [id]);

  if (!authChecked) {
    return null;
  }

  if (!car) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Loading vehicle details...</Text>
      </View>
    );
  }

  const qrUrl = encodeCarToQR(car);
  const dataToken = qrUrl.split('/scan/')[1] || '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=FFFFFF&color=1A1A2E&margin=20&data=${encodeURIComponent(
    qrUrl
  )}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (Platform.OS !== 'web') {
      Alert.alert('Copied', 'Web simulation link copied to clipboard.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Secure contact portal for car ${car.carNumber}: ${qrUrl}`,
        url: qrUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSimulateScan = () => {
    router.push(`/scan/${dataToken}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.05)', 'transparent']}
        style={styles.bgGradient}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>

        {/* Info Header */}
        <View style={styles.header}>
          <View style={styles.headerIndicator} />
          <Text style={styles.title}>VEHICLE QR CODE</Text>
          <Text style={styles.subtitle}>
            Display this code on your dashboard. Observers can scan it to alert you regarding parking or lights without seeing your phone number.
          </Text>
        </View>

        {/* QR Display Card */}
        <View style={styles.qrContainer}>
          <LinearGradient
            colors={[Colors.border, Colors.borderLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrBorder}
          >
            <View style={styles.qrWhiteBox}>
              <Image
                source={qrImageUrl}
                style={styles.qrImage}
                contentFit="contain"
                transition={400}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Car Details Info */}
        <GlassCard style={styles.carDetailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.plateContainer}>
              <Text style={styles.plateLabel}>PLATE</Text>
              <Text style={styles.carNumber}>{car.carNumber}</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.modelContainer}>
              <Text style={styles.modelLabel}>VEHICLE</Text>
              <Text style={styles.carModel}>
                {car.carModel || 'Registered Car'}
                {car.carColor ? ` (${car.carColor})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.dividerHorizontal} />

          <View style={styles.privacyIndicator}>
            <Text style={styles.privacyDot}>●</Text>
            <Text style={styles.privacyText}>
              Phone number ({car.phoneNumber.replace(/.(?=.{4})/g, '*')}) is fully encrypted.
            </Text>
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GradientButton
            title={copied ? 'Copied Link' : 'Copy Web Portal Link'}
            onPress={handleCopyLink}
            variant="primary"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
              <Text style={styles.secondaryButtonText}>Share Portal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSimulateScan}>
              <Text style={styles.secondaryButtonText}>Simulate Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <GlassCard style={styles.instructionsCard}>
          <Text style={styles.instructionTitle}>SETUP INSTRUCTIONS</Text>
          <Text style={styles.instructionStep}>
            1. Print or download this QR code template.
          </Text>
          <Text style={styles.instructionStep}>
            2. Place the code clearly on your dashboard or corner windshield.
          </Text>
          <Text style={styles.instructionStep}>
            3. Observers scanning this QR can notify you securely from their phone browsers.
          </Text>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
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
  },
  headerIndicator: {
    width: 20,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  qrBorder: {
    padding: 1,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
  },
  qrWhiteBox: {
    backgroundColor: Colors.qrBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md - 1,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  carDetailsCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateContainer: {
    flex: 1,
  },
  plateLabel: {
    fontSize: FontSize.xs - 2,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  carNumber: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: 2,
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  modelContainer: {
    flex: 2,
  },
  modelLabel: {
    fontSize: FontSize.xs - 2,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  carModel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  privacyDot: {
    color: Colors.success,
    fontSize: 10,
  },
  privacyText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  instructionsCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  instructionStep: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
});
