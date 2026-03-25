import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Spender, PocketMoneySchedule, PocketMoneyScheduleSplit, ApiResponse } from '@quiddo/shared';
import { SPENDER_COLORS, POCKET_MONEY_FREQUENCIES, DAYS_OF_WEEK } from '@quiddo/shared';

interface SpenderDetail extends Spender {
  pocket_money_schedule?: PocketMoneySchedule | null;
}

interface SplitRow {
  account_id: string;
  account_name: string;
  percentage: string;
}

function initSplitRows(schedule: PocketMoneySchedule | null | undefined, accounts: Spender['accounts']): SplitRow[] {
  if (!accounts || accounts.length < 2) return [];
  if (schedule?.splits && schedule.splits.length > 0) {
    return schedule.splits.map((s: PocketMoneyScheduleSplit) => ({
      account_id: s.account_id,
      account_name: accounts.find(a => a.id === s.account_id)?.name ?? s.account_id,
      percentage: String(parseFloat(String(s.percentage)).toFixed(2)),
    }));
  }
  // Default: equal distribution
  const equal = (100 / accounts.length).toFixed(2);
  return accounts.map((a, i) => ({
    account_id: a.id,
    account_name: a.name,
    percentage: i === accounts.length - 1
      ? (100 - parseFloat(equal) * (accounts.length - 1)).toFixed(2)
      : equal,
  }));
}

export default function EditKidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(SPENDER_COLORS[0]);

  // Pocket money form
  const [pmAmount, setPmAmount] = useState('');
  const [pmFrequency, setPmFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [pmDayOfWeek, setPmDayOfWeek] = useState<number>(4); // Friday
  const [pmDayOfMonth, setPmDayOfMonth] = useState<number>(1);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>([]);

  const { data: spender, isLoading } = useQuery({
    queryKey: ['spender', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SpenderDetail>>(`/spenders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (spender) {
      setName(spender.name);
      setSelectedColor(spender.color ?? SPENDER_COLORS[0]);
      if (spender.pocket_money_schedule) {
        const schedule = spender.pocket_money_schedule;
        setPmAmount(schedule.amount);
        setPmFrequency(schedule.frequency);
        if (schedule.day_of_week != null) setPmDayOfWeek(schedule.day_of_week);
        if (schedule.day_of_month != null) setPmDayOfMonth(schedule.day_of_month);
        const hasSplits = schedule.splits && schedule.splits.length > 0;
        setDistributeOpen(!!hasSplits);
        setSplits(initSplitRows(schedule, spender.accounts as Spender['accounts']));
      } else if (spender.accounts && spender.accounts.length > 1) {
        setSplits(initSplitRows(null, spender.accounts as Spender['accounts']));
      }
    }
  }, [spender]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/spenders/${id}`, { name, color: selectedColor });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['spender', id] });
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to update');
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const useSplits = distributeOpen && splits.length > 1;
      if (useSplits) {
        const total = splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
        if (Math.abs(total - 100) > 0.5) {
          throw new Error('Percentages must add up to 100%.');
        }
      }
      await api.post(`/spenders/${id}/pocket-money-schedule`, {
        amount: pmAmount,
        frequency: pmFrequency,
        day_of_week: pmFrequency === 'weekly' ? pmDayOfWeek : null,
        day_of_month: pmFrequency === 'monthly' ? pmDayOfMonth : null,
        splits: useSplits
          ? splits.map(s => ({ account_id: s.account_id, percentage: parseFloat(s.percentage) }))
          : [],
        account_id: useSplits ? null : null,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['spender', id] });
      queryClient.invalidateQueries({ queryKey: ['pocket-money-release'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message ?? err.response?.data?.message ?? 'Failed to save schedule');
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async () => {
      if (spender?.pocket_money_schedule?.id) {
        await api.delete(`/pocket-money-schedules/${spender.pocket_money_schedule.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spender', id] });
      queryClient.invalidateQueries({ queryKey: ['pocket-money-release'] });
      setPmAmount('');
      setDistributeOpen(false);
    },
  });

  function updateSplitPercentage(index: number, value: string) {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, percentage: value } : s));
  }

  if (isLoading || !spender) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonAvatar} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.skeletonField} />
        ))}
      </View>
    );
  }

  const hasSchedule = !!spender.pocket_money_schedule;
  const hasMultipleAccounts = (spender.accounts?.length ?? 0) > 1;
  const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
  const splitTotalOk = Math.abs(splitTotal - 100) <= 0.5;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Preview */}
      <View style={styles.preview}>
        <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
          <Text style={styles.previewAvatarText}>
            {name.trim().length > 0 ? name[0].toUpperCase() : '?'}
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Kid's name"
        placeholderTextColor={colors.bark[600]}
      />

      {/* Color */}
      <Text style={styles.label}>Colour</Text>
      <View style={styles.colorGrid}>
        {SPENDER_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.colorSwatchSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && <Text style={styles.colorCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
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

      {/* Pocket Money Schedule Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pocket Money Schedule</Text>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={pmAmount}
            onChangeText={setPmAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.bark[600]}
          />
        </View>

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.optionRow}>
          {POCKET_MONEY_FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.optionChip, pmFrequency === f && styles.optionChipActive]}
              onPress={() => setPmFrequency(f)}
            >
              <Text style={[styles.optionChipText, pmFrequency === f && styles.optionChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {pmFrequency === 'weekly' && (
          <>
            <Text style={styles.label}>Day of Week</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.dayChip, pmDayOfWeek === d.value && styles.dayChipActive]}
                  onPress={() => setPmDayOfWeek(d.value)}
                >
                  <Text style={[styles.dayChipText, pmDayOfWeek === d.value && styles.dayChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {pmFrequency === 'monthly' && (
          <>
            <Text style={styles.label}>Day of Month</Text>
            <TextInput
              style={[styles.input, { width: 80, textAlign: 'center' }]}
              value={String(pmDayOfMonth)}
              onChangeText={(v) => setPmDayOfMonth(Math.min(31, Math.max(1, parseInt(v) || 1)))}
              keyboardType="number-pad"
              placeholderTextColor={colors.bark[600]}
            />
          </>
        )}

        {/* Distribute between accounts (only when >1 account) */}
        {hasMultipleAccounts && (
          <View style={styles.distributeSection}>
            <View style={styles.distributeHeader}>
              <Text style={styles.distributeLabel}>Distribute between accounts</Text>
              <Switch
                value={distributeOpen}
                onValueChange={(val) => {
                  setDistributeOpen(val);
                  if (val && splits.length === 0) {
                    setSplits(initSplitRows(null, spender.accounts as Spender['accounts']));
                  }
                }}
                trackColor={{ false: colors.bark[200], true: colors.eucalyptus[400] }}
                thumbColor={colors.white}
              />
            </View>

            {distributeOpen && splits.length > 0 && (
              <View style={styles.splitsList}>
                {splits.map((split, index) => (
                  <View key={split.account_id} style={styles.splitRow}>
                    <Text style={styles.splitAccountName} numberOfLines={1}>{split.account_name}</Text>
                    <View style={styles.splitInputRow}>
                      <TextInput
                        style={styles.splitInput}
                        value={split.percentage}
                        onChangeText={(v) => updateSplitPercentage(index, v)}
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.bark[600]}
                      />
                      <Text style={styles.splitPercent}>%</Text>
                    </View>
                  </View>
                ))}
                <Text style={[styles.splitTotalText, !splitTotalOk && styles.splitTotalError]}>
                  Total: {splitTotal.toFixed(2)}% {splitTotalOk ? '✓' : '(must equal 100%)'}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.scheduleButton, (!pmAmount || (distributeOpen && !splitTotalOk)) && styles.scheduleButtonDisabled]}
          onPress={() => saveScheduleMutation.mutate()}
          disabled={saveScheduleMutation.isPending || !pmAmount || (distributeOpen && !splitTotalOk)}
        >
          <Text style={styles.scheduleButtonText}>
            {saveScheduleMutation.isPending
              ? 'Saving...'
              : hasSchedule
                ? 'Update Schedule'
                : 'Set Schedule'}
          </Text>
        </TouchableOpacity>

        {hasSchedule && (
          <TouchableOpacity
            style={styles.removeScheduleButton}
            onPress={() =>
              Alert.alert('Remove Schedule', 'Remove pocket money schedule?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => deleteScheduleMutation.mutate() },
              ])
            }
          >
            <Text style={styles.removeScheduleText}>Remove Schedule</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16, paddingBottom: 40 },
  preview: { alignItems: 'center', marginVertical: 16 },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: { color: colors.white, fontSize: 30, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.bark[700] },
  colorCheck: { color: colors.white, fontSize: 16, fontWeight: '700' },
  saveButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.bark[700], marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 20, fontWeight: '700', color: colors.bark[700], marginRight: 6 },
  amountInput: {
    flex: 1,
    backgroundColor: colors.bark[100],
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.bark[700],
  },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bark[100],
  },
  optionChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  optionChipText: { fontSize: 14, color: colors.bark[700] },
  optionChipTextActive: { color: colors.white, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.bark[200],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bark[100],
  },
  dayChipActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayChipText: { fontSize: 11, color: colors.bark[700] },
  dayChipTextActive: { color: colors.white, fontWeight: '600' },
  distributeSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.bark[100],
    paddingTop: 14,
  },
  distributeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributeLabel: { fontSize: 14, fontWeight: '600', color: colors.bark[700] },
  splitsList: { marginTop: 12, gap: 10 },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  splitAccountName: { flex: 1, fontSize: 14, color: colors.bark[700] },
  splitInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  splitInput: {
    width: 72,
    backgroundColor: colors.bark[100],
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    fontWeight: '600',
    color: colors.bark[700],
    textAlign: 'right',
  },
  splitPercent: { fontSize: 14, color: colors.bark[600], fontWeight: '600' },
  splitTotalText: { fontSize: 12, color: colors.bark[600], marginTop: 6, textAlign: 'right' },
  splitTotalError: { color: colors.redearth[400] },
  scheduleButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  scheduleButtonDisabled: { backgroundColor: colors.bark[200] },
  scheduleButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  removeScheduleButton: { alignItems: 'center', marginTop: 10 },
  removeScheduleText: { color: colors.redearth[400], fontSize: 14, fontWeight: '500' },
  // Skeleton
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bark[200],
    alignSelf: 'center',
    marginTop: 24,
  },
  skeletonField: {
    height: 50,
    backgroundColor: colors.bark[200],
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
});
