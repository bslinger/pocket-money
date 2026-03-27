import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { useTablet } from '@/hooks/useTablet';
import type { FamilyScreenDashboard, FamilyScreenSpender } from '@quiddo/shared';

function GoalProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(progress, 100);
  const color = clamped >= 100 ? colors.gumleaf[400] : colors.wattle[400];
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SpenderGoalsCard({ spender, currencySymbol }: { spender: FamilyScreenSpender; currencySymbol: string }) {
  if (spender.goals.length === 0) return null;

  return (
    <View style={[styles.spenderCard, { borderTopColor: spender.color ?? colors.eucalyptus[400] }]}>
      <View style={styles.spenderHeader}>
        <View style={[styles.spenderDot, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]} />
        <Text style={styles.spenderName}>{spender.name}</Text>
      </View>

      {spender.goals.map(goal => {
        const progress = parseFloat(goal.target_amount) > 0
          ? (parseFloat(goal.allocated_amount) / parseFloat(goal.target_amount)) * 100
          : 0;
        return (
          <View key={goal.id} style={styles.goalRow}>
            <View style={styles.goalTitleRow}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalAmounts}>
                {currencySymbol}{parseFloat(goal.allocated_amount).toFixed(2)}
                <Text style={styles.goalTarget}> / {currencySymbol}{parseFloat(goal.target_amount).toFixed(2)}</Text>
              </Text>
            </View>
            <GoalProgressBar progress={progress} />
            {goal.target_date && (
              <Text style={styles.goalDate}>By {new Date(goal.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function FamilyScreenGoalsScreen() {
  const { familyScreenFamily } = useAuth();
  const isTablet = useTablet();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['family-screen', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/family-screen/dashboard');
      return response.data as { data: FamilyScreenDashboard };
    },
    refetchInterval: 30_000,
  });

  const dashboard = data?.data;
  const currencySymbol = dashboard?.family.currency_symbol ?? familyScreenFamily?.currency_symbol ?? '$';
  const spendersWithGoals = dashboard?.spenders.filter(s => s.goals.length > 0) ?? [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings goals</Text>
      </View>

      {isLoading && !dashboard ? (
        <View style={styles.loadingContainer}>
          {[1, 2].map(i => (
            <View key={i} style={[styles.skeletonCard, isTablet && styles.skeletonCardTablet]} />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {spendersWithGoals.map(spender => (
            <View key={spender.id} style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
              <SpenderGoalsCard spender={spender} currencySymbol={currencySymbol} />
            </View>
          ))}

          {spendersWithGoals.length === 0 && (
            <Text style={styles.emptyText}>No active savings goals.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.bark[200],
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600', color: colors.bark[700] },

  loadingContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  skeletonCard: { width: '100%', height: 120, backgroundColor: colors.bark[200], borderRadius: 12 },
  skeletonCardTablet: { width: '48%' },

  content: { padding: 16, gap: 12 },
  contentTablet: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },

  cardWrapper: { width: '100%' },
  cardWrapperTablet: { width: '48%', margin: '1%' },

  spenderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderTopWidth: 3,
  },
  spenderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  spenderDot: { width: 10, height: 10, borderRadius: 5 },
  spenderName: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: colors.bark[700] },

  goalRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.bark[100] },
  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  goalName: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], flex: 1 },
  goalAmounts: { fontFamily: fonts.body, fontSize: 13, color: colors.wattle[400], fontWeight: '600' },
  goalTarget: { color: colors.bark[400], fontWeight: '400' },
  goalDate: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[500], marginTop: 4 },

  progressTrack: { height: 6, backgroundColor: colors.bark[200], borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[500], textAlign: 'center', marginTop: 60, paddingHorizontal: 32 },
});
