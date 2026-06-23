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
    // Unauthenticated View
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Shield size={22} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>CarGuard</Text>
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
              <View style={[styles.heroButtonRow, { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }]}>
                <GradientButton
                  title="Get Started (Free)"
                  onPress={() => router.push('/login')}
                  style={{ flex: 1, maxWidth: 200 }}
                />
                <TouchableOpacity
                  style={[styles.secondaryHeroBtn, { borderColor: colors.border }]}
                  onPress={() => router.push('/scan/demo')}
                >
                  <Text style={[styles.secondaryHeroBtnText, { color: colors.textPrimary }]}>Simulate Scan</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.landingNotice, { color: colors.textMuted, textAlign: 'left', paddingHorizontal: 0, marginTop: Spacing.sm }]}>
                ✓ Zero app install for observers.  ✓ Private & encrypted storage.
              </Text>
            </View>

            {/* Hero Right side: Mockup of windshield tag */}
            <View style={[styles.heroRight, isDesktop ? { flex: 0.8, alignItems: 'center' } : { marginTop: Spacing.xl }]}>
              <GlassCard style={styles.mockupCard}>
                <View style={styles.mockupTagHeader}>
                  <Shield size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.mockupTagTitle, { color: colors.textPrimary }]}>CARGUARD SECURE PORTAL</Text>
                </View>
                <View style={[styles.mockupQR, { borderColor: colors.border }]}>
                  <QrCode size={110} color={colors.textPrimary} style={{ opacity: 0.8 }} />
                </View>
                <Text style={[styles.mockupPlate, { color: colors.textPrimary }]}>JHHJ 8888</Text>
                <View style={[styles.mockupBadge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                  <Lock size={12} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={[styles.mockupBadgeText, { color: colors.success }]}>Windshield Profile Hidden</Text>
                </View>
              </GlassCard>
            </View>
          </View>

          {/* Why CarGuard? Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Traditional Dashboard Note vs. CarGuard
            </Text>
            <View style={[styles.comparisonGrid, isDesktop && styles.row, isDesktop && { gap: Spacing.md }]}>
              {/* Paper Note Card */}
              <View style={[styles.comparisonCard, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1, marginBottom: isDesktop ? 0 : Spacing.md }]}>
                <Text style={[styles.comparisonCardTitle, { color: colors.danger }]}>Handwritten Paper Note</Text>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonIcon}>❌</Text>
                  <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>Exposes your phone number to any passerby</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonIcon}>❌</Text>
                  <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>High risk of spam calls, stalking, or harassment</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonIcon}>❌</Text>
                  <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>Zero logs or tracking of who scanned your vehicle</Text>
                </View>
              </View>

              {/* CarGuard Card */}
              <GlassCard style={[styles.comparisonCardActive, { flex: 1 }]}>
                <Text style={[styles.comparisonCardTitle, { color: colors.primary }]}>CarGuard Privacy Shield</Text>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonIcon}>✓</Text>
                  <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>100% encrypted & hidden phone number</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonIcon}>✓</Text>
                  <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>Verified license plate is required to reveal emergency number</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonIcon}>✓</Text>
                  <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>Real-time push alerts sent straight to your dashboard</Text>
                </View>
              </GlassCard>
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
                  q: "Is CarGuard completely free?",
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
                Join thousands of drivers who secure their windshield contact details with CarGuard.
              </Text>
              <GradientButton
                title="Create Free Account"
                onPress={() => router.push('/login')}
                style={{ width: 220, alignSelf: 'center', marginTop: Spacing.sm }}
              />
            </GlassCard>
          </View>

          {/* Landing Footer */}
          <View style={styles.landingFooter}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              © 2026 CarGuard. All rights reserved. Privacy-First Vehicle Portal.
            </Text>
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
          <Shield size={22} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>CarGuard</Text>
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
});
