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
import { getCars, deleteCar, getUnreadCount } from '../utils/storage';
import { CarProfile } from '../types/car';
import CarCard from '../components/CarCard';
import GlassCard from '../components/GlassCard';

export default function HomeScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<CarProfile[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = useCallback(async () => {
    const carList = await getCars();
    setCars(carList);
    const count = await getUnreadCount();
    setUnreadCount(count);
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
          <View style={styles.headerIndicator} />
          <Text style={styles.heroTitle}>CARGUARD</Text>
          <Text style={styles.heroSubtitle}>Secure vehicle communication dashboard</Text>
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
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
  headerIndicator: {
    width: 24,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
    marginBottom: Spacing.md,
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
