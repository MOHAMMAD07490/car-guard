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
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getCars, deleteCar, getUnreadCount, getCurrentUser, logout } from '../utils/storage';
import { CarProfile } from '../types/car';
import { UserProfile } from '../types/user';
import CarCard from '../components/CarCard';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';

export default function HomeScreen() {
  const router = useRouter();
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
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.05)', 'transparent']}
          style={styles.bgGradient}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.landingHeader}>
            <View style={styles.headerIndicator} />
            <Text style={styles.landingTitle}>CARGUARD</Text>
            <Text style={styles.landingSubtitle}>Secure, Privacy-First Vehicle Portal</Text>
          </View>

          <GlassCard style={styles.introCard}>
            <Text style={styles.introHeader}>Protect Your Personal Identity</Text>
            <Text style={styles.introText}>
              Keep your phone number and full license plate hidden behind secure, customized dashboard QR codes. 
            </Text>
            <Text style={styles.introText}>
              Observers can alert you immediately regarding double parking, lights left on, or emergency situations without accessing your personal contact details.
            </Text>
          </GlassCard>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureDot}>●</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Secure QR Generator</Text>
                <Text style={styles.featureDesc}>Create beautiful QR tags to print and display on your windshield.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureDot}>●</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Anonymous Messaging</Text>
                <Text style={styles.featureDesc}>Receive real-time notifications securely through your app dashboard inbox.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureDot}>●</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Emergency Verification Wall</Text>
                <Text style={styles.featureDesc}>Phone numbers are only revealed if the observer verifies the full vehicle plate.</Text>
              </View>
            </View>
          </View>

          <View style={styles.landingActions}>
            <GradientButton
              title="Get Started / Sign In"
              onPress={() => router.push('/login')}
            />
            <Text style={styles.landingNotice}>
              Visitors can scan your QR and send alerts securely without needing an account.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Authenticated View
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Minimal Header */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.08)', 'transparent']}
            style={styles.heroBg}
          />
          <View style={styles.authHeaderTop}>
            <View style={styles.headerIndicator} />
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroTitle}>CARGUARD</Text>
          <Text style={styles.heroSubtitle}>Welcome back, {user.name}</Text>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{cars.length}</Text>
            <Text style={styles.statLabel}>VEHICLES</Text>
          </GlassCard>
          
          <TouchableOpacity
            onPress={() => router.push('/alerts')}
            activeOpacity={0.8}
            style={styles.statPressable}
          >
            <GlassCard style={styles.statCard}>
              <View style={styles.statWithBadge}>
                <Text style={styles.statNumber}>{unreadCount}</Text>
                {unreadCount > 0 && <View style={styles.badge} />}
              </View>
              <Text style={styles.statLabel}>NEW ALERTS</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Cars Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY CARS</Text>
          {cars.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <View style={styles.emptyLogoLine} />
              <Text style={styles.emptyTitle}>NO REGISTERED CARS</Text>
              <Text style={styles.emptyText}>
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
          colors={[Colors.primary, Colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: 40,
  },
  landingHeader: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  landingTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  landingSubtitle: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    color: Colors.accentLight,
    letterSpacing: 1.5,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  introCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  introHeader: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  introText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs + 1,
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
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureDot: {
    color: Colors.accentLight,
    fontSize: 10,
    marginTop: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  landingActions: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  landingNotice: {
    color: Colors.textMuted,
    fontSize: FontSize.xs - 1,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
  },
  authHeaderTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  signOutText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerIndicator: {
    width: 24,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  heroSubtitle: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  statPressable: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs - 2,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: Spacing.xs,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginLeft: 6,
    marginTop: -8,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyLogoLine: {
    width: 32,
    height: 1.5,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
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
  fabText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: -2,
  },
});
