import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import type { Family, Spender, ChoreCompletion, Transaction } from '@quiddo/shared';

interface DashboardData {
  is_parent: boolean;
  families: Family[];
  spenders: Spender[];
  pending_completions: ChoreCompletion[];
  recent_activity: Transaction[];
  total_balance: string;
  paid_this_month: string;
}

function ChildChoreItem({ chore, completions, spenderId }: { chore: any; completions: any[]; spenderId: string }) {
  const queryClient = useQueryClient();
  const thisCompletion = completions.find((c: any) => c.chore_id === chore.id);
  const [localStatus, setLocalStatus] = useState<string | null>(thisCompletion?.status ?? null);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/child/chores/${chore.id}/complete`);
    },
    onMutate: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalStatus('pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'child'] });
    },
    onError: () => {
      setLocalStatus(null);
    },
  });

  const status = localStatus ?? thisCompletion?.status ?? null;
  const isDeclined = status === 'declined';

  return (
    <View style={childStyles.choreCard}>
      {isDeclined && (
        <Text style={childStyles.choreDeclined}>Your parent sent this back</Text>
      )}
      <View style={childStyles.choreRow}>
        <Text style={childStyles.choreEmoji}>{chore.emoji ?? '📋'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={childStyles.choreName}>{chore.name}</Text>
          {chore.reward_type === 'earns' && chore.amount && (
            <Text style={childStyles.choreReward}>${parseFloat(chore.amount).toFixed(2)}</Text>
          )}
        </View>
        {(status === null || isDeclined) && (
          <TouchableOpacity
            style={childStyles.choreButton}
            onPress={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            <Text style={childStyles.choreButtonText}>
              {isDeclined ? 'I really did it!' : 'I did it!'}
            </Text>
          </TouchableOpacity>
        )}
        {status === 'pending' && (
          <Text style={childStyles.chorePending}>⏳ Waiting</Text>
        )}
        {status === 'approved' && (
          <Text style={childStyles.choreApproved}>✓ Done</Text>
        )}
      </View>
    </View>
  );
}

function ChildDeviceDashboard({ data, onRefresh }: { data: any; onRefresh: () => Promise<any> }) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const spender = data.spender;
  const spenderColor = spender?.color ?? colors.wattle[400];
  const balance = parseFloat(data.balance ?? '0');
  const goals = data.goals ?? [];
  const chores = data.chores ?? [];
  const completions = data.completions_this_week ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <View style={[childStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={childStyles.header}>
        <Text style={childStyles.logo}>Quiddo</Text>
        <TouchableOpacity onPress={logout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={childStyles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={childStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.wattle[400]}
            colors={[colors.wattle[400]]}
          />
        }
      >
        {/* Avatar + Name + Balance */}
        <View style={childStyles.profileSection}>
          {spender?.avatar_url ? (
            <Image source={{ uri: spender.avatar_url }} style={[childStyles.avatar, { backgroundColor: spenderColor }]} />
          ) : (
            <View style={[childStyles.avatar, { backgroundColor: spenderColor }]}>
              <Text style={childStyles.avatarText}>{spender?.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={childStyles.spenderName}>{spender?.name}</Text>
          <Text style={[childStyles.balance, { color: spenderColor }]}>
            ${balance.toFixed(2)}
          </Text>
        </View>

        {/* Goals */}
        {goals.length > 0 && (
          <View style={childStyles.section}>
            <Text style={childStyles.sectionTitle}>My Goals</Text>
            {goals.map((goal: any) => {
              const current = parseFloat(goal.allocated_amount ?? '0');
              const target = parseFloat(goal.target_amount ?? '1');
              const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
              const isComplete = pct >= 100;

              return (
                <View key={goal.id} style={childStyles.goalCard}>
                  <View style={childStyles.goalHeader}>
                    <Text style={childStyles.goalName}>{goal.name}</Text>
                    <Text style={childStyles.goalPct}>
                      {isComplete ? '🎉 Done!' : `${pct.toFixed(0)}%`}
                    </Text>
                  </View>
                  <View style={childStyles.goalTrack}>
                    <View style={[
                      childStyles.goalBar,
                      { width: `${pct}%`, backgroundColor: isComplete ? colors.gumleaf[400] : colors.wattle[400] },
                    ]} />
                  </View>
                  <Text style={childStyles.goalAmount}>
                    ${current.toFixed(2)} of ${target.toFixed(2)} ({pct.toFixed(0)}%)
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Chores */}
        {chores.length > 0 && (
          <View style={childStyles.section}>
            <Text style={childStyles.sectionTitle}>My Chores</Text>
            {chores.map((chore: any) => (
              <ChildChoreItem
                key={chore.id}
                chore={chore}
                completions={completions}
                spenderId={spender?.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const childStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.nightsky[900] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  logoutText: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  profileSection: { alignItems: 'center', paddingTop: 16, marginBottom: 32 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontFamily: fonts.body, fontSize: 24, color: colors.white },
  spenderName: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  balance: { fontFamily: fonts.display, fontSize: 48 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  // Goals
  goalCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 8 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalName: { fontFamily: fonts.body, fontSize: 14, color: colors.white },
  goalPct: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  goalTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' },
  goalBar: { height: '100%', borderRadius: 5 },
  goalAmount: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6 },
  // Chores
  choreCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 8 },
  choreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  choreEmoji: { fontSize: 24 },
  choreName: { fontFamily: fonts.body, fontSize: 14, color: colors.white },
  choreReward: { fontFamily: fonts.body, fontSize: 12, color: colors.wattle[400], marginTop: 2 },
  choreButton: { backgroundColor: colors.wattle[400], borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  choreButtonText: { fontFamily: fonts.body, fontSize: 13, color: colors.nightsky[900] },
  chorePending: { fontFamily: fonts.body, fontSize: 13, color: colors.wattle[400] },
  choreApproved: { fontFamily: fonts.body, fontSize: 13, color: colors.gumleaf[400] },
  choreDeclined: { fontFamily: fonts.body, fontSize: 12, color: colors.redearth[400], textAlign: 'center', marginBottom: 8 },
});

export default function DashboardScreen() {
  const { user, isChildDevice, childSpender } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', isChildDevice ? 'child' : 'parent'],
    queryFn: async () => {
      if (isChildDevice) {
        const res = await api.get('/child/dashboard');
        return res.data.data;
      }
      const res = await api.get<{ data: DashboardData }>('/dashboard');
      return res.data.data;
    },
  });

  const handleApprove = async (completionId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await api.patch(`/chore-completions/${completionId}/approve`);
  };

  const handleDecline = async (completionId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await api.patch(`/chore-completions/${completionId}/decline`);
  };

  const handleApproveAll = async (completionIds: string[]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await api.post('/chore-completions/bulk-approve', { completion_ids: completionIds });
  };

  if (isLoading || !data) {
    return (
      <View style={styles.container}>
        {/* Skeleton placeholders */}
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    );
  }

  // Child device view (linked via QR code, no user account)
  if (isChildDevice) {
    return <ChildDeviceDashboard data={data} onRefresh={refetch} />;
  }

  if (data.is_parent) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hi {user?.display_name ?? user?.name}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Family Balance</Text>
            <Text style={styles.statValue}>${data.total_balance}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Paid This Month</Text>
            <Text style={styles.statValue}>${data.paid_this_month}</Text>
          </View>
        </View>

        {/* Kids */}
        {data.families.map((family) =>
          family.spenders?.map((spender) => {
            const balance = spender.accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0) ?? 0;
            const topGoal = spender.savings_goals?.find(g => !g.is_completed);
            const goalProgress = topGoal
              ? Math.min(100, (parseFloat(topGoal.allocated_amount ?? '0') / parseFloat(topGoal.target_amount)) * 100)
              : 0;

            return (
              <View key={spender.id} style={styles.kidCard}>
                <TouchableOpacity
                  style={styles.kidCardTop}
                  onPress={() => router.push(`/(app)/(tabs)/kids/${spender.id}`)}
                >
                  <View style={[styles.avatar, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]}>
                    <Text style={styles.avatarText}>{spender.name[0]}</Text>
                  </View>
                  <View style={styles.kidInfo}>
                    <Text style={styles.kidName}>{spender.name}</Text>
                    <Text style={styles.kidBalanceAmount}>${balance.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>

                {topGoal && (
                  <View style={styles.kidGoal}>
                    <Text style={styles.kidGoalName} numberOfLines={1}>{topGoal.name}</Text>
                    <View style={styles.kidGoalBarBg}>
                      <View style={[styles.kidGoalBar, { width: `${goalProgress}%` }]} />
                    </View>
                    <Text style={styles.kidGoalAmount}>
                      ${parseFloat(topGoal.allocated_amount ?? '0').toFixed(2)} of ${parseFloat(topGoal.target_amount).toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.kidActions}>
                  <TouchableOpacity
                    style={styles.kidSpendButton}
                    onPress={() => router.push({ pathname: '/(app)/transactions/create', params: { spenderId: spender.id, type: 'debit' } })}
                  >
                    <Text style={styles.kidSpendText}>— Spend</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.kidAddButton}
                    onPress={() => router.push({ pathname: '/(app)/transactions/create', params: { spenderId: spender.id, type: 'credit' } })}
                  >
                    <Text style={styles.kidAddText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }),
        )}

        {/* Pending Approvals */}
        {data.pending_completions.length > 0 && (
          <View style={styles.approvalSection}>
            <View style={styles.approvalHeader}>
              <View style={styles.approvalTitleRow}>
                <Text style={styles.approvalTitle}>Needs your approval</Text>
                <View style={styles.approvalBadge}>
                  <Text style={styles.approvalBadgeText}>{data.pending_completions.length}</Text>
                </View>
              </View>
              {data.pending_completions.length > 1 && (
                <TouchableOpacity
                  style={styles.approveAllButton}
                  onPress={() => handleApproveAll(data.pending_completions.map(c => c.id))}
                >
                  <Text style={styles.approveAllText}>✓✓ Approve all</Text>
                </TouchableOpacity>
              )}
            </View>
            {data.pending_completions.map((completion, idx) => (
              <View key={completion.id} style={[styles.approvalRow, idx > 0 && styles.approvalRowBorder]}>
                <View style={[styles.approvalAvatar, { backgroundColor: completion.spender?.color ?? colors.eucalyptus[400] }]}>
                  <Text style={styles.approvalAvatarText}>{completion.spender?.name?.[0] ?? '?'}</Text>
                </View>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalChore} numberOfLines={1}>
                    {completion.chore?.emoji ? `${completion.chore.emoji} ` : ''}{completion.chore?.name}
                  </Text>
                  <Text style={styles.approvalMeta}>
                    {completion.spender?.name} · {new Date(completion.completed_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.approvalActions}>
                  <TouchableOpacity
                    style={styles.approveIconButton}
                    onPress={() => handleApprove(completion.id)}
                  >
                    <Text style={styles.approveIcon}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineIconButton}
                    onPress={() => handleDecline(completion.id)}
                  >
                    <Text style={styles.declineIcon}>✗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // Child view
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.nightsky[900] }]} contentContainerStyle={styles.content}>
      {data.spenders.map((spender) => (
        <View key={spender.id}>
          <Text style={styles.childName}>{spender.name}</Text>
          <Text style={styles.childBalance}>
            ${spender.accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0).toFixed(2)}
          </Text>

          {/* Goals */}
          {spender.savings_goals?.filter(g => !g.is_completed && !g.abandoned_at).map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <View style={styles.goalProgress}>
                <View style={[styles.goalBar, { width: `${Math.min(100, (parseFloat(goal.allocated_amount) / parseFloat(goal.target_amount)) * 100)}%` }]} />
              </View>
              <Text style={styles.goalAmount}>${goal.allocated_amount} / ${goal.target_amount}</Text>
            </View>
          ))}

          {/* Chores */}
          {spender.chores?.map((chore) => (
            <View key={chore.id} style={styles.choreCard}>
              <Text style={styles.choreEmoji}>{chore.emoji ?? '✅'}</Text>
              <Text style={styles.choreName}>{chore.name}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  greeting: { fontFamily: fonts.display, fontSize: 24, color: colors.bark[700], marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.bark[200] },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginBottom: 4 },
  statValue: { fontFamily: fonts.display, fontSize: 20, color: colors.bark[700] },
  kidCard: { backgroundColor: colors.white, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.bark[200], overflow: 'hidden' },
  kidCardTop: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
  kidInfo: { marginLeft: 12, flex: 1 },
  kidName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  kidBalanceAmount: { fontFamily: fonts.display, fontSize: 20, color: colors.bark[700], marginTop: 2 },
  kidGoal: { paddingHorizontal: 14, paddingBottom: 10 },
  kidGoalName: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginBottom: 4 },
  kidGoalBarBg: { height: 6, backgroundColor: colors.bark[200], borderRadius: 3, overflow: 'hidden' },
  kidGoalBar: { height: '100%', backgroundColor: colors.wattle[400], borderRadius: 3 },
  kidGoalAmount: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600], marginTop: 3 },
  kidActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.bark[200] },
  kidSpendButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.bark[200] },
  kidSpendText: { fontFamily: fonts.body, fontSize: 13, color: colors.redearth[400] },
  kidAddButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  kidAddText: { fontFamily: fonts.body, fontSize: 13, color: colors.gumleaf[400] },
  approvalSection: { marginTop: 20, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.wattle[400] + '40', overflow: 'hidden' },
  approvalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.bark[200] },
  approvalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  approvalTitle: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  approvalBadge: { backgroundColor: colors.wattle[400] + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.wattle[400] + '40' },
  approvalBadgeText: { fontFamily: fonts.body, fontSize: 12, color: colors.wattle[400] },
  approveAllButton: { borderWidth: 1, borderColor: colors.gumleaf[400] + '40', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  approveAllText: { fontFamily: fonts.body, fontSize: 12, color: colors.gumleaf[400] },
  approvalRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  approvalRowBorder: { borderTopWidth: 1, borderTopColor: colors.bark[200] },
  approvalAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  approvalAvatarText: { fontFamily: fonts.body, color: colors.white, fontSize: 13 },
  approvalInfo: { flex: 1 },
  approvalChore: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  approvalMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 1 },
  approvalActions: { flexDirection: 'row', gap: 6 },
  approveIconButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.gumleaf[400] + '40', justifyContent: 'center', alignItems: 'center' },
  approveIcon: { fontSize: 16, color: colors.gumleaf[400] },
  declineIconButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.redearth[400] + '40', justifyContent: 'center', alignItems: 'center' },
  declineIcon: { fontSize: 16, color: colors.redearth[400] },
  // Skeleton
  skeletonHeader: { height: 32, backgroundColor: colors.bark[200], borderRadius: 8, marginBottom: 16, width: '60%' },
  skeletonCard: { height: 80, backgroundColor: colors.bark[200], borderRadius: 12, marginBottom: 8 },
  // Child view
  childName: { fontFamily: fonts.body, fontSize: 20, color: colors.white, textAlign: 'center', marginBottom: 8 },
  childBalance: { fontFamily: fonts.display, fontSize: 48, color: colors.wattle[400], textAlign: 'center', marginBottom: 24 },
  goalCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 8 },
  goalName: { color: colors.white, fontWeight: '500', marginBottom: 8 },
  goalProgress: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  goalBar: { height: '100%', backgroundColor: colors.wattle[400], borderRadius: 4 },
  goalAmount: { color: colors.wattle[400], fontSize: 13, marginTop: 6 },
  choreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginBottom: 6 },
  choreEmoji: { fontSize: 20, marginRight: 10 },
  choreName: { color: colors.white, fontSize: 15 },
});
