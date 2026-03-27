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

function BalanceCard({ spender, currencySymbol }: { spender: FamilyScreenSpender; currencySymbol: string }) {
  const doneToday = spender.completions_today.filter(c => c.status === 'approved').length;
  const pendingToday = spender.completions_today.filter(c => c.status === 'pending').length;
  const totalChores = spender.chores.length;

  return (
    <View style={[styles.balanceCard, { borderTopColor: spender.color ?? colors.eucalyptus[400] }]}>
      <View style={[styles.colorBar, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]} />

      <View style={styles.balanceBody}>
        <Text style={styles.spenderName}>{spender.name}</Text>

        <Text style={[styles.balanceAmount, { color: spender.color ?? colors.wattle[400] }]}>
          {currencySymbol}{parseFloat(spender.balance).toFixed(2)}
        </Text>

        <View style={styles.stats}>
          {totalChores > 0 && (
            <Text style={styles.statText}>
              {doneToday}/{totalChores} chores done today
              {pendingToday > 0 && ` · ${pendingToday} pending`}
            </Text>
          )}
          {spender.goals.length > 0 && (
            <Text style={styles.statText}>
              {spender.goals.length} active {spender.goals.length === 1 ? 'goal' : 'goals'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function FamilyScreenBalancesScreen() {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Balances</Text>
      </View>

      {isLoading && !dashboard ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeletonCard, isTablet && styles.skeletonCardTablet]} />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {dashboard?.spenders.map(spender => (
            <View key={spender.id} style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
              <BalanceCard spender={spender} currencySymbol={currencySymbol} />
            </View>
          ))}

          {dashboard?.spenders.length === 0 && (
            <Text style={styles.emptyText}>No children added yet. Add them in the Quiddo app.</Text>
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
  skeletonCard: { width: '100%', height: 100, backgroundColor: colors.bark[200], borderRadius: 12 },
  skeletonCardTablet: { width: '30%' },

  content: { padding: 16, gap: 12 },
  contentTablet: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },

  cardWrapper: { width: '100%' },
  cardWrapperTablet: { width: '30%', margin: '1.5%' },

  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderTopWidth: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  balanceBody: { flex: 1, padding: 16 },
  spenderName: { fontFamily: fonts.display, fontSize: 16, fontWeight: '600', color: colors.bark[700], marginBottom: 4 },
  balanceAmount: { fontFamily: fonts.display, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  stats: { gap: 2 },
  statText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[500] },

  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[500], textAlign: 'center', marginTop: 60, paddingHorizontal: 32 },
});
