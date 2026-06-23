import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CarProfile } from '../types/car';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';

interface CarCardProps {
  car: CarProfile;
  onPress: () => void;
  onDelete: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CarCard({ car, onPress, onDelete }: CarCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Remove Vehicle',
      `Are you sure you want to remove vehicle ${car.carNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrapper}>
      <LinearGradient
        colors={[Colors.border, Colors.borderLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.innerCard}>
          <View style={styles.row}>
            {/* Minimalist License Plate Visual */}
            <View style={styles.plateBadge}>
              <Text style={styles.plateText}>{car.carNumber.slice(-4)}</Text>
            </View>

            {/* Car info */}
            <View style={styles.info}>
              <Text style={styles.carNumber}>{car.carNumber}</Text>
              <Text style={styles.ownerName}>{car.ownerName}</Text>
              {(car.carModel || car.carColor) && (
                <Text style={styles.details}>
                  {[car.carModel, car.carColor].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>

            {/* Remove button */}
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.dateText}>
              Registered: {formatDate(car.createdAt)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  gradientBorder: {
    borderRadius: BorderRadius.md,
    padding: 1,
  },
  innerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md - 1,
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateBadge: {
    width: 52,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  plateText: {
    color: Colors.accentLight,
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  info: {
    flex: 1,
  },
  carNumber: {
    color: Colors.textPrimary,
    fontSize: FontSize.md + 1,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  ownerName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  details: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
