import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
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

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardData }>('/dashboard');
      return res.data.data;
    },
  });

  const handleApprove = async (completionId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await api.patch(`/chore-completions/${completionId}/approve`);
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
          family.spenders?.map((spender) => (
            <TouchableOpacity
              key={spender.id}
              style={styles.kidCard}
              onPress={() => router.push(`/(app)/(tabs)/kids/${spender.id}`)}
            >
              <View style={[styles.avatar, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]}>
                <Text style={styles.avatarText}>{spender.name[0]}</Text>
              </View>
              <View style={styles.kidInfo}>
                <Text style={styles.kidName}>{spender.name}</Text>
                <Text style={styles.kidBalance}>
                  ${spender.accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )),
        )}

        {/* Pending Approvals */}
        {data.pending_completions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            {data.pending_completions.map((completion) => (
              <View key={completion.id} style={styles.approvalCard}>
                <View>
                  <Text style={styles.approvalChore}>{completion.chore?.name}</Text>
                  <Text style={styles.approvalSpender}>{completion.spender?.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(completion.id)}
                >
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
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
  kidCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.bark[200] },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: fonts.body, color: colors.white, fontSize: 18 },
  kidInfo: { marginLeft: 12, flex: 1 },
  kidName: { fontFamily: fonts.body, fontSize: 16, color: colors.bark[700] },
  kidBalance: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.bark[700], marginBottom: 12 },
  approvalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.bark[200] },
  approvalChore: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  approvalSpender: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginTop: 2 },
  approveButton: { backgroundColor: colors.gumleaf[400], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  approveButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 14 },
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
