import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Spender, Account, ApiResponse } from '@quiddo/shared';

export default function CreateGoalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [spenderId, setSpenderId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const { data: spenders, isLoading } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const selectedSpender = (spenders ?? []).find((s) => s.id === spenderId);
  const accounts = selectedSpender?.accounts ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/goals', {
        spender_id: spenderId,
        account_id: accountId || null,
        name,
        target_amount: targetAmount,
        target_date: targetDate || null,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['spender', spenderId] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create goal');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.skeletonField} />
        ))}
      </View>
    );
  }

  const isValid = spenderId && name.trim().length > 0 && parseFloat(targetAmount) > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Spender */}
      <Text style={styles.label}>Kid</Text>
      <View style={styles.chipRow}>
        {(spenders ?? []).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, spenderId === s.id && styles.chipActive]}
            onPress={() => {
              setSpenderId(s.id);
              setAccountId('');
            }}
          >
            <View style={[styles.chipAvatar, { backgroundColor: s.color ?? colors.eucalyptus[400] }]}>
              <Text style={styles.chipAvatarText}>{s.name[0]}</Text>
            </View>
            <Text style={[styles.chipName, spenderId === s.id && styles.chipNameActive]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Account (optional) */}
      {spenderId && accounts.length > 0 && (
        <>
          <Text style={styles.label}>Account (optional)</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.accountChip, !accountId && styles.accountChipActive]}
              onPress={() => setAccountId('')}
            >
              <Text style={[styles.accountChipText, !accountId && styles.accountChipTextActive]}>
                None (auto)
              </Text>
            </TouchableOpacity>
            {accounts.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.accountChip, accountId === a.id && styles.accountChipActive]}
                onPress={() => setAccountId(a.id)}
              >
                <Text style={[styles.accountChipText, accountId === a.id && styles.accountChipTextActive]}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Name */}
      <Text style={styles.label}>Goal Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. New Bike, Holiday Fund"
        placeholderTextColor={colors.bark[600]}
      />

      {/* Target Amount */}
      <Text style={styles.label}>Target Amount</Text>
      <View style={styles.amountRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.bark[600]}
        />
      </View>

      {/* Target Date */}
      <Text style={styles.label}>Target Date (optional)</Text>
      <TextInput
        style={styles.input}
        value={targetDate}
        onChangeText={setTargetDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.bark[600]}
      />

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending}
      >
        <Text style={styles.createButtonText}>
          {createMutation.isPending ? 'Creating...' : 'Create Goal'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  chipAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  chipAvatarText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  chipName: { marginLeft: 8, fontSize: 14, color: colors.bark[700] },
  chipNameActive: { fontWeight: '600', color: colors.eucalyptus[400] },
  accountChip: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  accountChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  accountChipText: { fontSize: 14, color: colors.bark[700] },
  accountChipTextActive: { color: colors.white, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 24, fontWeight: '700', color: colors.wattle[400], marginRight: 6 },
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
  createButton: {
    backgroundColor: colors.wattle[400],
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
