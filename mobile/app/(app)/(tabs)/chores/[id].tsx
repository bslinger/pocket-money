import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Chore, ApiResponse } from '@quiddo/shared';
import { CHORE_FREQUENCIES, CHORE_REWARD_TYPES, DAYS_OF_WEEK } from '@quiddo/shared';

export default function ChoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: chore, isLoading } = useQuery({
    queryKey: ['chore', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Chore>>(`/chores/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [rewardType, setRewardType] = useState<string>('no_reward');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<string>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

  const startEditing = () => {
    if (!chore) return;
    setName(chore.name);
    setEmoji(chore.emoji ?? '');
    setRewardType(chore.reward_type);
    setAmount(chore.amount ?? '');
    setFrequency(chore.frequency);
    setDaysOfWeek(chore.days_of_week ?? []);
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/chores/${id}`, {
        name,
        emoji: emoji || null,
        reward_type: rewardType,
        amount: rewardType === 'earns' ? amount : null,
        frequency,
        days_of_week: frequency === 'weekly' ? daysOfWeek : null,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['chore', id] });
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to update chore');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/chores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to delete chore');
    },
  });

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  if (isLoading || !chore) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonText, { width: '50%', height: 28, margin: 16 }]} />
        <View style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
        <View style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
      </View>
    );
  }

  if (editing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.formLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Chore name" placeholderTextColor={colors.bark[600]} />

        <Text style={styles.formLabel}>Emoji</Text>
        <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} placeholder="e.g. 🧹" placeholderTextColor={colors.bark[600]} />

        <Text style={styles.formLabel}>Reward Type</Text>
        <View style={styles.optionRow}>
          {CHORE_REWARD_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt}
              style={[styles.optionChip, rewardType === rt && styles.optionChipActive]}
              onPress={() => setRewardType(rt)}
            >
              <Text style={[styles.optionChipText, rewardType === rt && styles.optionChipTextActive]}>
                {rt.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {rewardType === 'earns' && (
          <>
            <Text style={styles.formLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.bark[600]}
            />
          </>
        )}

        <Text style={styles.formLabel}>Frequency</Text>
        <View style={styles.optionRow}>
          {CHORE_FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.optionChip, frequency === f && styles.optionChipActive]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.optionChipText, frequency === f && styles.optionChipTextActive]}>
                {f.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequency === 'weekly' && (
          <>
            <Text style={styles.formLabel}>Days</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.dayChip, daysOfWeek.includes(d.value) && styles.dayChipActive]}
                  onPress={() => toggleDay(d.value)}
                >
                  <Text style={[styles.dayChipText, daysOfWeek.includes(d.value) && styles.dayChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.formLabel}>Assigned Spenders</Text>
        <View style={styles.assignedList}>
          {(chore.spenders ?? []).map((s) => (
            <View key={s.id} style={styles.assignedChip}>
              <Text style={styles.assignedChipText}>{s.name}</Text>
            </View>
          ))}
          {(chore.spenders ?? []).length === 0 && (
            <Text style={styles.mutedText}>No spenders assigned</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          <Text style={styles.saveButtonText}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{chore.emoji ?? '✅'}</Text>
        <Text style={styles.headerName}>{chore.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reward Type</Text>
          <Text style={styles.detailValue}>{chore.reward_type.replace('_', ' ')}</Text>
        </View>
        {chore.amount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { color: colors.gumleaf[400] }]}>
              ${parseFloat(chore.amount).toFixed(2)}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>{chore.frequency.replace('_', ' ')}</Text>
        </View>
        {chore.days_of_week && chore.days_of_week.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Days</Text>
            <Text style={styles.detailValue}>
              {chore.days_of_week
                .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label)
                .join(', ')}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requires Approval</Text>
          <Text style={styles.detailValue}>{chore.requires_approval ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={[styles.detailValue, { color: chore.is_active ? colors.gumleaf[400] : colors.bark[600] }]}>
            {chore.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Spenders</Text>
        {(chore.spenders ?? []).map((s) => (
          <View key={s.id} style={styles.spenderRow}>
            <View style={[styles.miniAvatar, { backgroundColor: s.color ?? colors.eucalyptus[400] }]}>
              <Text style={styles.miniAvatarText}>{s.name[0]}</Text>
            </View>
            <Text style={styles.spenderName}>{s.name}</Text>
          </View>
        ))}
        {(chore.spenders ?? []).length === 0 && (
          <Text style={styles.mutedText}>No spenders assigned</Text>
        )}
      </View>

      <TouchableOpacity style={styles.editButton} onPress={startEditing}>
        <Text style={styles.editButtonText}>Edit Chore</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          Alert.alert('Delete Chore', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
          ])
        }
      >
        <Text style={styles.deleteButtonText}>Delete Chore</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  headerEmoji: { fontSize: 48 },
  headerName: { fontSize: 22, fontWeight: '700', color: colors.bark[700], marginTop: 8 },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
    marginBottom: 20,
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.bark[700], marginBottom: 12 },
  spenderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  spenderName: { marginLeft: 10, fontSize: 15, color: colors.bark[700] },
  editButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.redearth[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: { color: colors.redearth[400], fontWeight: '600', fontSize: 16 },
  mutedText: { fontSize: 14, color: colors.bark[600] },
  // Form styles
  formLabel: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  optionChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  optionChipText: { fontSize: 13, color: colors.bark[700] },
  optionChipTextActive: { color: colors.white, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.bark[200],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  dayChipActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayChipText: { fontSize: 12, color: colors.bark[700] },
  dayChipTextActive: { color: colors.white, fontWeight: '600' },
  assignedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assignedChip: {
    backgroundColor: colors.bark[200],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  assignedChipText: { fontSize: 13, color: colors.bark[700] },
  saveButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: { color: colors.bark[600], fontWeight: '600', fontSize: 16 },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: {
    height: 120,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 12,
  },
});
