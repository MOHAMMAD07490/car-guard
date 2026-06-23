import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/useAppTheme';
import { Spacing, FontSize, BorderRadius } from '../constants/theme';
import { ArrowLeft, Shield } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryGlow }]}>
            <Shield size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Your Privacy, Guaranteed</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            At QRNote, we prioritize security above all. Learn how we shield your personal information from the public.
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Information Encryption</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            When you register a vehicle, your phone number and personal identity are encrypted using secure protocols. The QR code contains only a secure token, not your plain-text data.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. Public Visuals Privacy</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Passing observers can scan your QR code to alert you about emergencies, lights left on, or parking issues. However, they will never see your phone number or email address unless you explicitly choose to reveal them during verification.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. Security Verification</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            To reveal the emergency contact number, the scanner must verify the full license plate number matching the vehicle's tag. This prevents random bots or malicious scanning from scraping your contact information.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>4. Cookie & Web Storage</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            We use secure local database configurations and browser cookies to maintain your login session. No tracking or marketing scripts are embedded in the app.
          </Text>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerBarTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.lg + 10,
    textAlign: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg + 2,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  card: {
    padding: Spacing.md + 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  bodyText: {
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
  },
});
