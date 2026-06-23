import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

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
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = error
    ? Colors.danger
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.border, Colors.primary],
      });

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={[styles.label, error && styles.labelError]}>
        {icon ? `${icon}  ` : ''}
        {label}
      </Text>

      {/* Input */}
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          selectionColor={Colors.primary}
        />
        {maxLength && value.length > 0 && (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        )}
      </Animated.View>

      {/* Error message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  labelError: {
    color: Colors.danger,
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    backgroundColor: Colors.surfaceLighter,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.md,
  },
  counter: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginRight: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
