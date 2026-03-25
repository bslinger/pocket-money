import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
} from '@quiddo/shared';

type TabKey = 'accounts' | 'goals' | 'chores' | 'transactions' | 'manage';

const TABS: { key: TabKey; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { key: 'accounts', icon: 'credit-card', label: 'Accounts' },
  { key: 'goals', icon: 'target', label: 'Goals' },
  { key: 'chores', icon: 'check-square', label: 'Chores' },
  { key: 'transactions', icon: 'list', label: 'Txns' },
  { key: 'manage', icon: 'settings', label: 'Manage' },
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

  const { data: devices = [] } = useQuery({
    queryKey: ['spender-devices', id],
    queryFn: async () => {
      const res = await api.get(`/spenders/${id}/devices`);
      return res.data.data as { id: string; device_name: string; last_active_at: string | null; created_at: string }[];
    },
    enabled: !!id && activeTab === 'manage',
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
        ))}
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

  const renderManage = () => {
    const linkedUsers = spender.users ?? [];

    return (
      <View style={styles.tabContent}>
        {/* Edit Details */}
        <TouchableOpacity
          style={styles.manageItem}
          onPress={() => router.push(`/(app)/kids/${spender.id}/edit`)}
        >
          <Feather name="edit-2" size={18} color={colors.bark[600]} />
          <Text style={styles.manageItemText}>Edit details</Text>
          <Feather name="chevron-right" size={18} color={colors.bark[600]} />
        </TouchableOpacity>

        {/* Child Login Accounts */}
        <View style={styles.manageSection}>
          <View style={styles.manageSectionHeader}>
            <Feather name="user" size={16} color={colors.bark[600]} />
            <Text style={styles.manageSectionTitle}>Child Login Accounts</Text>
          </View>
          {linkedUsers.length > 0 ? (
            linkedUsers.map((user: any) => (
              <View key={user.id} style={styles.manageSubItem}>
                <Feather name="link-2" size={14} color={colors.bark[600]} />
                <Text style={styles.manageSubItemText}>{user.email}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.manageEmptyText}>No login accounts linked</Text>
          )}
        </View>

        {/* Linked Devices */}
        <TouchableOpacity
          style={styles.manageItem}
          onPress={() => router.push(`/(app)/kids/${spender.id}/devices`)}
        >
          <Feather name="smartphone" size={18} color={colors.bark[600]} />
          <Text style={styles.manageItemText}>Linked devices</Text>
          <View style={styles.manageBadge}>
            <Text style={styles.manageBadgeText}>{devices.length}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.bark[600]} />
        </TouchableOpacity>
      </View>
    );
  };

  const tabContentMap: Record<TabKey, () => React.ReactNode> = {
    accounts: renderAccounts,
    goals: renderGoals,
    chores: renderChores,
    transactions: renderTransactions,
    manage: renderManage,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: { fontFamily: fonts.body, color: colors.white, fontSize: 30 },
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
  manageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  manageItemText: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700], flex: 1 },
  manageBadge: {
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  manageBadgeText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  manageSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  manageSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  manageSectionTitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  manageSubItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  manageSubItemText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  manageEmptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], paddingVertical: 4 },
  emptyText: { fontFamily: fonts.body, color: colors.bark[600], fontSize: 14, textAlign: 'center', padding: 24 },
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
