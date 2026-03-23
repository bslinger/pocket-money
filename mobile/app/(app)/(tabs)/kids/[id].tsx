import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type {
  Spender,
  Account,
  SavingsGoal,
  Chore,
  Transaction,
  ApiResponse,
} from '@quiddo/shared';

type TabKey = 'accounts' | 'goals' | 'chores' | 'transactions';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'goals', label: 'Goals' },
  { key: 'chores', label: 'Chores' },
  { key: 'transactions', label: 'Txns' },
];

export default function KidDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('accounts');

  const { data: spender, isLoading } = useQuery({
    queryKey: ['spender', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender>>(`/spenders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

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

  const renderAccounts = () => {
    const accounts = spender.accounts ?? [];
    return (
      <View style={styles.tabContent}>
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={styles.itemCard}
            onPress={() => router.push(`/(app)/accounts/${account.id}`)}
          >
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>{account.name}</Text>
              <Text style={styles.itemBalance}>${parseFloat(account.balance).toFixed(2)}</Text>
            </View>
            <Text style={styles.itemSub}>
              {(account.transactions ?? []).length} transactions
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push({ pathname: '/(app)/accounts/create', params: { spenderId: spender.id } })}
        >
          <Text style={styles.addCardText}>+ New Account</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGoals = () => {
    const goals = (spender.savings_goals ?? []).filter(
      (g) => !g.is_completed && !g.abandoned_at,
    );
    return (
      <View style={styles.tabContent}>
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
        {chores.map((chore) => (
          <TouchableOpacity
            key={chore.id}
            style={styles.itemCard}
            onPress={() => router.push(`/(app)/(tabs)/chores/${chore.id}`)}
          >
            <View style={styles.itemRow}>
              <Text style={styles.choreEmoji}>{chore.emoji ?? '✅'}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemName}>{chore.name}</Text>
                <Text style={styles.itemSub}>
                  {chore.frequency} · {chore.reward_type}
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

  const tabContentMap: Record<TabKey, () => React.ReactNode> = {
    accounts: renderAccounts,
    goals: renderGoals,
    chores: renderChores,
    transactions: renderTransactions,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLargeText}>{spender.name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{spender.name}</Text>
        <Text style={styles.balance}>${totalBalance.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(app)/kids/${spender.id}/edit`)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
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
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: { color: colors.white, fontSize: 30, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.bark[700], marginTop: 12 },
  balance: { fontSize: 32, fontWeight: '700', color: colors.bark[700], marginTop: 4 },
  editButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  editButtonText: { color: colors.eucalyptus[400], fontWeight: '600', fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.bark[600] },
  tabTextActive: { color: colors.bark[700], fontWeight: '600' },
  tabContent: {},
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.bark[700] },
  itemBalance: { fontSize: 16, fontWeight: '700', color: colors.bark[700] },
  itemSub: { fontSize: 13, color: colors.bark[600], marginTop: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bark[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: colors.wattle[400], borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', color: colors.wattle[400], width: 36 },
  choreEmoji: { fontSize: 22 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  addCard: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addCardText: { color: colors.eucalyptus[400], fontWeight: '600', fontSize: 14 },
  emptyText: { color: colors.bark[600], fontSize: 14, textAlign: 'center', padding: 24 },
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
