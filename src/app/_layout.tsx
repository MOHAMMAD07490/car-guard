import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { ThemeProvider, useAppTheme } from '../hooks/useAppTheme';
import { useIsOnline } from '../hooks/useIsOnline';
import { WifiOff } from 'lucide-react-native';
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';

function AppContent() {
  const { theme, colors } = useAppTheme();
  const isOnline = useIsOnline();

  if (!isOnline) {
    return (
      <View style={[styles.offlineContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.offlineInner}>
          <View style={[styles.offlineIconBg, { backgroundColor: colors.dangerLight }]}>
            <WifiOff size={48} color={colors.danger} />
          </View>
          <Text style={[styles.offlineTitle, { color: colors.textPrimary }]}>YOU ARE OFFLINE</Text>
          <Text style={[styles.offlineText, { color: colors.textSecondary }]}>
            Please check your internet connection. QRNote requires an active network to sync vehicle details and route alerts securely.
          </Text>
          <TouchableOpacity 
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="qrview" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="scan/[data]" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  offlineInner: {
    alignItems: 'center',
    maxWidth: 320,
  },
  offlineIconBg: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  offlineTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  offlineText: {
    fontSize: FontSize.xs + 2,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryBtn: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
