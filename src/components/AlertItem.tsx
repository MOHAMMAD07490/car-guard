import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AlertMessage } from '../types/car';
import { Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import GlassCard from './GlassCard';

interface AlertItemProps {
  alert: AlertMessage;
  onPress: () => void;
  loading?: boolean;
}

const ALERT_LABELS: Record<AlertMessage['alertType'], string> = {
  parking: 'Parking',
  lights: 'Lights',
  emergency: 'Emergency',
  general: 'General',
};

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function AlertItem({ alert, onPress, loading }: AlertItemProps) {
  const { colors } = useAppTheme();
  const label = ALERT_LABELS[alert.alertType];
  const timeAgo = getRelativeTime(alert.timestamp);

  const alertColors: Record<AlertMessage['alertType'], string> = {
    parking: colors.primary,
    lights: colors.warning,
    emergency: colors.danger,
    general: colors.accent,
  };
  const color = alertColors[alert.alertType];

  return (
    <GlassCard
      onPress={loading ? undefined : onPress}
      style={[
        styles.card,
        !alert.read && { borderColor: colors.primaryGlow, borderWidth: 1 }
      ]}
    >
      <View style={styles.row}>
        {/* Color Indicator Pillar */}
        <View style={[styles.indicator, { backgroundColor: color }]} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { borderColor: color }]}>
              <Text style={[styles.badgeText, { color }]}>{label}</Text>
            </View>
            <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo}</Text>
          </View>
          
          <Text 
            style={[
              styles.message, 
              { color: colors.textPrimary },
              alert.read && { color: colors.textSecondary, fontWeight: 'normal' }
            ]} 
            numberOfLines={2}
          >
            New issue reported: {alert.message}
          </Text>
          
          {alert.senderNote ? (
            <View style={[styles.noteContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={1}>
                Note: {alert.senderNote}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Unread indicator / Loading indicator */}
        <View style={styles.unreadDotWrapper}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            !alert.read && (
              <>
                <View style={[styles.unreadDotGlow, { backgroundColor: colors.primaryGlow }]} />
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              </>
            )
          )}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  indicator: {
    width: 3,
    borderRadius: 1.5,
    marginRight: Spacing.md,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSize.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  time: {
    fontSize: FontSize.xs,
  },
  message: {
    fontSize: FontSize.md,
    lineHeight: 20,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteText: {
    fontSize: FontSize.sm,
  },
  unreadDotWrapper: {
    marginLeft: Spacing.sm,
    width: 12,
    height: 12,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDotGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
