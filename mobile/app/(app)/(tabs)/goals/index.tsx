import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import type { SavingsGoal, Spender, ApiResponse } from '@quiddo/shared';

interface GoalWithSpender extends SavingsGoal {
  spender?: Spender;
}

interface GroupedGoals {
  spender: Spender;
  goals: GoalWithSpender[];
}

export default function GoalsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GoalWithSpender[]>>('/goals');
      return res.data.data;
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (goalIds: string[]) => {
      await api.post('/goals/reorder', { goal_ids: goalIds });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const moveGoal = (goalId: string, direction: 'up' | 'down', spenderGoals: GoalWithSpender[]) => {
    const idx = spenderGoals.findIndex((g) => g.id === goalId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= spenderGoals.length) return;

    const reordered = [...spenderGoals];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];

    reorderMutation.mutate(reordered.map((g) => g.id));
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={[styles.skeletonText, { width: '30%', height: 28 }]} />
          <View style={[styles.skeletonButton, { width: 100 }]} />
        </View>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  const activeGoals = (goals ?? []).filter((g) => !g.is_completed && !g.abandoned_at);

  // Group by spender
  const grouped: GroupedGoals[] = [];
  const spenderMap = new Map<string, GroupedGoals>();
  for (const goal of activeGoals) {
    const spenderId = goal.spender_id;
    if (!spenderMap.has(spenderId)) {
      const group: GroupedGoals = {
        spender: goal.spender ?? { id: spenderId, name: 'Unknown', family_id: '', color: null, avatar_url: null, currency_name: null, currency_name_plural: null, currency_symbol: null, use_integer_amounts: null, deleted_at: null, created_at: '', updated_at: '' },
        goals: [],
      };
      spenderMap.set(spenderId, group);
      grouped.push(group);
    }
    spenderMap.get(spenderId)!.goals.push(goal);
  }

  // Sort goals within each group by sort_order
  for (const group of grouped) {
    group.goals.sort((a, b) => a.sort_order - b.sort_order);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(app)/goals/create')}
        >
          <Text style={styles.newButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {grouped.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active goals. Create one to start saving!</Text>
        </View>
      )}

      {grouped.map((group) => (
        <View key={group.spender.id} style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <View style={[styles.miniAvatar, { backgroundColor: group.spender.color ?? colors.eucalyptus[400] }]}>
              <Text style={styles.miniAvatarText}>{group.spender.name[0]}</Text>
            </View>
            <Text style={styles.groupName}>{group.spender.name}</Text>
          </View>

          {group.goals.map((goal, index) => {
            const progress =
              parseFloat(goal.target_amount) > 0
                ? (parseFloat(goal.allocated_amount) / parseFloat(goal.target_amount)) * 100
                : 0;

            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => router.push(`/(app)/goals/${goal.id}`)}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <View style={styles.reorderButtons}>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => moveGoal(goal.id, 'up', group.goals)}
                      >
                        <Text style={styles.reorderButtonText}>↑</Text>
                      </TouchableOpacity>
                    )}
                    {index < group.goals.length - 1 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => moveGoal(goal.id, 'down', group.goals)}
                      >
                        <Text style={styles.reorderButtonText}>↓</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressBar, { width: `${Math.min(100, progress)}%` }]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.goalAmounts}>
                  <Text style={styles.goalAllocated}>
                    ${parseFloat(goal.allocated_amount).toFixed(2)}
                  </Text>
                  <Text style={styles.goalTarget}>
                    of ${parseFloat(goal.target_amount).toFixed(2)}
                  </Text>
                </View>
                {goal.target_date && (
                  <Text style={styles.goalDate}>
                    Target: {new Date(goal.target_date).toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
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
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.bark[700] },
  newButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  groupSection: { marginBottom: 24 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  groupName: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: colors.bark[700] },
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 15, fontWeight: '600', color: colors.bark[700], flex: 1 },
  reorderButtons: { flexDirection: 'row', gap: 4 },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bark[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonText: { fontSize: 14, color: colors.bark[700] },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.bark[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: colors.wattle[400], borderRadius: 5 },
  progressPercent: { fontSize: 12, fontWeight: '600', color: colors.wattle[400], width: 36, textAlign: 'right' },
  goalAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 4 },
  goalAllocated: { fontSize: 16, fontWeight: '700', color: colors.bark[700] },
  goalTarget: { fontSize: 13, color: colors.bark[600] },
  goalDate: { fontSize: 12, color: colors.bark[600], marginTop: 4 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.bark[600], textAlign: 'center' },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonButton: { backgroundColor: colors.bark[200], borderRadius: 8, height: 36 },
  skeletonCard: {
    height: 100,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 8,
  },
});
