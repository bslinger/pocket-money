import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { TxType } from '@quiddo/shared';

export default function CreateTransactionScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TxType>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/accounts/${accountId}/transactions`, {
        type,
        amount,
        description: description || null,
        occurred_at: occurredAt,
      });
    },
    onMutate: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions', accountId] });
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create transaction');
    },
  });

  const isValid = accountId && parseFloat(amount) > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Type Toggle */}
      <Text style={styles.label}>Type</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'credit' && styles.toggleCredit]}
          onPress={() => setType('credit')}
        >
          <Text style={[styles.toggleText, type === 'credit' && styles.toggleTextActive]}>
            Credit (Earn)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'debit' && styles.toggleDebit]}
          onPress={() => setType('debit')}
        >
          <Text style={[styles.toggleText, type === 'debit' && styles.toggleTextActive]}>
            Debit (Spend)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountRow}>
        <Text style={[styles.amountSign, { color: type === 'credit' ? colors.gumleaf[400] : colors.redearth[400] }]}>
          {type === 'credit' ? '+$' : '-$'}
        </Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.bark[400]}
        />
      </View>

      {/* Description */}
      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What was this for?"
        placeholderTextColor={colors.bark[400]}
      />

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={occurredAt}
        onChangeText={setOccurredAt}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.bark[400]}
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          !isValid && styles.submitButtonDisabled,
          { backgroundColor: type === 'credit' ? colors.gumleaf[400] : colors.redearth[400] },
        ]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending}
      >
        <Text style={styles.submitButtonText}>
          {createMutation.isPending
            ? 'Adding...'
            : type === 'credit'
              ? 'Add Credit'
              : 'Add Debit'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  toggleCredit: { borderColor: colors.gumleaf[400], backgroundColor: colors.gumleaf[400] },
  toggleDebit: { borderColor: colors.redearth[400], backgroundColor: colors.redearth[400] },
  toggleText: { fontSize: 15, fontWeight: '500', color: colors.bark[700] },
  toggleTextActive: { color: colors.white, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountSign: { fontSize: 24, fontWeight: '700', marginRight: 4 },
  amountInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    color: colors.bark[700],
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
  submitButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
});
