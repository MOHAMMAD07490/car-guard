import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/useAppTheme';
import { Spacing, FontSize, BorderRadius } from '../constants/theme';
import { ArrowLeft, FileText } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';

export default function TermsScreen() {
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
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryGlow }]}>
            <FileText size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Terms & Conditions</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please review our simple guidelines for using the QRNote platform responsibly.
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            By creating an account, registering a vehicle, or scanning a QRNote tag, you agree to comply with these terms. If you do not agree, please do not use the service.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. Responsible Usage</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            You agree to use this platform only for valid notifications (e.g. informing a driver about double-parking, headlights, or other vehicle-related issues). Sending spam alerts or abusive messages is strictly prohibited.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. Data Accuracy</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            You are responsible for ensuring that the license plate and contact numbers you register in the app are accurate and current.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>4. Limitation of Liability</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            QRNote serves as a communication tool. We are not responsible for any disputes, traffic violations, parking fines, or vehicle damages that occur while using or failing to use our app.
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
