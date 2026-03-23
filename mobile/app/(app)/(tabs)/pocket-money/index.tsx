import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { ApiResponse, Spender, PocketMoneySchedule, Chore } from '@quiddo/shared';

interface ReleaseSpender {
  spender: Spender;
  schedule: PocketMoneySchedule | null;
  amount: string;
  responsibility_chores: { chore: Chore; completed: boolean }[];
  all_responsibilities_met: boolean;
  is_due: boolean;
}

interface ReleaseData {
  spenders: ReleaseSpender[];
}

export default function PocketMoneyScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pocket-money-release'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ReleaseData>>('/pocket-money/release');
      return res.data.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (spenderId: string) => {
      await api.post('/pocket-money/release', { spender_id: spenderId });
    },
    onMutate: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pocket-money-release'] });
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to process payment');
    },
  });

  const payAll = () => {
    const dueSpenders = (data?.spenders ?? []).filter((s) => s.is_due && s.all_responsibilities_met);
    if (dueSpenders.length === 0) {
      Alert.alert('No payments due', 'There are no spenders with pocket money due right now.');
      return;
    }
    Alert.alert(
      'Pay All',
      `Release pocket money to ${dueSpenders.length} kid${dueSpenders.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay All',
          onPress: () => {
            for (const s of dueSpenders) {
              payMutation.mutate(s.spender.id);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonText, { width: '50%', height: 28, margin: 16 }]} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
        ))}
      </View>
    );
  }

  const spenders = data?.spenders ?? [];
  const dueCount = spenders.filter((s) => s.is_due).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pocket Money</Text>
        {dueCount > 0 && (
          <TouchableOpacity style={styles.payAllButton} onPress={payAll}>
            <Text style={styles.payAllText}>Pay All ({dueCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {spenders.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No pocket money schedules set up yet. Edit a kid to add a schedule.
          </Text>
        </View>
      )}

      {spenders.map((item) => (
        <View key={item.spender.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: item.spender.color ?? colors.eucalyptus[400] }]}>
              <Text style={styles.avatarText}>{item.spender.name[0]}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.spenderName}>{item.spender.name}</Text>
              {item.schedule && (
                <Text style={styles.scheduleInfo}>
                  ${parseFloat(item.amount).toFixed(2)} · {item.schedule.frequency}
                </Text>
              )}
            </View>
            <Text style={styles.amountLarge}>${parseFloat(item.amount).toFixed(2)}</Text>
          </View>

          {/* Responsibility chores */}
          {item.responsibility_chores.length > 0 && (
            <View style={styles.choresSection}>
              <Text style={styles.choresLabel}>Responsibilities</Text>
              {item.responsibility_chores.map((rc) => (
                <View key={rc.chore.id} style={styles.choreRow}>
                  <View style={[styles.checkCircle, rc.completed && styles.checkCircleCompleted]}>
                    {rc.completed && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={[styles.choreName, rc.completed && styles.choreNameCompleted]}>
                    {rc.chore.emoji ?? '✅'} {rc.chore.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Status and Pay button */}
          <View style={styles.cardFooter}>
            {!item.is_due ? (
              <Text style={styles.notDueText}>Not due yet</Text>
            ) : !item.all_responsibilities_met ? (
              <Text style={styles.blockedText}>Responsibilities incomplete</Text>
            ) : (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() =>
                  Alert.alert(
                    'Confirm Payment',
                    `Pay ${item.spender.name} $${parseFloat(item.amount).toFixed(2)}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Pay', onPress: () => payMutation.mutate(item.spender.id) },
                    ],
                  )
                }
                disabled={payMutation.isPending}
              >
                <Text style={styles.payButtonText}>
                  {payMutation.isPending ? 'Paying...' : 'Pay'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.bark[700] },
  payAllButton: {
    backgroundColor: colors.gumleaf[400],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  payAllText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '600' },
  spenderName: { fontSize: 16, fontWeight: '600', color: colors.bark[700] },
  scheduleInfo: { fontSize: 13, color: colors.bark[600], marginTop: 2 },
  amountLarge: { fontSize: 22, fontWeight: '700', color: colors.bark[700] },
  choresSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.bark[100] },
  choresLabel: { fontSize: 12, fontWeight: '600', color: colors.bark[600], marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  choreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.bark[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkCircleCompleted: { borderColor: colors.gumleaf[400], backgroundColor: colors.gumleaf[400] },
  checkMark: { color: colors.white, fontSize: 12, fontWeight: '700' },
  choreName: { fontSize: 14, color: colors.bark[700] },
  choreNameCompleted: { color: colors.bark[600] },
  cardFooter: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.bark[100], alignItems: 'flex-end' },
  notDueText: { fontSize: 13, color: colors.bark[600] },
  blockedText: { fontSize: 13, color: colors.wattle[400], fontWeight: '500' },
  payButton: {
    backgroundColor: colors.gumleaf[400],
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  payButtonText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.bark[600], textAlign: 'center' },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: {
    height: 140,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 12,
  },
});
