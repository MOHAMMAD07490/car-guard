import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getCarById, getCurrentUser } from '../utils/storage';
import { CarProfile } from '../types/car';
import { encodeCarToQR, getBaseWebUrl } from '../utils/qr';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { ArrowLeft, Shield } from 'lucide-react-native';
import LoadingIndicator from '../components/LoadingIndicator';

import QRBg1 from '../../assets/images/qr_bg_1.jpg';
import QRBg2 from '../../assets/images/qr_bg_2.jpg';
import LogoImage from '../../assets/images/icon.png';

export default function QRViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [authChecked, setAuthChecked] = useState(false);
  const [car, setCar] = useState<CarProfile | null>(null);
  const [activeBg, setActiveBg] = useState<'bg1' | 'bg2'>('bg1');
  const [generating, setGenerating] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);

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
        <LoadingIndicator message="Loading vehicle details..." size={100} />
      </View>
    );
  }

  const qrUrl = encodeCarToQR(car);
  const dataToken = qrUrl.split('/scan/')[1] || '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=00c9ff&ecc=H&format=svg&data=${encodeURIComponent(
    qrUrl
  )}`;

  const handleDownloadPoster = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Download', 'Downloading is supported on the web version.');
      return;
    }
    
    try {
      setGenerating(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Load Background Image
      const bgImg = new window.Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
        bgImg.src = activeBg === 'bg1' ? QRBg1 : QRBg2;
      });
      ctx.drawImage(bgImg, 0, 0, 1080, 1920);

      // 2. Draw Semi-transparent Glass Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      const x = 140, y = 360, w = 800, h = 1200, r = 40;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      // 3. Draw Header Logo & Branding Text
      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
        logoImg.src = LogoImage;
      });
      if (logoImg.complete && logoImg.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(320, 480, 30, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, 290, 450, 60, 60);
        ctx.restore();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('QRNOTE SECURE', 370, 492);

      // 4. Load QR Code Image as PNG with native transparency from QuickChart
      const pngQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrUrl)}&light=00000000&dark=00c9ff&ecLevel=H&size=460`;
      const qrImg = new window.Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = pngQrUrl;
      });
      ctx.drawImage(qrImg, 310, 620, 460, 460);

      // 6. Draw Center Logo on the QR code
      if (logoImg.complete && logoImg.width > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(540, 850, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(540, 850, 40, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, 500, 810, 80, 80);
        ctx.restore();
      }

      // 7. Draw Plate Number and Owner Name
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 64px monospace';
      ctx.fillText(car.carNumber, 540, 1250);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(car.ownerName.toUpperCase(), 540, 1330);

      // 8. Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrnote_${car.carNumber.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setGenerating(false);
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
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>Vehicle QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Background Selector */}
        <View style={styles.bgSelectorRow}>
          <TouchableOpacity 
            style={[styles.bgSelectorBtn, activeBg === 'bg1' ? styles.bgSelectorBtnActive : { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => setActiveBg('bg1')}
          >
            <Text style={[styles.bgSelectorText, { color: colors.textPrimary, fontWeight: activeBg === 'bg1' ? '700' : '500' }]}>Carbon Cyber</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bgSelectorBtn, activeBg === 'bg2' ? styles.bgSelectorBtnActive : { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => setActiveBg('bg2')}
          >
            <Text style={[styles.bgSelectorText, { color: colors.textPrimary, fontWeight: activeBg === 'bg2' ? '700' : '500' }]}>Abstract Tech</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Card (9:16 Aspect Ratio) */}
        <View style={styles.qrCardContainer}>
          <ImageBackground 
            source={activeBg === 'bg1' ? QRBg1 : QRBg2} 
            style={styles.qrCardBackground}
            imageStyle={{ borderRadius: BorderRadius.xl }}
          >
            {/* A glassmorphic overlay container inside the card */}
            <View style={styles.qrCardGlass}>
              <View style={styles.qrHeaderRow}>
                <Image source={LogoImage} style={styles.qrCardLogo} />
                <Text style={styles.qrCardBranding}>QRNOTE SECURE</Text>
              </View>
              
              {/* The QR Code itself, with high ECC so we can overlay the logo */}
              <View style={styles.qrWrapper}>
                {qrLoading && (
                  <View style={styles.qrLoadingOverlay}>
                    <LoadingIndicator size={80} />
                  </View>
                )}
                <Image
                  source={qrImageUrl}
                  style={styles.qrImage}
                  contentFit="contain"
                  onLoadStart={() => setQrLoading(true)}
                  onLoadEnd={() => setQrLoading(false)}
                />
                {/* Logo in the center of the QR code */}
                <View style={styles.qrCenterLogo}>
                  <Image source={LogoImage} style={styles.qrCenterLogoImage} />
                </View>
              </View>
              
              <View style={styles.qrFooterTextContainer}>
                <Text style={styles.qrPlateText}>{car.carNumber}</Text>
                <Text style={styles.qrNameText}>{car.ownerName}</Text>
              </View>
            </View>
          </ImageBackground>

          {generating && (
            <View style={[styles.generatingOverlay, { backgroundColor: 'rgba(9, 9, 11, 0.85)' }]}>
              <LoadingIndicator message="Generating 9:16 Poster..." size={140} />
            </View>
          )}
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
            title={generating ? 'Generating Poster...' : 'Download QR Poster (9:16)'}
            onPress={handleDownloadPoster}
            disabled={generating || qrLoading}
            loading={generating}
          />
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
  bgSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  bgSelectorBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
  },
  bgSelectorBtnActive: {
    backgroundColor: '#00c9ff',
    borderColor: '#00c9ff',
  },
  bgSelectorText: {
    fontSize: FontSize.xs + 1,
  },
  qrCardContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    alignSelf: 'center',
    maxWidth: 360,
    position: 'relative',
    ...Shadow.card,
  },
  qrCardBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  qrCardGlass: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl * 1.2,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  qrCardLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  qrCardBranding: {
    fontSize: FontSize.xs - 1,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  qrWrapper: {
    position: 'relative',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadow.card,
  },
  qrLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 10,
    borderRadius: BorderRadius.lg,
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderRadius: BorderRadius.xl,
  },
  qrFooterTextContainer: {
    alignItems: 'center',
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  qrCenterLogo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  qrCenterLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  qrPlateText: {
    fontFamily: 'monospace',
    fontSize: FontSize.xl,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  qrNameText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
