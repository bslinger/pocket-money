import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Account, Transaction, ApiResponse, ApiListResponse } from '@quiddo/shared';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['account-transactions', id],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<Transaction>>(`/accounts/${id}/transactions`);
      return res.data;
    },
    enabled: !!id,
  });

  const isLoading = accountLoading || txLoading;

  if (isLoading || !account) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSkeleton}>
          <View style={[styles.skeletonText, { width: 120, height: 20 }]} />
          <View style={[styles.skeletonText, { width: 100, height: 36, marginTop: 8 }]} />
        </View>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.skeletonRow} />
        ))}
      </View>
    );
  }

  const transactions = transactionsData?.data ?? [];
  const symbol = account.currency_symbol ?? '$';

  return (
    <View style={styles.container}>
      {/* Balance header */}
      <View style={styles.header}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.balance}>{symbol}{parseFloat(account.balance).toFixed(2)}</Text>
        {account.spender && (
          <Text style={styles.spenderLabel}>{account.spender.name}</Text>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/(app)/transactions/create', params: { accountId: id } })}
          >
            <Text style={styles.actionButtonText}>+ Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonOutline]}
            onPress={() => router.push({ pathname: '/(app)/transactions/transfer', params: { fromAccountId: id } })}
          >
            <Text style={[styles.actionButtonText, { color: colors.eucalyptus[400] }]}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions list */}
      <FlashList
        data={transactions}
        estimatedItemSize={64}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isCredit = item.type === 'credit';
          return (
            <View style={styles.txRow}>
              <View style={styles.txInfo}>
                <Text style={styles.txDescription}>
                  {item.description ?? (isCredit ? 'Credit' : 'Debit')}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(item.occurred_at).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: isCredit ? colors.gumleaf[400] : colors.redearth[400] },
                ]}
              >
                {isCredit ? '+' : '-'}{symbol}{parseFloat(item.amount).toFixed(2)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  header: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.bark[200],
    alignItems: 'center',
  },
  accountName: { fontSize: 14, color: colors.bark[600], marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '700', color: colors.bark[700] },
  spenderLabel: { fontSize: 13, color: colors.bark[600], marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButtonOutline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.eucalyptus[400],
  },
  actionButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  txInfo: { flex: 1 },
  txDescription: { fontSize: 15, fontWeight: '500', color: colors.bark[700] },
  txDate: { fontSize: 12, color: colors.bark[600], marginTop: 3 },
  txAmount: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.bark[600] },
  // Skeleton
  headerSkeleton: { backgroundColor: colors.white, padding: 20, alignItems: 'center' },
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonRow: {
    height: 56,
    backgroundColor: colors.bark[200],
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 6,
  },
});
