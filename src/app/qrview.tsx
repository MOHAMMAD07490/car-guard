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
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getCarById, getCurrentUser } from '../utils/storage';
import { CarProfile } from '../types/car';
import { encodeCarToQR, getBaseWebUrl } from '../utils/qr';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { ArrowLeft, Shield, Copy, Share2, Search } from 'lucide-react-native';

export default function QRViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Loading vehicle details...</Text>
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
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>Vehicle QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrShieldBadge}>
            <Shield size={16} color="#71717A" />
          </View>
          <Image
            source={qrImageUrl}
            style={styles.qrImage}
            contentFit="contain"
            transition={400}
          />
          <Text style={styles.qrPlate}>{car.carNumber}</Text>
          <Text style={styles.qrName}>{car.ownerName}</Text>
        </View>

        {/* Security Status Box */}
        <View style={[
          styles.securityBox, 
          { 
            backgroundColor: colors.successLight, 
            borderColor: colors.successLight,
          }
        ]}>
          <Shield size={20} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.success }]}>
            Phone number ({car.phoneNumber.replace(/.(?=.{4})/g, '*')}) is fully encrypted.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GradientButton
            title={copied ? 'Copied Link' : 'Copy Web Portal Link'}
            onPress={handleCopyLink}
            variant="primary"
            icon={copied ? "✓" : "📋"}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[
                styles.secondaryButton, 
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]} 
              onPress={handleShare}
            >
              <Share2 size={16} color={colors.textPrimary} />
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Share Portal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.secondaryButton, 
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]} 
              onPress={handleSimulateScan}
            >
              <Search size={16} color={colors.textPrimary} />
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Simulate Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <GlassCard style={styles.instructionsCard}>
          <Text style={[styles.instructionTitle, { color: colors.textPrimary }]}>SETUP INSTRUCTIONS</Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
            1. Print or download this QR code template.
          </Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
            2. Place the code clearly on your dashboard or corner windshield.
          </Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSize.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 27, 0.08)',
    marginBottom: Spacing.md,
    position: 'relative',
    ...Shadow.card,
  },
  qrShieldBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 6,
    backgroundColor: '#F4F4F5',
    borderRadius: BorderRadius.round,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.lg,
  },
  qrPlate: {
    fontFamily: 'monospace',
    fontSize: FontSize.xl - 2,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#18181B',
  },
  qrName: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  securityText: {
    fontSize: FontSize.xs + 1,
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
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    height: 52,
  },
  secondaryButtonText: {
    fontSize: FontSize.sm + 1,
    fontWeight: '600',
  },
  instructionsCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
  },
  instructionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  instructionStep: {
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
});
