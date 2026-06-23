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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getCars, deleteCar, getUnreadCount, getCurrentUser, logout } from '../utils/storage';
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
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useAppTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<CarProfile[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const carList = await getCars();
      // Filter cars to show only the ones owned by the current logged-in user
      const filteredCars = carList.filter(c => c.ownerId === currentUser.id);
      setCars(filteredCars);
      
      const count = await getUnreadCount();
      setUnreadCount(count);
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.landingHeader}>
            <View style={[styles.headerIndicator, { backgroundColor: colors.primary }]} />
            <Text style={[styles.landingTitle, { color: colors.textPrimary }]}>CARGUARD</Text>
            <Text style={[styles.landingSubtitle, { color: colors.primary }]}>Secure, Privacy-First Vehicle Portal</Text>
          </View>

          <GlassCard style={styles.introCard}>
            <Text style={[styles.introHeader, { color: colors.textPrimary }]}>Protect Your Personal Identity</Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Keep your phone number and full license plate hidden behind secure, customized dashboard QR codes.
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Observers can alert you immediately regarding double parking, lights left on, or emergency situations without accessing your personal contact details.
            </Text>
          </GlassCard>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryGlow }]}>
                <QrCode size={20} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Secure QR Generator</Text>
                <Text style={[styles.featureDesc, { color: colors.textMuted }]}>Create beautiful QR tags to print and display on your windshield.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryGlow }]}>
                <MessageSquare size={20} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Anonymous Messaging</Text>
                <Text style={[styles.featureDesc, { color: colors.textMuted }]}>Receive real-time notifications securely through your app dashboard inbox.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryGlow }]}>
                <AlertTriangle size={20} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Emergency Verification Wall</Text>
                <Text style={[styles.featureDesc, { color: colors.textMuted }]}>Phone numbers are only revealed if the observer verifies the full vehicle plate.</Text>
              </View>
            </View>
          </View>

          <View style={styles.landingActions}>
            <GradientButton
              title="Get Started / Sign In"
              onPress={() => router.push('/login')}
            />
            <Text style={[styles.landingNotice, { color: colors.textMuted }]}>
              Visitors can scan your QR and send alerts securely without needing an account.
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
  landingHeader: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  headerIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginBottom: Spacing.sm,
  },
  landingTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: 2,
  },
  landingSubtitle: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xs,
    fontWeight: '700',
  },
  introCard: {
    marginBottom: Spacing.xl,
  },
  introHeader: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  introText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  featuresList: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  landingActions: {
    marginTop: Spacing.md,
    gap: Spacing.md,
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
