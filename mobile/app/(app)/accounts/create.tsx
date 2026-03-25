import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Spender, ApiResponse } from '@quiddo/shared';
import { REAL_CURRENCY_PRESETS } from '@quiddo/shared';

type CurrencyMode = 'dollars' | 'custom' | 'real';

export default function CreateAccountScreen() {
  const { spenderId: preselectedSpenderId } = useLocalSearchParams<{ spenderId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [spenderId, setSpenderId] = useState(preselectedSpenderId ?? '');
  const [name, setName] = useState('');
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('dollars');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyName, setCurrencyName] = useState('Dollar');
  const [currencyNamePlural, setCurrencyNamePlural] = useState('Dollars');
  const [useIntegerAmounts, setUseIntegerAmounts] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  const { data: spenders, isLoading } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        spender_id: spenderId,
        name,
      };
      // Only send currency fields if not using family default (dollars mode with $ is the default)
      if (currencyMode !== 'dollars') {
        payload.currency_symbol = currencySymbol;
        payload.currency_name = currencyName;
        payload.currency_name_plural = currencyNamePlural;
        payload.use_integer_amounts = useIntegerAmounts;
      }
      return api.post('/accounts', payload);
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
    setUseIntegerAmounts(false);
  };

  const selectMode = (mode: CurrencyMode) => {
    setCurrencyMode(mode);
    if (mode === 'dollars') {
      setCurrencySymbol('$');
      setCurrencyName('Dollar');
      setCurrencyNamePlural('Dollars');
      setUseIntegerAmounts(false);
    } else if (mode === 'custom') {
      setCurrencySymbol('⭐');
      setCurrencyName('Star');
      setCurrencyNamePlural('Stars');
      setUseIntegerAmounts(true);
    }
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
      {/* Child Selection — rich dropdown with avatars */}
      <Text style={styles.label}>Kid</Text>
      <View style={styles.childList}>
        {(spenders ?? []).map((s) => {
          const selected = spenderId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.childChip, selected && styles.childChipActive]}
              onPress={() => setSpenderId(s.id)}
            >
              <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={32} />
              <Text style={[styles.childName, selected && styles.childNameActive]}>{s.name}</Text>
              {selected && <Feather name="check-circle" size={18} color={colors.eucalyptus[400]} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account Name */}
      <Text style={styles.label}>Account Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Spending, Savings, Birthday"
        placeholderTextColor={colors.bark[600]}
      />

      {/* Currency Selection */}
      <Text style={styles.label}>Currency</Text>

      {/* Top row: Dollars + Custom */}
      <View style={styles.currencyTopRow}>
        <TouchableOpacity
          style={[styles.currencyModeChip, currencyMode === 'dollars' && styles.currencyModeChipActive]}
          onPress={() => selectMode('dollars')}
        >
          <Text style={[styles.currencyModeEmoji]}>💵</Text>
          <Text style={[styles.currencyModeLabel, currencyMode === 'dollars' && styles.currencyModeLabelActive]}>Dollars</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.currencyModeChip, currencyMode === 'custom' && styles.currencyModeChipActive]}
          onPress={() => selectMode('custom')}
        >
          <Text style={[styles.currencyModeEmoji]}>⭐</Text>
          <Text style={[styles.currencyModeLabel, currencyMode === 'custom' && styles.currencyModeLabelActive]}>Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Divider + all real currencies */}
      <TouchableOpacity
        style={styles.showMoreRow}
        onPress={() => setShowAllCurrencies(!showAllCurrencies)}
      >
        <View style={styles.dividerLine} />
        <Text style={styles.showMoreText}>
          {showAllCurrencies ? 'Hide other currencies' : 'Other currencies'}
        </Text>
        <Feather name={showAllCurrencies ? 'chevron-up' : 'chevron-down'} size={14} color={colors.bark[600]} />
        <View style={styles.dividerLine} />
      </TouchableOpacity>

      {showAllCurrencies && (
        <View style={styles.currencyGrid}>
          {REAL_CURRENCY_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.symbol}
              style={[styles.currencyChip, currencyMode === 'real' && currencySymbol === preset.symbol && styles.currencyChipActive]}
              onPress={() => {
                setCurrencyMode('real');
                selectCurrencyPreset(preset);
              }}
            >
              <Text style={[styles.currencySymbolText, currencyMode === 'real' && currencySymbol === preset.symbol && styles.currencySymbolActive]}>
                {preset.symbol}
              </Text>
              <Text style={[styles.currencyChipLabel, currencyMode === 'real' && currencySymbol === preset.symbol && styles.currencyChipLabelActive]}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Custom currency fields */}
      {currencyMode === 'custom' && (
        <View style={styles.customSection}>
          <Text style={styles.subLabel}>Emoji</Text>
          <TouchableOpacity style={styles.emojiButton} onPress={() => setEmojiPickerOpen(true)}>
            <Text style={styles.emojiButtonText}>{currencySymbol}</Text>
          </TouchableOpacity>
          <EmojiPicker
            open={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            onEmojiSelected={(emojiObject: EmojiType) => {
              setCurrencySymbol(emojiObject.emoji);
              // Auto-guess name from emoji description
              const name = emojiObject.name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') ?? '';
              if (name) {
                setCurrencyName(name);
                setCurrencyNamePlural(name.endsWith('s') ? name : name + 's');
              }
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

          <View style={styles.nameFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Singular</Text>
              <TextInput
                style={styles.input}
                value={currencyName}
                onChangeText={(t) => {
                  setCurrencyName(t);
                  setCurrencyNamePlural(t.endsWith('s') ? t : t + 's');
                }}
                placeholder="e.g. Star"
                placeholderTextColor={colors.bark[600]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Plural</Text>
              <TextInput
                style={styles.input}
                value={currencyNamePlural}
                onChangeText={setCurrencyNamePlural}
                placeholder="e.g. Stars"
                placeholderTextColor={colors.bark[600]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.integerToggle}
            onPress={() => setUseIntegerAmounts(!useIntegerAmounts)}
          >
            <View style={[styles.toggleDot, useIntegerAmounts && styles.toggleDotActive]} />
            <Text style={styles.toggleText}>Whole numbers only</Text>
          </TouchableOpacity>

          {currencySymbol && currencyName && (
            <Text style={styles.previewText}>
              Preview: {currencySymbol}1 {currencyName} · {currencySymbol}25 {currencyNamePlural}
            </Text>
          )}
        </View>
      )}

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
  content: { padding: 16, paddingBottom: 40 },
  label: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  subLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginBottom: 4 },
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
  // Child selection
  childList: { gap: 8 },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
  },
  childChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] + '10' },
  childName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  childNameActive: { fontWeight: '600', color: colors.eucalyptus[400] },
  // Currency mode top row
  currencyTopRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  currencyModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  currencyModeChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  currencyModeEmoji: { fontSize: 18 },
  currencyModeLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  currencyModeLabelActive: { color: colors.white, fontWeight: '600' },
  // Show more / divider
  showMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.bark[200] },
  showMoreText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  // Currency grid
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
  currencySymbolText: { fontFamily: fonts.display, fontSize: 18, fontWeight: '700', color: colors.bark[700] },
  currencySymbolActive: { color: colors.white },
  currencyChipLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600], marginTop: 2 },
  currencyChipLabelActive: { color: colors.white },
  // Custom currency
  customSection: { marginTop: 8 },
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
  nameFields: { flexDirection: 'row', gap: 8, marginTop: 12 },
  integerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
  },
  toggleDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bark[200] },
  toggleDotActive: { backgroundColor: colors.eucalyptus[400] },
  toggleText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  previewText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 8 },
  // Submit
  createButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  skeletonField: {
    height: 50,
    backgroundColor: colors.bark[200],
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
});
