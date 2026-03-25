import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { useFamily } from '@/lib/family';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Spender, ApiResponse, ChoreRewardType, ChoreFrequency } from '@quiddo/shared';
import { CHORE_FREQUENCIES, CHORE_REWARD_TYPES, DAYS_OF_WEEK } from '@quiddo/shared';

export default function CreateChoreScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFamily } = useFamily();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧹');
  const [rewardType, setRewardType] = useState<ChoreRewardType>('no_reward');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<ChoreFrequency>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [selectedSpenderIds, setSelectedSpenderIds] = useState<string[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const { data: spenders, isLoading } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/chores', {
        family_id: activeFamily?.id,
        name,
        emoji: emoji || null,
        reward_type: rewardType,
        amount: rewardType === 'earns' ? amount : null,
        frequency,
        days_of_week: frequency === 'weekly' ? daysOfWeek : null,
        requires_approval: requiresApproval,
        spender_ids: selectedSpenderIds,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create chore');
    },
  });

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleSpender = (id: string) => {
    setSelectedSpenderIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.skeletonField} />
        ))}
      </View>
    );
  }

  const isValid = name.trim().length > 0 && (rewardType !== 'earns' || parseFloat(amount) > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Name */}
      <Text style={styles.label}>Chore Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Make bed, Feed the dog"
        placeholderTextColor={colors.bark[600]}
      />

      {/* Emoji */}
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

      {/* Reward Type */}
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

      {/* Frequency */}
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

      {/* Requires Approval */}
      <Text style={styles.label}>Requires Approval</Text>
      <View style={styles.optionRow}>
        <TouchableOpacity
          style={[styles.optionChip, requiresApproval && styles.optionChipActive]}
          onPress={() => setRequiresApproval(true)}
        >
          <Text style={[styles.optionChipText, requiresApproval && styles.optionChipTextActive]}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionChip, !requiresApproval && styles.optionChipActive]}
          onPress={() => setRequiresApproval(false)}
        >
          <Text style={[styles.optionChipText, !requiresApproval && styles.optionChipTextActive]}>
            No
          </Text>
        </TouchableOpacity>
      </View>

      {/* Assign to Spenders */}
      <Text style={styles.label}>Assign to Kids</Text>
      <View style={styles.spenderList}>
        {(spenders ?? []).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.spenderChip, selectedSpenderIds.includes(s.id) && styles.spenderChipActive]}
            onPress={() => toggleSpender(s.id)}
          >
            <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={32} />
            <Text style={[styles.spenderName, selectedSpenderIds.includes(s.id) && styles.spenderNameActive]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending}
      >
        <Text style={styles.createButtonText}>
          {createMutation.isPending ? 'Creating...' : 'Create Chore'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  input: {
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
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.bark[200],
    borderStyle: 'dashed',
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonText: { fontSize: 36 },
  emojiButtonHint: { fontSize: 10, color: colors.bark[600], position: 'absolute', bottom: 6 },
  emojiClear: { paddingVertical: 4 },
  emojiClearText: { fontSize: 13, color: colors.redearth[400] },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  optionChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  optionChipText: { fontSize: 14, color: colors.bark[700] },
  optionChipTextActive: { color: colors.white, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 24, fontWeight: '700', color: colors.gumleaf[400], marginRight: 6 },
  amountInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    fontWeight: '700',
    color: colors.bark[700],
  },
  daysRow: { flexDirection: 'row', gap: 6 },
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
  spenderList: { gap: 8 },
  spenderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
  },
  spenderChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  spenderAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  spenderAvatarText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  spenderName: { marginLeft: 10, fontSize: 15, color: colors.bark[700] },
  spenderNameActive: { fontWeight: '600', color: colors.eucalyptus[400] },
  createButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  skeletonField: {
    height: 50,
    backgroundColor: colors.bark[200],
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
});
