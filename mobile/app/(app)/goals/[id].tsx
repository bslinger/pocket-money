import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { SavingsGoal, ApiResponse } from '@quiddo/shared';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const { data: goal, isLoading, refetch } = useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SavingsGoal>>(`/goals/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const abandonMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/goals/${id}/abandon`);
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to abandon goal');
    },
  });

  if (isLoading || !goal) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonImage} />
        <View style={[styles.skeletonText, { width: '60%', height: 24, margin: 16 }]} />
        <View style={[styles.skeletonText, { width: '80%', height: 12, marginHorizontal: 16 }]} />
        <View style={[styles.skeletonCard, { margin: 16 }]} />
      </View>
    );
  }

  const progress =
    parseFloat(goal.target_amount) > 0
      ? (parseFloat(goal.allocated_amount) / parseFloat(goal.target_amount)) * 100
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.eucalyptus[400]} />}>
      {/* Cover Image — only shown if present */}
      {goal.image_url && (
        <Image source={{ uri: goal.image_url }} style={styles.coverImage} resizeMode="cover" />
      )}

      {/* Goal Info */}
      <View style={styles.infoSection}>
        <Text style={styles.goalName}>{goal.name}</Text>
        {goal.spender && (
          <View style={styles.spenderRow}>
            <SpenderAvatar name={goal.spender.name} color={goal.spender.color} avatarUrl={goal.spender.avatar_url} size={28} />
            <Text style={styles.spenderLabel}>{goal.spender.name}</Text>
          </View>
        )}

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.min(100, progress)}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>

        {/* Amounts */}
        <View style={styles.amountsRow}>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Allocated</Text>
            <Text style={styles.amountValue}>
              ${parseFloat(goal.allocated_amount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={styles.amountValue}>
              ${parseFloat(goal.target_amount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={styles.amountValue}>
              ${Math.max(0, parseFloat(goal.target_amount) - parseFloat(goal.allocated_amount)).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailCard}>
          {goal.target_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Target Date</Text>
              <Text style={styles.detailValue}>
                {new Date(goal.target_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          {goal.account && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account</Text>
              <Text style={styles.detailValue}>{goal.account.name}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: goal.is_completed
                    ? colors.gumleaf[400]
                    : goal.abandoned_at
                      ? colors.redearth[400]
                      : colors.wattle[400],
                },
              ]}
            >
              {goal.is_completed ? 'Completed' : goal.abandoned_at ? 'Abandoned' : 'Active'}
            </Text>
          </View>
          {goal.match_percentage != null && goal.match_percentage > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Parent Match</Text>
              <Text style={styles.detailValue}>{goal.match_percentage}%</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {!goal.is_completed && !goal.abandoned_at && (
          <TouchableOpacity
            style={styles.abandonButton}
            onPress={() =>
              Alert.alert('Abandon Goal', 'Are you sure you want to abandon this goal?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Abandon', style: 'destructive', onPress: () => abandonMutation.mutate() },
              ])
            }
          >
            <Text style={styles.abandonButtonText}>Abandon Goal</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: {},
  coverImage: { width: '100%', height: 200 },
  infoSection: { padding: 16 },
  goalName: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: colors.bark[700] },
  spenderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  spenderLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  progressTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.bark[200],
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: colors.wattle[400], borderRadius: 7 },
  progressPercent: { fontSize: 16, fontWeight: '700', color: colors.wattle[400], width: 48, textAlign: 'right' },
  amountsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  amountBlock: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: colors.bark[600], marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValue: { fontSize: 18, fontWeight: '700', color: colors.bark[700] },
  amountDivider: { width: 1, backgroundColor: colors.bark[200] },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.bark[100],
  },
  detailLabel: { fontSize: 14, color: colors.bark[600] },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.bark[700] },
  abandonButton: {
    borderWidth: 1,
    borderColor: colors.redearth[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  abandonButtonText: { color: colors.redearth[400], fontWeight: '600', fontSize: 16 },
  // Skeleton
  skeletonImage: { width: '100%', height: 200, backgroundColor: colors.bark[200] },
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: { height: 120, backgroundColor: colors.bark[200], borderRadius: 12 },
});
