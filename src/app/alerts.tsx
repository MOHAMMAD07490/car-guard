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
import { Spacing, FontSize, BorderRadius } from '../constants/theme';
import { getAlerts, markAlertRead, markAllAlertsRead, getCurrentUser } from '../utils/storage';
import { AlertMessage } from '../types/car';
import AlertItem from '../components/AlertItem';
import GlassCard from '../components/GlassCard';
import { useAppTheme } from '../hooks/useAppTheme';
import { ArrowLeft } from 'lucide-react-native';

export default function AlertsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
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
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>Inbox Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.subHeader}>
        <Text style={[styles.descText, { color: colors.textSecondary }]}>
          Notifications from your QR codes.
        </Text>
        {alerts.some(a => !a.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
          {alerts.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <View style={[styles.emptyDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>NO NOTIFICATIONS</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  descText: {
    fontSize: FontSize.sm,
  },
  markReadText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyDivider: {
    width: 24,
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
  alertList: {
    gap: Spacing.sm,
  },
});
