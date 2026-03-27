import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, RefreshControl, Switch, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type {
  Spender,
  Account,
  SavingsGoal,
  Chore,
  Transaction,
  ApiResponse,
  PocketMoneySchedule,
  PocketMoneyScheduleSplit,
  SpenderDevice,
} from '@quiddo/shared';
import { SPENDER_COLORS, POCKET_MONEY_FREQUENCIES, DAYS_OF_WEEK } from '@quiddo/shared';

const FREQUENCY_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', one_off: 'One-off' };
const REWARD_TYPE_LABELS: Record<string, string> = { earns: 'Earns', responsibility: 'Responsibility', no_reward: 'No Reward' };
function formatFrequency(f: string) { return FREQUENCY_LABELS[f] ?? f; }
function formatRewardType(r: string) { return REWARD_TYPE_LABELS[r] ?? r; }

type TabKey = 'accounts' | 'goals' | 'chores' | 'transactions' | 'manage';

const TABS: { key: TabKey; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { key: 'accounts', icon: 'credit-card', label: 'Accounts' },
  { key: 'goals', icon: 'target', label: 'Goals' },
  { key: 'chores', icon: 'check-square', label: 'Chores' },
  { key: 'transactions', icon: 'list', label: 'Txns' },
  { key: 'manage', icon: 'settings', label: 'Settings' },
];

interface SplitRow {
  account_id: string;
  account_name: string;
  percentage: string;
}

function initSplitRows(schedule: PocketMoneySchedule | null | undefined, accounts: Account[]): SplitRow[] {
  if (!accounts || accounts.length < 2) return [];
  if (schedule?.splits && schedule.splits.length > 0) {
    return schedule.splits.map((s: PocketMoneyScheduleSplit) => ({
      account_id: s.account_id,
      account_name: accounts.find(a => a.id === s.account_id)?.name ?? s.account_id,
      percentage: String(parseFloat(String(s.percentage)).toFixed(2)),
    }));
  }
  const equal = (100 / accounts.length).toFixed(2);
  return accounts.map((a, i) => ({
    account_id: a.id,
    account_name: a.name,
    percentage: i === accounts.length - 1
      ? (100 - parseFloat(equal) * (accounts.length - 1)).toFixed(2)
      : equal,
  }));
}

function useCountdown(expiresAt: string | null) {
  const calc = () => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  };
  const [secondsLeft, setSecondsLeft] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return;
    setSecondsLeft(calc());
    const id = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return { secondsLeft, display: `${minutes}:${seconds.toString().padStart(2, '0')}` };
}

interface SpenderDetail extends Spender {
  pocket_money_schedule?: PocketMoneySchedule | null;
}

export default function KidDetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>(() => tab === 'manage' ? 'manage' : 'accounts');
  const [refreshing, setRefreshing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>(SPENDER_COLORS[0]);

  // Pocket money state
  const [pmAmount, setPmAmount] = useState('');
  const [pmFrequency, setPmFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [pmDayOfWeek, setPmDayOfWeek] = useState<number>(4);
  const [pmDayOfMonth, setPmDayOfMonth] = useState<number>(1);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [focusedSplitIndex, setFocusedSplitIndex] = useState<number | null>(null);

  // Device link code state
  const [linkCode, setLinkCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const { secondsLeft: codeSecondsLeft, display: codeCountdown } = useCountdown(linkCode?.expires_at ?? null);

  useEffect(() => {
    if (linkCode && codeSecondsLeft <= 0) {
      setLinkCode(null);
    }
  }, [codeSecondsLeft, linkCode]);

  const { data: spender, isLoading, refetch } = useQuery({
    queryKey: ['spender', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SpenderDetail>>(`/spenders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const { data: devices = [] } = useQuery({
    queryKey: ['spender-devices', id],
    queryFn: async () => {
      const res = await api.get(`/spenders/${id}/devices`);
      return res.data.data as SpenderDevice[];
    },
    enabled: !!id && activeTab === 'manage',
  });

  // Populate edit form when spender loads
  useEffect(() => {
    if (spender) {
      setEditName(spender.name);
      setEditColor(spender.color ?? SPENDER_COLORS[0]);
      const schedule = spender.pocket_money_schedule;
      if (schedule) {
        setPmAmount(schedule.amount);
        setPmFrequency(schedule.frequency);
        if (schedule.day_of_week != null) setPmDayOfWeek(schedule.day_of_week);
        if (schedule.day_of_month != null) setPmDayOfMonth(schedule.day_of_month);
        const hasSplits = schedule.splits && schedule.splits.length > 0;
        setDistributeOpen(!!hasSplits);
        setSplits(initSplitRows(schedule, (spender.accounts ?? []) as Account[]));
      } else if ((spender.accounts?.length ?? 0) > 1) {
        setSplits(initSplitRows(null, (spender.accounts ?? []) as Account[]));
      }
    }
  }, [spender]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/spenders/${id}`, { name: editName, color: editColor });
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
        account_id: null,
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

  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await api.delete(`/spender-devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spender-devices', id] });
    },
  });

  const generateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await api.post(`/spenders/${id}/link-code`);
      setLinkCode(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to generate link code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRevoke = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Revoke device',
      `Remove ${deviceName || 'this device'}? They will need a new link code to reconnect.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: () => revokeMutation.mutate(deviceId) },
      ],
    );
  };

  function updateSplitPercentage(index: number, value: string) {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, percentage: value } : s));
  }

  if (isLoading || !spender) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSkeleton}>
          <View style={styles.skeletonAvatar} />
          <View style={[styles.skeletonText, { width: 120, height: 22, marginTop: 12 }]} />
          <View style={[styles.skeletonText, { width: 80, height: 32, marginTop: 8 }]} />
        </View>
        <View style={styles.skeletonTabs} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  const avatarColor = spender.color ?? colors.eucalyptus[400];
  const totalBalance = (spender.accounts ?? []).reduce(
    (sum, a) => sum + parseFloat(a.balance),
    0,
  );

  const hasSchedule = !!spender.pocket_money_schedule;
  const hasMultipleAccounts = (spender.accounts?.length ?? 0) > 1;
  const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
  const splitTotalOk = focusedSplitIndex !== null || Math.abs(splitTotal - 100) <= 0.5;

  const renderAccounts = () => {
    const accounts = spender.accounts ?? [];
    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/(app)/accounts/create', params: { spenderId: spender.id } })}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
        {accounts.map((account) => {
          const accountGoals = (spender.savings_goals ?? []).filter(
            (g) => g.account_id === account.id && !g.is_completed && !g.abandoned_at,
          );
          return (
            <TouchableOpacity
              key={account.id}
              style={styles.itemCard}
              onPress={() => router.push(`/(app)/accounts/${account.id}`)}
            >
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{account.name}</Text>
                <Text style={styles.itemBalance}>${parseFloat(account.balance).toFixed(2)}</Text>
              </View>
              {accountGoals.length > 0 && (
                <View style={styles.accountGoals}>
                  <Text style={styles.accountGoalsHeader}>Goals</Text>
                  {accountGoals.map((goal) => {
                    const progress =
                      parseFloat(goal.target_amount) > 0
                        ? (parseFloat(goal.allocated_amount) / parseFloat(goal.target_amount)) * 100
                        : 0;
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        style={styles.accountGoalRow}
                        onPress={() => router.push(`/(app)/goals/${goal.id}`)}
                      >
                        <Text style={styles.accountGoalName} numberOfLines={1}>{goal.name}</Text>
                        <View style={styles.accountGoalProgress}>
                          <View style={[styles.accountGoalBar, { width: `${Math.min(100, progress)}%` }]} />
                        </View>
                        <Text style={styles.accountGoalPct}>{Math.round(progress)}%</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={styles.accountActions}>
                <TouchableOpacity
                  style={styles.accountActionBtn}
                  onPress={() => router.push({ pathname: '/(app)/transactions/create', params: { spenderId: spender.id, accountId: account.id, type: 'debit' } })}
                >
                  <Text style={[styles.accountActionText, { color: colors.redearth[400] }]}>— Spend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.accountActionBtn}
                  onPress={() => router.push({ pathname: '/(app)/transactions/create', params: { spenderId: spender.id, accountId: account.id, type: 'credit' } })}
                >
                  <Text style={[styles.accountActionText, { color: colors.gumleaf[400] }]}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        {accounts.length === 0 && (
          <Text style={styles.emptyText}>No accounts yet</Text>
        )}
      </View>
    );
  };

  const renderGoals = () => {
    const goals = (spender.savings_goals ?? []).filter(
      (g) => !g.is_completed && !g.abandoned_at,
    );
    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/(app)/goals/create', params: { spenderId: spender.id } })}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>
        {goals.map((goal) => {
          const progress =
            parseFloat(goal.target_amount) > 0
              ? (parseFloat(goal.allocated_amount) / parseFloat(goal.target_amount)) * 100
              : 0;
          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.itemCard}
              onPress={() => router.push(`/(app)/goals/${goal.id}`)}
            >
              <Text style={styles.itemName}>{goal.name}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(100, progress)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
              <Text style={styles.itemSub}>
                ${parseFloat(goal.allocated_amount).toFixed(2)} / ${parseFloat(goal.target_amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
        {goals.length === 0 && (
          <Text style={styles.emptyText}>No active goals</Text>
        )}
      </View>
    );
  };

  const renderChores = () => {
    const chores = spender.chores ?? [];
    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.sectionTitle}>Chores</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/(app)/chores/create', params: { spenderId: spender.id } })}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Add Chore</Text>
          </TouchableOpacity>
        </View>
        {chores.map((chore) => (
          <TouchableOpacity
            key={chore.id}
            style={styles.itemCard}
            onPress={() => router.push(`/(app)/(tabs)/chores/${chore.id}`)}
          >
            <View style={styles.itemRow}>
              <Text style={styles.choreEmoji}>{chore.emoji ?? '🧹'}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemName}>{chore.name}</Text>
                <Text style={styles.itemSub}>
                  {formatFrequency(chore.frequency)} · {formatRewardType(chore.reward_type)}
                  {chore.amount ? ` · $${parseFloat(chore.amount).toFixed(2)}` : ''}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {chores.length === 0 && (
          <Text style={styles.emptyText}>No chores assigned</Text>
        )}
      </View>
    );
  };

  const renderTransactions = () => {
    const allTransactions: (Transaction & { accountName: string })[] = [];
    for (const account of spender.accounts ?? []) {
      for (const tx of account.transactions ?? []) {
        allTransactions.push({ ...tx, accountName: account.name });
      }
    }
    allTransactions.sort(
      (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );
    const recent = allTransactions.slice(0, 30);

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {(spender.accounts?.length ?? 0) > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({ pathname: '/(app)/transactions/create', params: { spenderId: spender.id, type: 'credit' } })}
            >
              <Feather name="plus" size={14} color={colors.white} />
              <Text style={styles.actionButtonText}>New Transaction</Text>
            </TouchableOpacity>
          )}
        </View>
        {recent.map((tx) => (
          <View key={tx.id} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {tx.description ?? (tx.type === 'credit' ? 'Credit' : 'Debit')}
                </Text>
                <Text style={styles.itemSub}>
                  {tx.accountName} · {new Date(tx.occurred_at).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === 'credit' ? colors.gumleaf[400] : colors.redearth[400] },
                ]}
              >
                {tx.type === 'credit' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        {recent.length === 0 && (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}
      </View>
    );
  };

  const renderSettings = () => {
    const linkedUsers = spender.users ?? [];
    const qrValue = linkCode ? `quiddo://link?code=${linkCode.code}` : '';

    return (
      <View style={styles.tabContent}>
        {/* Spender Details */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardTitle}>Spender details</Text>

          <View style={styles.settingsPreview}>
            <View style={[styles.previewAvatar, { backgroundColor: editColor }]}>
              <Text style={styles.previewAvatarText}>
                {editName.trim().length > 0 ? editName[0].toUpperCase() : '?'}
              </Text>
            </View>
          </View>

          <Text style={styles.settingsLabel}>Name</Text>
          <TextInput
            style={styles.settingsInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Kid's name"
            placeholderTextColor={colors.bark[400]}
          />

          <Text style={styles.settingsLabel}>Colour</Text>
          <View style={styles.colorGrid}>
            {SPENDER_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  editColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => setEditColor(color)}
              >
                {editColor === color && <Text style={styles.colorCheck}>✓</Text>}
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
        </View>

        {/* Pocket Money Schedule */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardTitle}>Pocket money schedule</Text>

          {hasSchedule && spender.pocket_money_schedule && (
            <View style={styles.scheduleActiveChip}>
              <Text style={styles.scheduleActiveText}>
                Active: {spender.pocket_money_schedule.amount} {
                  spender.pocket_money_schedule.frequency === 'weekly'
                    ? `every ${DAYS_OF_WEEK.find(d => d.value === spender.pocket_money_schedule!.day_of_week)?.label ?? ''}`
                    : `on day ${spender.pocket_money_schedule.day_of_month ?? 1} of each month`
                }
              </Text>
            </View>
          )}

          <Text style={styles.settingsLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={pmAmount}
              onChangeText={setPmAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.bark[400]}
            />
          </View>

          <Text style={styles.settingsLabel}>Frequency</Text>
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
              <Text style={styles.settingsLabel}>Pay day</Text>
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
              <Text style={styles.settingsLabel}>Day of month</Text>
              <TextInput
                style={[styles.settingsInput, { width: 80, textAlign: 'center' }]}
                value={String(pmDayOfMonth)}
                onChangeText={(v) => setPmDayOfMonth(Math.min(31, Math.max(1, parseInt(v) || 1)))}
                keyboardType="number-pad"
                placeholderTextColor={colors.bark[400]}
              />
            </>
          )}

          {hasMultipleAccounts && (
            <View style={styles.distributeSection}>
              <View style={styles.distributeHeader}>
                <Text style={styles.distributeLabel}>Distribute between accounts</Text>
                <Switch
                  value={distributeOpen}
                  onValueChange={(val) => {
                    setDistributeOpen(val);
                    if (val && splits.length === 0) {
                      setSplits(initSplitRows(null, (spender.accounts ?? []) as Account[]));
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
                          onFocus={() => setFocusedSplitIndex(index)}
                          onBlur={() => setFocusedSplitIndex(null)}
                          keyboardType="decimal-pad"
                          placeholderTextColor={colors.bark[400]}
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
              {saveScheduleMutation.isPending ? 'Saving...' : hasSchedule ? 'Update Schedule' : 'Set Schedule'}
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

        {/* Child Login Accounts */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsSectionHeader}>
            <Feather name="user" size={16} color={colors.bark[600]} />
            <Text style={styles.settingsCardTitle}>Child login accounts</Text>
          </View>
          {linkedUsers.length > 0 ? (
            linkedUsers.map((user: any) => (
              <View key={user.id} style={styles.linkedUserRow}>
                <Feather name="link-2" size={14} color={colors.bark[600]} />
                <Text style={styles.linkedUserText}>{user.email}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.settingsEmptyText}>No login accounts linked — use the web app to invite a child.</Text>
          )}
        </View>

        {/* Linked Devices */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsSectionHeader}>
            <Feather name="smartphone" size={16} color={colors.bark[600]} />
            <Text style={styles.settingsCardTitle}>Linked devices</Text>
          </View>
          <Text style={styles.settingsDescription}>
            Link a child's device so they can view their accounts and mark chores complete. No email needed.
          </Text>

          {linkCode && codeSecondsLeft > 0 ? (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Scan this QR code or enter the code below</Text>
              <View style={styles.qrContainer}>
                <QRCode value={qrValue} size={160} color={colors.bark[700]} backgroundColor={colors.white} />
              </View>
              <Text style={styles.codeDivider}>or enter manually</Text>
              <Text style={styles.codeText}>{linkCode.code}</Text>
              <Text style={[styles.codeExpiry, codeSecondsLeft < 60 && styles.codeExpiryUrgent]}>
                Expires in {codeCountdown}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateCode}
              disabled={generatingCode}
            >
              <Feather name="smartphone" size={18} color={colors.white} />
              <Text style={styles.generateButtonText}>
                {generatingCode ? 'Generating...' : 'Generate Link Code'}
              </Text>
            </TouchableOpacity>
          )}

          {devices.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.devicesSectionTitle}>Active Devices</Text>
              {devices.map((device) => (
                <View key={device.id} style={styles.deviceCard}>
                  <Feather name="smartphone" size={18} color={colors.bark[600]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.deviceName}>{device.device_name || 'Unnamed device'}</Text>
                    {device.last_active_at ? (
                      <Text style={styles.deviceMeta}>
                        Last active {format(new Date(device.last_active_at), 'd MMM yyyy, h:mm a')}
                      </Text>
                    ) : (
                      <Text style={styles.deviceMeta}>
                        Added {format(new Date(device.created_at), 'd MMM yyyy, h:mm a')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevoke(device.id, device.device_name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="trash-2" size={18} color={colors.redearth[400]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {devices.length === 0 && !linkCode && (
            <Text style={styles.settingsEmptyText}>No devices linked yet.</Text>
          )}
        </View>
      </View>
    );
  };

  const tabContentMap: Record<TabKey, () => React.ReactNode> = {
    accounts: renderAccounts,
    goals: renderGoals,
    chores: renderChores,
    transactions: renderTransactions,
    manage: renderSettings,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.eucalyptus[400]} />}>
      {/* Header */}
      <View style={styles.header}>
        <SpenderAvatar name={spender.name} color={avatarColor} avatarUrl={spender.avatar_url} size={72} />
        <Text style={styles.name}>{spender.name}</Text>
        <Text style={styles.balance}>${totalBalance.toFixed(2)}</Text>
      </View>

      {/* Icon Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Feather
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.eucalyptus[400] : colors.bark[600]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {tabContentMap[activeTab]()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 20 },
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.bark[700], marginTop: 12 },
  balance: { fontFamily: fonts.display, fontSize: 32, color: colors.bark[700], marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: colors.white },
  tabContent: {},
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.bark[600],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 13 },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  itemBalance: { fontFamily: fonts.display, fontSize: 16, color: colors.bark[700] },
  itemSub: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginTop: 4 },
  accountGoals: {
    borderTopWidth: 1,
    borderTopColor: colors.bark[200],
    marginTop: 10,
    paddingTop: 8,
  },
  accountGoalsHeader: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.bark[600],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  accountGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  accountGoalName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bark[700],
    width: 80,
  },
  accountGoalProgress: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bark[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  accountGoalBar: {
    height: '100%',
    backgroundColor: colors.wattle[400],
    borderRadius: 3,
  },
  accountGoalPct: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.wattle[400],
    width: 32,
    textAlign: 'right',
  },
  accountActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.bark[200],
    marginTop: 10,
    paddingTop: 10,
  },
  accountActionBtn: { flex: 1, alignItems: 'center' },
  accountActionText: { fontFamily: fonts.body, fontSize: 13 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bark[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: colors.wattle[400], borderRadius: 4 },
  progressText: { fontFamily: fonts.body, fontSize: 12, color: colors.wattle[400], width: 36 },
  choreEmoji: { fontSize: 22 },
  txAmount: { fontFamily: fonts.display, fontSize: 16 },
  emptyText: { fontFamily: fonts.body, color: colors.bark[600], fontSize: 14, textAlign: 'center', padding: 24 },

  // Settings tab
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  settingsCardTitle: { fontFamily: fonts.body, fontSize: 15, fontWeight: '700', color: colors.bark[700], marginBottom: 12 },
  settingsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  settingsLabel: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700], marginBottom: 6, marginTop: 12 },
  settingsInput: {
    backgroundColor: colors.bark[100],
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.bark[700],
    fontFamily: fonts.body,
  },
  settingsDescription: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginBottom: 12 },
  settingsEmptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginTop: 4 },
  settingsPreview: { alignItems: 'center', marginVertical: 8 },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: { color: colors.white, fontSize: 24, fontWeight: '700' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.bark[700] },
  colorCheck: { color: colors.white, fontSize: 14, fontWeight: '700' },
  saveButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 15 },
  scheduleActiveChip: {
    backgroundColor: colors.gumleaf[400] + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  scheduleActiveText: { fontFamily: fonts.body, fontSize: 13, color: colors.gumleaf[400], fontWeight: '500' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontFamily: fonts.body, fontSize: 20, fontWeight: '700', color: colors.bark[700], marginRight: 6 },
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
    fontFamily: fonts.body,
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
  optionChipText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  optionChipTextActive: { color: colors.white, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.bark[200],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bark[100],
  },
  dayChipActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayChipText: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[700] },
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
  distributeLabel: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700] },
  splitsList: { marginTop: 12, gap: 10 },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  splitAccountName: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
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
    fontFamily: fonts.body,
  },
  splitPercent: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], fontWeight: '600' },
  splitTotalText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 6, textAlign: 'right' },
  splitTotalError: { color: colors.redearth[400] },
  scheduleButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  scheduleButtonDisabled: { backgroundColor: colors.bark[200] },
  scheduleButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 14 },
  removeScheduleButton: { alignItems: 'center', marginTop: 10 },
  removeScheduleText: { fontFamily: fonts.body, color: colors.redearth[400], fontSize: 14, fontWeight: '500' },
  linkedUserRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  linkedUserText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  codeCard: {
    backgroundColor: colors.bark[100],
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.eucalyptus[400] + '30',
  },
  codeLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginBottom: 16, textAlign: 'center' },
  qrContainer: {
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
    marginBottom: 16,
  },
  codeDivider: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginBottom: 12 },
  codeText: { fontFamily: fonts.display, fontSize: 32, color: colors.eucalyptus[400], letterSpacing: 6, marginBottom: 12 },
  codeExpiry: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600] },
  codeExpiryUrgent: { color: colors.redearth[400] },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  generateButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 15 },
  devicesSectionTitle: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bark[100],
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  deviceName: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  deviceMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 2 },

  // Skeleton
  headerSkeleton: { alignItems: 'center', marginBottom: 20, padding: 16 },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bark[200],
  },
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonTabs: {
    height: 40,
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  skeletonCard: {
    height: 70,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
});
