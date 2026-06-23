import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getCars, deleteCar, getUnreadCount, getCurrentUser, logout, syncCarsFromCloud } from '../utils/storage';
import { CarProfile } from '../types/car';
import { UserProfile } from '../types/user';
import CarCard from '../components/CarCard';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { Image } from 'expo-image';
import LogoImage from '../../assets/images/icon.png';
import WelcomeHeroImage from '../../assets/images/welcome_hero.png';
import Example1Image from '../../assets/images/carguard_example1.png';
import Example2Image from '../../assets/images/carguard_example2.png';
import {
  Shield,
  Moon,
  Sun,
  Plus,
  Car,
  Bell,
  LogOut,
  QrCode,
  AlertTriangle,
  MessageSquare,
  Lock,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useAppTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<CarProfile[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});
  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 900;

  const handleOpenPrivacy = () => {
    if (Platform.OS === 'web') {
      router.push('/privacy');
    } else {
      Linking.openURL('https://car-guard-kappa.vercel.app/privacy');
    }
  };

  const handleOpenTerms = () => {
    if (Platform.OS === 'web') {
      router.push('/terms');
    } else {
      Linking.openURL('https://car-guard-kappa.vercel.app/terms');
    }
  };

  const loadData = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // First load local cars for instant rendering
      const localCarList = await getCars();
      const filteredCars = localCarList.filter(c => c.ownerId === currentUser.id);
      setCars(filteredCars);
      
      const count = await getUnreadCount();
      setUnreadCount(count);

      // Trigger background cloud sync to restore cars if the app was reinstalled
      const syncedCars = await syncCarsFromCloud(currentUser.id);
      setCars(syncedCars);
    } else {
      setCars([]);
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          await loadData();
        },
      },
    ]);
  };

  const handleDeleteCar = (car: CarProfile) => {
    Alert.alert(
      'Remove Vehicle',
      `Remove ${car.carNumber} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCar(car.id);
            await loadData();
          },
        },
      ]
    );
  };

  if (!user) {
    if (Platform.OS !== 'web') {
      // Mobile APK Welcome Page
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Image source={LogoImage} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4 }} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>QRNote</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.surfaceLight }]}>
              {theme === 'dark' ? <Sun size={18} color={colors.textPrimary} /> : <Moon size={18} color={colors.textPrimary} />}
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.mobileWelcomeScroll} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mobileHero}>
              <Image 
                source={WelcomeHeroImage} 
                style={styles.mobileHeroImage} 
                contentFit="contain"
              />
              <Text style={[styles.mobileHeroTitle, { color: colors.textPrimary }]}>
                Shield Your Identity
              </Text>
              <Text style={[styles.mobileHeroDesc, { color: colors.textSecondary }]}>
                Generate a privacy-safe QR code note for your dashboard. Observers can scan it to alert you of emergencies instantly—without ever seeing your phone number.
              </Text>

              <GradientButton
                title="Get Started"
                onPress={() => router.push('/login')}
                style={styles.mobileWelcomeBtn}
              />
            </View>

            {/* Mobile Footer */}
            <View style={[styles.mobileFooter, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                © 2026 QRNote. All rights reserved.
              </Text>
              <View style={styles.footerLinkRow}>
                <TouchableOpacity onPress={handleOpenPrivacy}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.textMuted }}>•</Text>
                <TouchableOpacity onPress={handleOpenTerms}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Terms of Service</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Web Landing Page
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Image source={LogoImage} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4 }} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>QRNote</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.surfaceLight }]}>
            {theme === 'dark' ? <Sun size={18} color={colors.textPrimary} /> : <Moon size={18} color={colors.textPrimary} />}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && {
              maxWidth: 1100,
              alignSelf: 'center',
              width: '100%',
              paddingHorizontal: Spacing.xl,
            }
          ]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={[styles.heroContainer, isDesktop && styles.row, isDesktop && { gap: Spacing.xl }]}>
            <View style={[styles.heroLeft, isDesktop && { flex: 1.2, paddingRight: Spacing.lg }]}>
              <View style={styles.badgeContainer}>
                <View style={[styles.sparkleBadge, { backgroundColor: colors.primaryGlow }]}>
                  <Sparkles size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.sparkleText, { color: colors.primary }]}>V2.0 Privacy Shield Active</Text>
                </View>
              </View>
              <Text style={[styles.heroMainTitle, { color: colors.textPrimary }]}>
                Shield Your Identity.{"\n"}Keep Your Car Connected.
              </Text>
              <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
                Generate secure, encrypted QR codes for your windshield. Observers can alert you about double-parking, lights left on, or emergencies instantly—without ever knowing your personal phone number or email address.
              </Text>
              <View style={[styles.heroButtonRow, { marginTop: Spacing.md }]}>
                <GradientButton
                  title="Get Started (Free)"
                  onPress={() => router.push('/login')}
                  style={{ width: '100%', maxWidth: 240 }}
                />
              </View>
            </View>

            {/* Hero Right side: Mockup of windshield tag */}
            <View style={[styles.heroRight, isDesktop ? { flex: 0.8, alignItems: 'center' } : { marginTop: Spacing.xl }]}>
              <GlassCard style={styles.mockupCard}>
                <View style={styles.mockupTagHeader}>
                  <Image source={LogoImage} style={{ width: 16, height: 16, marginRight: 6, borderRadius: 3 }} />
                  <Text style={[styles.mockupTagTitle, { color: colors.textPrimary }]}>QRNOTE SECURE PORTAL</Text>
                </View>
                <View style={[styles.mockupQR, { borderColor: colors.border, padding: 0 }]}>
                  <Image source={Example1Image} style={{ width: 140, height: 140, borderRadius: BorderRadius.md }} contentFit="cover" />
                </View>
                <Text style={[styles.mockupPlate, { color: colors.textPrimary }]}>JHHJ 8888</Text>
                <View style={[styles.mockupBadge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                  <Lock size={12} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={[styles.mockupBadgeText, { color: colors.success }]}>Windshield Profile Hidden</Text>
                </View>
              </GlassCard>
            </View>
          </View>

          {/* Why QRNote? Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Traditional Dashboard Note vs. QRNote
            </Text>
            <View style={[styles.comparisonGrid, isDesktop && styles.row, isDesktop && { gap: Spacing.md }]}>
              {/* Paper Note Card */}
              <View style={[styles.comparisonCard, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1, marginBottom: isDesktop ? 0 : Spacing.md }]}>
                <Text style={[styles.comparisonCardTitle, { color: colors.danger }]}>Handwritten Paper Note</Text>
                <View style={styles.comparisonItem}>
                  <X size={18} color={colors.danger} style={{ marginTop: 2 }} />
                  <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>Exposes your phone number to any passerby</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <X size={18} color={colors.danger} style={{ marginTop: 2 }} />
                  <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>High risk of spam calls, stalking, or harassment</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <X size={18} color={colors.danger} style={{ marginTop: 2 }} />
                  <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>Zero logs or tracking of who scanned your vehicle</Text>
                </View>
              </View>

              {/* QRNote Card */}
              <GlassCard style={[styles.comparisonCardActive, { flex: 1 }]}>
                <Text style={[styles.comparisonCardTitle, { color: colors.primary }]}>QRNote Privacy Shield</Text>
                <View style={styles.comparisonItem}>
                  <Check size={18} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>100% encrypted & hidden phone number</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Check size={18} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>Verified license plate is required to reveal emergency number</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Check size={18} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>Real-time push alerts sent straight to your dashboard</Text>
                </View>
              </GlassCard>
            </View>
          </View>

          {/* Example Windshield Posters Showcase */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Customized Windshield Templates
            </Text>
            <Text style={{ fontSize: FontSize.xs + 2, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }}>
              Choose and download professional templates in 9:16 layout matching your design aesthetics.
            </Text>
            <View style={styles.exampleGrid}>
              <View style={[isDesktop ? styles.row : { flexDirection: 'column' }, { gap: Spacing.xl, justifyContent: 'center', width: '100%', alignItems: 'center' }]}>
                <Image 
                  source={Example1Image} 
                  style={[styles.exampleImage, { width: 280, height: 497 }]} 
                  contentFit="cover"
                />
                <Image 
                  source={Example2Image} 
                  style={[styles.exampleImage, { width: 280, height: 497 }]} 
                  contentFit="cover"
                />
              </View>
            </View>
          </View>

          {/* Core Features */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Designed with Privacy First</Text>
            <View style={[styles.featuresGrid, isDesktop && styles.row, isDesktop && { gap: Spacing.md }]}>
              {/* Feature 1 */}
              <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { flex: 1, marginBottom: 0 }]}>
                <View style={[styles.featureBadge, { backgroundColor: colors.primaryGlow }]}>
                  <Lock size={18} color={colors.primary} />
                </View>
                <Text style={[styles.featureCardTitle, { color: colors.textPrimary }]}>Verification Wall</Text>
                <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                  Your emergency contact number is locked. Passersby must enter your full license plate (printed on the car, not embedded in the QR) to unlock it.
                </Text>
              </View>

              {/* Feature 2 */}
              <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { flex: 1, marginBottom: 0 }]}>
                <View style={[styles.featureBadge, { backgroundColor: colors.primaryGlow }]}>
                  <QrCode size={18} color={colors.primary} />
                </View>
                <Text style={[styles.featureCardTitle, { color: colors.textPrimary }]}>Printable Windshield Tags</Text>
                <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                  Easily generate and print QR codes tailored for placement on your windshield. You can download the image templates anytime from your app profile.
                </Text>
              </View>

              {/* Feature 3 */}
              <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { flex: 1, marginBottom: 0 }]}>
                <View style={[styles.featureBadge, { backgroundColor: colors.primaryGlow }]}>
                  <Smartphone size={18} color={colors.primary} />
                </View>
                <Text style={[styles.featureCardTitle, { color: colors.textPrimary }]}>Zero-App Installation</Text>
                <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                  Observers do not need to install anything. Scanning the QR code opens a secure web portal in their default browser where they can trigger preset alerts.
                </Text>
              </View>
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>How does it work?</Text>
            <View style={[styles.stepsContainer, isDesktop && styles.row, isDesktop && { gap: Spacing.md }]}>
              {/* Step 1 */}
              <View style={[styles.stepItem, isDesktop && { flex: 1, marginBottom: 0 }]}>
                <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Register Vehicle</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  Create your free account, add your car license plate, model, and emergency phone number securely.
                </Text>
              </View>

              {/* Step 2 */}
              <View style={[styles.stepItem, isDesktop && { flex: 1, marginBottom: 0 }]}>
                <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Display Windshield QR</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  Print or download your custom QR code tag and place it clearly on your dashboard or corner windshield.
                </Text>
              </View>

              {/* Step 3 */}
              <View style={[styles.stepItem, isDesktop && { flex: 1, marginBottom: 0 }]}>
                <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNum}>3</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Get Instant Alerts</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  If someone scans the QR code, they choose an alert category (e.g. double parked) and route it securely to you.
                </Text>
              </View>
            </View>
          </View>

          {/* FAQs Accordion */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {[
                {
                  q: "Is QRNote completely free?",
                  a: "Yes! Creating your account, adding vehicles, generating QR codes, and receiving alerts is 100% free with no monthly fees."
                },
                {
                  q: "Do observers scanning my QR need to download an app?",
                  a: "No. The QR code links directly to a secure web portal. The observer can send alerts or initiate verified calls using their default smartphone web browser."
                },
                {
                  q: "Can anyone harvest my phone number?",
                  a: "No. Your phone number is encrypted. The scanner page only reveals your phone number if they verify your full license plate, locking out automated harvesting bots."
                },
                {
                  q: "Can I manage multiple vehicles under one account?",
                  a: "Yes, you can register and manage multiple cars. Each vehicle will generate its own custom secure QR code."
                }
              ].map((faq, idx) => {
                const isOpen = !!faqOpen[idx];
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => toggleFaq(idx)}
                    style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.faqQuestionRow}>
                      <HelpCircle size={16} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>{faq.q}</Text>
                      <View style={{ marginLeft: 'auto' }}>
                        {isOpen ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
                      </View>
                    </View>
                    {isOpen && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CTA Section */}
          <View style={[styles.sectionContainer, styles.ctaContainer]}>
            <GlassCard style={styles.ctaCard}>
              <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>Protect your privacy on the road today</Text>
              <Text style={[styles.ctaDesc, { color: colors.textSecondary }]}>
                Join thousands of drivers who secure their windshield contact details with QRNote.
              </Text>
              <GradientButton
                title="Create Free Account"
                onPress={() => router.push('/login')}
                style={{ width: 220, alignSelf: 'center', marginTop: Spacing.sm }}
              />
            </GlassCard>
          </View>

          {/* Landing Footer */}
          <View style={[styles.landingFooter, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.md }]}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              © 2026 QRNote. All rights reserved.
            </Text>
            <View style={styles.footerLinkRow}>
              <TouchableOpacity onPress={handleOpenPrivacy}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.textMuted }}>•</Text>
              <TouchableOpacity onPress={handleOpenTerms}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Authenticated View
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image source={LogoImage} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4 }} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>QRNote</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <LogOut size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.surfaceLight }]}>
            {theme === 'dark' ? <Sun size={18} color={colors.textPrimary} /> : <Moon size={18} color={colors.textPrimary} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Minimal Header */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{user.name}</Text>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Stat Card 1 */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {}}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.primaryGlow }]}>
              <Car size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{cars.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VEHICLES</Text>
          </TouchableOpacity>
          
          {/* Stat Card 2 */}
          <TouchableOpacity
            onPress={() => router.push('/alerts')}
            activeOpacity={0.8}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {unreadCount > 0 && <View style={[styles.badge, { backgroundColor: colors.danger }]} />}
            <View style={[styles.statIconContainer, { backgroundColor: colors.surfaceLight }]}>
              <Bell size={20} color={colors.textSecondary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{unreadCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NEW ALERTS</Text>
          </TouchableOpacity>
        </View>

        {/* Cars Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MY CARS</Text>
          {cars.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <View style={[styles.emptyLogoLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>NO REGISTERED CARS</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Register your vehicle to generate a privacy-safe QR code.
              </Text>
            </GlassCard>
          ) : (
            cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onPress={() => router.push(`/qrview?id=${car.id}`)}
                onDelete={() => handleDeleteCar(car)}
              />
            ))
          )}
        </View>

        {/* Dashboard Footer */}
        <View style={[styles.mobileFooter, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: Spacing.xl, paddingVertical: Spacing.md }]}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            © 2026 QRNote. All rights reserved.
          </Text>
          <View style={styles.footerLinkRow}>
            <TouchableOpacity onPress={handleOpenPrivacy}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textMuted }}>•</Text>
            <TouchableOpacity onPress={handleOpenTerms}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/register')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
  },
  heroContainer: {
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  heroLeft: {
    justifyContent: 'center',
  },
  badgeContainer: {
    marginBottom: Spacing.sm,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sparkleText: {
    fontSize: FontSize.xs - 1,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroMainTitle: {
    fontSize: FontSize.xxl + 2,
    fontWeight: '900',
    lineHeight: Platform.OS === 'web' ? 42 : 34,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: FontSize.sm + 1,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  heroButtonRow: {
    alignItems: 'center',
  },
  secondaryHeroBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    height: 52,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryHeroBtnText: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
  },
  heroRight: {
    justifyContent: 'center',
  },
  mockupCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    width: 280,
    borderWidth: 1,
  },
  mockupTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mockupTagTitle: {
    fontSize: FontSize.xs - 2,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mockupQR: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  mockupPlate: {
    fontFamily: 'monospace',
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  mockupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  mockupBadgeText: {
    fontSize: FontSize.xs - 2,
    fontWeight: '700',
  },
  sectionContainer: {
    marginTop: Spacing.xxl + 10,
    paddingTop: Spacing.md,
  },
  sectionHeading: {
    fontSize: FontSize.md + 2,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  comparisonGrid: {
    gap: Spacing.md,
  },
  comparisonCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  comparisonCardActive: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  comparisonCardTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  comparisonIcon: {
    fontSize: FontSize.sm + 1,
  },
  comparisonText: {
    fontSize: FontSize.xs + 2,
    lineHeight: 18,
    flex: 1,
  },
  featuresGrid: {
    gap: Spacing.md,
  },
  featureCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  featureBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureCardTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  featureCardDesc: {
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
  },
  stepsContainer: {
    gap: Spacing.xl,
  },
  stepItem: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  faqList: {
    gap: Spacing.sm,
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 4,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  faqAnswerContainer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: Spacing.md,
  },
  faqAnswer: {
    fontSize: FontSize.xs + 2,
    lineHeight: 18,
  },
  ctaContainer: {
    marginBottom: Spacing.xxl + 10,
  },
  ctaCard: {
    paddingVertical: Spacing.xl + 10,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: FontSize.md + 3,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  ctaDesc: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  landingFooter: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.xs - 1,
    fontWeight: '500',
  },
  landingNotice: {
    fontSize: FontSize.xs - 1,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: Spacing.xl,
  },
  heroSection: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: FontSize.xxl - 2,
    fontWeight: '800',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl, // rounded-3xl
    borderWidth: 1,
    position: 'relative',
    ...Shadow.card,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSize.xs - 2,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyLogoLine: {
    width: 32,
    height: 1.5,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    ...Shadow.button,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileWelcomeScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  mobileHero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    flex: 1,
  },
  mobileHeroImage: {
    width: 280,
    height: 280,
    marginBottom: Spacing.lg,
  },
  mobileHeroTitle: {
    fontSize: FontSize.lg + 4,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  mobileHeroDesc: {
    fontSize: FontSize.xs + 2,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  mobileWelcomeBtn: {
    width: '100%',
    maxWidth: 240,
  },
  mobileFooter: {
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  footerLink: {
    fontSize: FontSize.xs + 1,
    fontWeight: '600',
  },
  exampleGrid: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  exampleImage: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadow.card,
  },
});
