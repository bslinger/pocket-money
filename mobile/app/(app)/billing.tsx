import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { SubscriptionStatus, ApiResponse, Price } from '@quiddo/shared';
import { TRIAL_DAYS } from '@quiddo/shared';

interface BillingData {
  subscription: SubscriptionStatus | null;
  plans: { monthly: Price; yearly: Price } | null;
  portal_url: string | null;
}

export default function BillingScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      // The billing info is assembled from the dashboard and subscription status
      // We fetch the user data which includes subscription info
      const res = await api.get<ApiResponse<{ subscription: SubscriptionStatus | null }>>('/auth/user');
      return {
        subscription: res.data.data.subscription ?? null,
      };
    },
  });

  const handleManageBilling = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Request a Stripe billing portal URL from the backend
      const res = await api.post<ApiResponse<{ url: string }>>('/billing/portal');
      if (res.data.data.url) {
        await Linking.openURL(res.data.data.url);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Unable to open billing portal');
    }
  };

  const handleSubscribe = async (interval: 'month' | 'year') => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await api.post<ApiResponse<{ url: string }>>('/billing/checkout', {
        interval,
      });
      if (res.data.data.url) {
        await Linking.openURL(res.data.data.url);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Unable to start checkout');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    );
  }

  const subscription = data?.subscription;
  const isActive = subscription?.active ?? false;
  const onTrial = subscription?.on_trial ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Subscription Status</Text>
        <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusBadgeText, isActive ? styles.statusActiveText : styles.statusInactiveText]}>
            {isActive ? (onTrial ? 'Trial' : 'Active') : 'Inactive'}
          </Text>
        </View>
        {onTrial && subscription?.trial_ends_at && (
          <Text style={styles.trialInfo}>
            Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString()}
          </Text>
        )}
        {subscription?.frozen && (
          <Text style={styles.frozenText}>
            Your subscription is frozen. Please update your payment method.
          </Text>
        )}
      </View>

      {/* Plans */}
      {!isActive && (
        <View style={styles.plansSection}>
          <Text style={styles.plansTitle}>Choose a Plan</Text>
          <Text style={styles.plansSubtitle}>
            Start with a {TRIAL_DAYS}-day free trial. Cancel anytime.
          </Text>

          <TouchableOpacity style={styles.planCard} onPress={() => handleSubscribe('month')}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>$1.99/mo</Text>
            </View>
            <Text style={styles.planDesc}>Billed monthly. Cancel anytime.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.planCard, styles.planCardPopular]} onPress={() => handleSubscribe('year')}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Save 37%</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.white }]}>Annual</Text>
              <Text style={[styles.planPrice, { color: colors.white }]}>$15/yr</Text>
            </View>
            <Text style={[styles.planDesc, { color: colors.eucalyptus[400] + 'CC' }]}>
              $1.25/mo billed annually
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manage */}
      {isActive && (
        <View style={styles.manageSection}>
          <TouchableOpacity style={styles.manageButton} onPress={handleManageBilling}>
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
          <Text style={styles.manageHint}>
            Opens Stripe billing portal to update payment, change plan, or cancel.
          </Text>
        </View>
      )}

      {/* Features List */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>What's included</Text>
        {[
          'Unlimited kids and accounts',
          'Savings goals with auto-allocation',
          'Chore tracking with rewards',
          'Automatic pocket money',
          'Family sharing with multiple parents',
          'Push notifications',
        ].map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16, paddingBottom: 40 },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.bark[200],
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: { fontSize: 12, fontWeight: '600', color: colors.bark[600], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statusActive: { backgroundColor: colors.gumleaf[400] + '20' },
  statusInactive: { backgroundColor: colors.bark[200] },
  statusBadgeText: { fontSize: 16, fontWeight: '700' },
  statusActiveText: { color: colors.gumleaf[400] },
  statusInactiveText: { color: colors.bark[600] },
  trialInfo: { fontSize: 13, color: colors.wattle[400], marginTop: 8 },
  frozenText: { fontSize: 13, color: colors.redearth[400], marginTop: 8, textAlign: 'center' },
  plansSection: { marginBottom: 24 },
  plansTitle: { fontSize: 20, fontWeight: '700', color: colors.bark[700] },
  plansSubtitle: { fontSize: 14, color: colors.bark[600], marginTop: 4, marginBottom: 16 },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.bark[200],
    marginBottom: 10,
  },
  planCardPopular: {
    backgroundColor: colors.eucalyptus[500],
    borderColor: colors.eucalyptus[600],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.wattle[400],
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  popularBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '600', color: colors.bark[700] },
  planPrice: { fontSize: 20, fontWeight: '700', color: colors.bark[700] },
  planDesc: { fontSize: 13, color: colors.bark[600], marginTop: 4 },
  manageSection: { marginBottom: 24 },
  manageButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  manageButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  manageHint: { fontSize: 12, color: colors.bark[600], textAlign: 'center', marginTop: 8 },
  featuresSection: { marginTop: 8 },
  featuresTitle: { fontSize: 16, fontWeight: '600', color: colors.bark[700], marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureCheck: { fontSize: 16, color: colors.gumleaf[400], fontWeight: '700', marginRight: 10, width: 20 },
  featureText: { fontSize: 14, color: colors.bark[700] },
  // Skeleton
  skeletonCard: {
    height: 120,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
  },
});
