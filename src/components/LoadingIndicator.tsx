import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { useAppTheme } from '../hooks/useAppTheme';
import { Spacing, FontSize } from '../constants/theme';
import LoadingSvg from '../../assets/images/loading_car_types.svg';

interface LoadingIndicatorProps {
  message?: string;
  size?: number;
}

export default function LoadingIndicator({ message, size = 140 }: LoadingIndicatorProps) {
  const { colors } = useAppTheme();
  
  return (
    <View style={styles.container}>
      <Image 
        source={LoadingSvg} 
        style={{ width: size, height: size * 0.5 }} 
        contentFit="contain"
      />
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs + 1,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
