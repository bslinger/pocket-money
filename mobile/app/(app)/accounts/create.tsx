import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Spender, ApiResponse } from '@quiddo/shared';
import { REAL_CURRENCY_PRESETS } from '@quiddo/shared';

export default function CreateAccountScreen() {
  const { spenderId: preselectedSpenderId } = useLocalSearchParams<{ spenderId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [spenderId, setSpenderId] = useState(preselectedSpenderId ?? '');
  const [name, setName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyName, setCurrencyName] = useState('Dollar');
  const [currencyNamePlural, setCurrencyNamePlural] = useState('Dollars');

  const { data: spenders, isLoading } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/accounts', {
        spender_id: spenderId,
        name,
        currency_symbol: currencySymbol,
        currency_name: currencyName,
        currency_name_plural: currencyNamePlural,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
      queryClient.invalidateQueries({ queryKey: ['spender', spenderId] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create account');
    },
  });

  const selectCurrencyPreset = (preset: typeof REAL_CURRENCY_PRESETS[number]) => {
    setCurrencySymbol(preset.symbol);
    setCurrencyName(preset.name);
    setCurrencyNamePlural(preset.namePlural);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeletonField} />
        ))}
      </View>
    );
  }

  const isValid = spenderId && name.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Kid</Text>
      <View style={styles.selectorRow}>
        {(spenders ?? []).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.selectorChip, spenderId === s.id && styles.selectorChipActive]}
            onPress={() => setSpenderId(s.id)}
          >
            <View style={[styles.selectorAvatar, { backgroundColor: s.color ?? colors.eucalyptus[400] }]}>
              <Text style={styles.selectorAvatarText}>{s.name[0]}</Text>
            </View>
            <Text style={[styles.selectorName, spenderId === s.id && styles.selectorNameActive]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Account Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Spending, Savings, Birthday"
        placeholderTextColor={colors.bark[600]}
      />

      <Text style={styles.label}>Currency</Text>
      <View style={styles.currencyGrid}>
        {REAL_CURRENCY_PRESETS.slice(0, 6).map((preset) => (
          <TouchableOpacity
            key={preset.symbol}
            style={[styles.currencyChip, currencySymbol === preset.symbol && styles.currencyChipActive]}
            onPress={() => selectCurrencyPreset(preset)}
          >
            <Text style={[styles.currencySymbol, currencySymbol === preset.symbol && styles.currencySymbolActive]}>
              {preset.symbol}
            </Text>
            <Text style={[styles.currencyLabel, currencySymbol === preset.symbol && styles.currencyLabelActive]}>
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Custom Currency</Text>
      <View style={styles.customCurrencyRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={currencySymbol}
          onChangeText={setCurrencySymbol}
          placeholder="Symbol"
          placeholderTextColor={colors.bark[600]}
        />
        <TextInput
          style={[styles.input, { flex: 2, marginLeft: 8 }]}
          value={currencyName}
          onChangeText={setCurrencyName}
          placeholder="Name"
          placeholderTextColor={colors.bark[600]}
        />
        <TextInput
          style={[styles.input, { flex: 2, marginLeft: 8 }]}
          value={currencyNamePlural}
          onChangeText={setCurrencyNamePlural}
          placeholder="Plural"
          placeholderTextColor={colors.bark[600]}
        />
      </View>

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending}
      >
        <Text style={styles.createButtonText}>
          {createMutation.isPending ? 'Creating...' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  selectorChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  selectorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorAvatarText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  selectorName: { marginLeft: 8, fontSize: 14, color: colors.bark[700] },
  selectorNameActive: { fontWeight: '600', color: colors.eucalyptus[400] },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    minWidth: 80,
  },
  currencyChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: colors.bark[700] },
  currencySymbolActive: { color: colors.white },
  currencyLabel: { fontSize: 11, color: colors.bark[600], marginTop: 2 },
  currencyLabelActive: { color: colors.white },
  customCurrencyRow: { flexDirection: 'row' },
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
