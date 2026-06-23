import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  icon?: string;
  error?: string;
  maxLength?: number;
}

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  icon,
  error,
  maxLength,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useAppTheme();

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Determine current styles based on state and theme
  const currentBorderColor = error
    ? colors.danger
    : isFocused
    ? colors.primary
    : colors.border;

  const currentBgColor = error
    ? colors.dangerLight
    : isFocused
    ? colors.surfaceLight
    : colors.surface;

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={[
        styles.label, 
        { color: error ? colors.danger : colors.textSecondary }
      ]}>
        {icon ? `${icon}  ` : ''}
        {label}
      </Text>

      {/* Input Wrapper */}
      <View
        style={[
          styles.inputWrapper,
          { 
            borderColor: currentBorderColor,
            backgroundColor: currentBgColor,
          }
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          selectionColor={colors.primary}
        />
        {maxLength && value.length > 0 && (
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>

      {/* Error message */}
      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    borderRadius: BorderRadius.xl, // rounded-2xl in design
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.md,
  },
  counter: {
    fontSize: FontSize.xs,
    marginRight: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
