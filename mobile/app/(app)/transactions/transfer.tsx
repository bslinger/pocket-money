import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Spender, Account, ApiResponse } from '@quiddo/shared';

export default function TransferScreen() {
  const { fromAccountId } = useLocalSearchParams<{ fromAccountId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [sourceAccountId, setSourceAccountId] = useState(fromAccountId ?? '');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: spenders, isLoading } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const allAccounts: (Account & { spenderName: string })[] = [];
  for (const spender of spenders ?? []) {
    for (const account of spender.accounts ?? []) {
      allAccounts.push({ ...account, spenderName: spender.name });
    }
  }

  const transferMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/accounts/${sourceAccountId}/transfer`, {
        to_account_id: destinationAccountId,
        amount,
        description: description || null,
      });
    },
    onMutate: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Transfer failed');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeletonField} />
        ))}
      </View>
    );
  }

  const sourceAccount = allAccounts.find((a) => a.id === sourceAccountId);
  const isValid = sourceAccountId && destinationAccountId && parseFloat(amount) > 0 && sourceAccountId !== destinationAccountId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* From Account */}
      <Text style={styles.label}>From Account</Text>
      <View style={styles.accountList}>
        {allAccounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[styles.accountChip, sourceAccountId === account.id && styles.accountChipActive]}
            onPress={() => setSourceAccountId(account.id)}
          >
            <Text style={[styles.accountChipName, sourceAccountId === account.id && styles.accountChipNameActive]}>
              {account.spenderName} — {account.name}
            </Text>
            <Text style={[styles.accountChipBalance, sourceAccountId === account.id && styles.accountChipBalanceActive]}>
              ${parseFloat(account.balance).toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* To Account */}
      <Text style={styles.label}>To Account</Text>
      <View style={styles.accountList}>
        {allAccounts
          .filter((a) => a.id !== sourceAccountId)
          .map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[styles.accountChip, destinationAccountId === account.id && styles.accountChipActive]}
              onPress={() => setDestinationAccountId(account.id)}
            >
              <Text style={[styles.accountChipName, destinationAccountId === account.id && styles.accountChipNameActive]}>
                {account.spenderName} — {account.name}
              </Text>
              <Text style={[styles.accountChipBalance, destinationAccountId === account.id && styles.accountChipBalanceActive]}>
                ${parseFloat(account.balance).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      {sourceAccount && (
        <Text style={styles.availableText}>
          Available: ${parseFloat(sourceAccount.balance).toFixed(2)}
        </Text>
      )}
      <TextInput
        style={styles.amountInput}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.bark[400]}
      />

      {/* Description */}
      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Transfer note"
        placeholderTextColor={colors.bark[400]}
      />

      <TouchableOpacity
        style={[styles.transferButton, !isValid && styles.transferButtonDisabled]}
        onPress={() => transferMutation.mutate()}
        disabled={!isValid || transferMutation.isPending}
      >
        <Text style={styles.transferButtonText}>
          {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  accountList: { gap: 6 },
  accountChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.white,
  },
  accountChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  accountChipName: { fontSize: 14, color: colors.bark[700], flex: 1 },
  accountChipNameActive: { fontWeight: '600', color: colors.eucalyptus[500] },
  accountChipBalance: { fontSize: 14, fontWeight: '600', color: colors.bark[600] },
  accountChipBalanceActive: { color: colors.eucalyptus[500] },
  availableText: { fontSize: 12, color: colors.bark[600], marginBottom: 6 },
  amountInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    color: colors.bark[700],
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  transferButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  transferButtonDisabled: { opacity: 0.5 },
  transferButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  skeletonField: {
    height: 50,
    backgroundColor: colors.bark[200],
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
});
