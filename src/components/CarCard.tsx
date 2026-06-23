import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CarProfile } from '../types/car';
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { ChevronRight, Trash2 } from 'lucide-react-native';

interface CarCardProps {
  car: CarProfile;
  onPress: () => void;
  onDelete: () => void;
}

export default function CarCard({ car, onPress, onDelete }: CarCardProps) {
  const { colors } = useAppTheme();
  
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

  // Safe plate suffix for visual badge
  const plateParts = car.carNumber.split(' ');
  const suffix = plateParts[1] || plateParts[0] || car.carNumber;

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      style={[
        styles.card,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
        }
      ]}
    >
      <View style={styles.leftSection}>
        {/* Modern License Plate Badge */}
        <View style={[
          styles.plateBadge,
          { 
            backgroundColor: colors.surfaceLight, 
            borderColor: colors.border,
          }
        ]}>
          <Text style={[styles.plateBadgeText, { color: colors.primary }]}>
            {suffix.slice(-4)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.carNumber, { color: colors.textPrimary }]}>
            {car.carNumber}
          </Text>
          <Text style={[styles.ownerName, { color: colors.textSecondary }]}>
            {car.ownerName}
          </Text>
          {(car.carModel || car.carColor) && (
            <Text style={[styles.details, { color: colors.textMuted }]}>
              {[car.carModel, car.carColor].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </View>

      {/* Delete / Chevron Action Area */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Trash2 size={14} color={colors.danger} />
        </TouchableOpacity>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl, // rounded-3xl
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plateBadge: {
    width: 64,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  plateBadgeText: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
  },
  carNumber: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ownerName: {
    fontSize: FontSize.xs + 1,
    marginTop: 2,
  },
  details: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
});
