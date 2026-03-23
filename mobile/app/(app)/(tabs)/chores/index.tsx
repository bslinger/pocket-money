import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Chore, ChoreCompletion, ApiResponse } from '@quiddo/shared';
import { DAYS_OF_WEEK } from '@quiddo/shared';

type SegmentKey = 'approvals' | 'schedule' | 'manage';

const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: 'approvals', label: 'Approvals' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'manage', label: 'Manage' },
];

export default function ChoresScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('approvals');

  const { data: chores, isLoading: choresLoading } = useQuery({
    queryKey: ['chores'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Chore[]>>('/chores');
      return res.data.data;
    },
  });

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

  const allCompletions: (ChoreCompletion & { choreName: string; choreEmoji: string | null })[] = [];
  for (const chore of chores ?? []) {
    for (const completion of chore.completions ?? []) {
      if (completion.status === 'pending') {
        allCompletions.push({
          ...completion,
          choreName: chore.name,
          choreEmoji: chore.emoji,
        });
      }
    }
  }

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to 0=Mon

  const renderApprovals = () => (
    <View>
      {allCompletions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending approvals</Text>
        </View>
      ) : (
        allCompletions.map((completion) => (
          <View key={completion.id} style={styles.approvalCard}>
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalEmoji}>{completion.choreEmoji ?? '✅'}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.approvalChore}>{completion.choreName}</Text>
                <Text style={styles.approvalSpender}>{completion.spender?.name}</Text>
                <Text style={styles.approvalDate}>
                  {new Date(completion.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => declineMutation.mutate(completion.id)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => approveMutation.mutate(completion.id)}
              >
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
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
                  <Text style={styles.scheduleEmoji}>{chore.emoji ?? '✅'}</Text>
                  <Text style={styles.scheduleName}>{chore.name}</Text>
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
            <Text style={styles.manageEmoji}>{chore.emoji ?? '✅'}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.manageName}>{chore.name}</Text>
              <Text style={styles.manageSub}>
                {chore.frequency} · {chore.reward_type}
                {chore.amount ? ` · $${parseFloat(chore.amount).toFixed(2)}` : ''}
              </Text>
            </View>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: chore.is_active ? colors.gumleaf[400] : colors.bark[200] },
              ]}
            />
          </View>
          {chore.spenders && chore.spenders.length > 0 && (
            <Text style={styles.assignedText}>
              {chore.spenders.map((s) => s.name).join(', ')}
            </Text>
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
  title: { fontSize: 24, fontWeight: '700', color: colors.bark[700] },
  newButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
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
  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  approvalInfo: { flexDirection: 'row', alignItems: 'center' },
  approvalEmoji: { fontSize: 24 },
  approvalChore: { fontSize: 15, fontWeight: '600', color: colors.bark[700] },
  approvalSpender: { fontSize: 13, color: colors.bark[600], marginTop: 2 },
  approvalDate: { fontSize: 12, color: colors.bark[600], marginTop: 2 },
  approvalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  declineButton: {
    borderWidth: 1,
    borderColor: colors.redearth[400],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  declineButtonText: { color: colors.redearth[400], fontWeight: '600', fontSize: 14 },
  approveButton: {
    backgroundColor: colors.gumleaf[400],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  approveButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
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
  scheduleName: { flex: 1, fontSize: 14, color: colors.bark[700] },
  scheduleAmount: { fontSize: 14, fontWeight: '600', color: colors.gumleaf[400] },
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
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  assignedText: { fontSize: 12, color: colors.bark[600], marginTop: 8, paddingLeft: 36 },
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
