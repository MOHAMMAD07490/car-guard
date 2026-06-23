import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export default function GlassCard({ children, style, onPress }: GlassCardProps) {
  const content = (
    <View style={[styles.card, style]}>
      {/* Inner glow accent line */}
      <View style={styles.glowAccent} />
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
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
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
    backgroundColor: Colors.primaryLight,
    opacity: 0.3,
    borderRadius: 1,
  },
});
