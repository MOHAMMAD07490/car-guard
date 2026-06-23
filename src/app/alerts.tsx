import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { getAlerts, markAlertRead, markAllAlertsRead, getCurrentUser } from '../utils/storage';
import { AlertMessage } from '../types/car';
import AlertItem from '../components/AlertItem';
import GlassCard from '../components/GlassCard';

export default function AlertsScreen() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const allAlerts = await getAlerts();
      setAlerts(allAlerts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getCurrentUser().then((user) => {
        if (!user) {
          router.replace('/login');
        } else {
          setAuthChecked(true);
          loadAlerts();
        }
      });
    }, [loadAlerts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleAlertPress = async (alert: AlertMessage) => {
    await markAlertRead(alert.id);
    await loadAlerts();
  };

  const handleMarkAllRead = async () => {
    await markAllAlertsRead();
    await loadAlerts();
  };

  if (!authChecked) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.05)', 'transparent']}
        style={styles.bgGradient}
      />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>
        
        {alerts.some(a => !a.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>INBOX ALERTS</Text>
      <Text style={styles.subtitle}>Alert notifications sent by users scanning your QR codes</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
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
          {alerts.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <View style={styles.emptyDivider} />
              <Text style={styles.emptyTitle}>NO NOTIFICATIONS</Text>
              <Text style={styles.emptyText}>
                Any alerts sent from scanned QR codes will appear here in chronological order.
              </Text>
            </GlassCard>
          ) : (
            <View style={styles.alertList}>
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onPress={() => handleAlertPress(alert)}
                />
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
  },
  bgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  markReadText: {
    fontSize: FontSize.xs,
    color: Colors.accentLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyDivider: {
    width: 24,
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
  alertList: {
    gap: Spacing.sm,
  },
});
