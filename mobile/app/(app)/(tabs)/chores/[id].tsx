import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Chore, Spender, ApiResponse, ChoreRewardType, ChoreFrequency } from '@quiddo/shared';
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

  const { data: allSpenders } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [rewardType, setRewardType] = useState<ChoreRewardType>('no_reward');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<ChoreFrequency>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [selectedSpenderIds, setSelectedSpenderIds] = useState<string[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const startEditing = () => {
    if (!chore) return;
    setName(chore.name);
    setEmoji(chore.emoji ?? '');
    setRewardType(chore.reward_type as ChoreRewardType);
    setAmount(chore.amount ?? '');
    setFrequency(chore.frequency as ChoreFrequency);
    setDaysOfWeek(chore.days_of_week ?? []);
    setRequiresApproval(chore.requires_approval);
    setIsActive(chore.is_active);
    setSelectedSpenderIds((chore.spenders ?? []).map(s => s.id));
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
        requires_approval: requiresApproval,
        is_active: isActive,
        spender_ids: selectedSpenderIds,
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

  const toggleSpender = (sid: string) => {
    setSelectedSpenderIds((prev) =>
      prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid],
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

  // ── Edit mode ──
  if (editing) {
    const isValid = name.trim().length > 0 && (rewardType !== 'earns' || parseFloat(amount) > 0);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Chore Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Chore name" placeholderTextColor={colors.bark[600]} />

        <Text style={styles.label}>Emoji (optional)</Text>
        <View style={styles.emojiRow}>
          <TouchableOpacity style={styles.emojiButton} onPress={() => setEmojiPickerOpen(true)}>
            <Text style={styles.emojiButtonText}>{emoji || '😀'}</Text>
            {!emoji && <Text style={styles.emojiButtonHint}>Tap to pick</Text>}
          </TouchableOpacity>
          {emoji ? (
            <TouchableOpacity style={styles.emojiClear} onPress={() => setEmoji('')}>
              <Text style={styles.emojiClearText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <EmojiPicker
          open={emojiPickerOpen}
          onClose={() => setEmojiPickerOpen(false)}
          onEmojiSelected={(emojiObject: EmojiType) => {
            setEmoji(emojiObject.emoji);
            setEmojiPickerOpen(false);
          }}
          enableSearchBar
          enableRecentlyUsed
          categoryPosition="top"
          theme={{
            container: colors.white,
            header: colors.bark[700],
            category: { container: colors.bark[100], icon: colors.bark[600], iconActive: colors.eucalyptus[400], containerActive: colors.eucalyptus[400] + '20' },
            search: { background: colors.bark[100], text: colors.bark[700], placeholder: colors.bark[600] },
          }}
        />

        <Text style={styles.label}>Reward Type</Text>
        <View style={styles.optionRow}>
          {CHORE_REWARD_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt}
              style={[styles.optionChip, rewardType === rt && styles.optionChipActive]}
              onPress={() => setRewardType(rt)}
            >
              <Text style={[styles.optionChipText, rewardType === rt && styles.optionChipTextActive]}>
                {rt === 'earns' ? 'Earns $' : rt === 'responsibility' ? 'Responsibility' : 'No Reward'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {rewardType === 'earns' && (
          <>
            <Text style={styles.label}>Reward Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.bark[600]}
              />
            </View>
          </>
        )}

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.optionRow}>
          {CHORE_FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.optionChip, frequency === f && styles.optionChipActive]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.optionChipText, frequency === f && styles.optionChipTextActive]}>
                {f === 'one_off' ? 'One-off' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequency === 'weekly' && (
          <>
            <Text style={styles.label}>Days of Week</Text>
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

        <Text style={styles.label}>Requires Approval</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionChip, requiresApproval && styles.optionChipActive]}
            onPress={() => setRequiresApproval(true)}
          >
            <Text style={[styles.optionChipText, requiresApproval && styles.optionChipTextActive]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionChip, !requiresApproval && styles.optionChipActive]}
            onPress={() => setRequiresApproval(false)}
          >
            <Text style={[styles.optionChipText, !requiresApproval && styles.optionChipTextActive]}>No</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Status</Text>
        <TouchableOpacity
          style={styles.activeToggle}
          onPress={() => setIsActive(prev => !prev)}
        >
          <View style={[styles.activeToggleDot, { backgroundColor: isActive ? colors.gumleaf[400] : colors.bark[200] }]} />
          <Text style={[styles.activeToggleLabel, { color: isActive ? colors.gumleaf[400] : colors.bark[600] }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
          <Text style={styles.activeToggleHint}>
            {isActive ? 'Chore appears in schedules' : 'Chore is paused'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Assign to Kids</Text>
        <View style={styles.spenderList}>
          {(allSpenders ?? []).map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.spenderChip, selectedSpenderIds.includes(s.id) && styles.spenderChipActive]}
              onPress={() => toggleSpender(s.id)}
            >
              <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={32} />
              <Text style={[styles.spenderChipName, selectedSpenderIds.includes(s.id) && styles.spenderChipNameActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={() => updateMutation.mutate()}
          disabled={!isValid || updateMutation.isPending}
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

  // ── Detail view ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{chore.emoji ?? '📋'}</Text>
        <Text style={styles.headerName}>{chore.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: chore.is_active ? colors.gumleaf[400] + '20' : colors.bark[200] }]}>
          <Text style={[styles.statusPillText, { color: chore.is_active ? colors.gumleaf[400] : colors.bark[600] }]}>
            {chore.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reward Type</Text>
          <Text style={styles.detailValue}>
            {chore.reward_type === 'earns' ? 'Earns $' : chore.reward_type === 'responsibility' ? 'Responsibility' : 'No Reward'}
          </Text>
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
          <Text style={styles.detailValue}>
            {chore.frequency === 'one_off' ? 'One-off' : chore.frequency.charAt(0).toUpperCase() + chore.frequency.slice(1)}
          </Text>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Kids</Text>
        {(chore.spenders ?? []).map((s) => (
          <View key={s.id} style={styles.spenderRow}>
            <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={32} />
            <Text style={styles.spenderRowName}>{s.name}</Text>
          </View>
        ))}
        {(chore.spenders ?? []).length === 0 && (
          <Text style={styles.mutedText}>No kids assigned</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  headerEmoji: { fontSize: 48 },
  headerName: { fontFamily: fonts.display, fontSize: 22, color: colors.bark[700], marginTop: 8 },
  statusPill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  statusPillText: { fontFamily: fonts.body, fontSize: 12, fontWeight: '600' },
  // Detail card
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
  detailLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  detailValue: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700] },
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 12 },
  spenderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  spenderRowName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  mutedText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  // Action buttons
  editButton: { backgroundColor: colors.eucalyptus[400], borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  editButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  deleteButton: { borderWidth: 1, borderColor: colors.redearth[400], borderRadius: 10, padding: 16, alignItems: 'center' },
  deleteButtonText: { fontFamily: fonts.body, color: colors.redearth[400], fontWeight: '600', fontSize: 16 },
  // Form styles (shared with create page)
  label: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  input: {
    fontFamily: fonts.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  emojiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiButton: {
    width: 72, height: 72, borderRadius: 16, borderWidth: 2, borderColor: colors.bark[200],
    borderStyle: 'dashed', backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
  },
  emojiButtonText: { fontSize: 36 },
  emojiButtonHint: { fontSize: 10, color: colors.bark[600], position: 'absolute', bottom: 6 },
  emojiClear: { paddingVertical: 4 },
  emojiClearText: { fontFamily: fonts.body, fontSize: 13, color: colors.redearth[400] },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.white,
  },
  optionChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  optionChipText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  optionChipTextActive: { color: colors.white, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontFamily: fonts.display, fontSize: 24, color: colors.gumleaf[400], marginRight: 6 },
  amountInput: {
    flex: 1, fontFamily: fonts.body, backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.bark[200], borderRadius: 8, padding: 14, fontSize: 20, color: colors.bark[700],
  },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    borderColor: colors.bark[200], justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white,
  },
  dayChipActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayChipText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[700] },
  dayChipTextActive: { color: colors.white, fontWeight: '600' },
  activeToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8, padding: 14,
  },
  activeToggleDot: { width: 12, height: 12, borderRadius: 6 },
  activeToggleLabel: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600' },
  activeToggleHint: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], textAlign: 'right' },
  spenderList: { gap: 8 },
  spenderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1,
    borderColor: colors.bark[200], borderRadius: 10, padding: 12, backgroundColor: colors.white,
  },
  spenderChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  spenderChipName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  spenderChipNameActive: { fontWeight: '600', color: colors.eucalyptus[400] },
  saveButton: { backgroundColor: colors.eucalyptus[400], borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 32 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  cancelButton: { borderWidth: 1, borderColor: colors.bark[200], borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { fontFamily: fonts.body, color: colors.bark[600], fontWeight: '600', fontSize: 16 },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: { height: 120, backgroundColor: colors.bark[200], borderRadius: 12, marginBottom: 12 },
});
