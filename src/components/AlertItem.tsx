import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertMessage } from '../types/car';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import GlassCard from './GlassCard';

interface AlertItemProps {
  alert: AlertMessage;
  onPress: () => void;
}

const ALERT_LABELS: Record<AlertMessage['alertType'], string> = {
  parking: 'Parking',
  lights: 'Lights',
  emergency: 'Emergency',
  general: 'General',
};

const ALERT_COLORS: Record<AlertMessage['alertType'], string> = {
  parking: Colors.primary,
  lights: Colors.warning,
  emergency: Colors.danger,
  general: Colors.accent,
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

export default function AlertItem({ alert, onPress }: AlertItemProps) {
  const label = ALERT_LABELS[alert.alertType];
  const color = ALERT_COLORS[alert.alertType];
  const timeAgo = getRelativeTime(alert.timestamp);

  return (
    <GlassCard
      onPress={onPress}
      style={[styles.card, !alert.read && styles.unreadCard]}
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
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
          
          <Text style={styles.message} numberOfLines={2}>
            {alert.message}
          </Text>
          
          {alert.senderNote ? (
            <View style={styles.noteContainer}>
              <Text style={styles.noteText} numberOfLines={1}>
                Note: {alert.senderNote}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Unread indicator */}
        {!alert.read && (
          <View style={styles.unreadDotWrapper}>
            <View style={styles.unreadDotGlow} />
            <View style={styles.unreadDot} />
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  unreadCard: {
    borderColor: Colors.primaryGlow,
    borderWidth: 1,
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
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  message: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 20,
    fontWeight: '500',
  },
  noteContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  noteText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primaryGlow,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
