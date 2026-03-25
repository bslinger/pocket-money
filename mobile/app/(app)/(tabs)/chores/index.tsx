import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Chore, ChoreCompletion, ApiResponse } from '@quiddo/shared';
import { DAYS_OF_WEEK } from '@quiddo/shared';

const FREQUENCY_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', one_off: 'One-off' };
const REWARD_TYPE_LABELS: Record<string, string> = { earns: 'Earns', responsibility: 'Responsibility', no_reward: 'No Reward' };
function formatFrequency(f: string) { return FREQUENCY_LABELS[f] ?? f; }
function formatRewardType(r: string) { return REWARD_TYPE_LABELS[r] ?? r; }

type SegmentKey = 'approvals' | 'schedule' | 'manage';

const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: 'manage', label: 'Manage' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'approvals', label: 'Approvals' },
];

export default function ChoresScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = (params.tab === 'approvals' ? 'approvals' : params.tab === 'schedule' ? 'schedule' : 'manage') as SegmentKey;
  const [activeSegment, setActiveSegment] = useState<SegmentKey>(initialTab);

  const { data: choresData, isLoading: choresLoading } = useQuery({
    queryKey: ['chores'],
    queryFn: async () => {
      const res = await api.get('/chores');
      return res.data.data as {
        chores: Chore[];
        week_completions: (ChoreCompletion & { choreName?: string; choreEmoji?: string | null })[];
        pending_completions: (ChoreCompletion & { choreName?: string; choreEmoji?: string | null })[];
      };
    },
  });

  const chores = choresData?.chores;

  const approveMutation = useMutation({
    mutationFn: async (completionId: string) => {
      await api.patch(`/chore-completions/${completionId}/approve`);
    },
    onMutate: async (completionId) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await queryClient.cancelQueries({ queryKey: ['chores'] });
      const previous = queryClient.getQueryData<Chore[]>(['chores']);
      queryClient.setQueryData<Chore[]>(['chores'], (old) =>
        (old ?? []).map((chore) => ({
          ...chore,
          completions: (chore.completions ?? []).map((c) =>
            c.id === completionId ? { ...c, status: 'approved' as const } : c,
          ),
        })),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['chores'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (completionId: string) => {
      await api.patch(`/chore-completions/${completionId}/decline`);
    },
    onMutate: async (completionId) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await queryClient.cancelQueries({ queryKey: ['chores'] });
      const previous = queryClient.getQueryData<Chore[]>(['chores']);
      queryClient.setQueryData<Chore[]>(['chores'], (old) =>
        (old ?? []).map((chore) => ({
          ...chore,
          completions: (chore.completions ?? []).map((c) =>
            c.id === completionId ? { ...c, status: 'declined' as const } : c,
          ),
        })),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['chores'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (choresLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={[styles.skeletonText, { width: '30%', height: 28 }]} />
          <View style={[styles.skeletonButton, { width: 100 }]} />
        </View>
        <View style={styles.skeletonSegments} />
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  const allCompletions = (choresData?.pending_completions ?? []).map((c) => ({
    ...c,
    choreName: c.chore?.name ?? '',
    choreEmoji: c.chore?.emoji ?? null,
  }));

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to 0=Mon

  const renderApprovals = () => (
    <View>
      {allCompletions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending approvals</Text>
        </View>
      ) : (
        <View style={styles.approvalList}>
          {allCompletions.map((completion, idx) => (
            <View key={completion.id} style={[styles.approvalRow, idx > 0 && styles.approvalRowBorder]}>
              <SpenderAvatar name={completion.spender?.name ?? '?'} color={completion.spender?.color} avatarUrl={completion.spender?.avatar_url} size={32} />
              <View style={styles.approvalInfo}>
                <Text style={styles.approvalChore} numberOfLines={1}>
                  {completion.choreEmoji ? `${completion.choreEmoji} ` : ''}{completion.choreName}
                </Text>
                <Text style={styles.approvalMeta}>
                  {completion.spender?.name} · {new Date(completion.completed_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.approvalActions}>
                <TouchableOpacity
                  style={styles.approvalDeclineIcon}
                  onPress={() => declineMutation.mutate(completion.id)}
                >
                  <Text style={{ color: colors.redearth[400], fontSize: 16 }}>✗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approvalApproveIcon}
                  onPress={() => approveMutation.mutate(completion.id)}
                >
                  <Text style={{ color: colors.gumleaf[400], fontSize: 16 }}>✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSchedule = () => {
    const weekChores: { day: number; dayLabel: string; chores: Chore[] }[] = DAYS_OF_WEEK.map(
      (d) => ({
        day: d.value,
        dayLabel: d.label,
        chores: (chores ?? []).filter(
          (c) =>
            c.is_active &&
            (c.frequency === 'daily' ||
              (c.days_of_week && c.days_of_week.includes(d.value))),
        ),
      }),
    );

    return (
      <View>
        {weekChores.map((dayGroup) => (
          <View key={dayGroup.day} style={styles.dayGroup}>
            <View style={styles.dayHeader}>
              <Text
                style={[
                  styles.dayLabel,
                  dayGroup.day === todayIndex && styles.dayLabelToday,
                ]}
              >
                {dayGroup.dayLabel}
              </Text>
              {dayGroup.day === todayIndex && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </View>
            {dayGroup.chores.length === 0 ? (
              <Text style={styles.noChoresDay}>No chores</Text>
            ) : (
              dayGroup.chores.map((chore) => (
                <TouchableOpacity
                  key={chore.id}
                  style={styles.scheduleChore}
                  onPress={() => router.push(`/(app)/(tabs)/chores/${chore.id}`)}
                >
                  <Text style={styles.scheduleEmoji}>{chore.emoji ?? '📋'}</Text>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleName}>{chore.name}</Text>
                    {chore.spenders && chore.spenders.length > 0 && (
                      <View style={styles.scheduleSpenders}>
                        {chore.spenders.map((s) => (
                          <View key={s.id} style={styles.scheduleSpenderRow}>
                            <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={16} />
                            <Text style={styles.scheduleSpenderName}>{s.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {chore.amount && (
                    <Text style={styles.scheduleAmount}>
                      ${parseFloat(chore.amount).toFixed(2)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderManage = () => (
    <View>
      {(chores ?? []).map((chore) => (
        <TouchableOpacity
          key={chore.id}
          style={styles.manageCard}
          onPress={() => router.push(`/(app)/(tabs)/chores/${chore.id}`)}
        >
          <View style={styles.manageRow}>
            <Text style={styles.manageEmoji}>{chore.emoji ?? '📋'}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.manageName}>{chore.name}</Text>
              <Text style={styles.manageSub}>
                {formatFrequency(chore.frequency)} · {formatRewardType(chore.reward_type)}
                {chore.amount ? ` · $${parseFloat(chore.amount).toFixed(2)}` : ''}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: chore.is_active ? colors.gumleaf[400] + '20' : colors.bark[200] }]}>
              <Text style={[styles.statusPillText, { color: chore.is_active ? colors.gumleaf[400] : colors.bark[600] }]}>
                {chore.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          {chore.spenders && chore.spenders.length > 0 && (
            <View style={styles.assignedRow}>
              {chore.spenders.map((s) => (
                <View key={s.id} style={styles.assignedSpender}>
                  <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={20} />
                  <Text style={styles.assignedSpenderName}>{s.name}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
      {(chores ?? []).length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chores yet</Text>
        </View>
      )}
    </View>
  );

  const segmentContentMap: Record<SegmentKey, () => React.ReactNode> = {
    approvals: renderApprovals,
    schedule: renderSchedule,
    manage: renderManage,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Chores</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(app)/chores/create')}
        >
          <Text style={styles.newButtonText}>+ New Chore</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentBar}>
        {SEGMENTS.map((seg) => (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segment, activeSegment === seg.key && styles.segmentActive]}
            onPress={() => setActiveSegment(seg.key)}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === seg.key && styles.segmentTextActive,
              ]}
            >
              {seg.label}
              {seg.key === 'approvals' && allCompletions.length > 0 && (
                ` (${allCompletions.length})`
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {segmentContentMap[activeSegment]()}
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
  newButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 14 },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { fontSize: 13, fontWeight: '500', color: colors.bark[600] },
  segmentTextActive: { color: colors.bark[700], fontWeight: '600' },
  // Approvals
  approvalList: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.bark[200], overflow: 'hidden' },
  approvalRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  approvalRowBorder: { borderTopWidth: 1, borderTopColor: colors.bark[200] },
  approvalAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  approvalAvatarText: { fontFamily: fonts.body, color: colors.white, fontSize: 13 },
  approvalInfo: { flex: 1 },
  approvalChore: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  approvalMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 1 },
  approvalActions: { flexDirection: 'row', gap: 6 },
  approvalDeclineIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.redearth[400] + '40', justifyContent: 'center', alignItems: 'center' },
  approvalApproveIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.gumleaf[400] + '40', justifyContent: 'center', alignItems: 'center' },
  // Schedule
  dayGroup: { marginBottom: 16 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dayLabel: { fontSize: 14, fontWeight: '600', color: colors.bark[600] },
  dayLabelToday: { color: colors.eucalyptus[400] },
  todayBadge: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  todayBadgeText: { color: colors.white, fontSize: 10, fontWeight: '600' },
  noChoresDay: { fontSize: 13, color: colors.bark[600], paddingLeft: 4 },
  scheduleChore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  scheduleEmoji: { fontSize: 18, marginRight: 8 },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: 14, color: colors.bark[700] },
  scheduleSpenders: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  scheduleSpenderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduleSpenderName: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600] },
  scheduleAmount: { fontSize: 14, fontWeight: '600', color: colors.gumleaf[400], marginLeft: 8 },
  // Manage
  manageCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  manageRow: { flexDirection: 'row', alignItems: 'center' },
  manageEmoji: { fontSize: 22 },
  manageName: { fontSize: 15, fontWeight: '600', color: colors.bark[700] },
  manageSub: { fontSize: 13, color: colors.bark[600], marginTop: 2 },
  statusPill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontFamily: fonts.body, fontSize: 10, fontWeight: '600' },
  assignedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 36 },
  assignedSpender: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignedSpenderName: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  // Empty
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.bark[600], textAlign: 'center' },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonButton: { backgroundColor: colors.bark[200], borderRadius: 8, height: 36 },
  skeletonSegments: {
    height: 40,
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    marginBottom: 16,
  },
  skeletonCard: {
    height: 80,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 8,
  },
});
