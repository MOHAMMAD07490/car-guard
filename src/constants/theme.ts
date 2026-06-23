export const Colors = {
  // Primary palette - deep blue/indigo
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  primaryGlow: 'rgba(37, 99, 235, 0.15)',
  
  // Accent - cyan/teal
  accent: '#3b82f6',
  accentDark: '#1d4ed8',
  accentLight: '#60a5fa',
  
  // Success/Warning/Danger
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  
  // Background layers (dark theme)
  background: '#09090b',
  surface: '#18181b',
  surfaceLight: '#27272a',
  surfaceLighter: '#3f3f46',
  
  // Text
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textInverse: '#18181b',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  
  // Gradients
  gradientStart: '#2563eb',
  gradientEnd: '#3b82f6',
  
  // Card glass effect
  glass: 'rgba(24, 24, 27, 0.8)',
  glassBorder: 'rgba(37, 99, 235, 0.15)',
  
  // QR specific
  qrBackground: '#FFFFFF',
  qrForeground: '#09090b',
};

export const ThemeColors = {
  dark: {
    background: '#09090b',
    surface: '#18181b',
    surfaceLight: '#27272a',
    surfaceLighter: '#3f3f46',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textInverse: '#18181b',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    primaryGlow: 'rgba(37, 99, 235, 0.15)',
    accent: '#3b82f6',
    accentLight: '#60a5fa',
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    danger: '#ef4444',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    qrBackground: '#ffffff',
    qrForeground: '#09090b',
  },
  light: {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceLight: '#f4f4f5',
    surfaceLighter: '#e4e4e7',
    textPrimary: '#18181b',
    textSecondary: '#71717a',
    textMuted: '#a1a1aa',
    textInverse: '#ffffff',
    border: 'rgba(24, 24, 27, 0.08)',
    borderLight: 'rgba(24, 24, 27, 0.04)',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    primaryGlow: 'rgba(37, 99, 235, 0.1)',
    accent: '#2563eb',
    accentLight: '#3b82f6',
    success: '#059669',
    successLight: 'rgba(5, 150, 105, 0.08)',
    warning: '#d97706',
    warningLight: 'rgba(217, 119, 6, 0.08)',
    danger: '#dc2626',
    dangerLight: 'rgba(220, 38, 38, 0.08)',
    qrBackground: '#ffffff',
    qrForeground: '#18181b',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 36,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
};
