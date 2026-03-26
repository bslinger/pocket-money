import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { useFamily } from '@/lib/family';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Spender, ApiResponse, ChoreRewardType, ChoreFrequency } from '@quiddo/shared';
import { CHORE_FREQUENCIES, CHORE_REWARD_TYPES, DAYS_OF_WEEK } from '@quiddo/shared';

const REWARD_TYPE_INFO: Record<string, { label: string; subtitle: string }> = {
  earns: { label: 'Earns $', subtitle: 'A cash reward is paid each time this chore is completed and approved.' },
  responsibility: { label: 'Responsibility', subtitle: 'Counts toward the weekly allowance. Pocket money is only released when all responsibility chores are done.' },
  no_reward: { label: 'No reward', subtitle: 'A reminder chore with no payment or tracking attached.' },
};

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
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [oneOffDate, setOneOffDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [upForGrabs, setUpForGrabs] = useState(false);
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
      if (!activeFamily?.id) {
        throw new Error('No active family');
      }
      return api.post('/chores', {
        family_id: activeFamily.id,
        name,
        emoji: emoji || '🧹',
        reward_type: rewardType,
        amount: rewardType === 'earns' ? amount : null,
        frequency,
        days_of_week: frequency === 'weekly' ? daysOfWeek : null,
        day_of_month: frequency === 'monthly' ? dayOfMonth : null,
        one_off_date: frequency === 'one_off' && oneOffDate ? oneOffDate : null,
        requires_approval: requiresApproval,
        up_for_grabs: upForGrabs,
        spender_ids: upForGrabs ? [] : selectedSpenderIds,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? err.message ?? 'Failed to create chore');
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

  const handleSubmit = () => {
    if (!upForGrabs && selectedSpenderIds.length === 0) {
      Alert.alert('No kids selected', 'Please assign this chore to at least one kid, or mark it as Up For Grabs.');
      return;
    }
    createMutation.mutate();
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
      {/* Name + Emoji on same row */}
      <Text style={styles.label}>Chore Name</Text>
      <View style={styles.nameRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Make bed, Feed the dog"
          placeholderTextColor={colors.bark[600]}
        />
        <TouchableOpacity style={styles.emojiButton} onPress={() => setEmojiPickerOpen(true)}>
          <Text style={styles.emojiButtonText}>{emoji}</Text>
        </TouchableOpacity>
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

      {/* Reward Type — stacked vertically with subtitles */}
      <Text style={styles.label}>Reward Type</Text>
      <View style={styles.rewardTypeList}>
        {CHORE_REWARD_TYPES.map((rt) => {
          const info = REWARD_TYPE_INFO[rt];
          const selected = rewardType === rt;
          return (
            <TouchableOpacity
              key={rt}
              style={[styles.rewardTypeCard, selected && styles.rewardTypeCardActive]}
              onPress={() => setRewardType(rt)}
            >
              <View style={styles.rewardTypeHeader}>
                <Text style={[styles.rewardTypeLabel, selected && styles.rewardTypeLabelActive]}>
                  {info.label}
                </Text>
                {selected && <Feather name="check" size={16} color={colors.eucalyptus[400]} />}
              </View>
              <Text style={[styles.rewardTypeSub, selected && styles.rewardTypeSubActive]}>
                {info.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
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

      {/* Frequency — 2x2 grid */}
      <Text style={styles.label}>Frequency</Text>
      <View style={styles.frequencyGrid}>
        {CHORE_FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.frequencyChip, frequency === f && styles.frequencyChipActive]}
            onPress={() => setFrequency(f)}
          >
            <Text style={[styles.frequencyChipText, frequency === f && styles.frequencyChipTextActive]}>
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

      {frequency === 'monthly' && (
        <>
          <Text style={styles.label}>Day of Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayOfMonthScroll}>
            <View style={styles.dayOfMonthRow}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayOfMonthChip, dayOfMonth === d && styles.dayOfMonthChipActive]}
                  onPress={() => setDayOfMonth(d)}
                >
                  <Text style={[styles.dayOfMonthChipText, dayOfMonth === d && styles.dayOfMonthChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.hint}>For shorter months, the chore will be scheduled on the last day.</Text>
        </>
      )}

      {frequency === 'one_off' && (
        <>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Feather name="calendar" size={16} color={colors.bark[600]} />
            <Text style={[styles.dateButtonText, !oneOffDate && { color: colors.bark[600] }]}>
              {oneOffDate ?? 'Select a date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={oneOffDate ? new Date(oneOffDate + 'T00:00:00') : new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(selectedDate.getDate()).padStart(2, '0');
                  setOneOffDate(`${yyyy}-${mm}-${dd}`);
                }
              }}
            />
          )}
        </>
      )}

      {/* Requires Approval */}
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

      {/* Up For Grabs */}
      <Text style={styles.label}>Up For Grabs</Text>
      <TouchableOpacity
        style={styles.upForGrabsToggle}
        onPress={() => setUpForGrabs(prev => !prev)}
      >
        <View style={[styles.toggleDot, upForGrabs && styles.toggleDotActive]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, upForGrabs && styles.toggleLabelActive]}>
            {upForGrabs ? 'Yes - any kid can claim it' : 'No - assigned to specific kids'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Assign to Spenders (hidden when up for grabs) */}
      {!upForGrabs && (
        <>
          <Text style={styles.label}>Assign to Kids</Text>
          <View style={styles.spenderList}>
            {(spenders ?? []).map((s) => {
              const selected = selectedSpenderIds.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.spenderChip, selected && styles.spenderChipActive]}
                  onPress={() => toggleSpender(s.id)}
                >
                  <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={32} />
                  <Text style={[styles.spenderName, selected && styles.spenderNameActive]}>
                    {s.name}
                  </Text>
                  {selected && (
                    <Feather name="check-circle" size={18} color={colors.eucalyptus[400]} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={handleSubmit}
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
  // Name + emoji row
  nameRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonText: { fontSize: 28 },
  // Reward types — stacked
  rewardTypeList: { gap: 8 },
  rewardTypeCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    padding: 14,
  },
  rewardTypeCardActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '08' },
  rewardTypeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardTypeLabel: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600', color: colors.bark[700] },
  rewardTypeLabelActive: { color: colors.eucalyptus[400] },
  rewardTypeSub: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 4, lineHeight: 17 },
  rewardTypeSubActive: { color: colors.bark[600] },
  // Amount
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontFamily: fonts.display, fontSize: 24, color: colors.gumleaf[400], marginRight: 6 },
  amountInput: {
    flex: 1, fontFamily: fonts.body, backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.bark[200], borderRadius: 8, padding: 14, fontSize: 20, color: colors.bark[700],
  },
  // Frequency — 2x2 grid
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequencyChip: {
    width: '48%' as any,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  frequencyChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  frequencyChipText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  frequencyChipTextActive: { color: colors.white, fontWeight: '600' },
  // Days
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    borderColor: colors.bark[200], justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white,
  },
  dayChipActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayChipText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[700] },
  dayChipTextActive: { color: colors.white, fontWeight: '600' },
  // Day of month
  dayOfMonthScroll: { marginBottom: 4 },
  dayOfMonthRow: { flexDirection: 'row', gap: 6 },
  dayOfMonthChip: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: colors.bark[200], justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white,
  },
  dayOfMonthChipActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayOfMonthChipText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[700] },
  dayOfMonthChipTextActive: { color: colors.white, fontWeight: '600' },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 4 },
  // Date picker
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8, padding: 14,
  },
  dateButtonText: { fontFamily: fonts.body, fontSize: 16, color: colors.bark[700] },
  // Options
  optionRow: { flexDirection: 'row', gap: 8 },
  optionChip: {
    borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.white,
  },
  optionChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  optionChipText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  optionChipTextActive: { color: colors.white, fontWeight: '600' },
  // Up for grabs
  upForGrabsToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8, padding: 14,
  },
  toggleDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bark[200] },
  toggleDotActive: { backgroundColor: colors.eucalyptus[400] },
  toggleLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  toggleLabelActive: { color: colors.eucalyptus[400], fontWeight: '600' },
  // Spenders
  spenderList: { gap: 8 },
  spenderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1,
    borderColor: colors.bark[200], borderRadius: 10, padding: 12, backgroundColor: colors.white,
  },
  spenderChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  spenderName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  spenderNameActive: { fontWeight: '600', color: colors.eucalyptus[400] },
  // Submit
  createButton: {
    backgroundColor: colors.eucalyptus[400], borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 32,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  // Skeleton
  skeletonField: { height: 50, backgroundColor: colors.bark[200], borderRadius: 8, margin: 16, marginBottom: 0 },
});
