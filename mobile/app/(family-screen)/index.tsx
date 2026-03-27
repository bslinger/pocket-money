import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { useTablet } from '@/hooks/useTablet';
import type { FamilyScreenDashboard, FamilyScreenSpender } from '@quiddo/shared';

function SpenderChoreCard({ spender, currencySymbol }: { spender: FamilyScreenSpender; currencySymbol: string }) {
  const queryClient = useQueryClient();

  const completedChoreIds = new Set(
    spender.completions_today
      .filter(c => c.status === 'approved' || c.status === 'pending')
      .map(c => c.chore_id)
  );

  const completeMutation = useMutation({
    mutationFn: async (choreId: string) => {
      const response = await api.post(`/family-screen/spenders/${spender.id}/chores/${choreId}/complete`);
      return response.data.data;
    },
    onMutate: async (choreId: string) => {
      // Optimistic update — mark as pending immediately
      await queryClient.cancelQueries({ queryKey: ['family-screen', 'dashboard'] });
      const previous = queryClient.getQueryData(['family-screen', 'dashboard']);
      queryClient.setQueryData(['family-screen', 'dashboard'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            spenders: old.data.spenders.map((s: FamilyScreenSpender) =>
              s.id === spender.id
                ? {
                    ...s,
                    completions_today: [
                      ...s.completions_today,
                      { id: `optimistic-${choreId}`, chore_id: choreId, status: 'pending', completed_at: new Date().toISOString() },
                    ],
                  }
                : s
            ),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _choreId, context: any) => {
      queryClient.setQueryData(['family-screen', 'dashboard'], context?.previous);
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['family-screen', 'dashboard'] });
    },
  });

  const handleComplete = (choreId: string, choreName: string) => {
    Alert.alert(
      'Mark as done',
      `Mark "${choreName}" as done for ${spender.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Done', onPress: () => completeMutation.mutate(choreId) },
      ]
    );
  };

  const pendingChores = spender.chores.filter(c => !completedChoreIds.has(c.id));
  const doneChores = spender.chores.filter(c => completedChoreIds.has(c.id));

  return (
    <View style={[styles.spenderCard, { borderTopColor: spender.color ?? colors.eucalyptus[400] }]}>
      <View style={styles.spenderHeader}>
        <View style={[styles.spenderDot, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]} />
        <Text style={styles.spenderName}>{spender.name}</Text>
        <Text style={styles.spenderBalance}>{currencySymbol}{parseFloat(spender.balance).toFixed(2)}</Text>
      </View>

      {spender.chores.length === 0 && (
        <Text style={styles.emptyText}>No chores today</Text>
      )}

      {pendingChores.map(chore => (
        <TouchableOpacity
          key={chore.id}
          style={styles.choreRow}
          onPress={() => handleComplete(chore.id, chore.name)}
          activeOpacity={0.7}
        >
          <View style={styles.choreTick}>
            <Text style={styles.choreTickEmpty}>○</Text>
          </View>
          <Text style={styles.choreEmoji}>{chore.emoji ?? '📋'}</Text>
          <View style={styles.choreInfo}>
            <Text style={styles.choreName}>{chore.name}</Text>
            {chore.reward_type === 'earns' && chore.amount && (
              <Text style={styles.choreAmount}>{currencySymbol}{chore.amount}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {doneChores.map(chore => {
        const completion = spender.completions_today.find(c => c.chore_id === chore.id);
        const isPending = completion?.status === 'pending';
        return (
          <View key={chore.id} style={[styles.choreRow, styles.choreRowDone]}>
            <View style={styles.choreTick}>
              <Text style={[styles.choreTickFilled, isPending && styles.choreTickPending]}>
                {isPending ? '⏳' : '✓'}
              </Text>
            </View>
            <Text style={styles.choreEmoji}>{chore.emoji ?? '📋'}</Text>
            <View style={styles.choreInfo}>
              <Text style={[styles.choreName, styles.choreNameDone]}>{chore.name}</Text>
              {isPending && <Text style={styles.chorePending}>Awaiting approval</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function FamilyScreenTodayScreen() {
  const { familyScreenFamily, logout } = useAuth();
  const isTablet = useTablet();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['family-screen', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/family-screen/dashboard');
      return response.data as { data: FamilyScreenDashboard };
    },
    refetchInterval: 30_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['family-screen', 'dashboard'] });
    setRefreshing(false);
  };

  const dashboard = data?.data;
  const currencySymbol = dashboard?.family.currency_symbol ?? familyScreenFamily?.currency_symbol ?? '$';

  const handleLogout = () => {
    Alert.alert('Remove family screen', 'Remove this device as a family screen?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{dashboard?.family.name ?? familyScreenFamily?.name ?? 'Family'}</Text>
        <Text style={styles.headerSubtitle}>Today's chores</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Remove screen</Text>
        </TouchableOpacity>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {dashboard?.spenders.map(spender => (
            <View key={spender.id} style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
              <SpenderChoreCard spender={spender} currencySymbol={currencySymbol} />
            </View>
          ))}

          {dashboard?.spenders.length === 0 && (
            <Text style={styles.noKidsText}>No children added yet. Add them in the Quiddo app.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600', color: colors.bark[700], flex: 1 },
  headerSubtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  logoutButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.bark[200] },
  logoutText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },

  loadingContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  skeletonCard: { width: '100%', height: 160, backgroundColor: colors.bark[200], borderRadius: 12 },
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
  spenderName: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: colors.bark[700], flex: 1 },
  spenderBalance: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },

  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[400], textAlign: 'center', paddingVertical: 8 },

  choreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderTopWidth: 1, borderTopColor: colors.bark[100] },
  choreRowDone: { opacity: 0.55 },
  choreTick: { width: 24, alignItems: 'center' },
  choreTickEmpty: { fontSize: 18, color: colors.bark[400] },
  choreTickFilled: { fontSize: 16, color: colors.gumleaf[400], fontWeight: '700' },
  choreTickPending: { color: colors.wattle[400] },
  choreEmoji: { fontSize: 18 },
  choreInfo: { flex: 1 },
  choreName: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  choreNameDone: { textDecorationLine: 'line-through', color: colors.bark[500] },
  choreAmount: { fontFamily: fonts.body, fontSize: 12, color: colors.gumleaf[400] },
  chorePending: { fontFamily: fonts.body, fontSize: 11, color: colors.wattle[400] },

  noKidsText: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[500], textAlign: 'center', marginTop: 60, paddingHorizontal: 32 },
});
