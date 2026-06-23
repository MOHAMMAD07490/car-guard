import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Spacing, BorderRadius, Shadow } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export default function GlassCard({ children, style, onPress }: GlassCardProps) {
  const { colors } = useAppTheme();
  
  const content = (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
      },
      style
    ]}>
      {/* Inner glow accent line */}
      <View style={[styles.glowAccent, { backgroundColor: colors.primary }]} />
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl, // rounded-3xl in the design
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  glowAccent: {
    position: 'absolute',
    top: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 1,
    opacity: 0.2,
    borderRadius: 1,
  },
});
