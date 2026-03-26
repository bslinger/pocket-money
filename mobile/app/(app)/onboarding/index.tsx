import { useState, useRef } from 'react';
import { findNodeHandle } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import pluralize from 'pluralize';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { SPENDER_COLORS } from '@quiddo/shared';
import type { Family } from '@quiddo/shared';

const CURRENCY_SYMBOLS = [
  { symbol: '$', name: 'Dollar', plural: 'Dollars' },
  { symbol: '£', name: 'Pound', plural: 'Pounds' },
  { symbol: '€', name: 'Euro', plural: 'Euros' },
  { symbol: '¥', name: 'Yen', plural: 'Yen' },
  { symbol: '₹', name: 'Rupee', plural: 'Rupees' },
  { symbol: 'kr', name: 'Krone', plural: 'Kroner' },
  { symbol: 'Fr', name: 'Franc', plural: 'Francs' },
  { symbol: 'R', name: 'Rand', plural: 'Rand' },
  { symbol: '₩', name: 'Won', plural: 'Won' },
  { symbol: '₪', name: 'Shekel', plural: 'Shekels' },
  { symbol: '₺', name: 'Lira', plural: 'Lira' },
  { symbol: '₿', name: 'Bitcoin', plural: 'Bitcoin' },
] as const;

interface KidRow {
  name: string;
  color: string;
  balance: string;
}

export default function OnboardingIndex() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const lastKidInputRef = useRef<TextInput>(null);
  const [step, setStep] = useState(0);

  // Step 0: family name
  const [familyName, setFamilyName] = useState('');

  // Step 1: currency
  const [currencyType, setCurrencyType] = useState<'real' | 'custom'>('real');
  const [selectedSymbolIdx, setSelectedSymbolIdx] = useState(0);
  const [customSymbol, setCustomSymbol] = useState('⭐');
  const [customName, setCustomName] = useState('');
  const [customNamePlural, setCustomNamePlural] = useState('');
  const [useIntegerAmounts, setUseIntegerAmounts] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // Step 2: kids
  const [kids, setKids] = useState<KidRow[]>([]);
  const [kidErrors, setKidErrors] = useState<string[]>([]);

  function isValidKidName(name: string): boolean {
    return /[a-zA-Z0-9]/.test(name);
  }

  function currencyInputFontSize(text: string): number {
    const len = text.length;
    if (len <= 8) return 14;
    if (len <= 12) return 12;
    if (len <= 16) return 10;
    return 9;
  }

  const currencySymbol = currencyType === 'real' ? CURRENCY_SYMBOLS[selectedSymbolIdx].symbol : customSymbol;
  const currencyName = currencyType === 'real' ? CURRENCY_SYMBOLS[selectedSymbolIdx].name : customName;
  const currencyNamePlural = currencyType === 'real' ? CURRENCY_SYMBOLS[selectedSymbolIdx].plural : customNamePlural;

  const createFamily = useMutation({
    mutationFn: async () => {
      const spenders = kids
        .filter(k => k.name.trim())
        .map(k => ({ name: k.name.trim(), color: k.color, balance: parseFloat(k.balance) || 0 }));
      const res = await api.post('/families', {
        name: familyName.trim(),
        currency_symbol: currencySymbol,
        currency_name: currencyName,
        currency_name_plural: currencyNamePlural,
        use_integer_amounts: useIntegerAmounts,
        spenders,
      });
      return res.data.data as Family;
    },
    onSuccess: (family) => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      router.replace({ pathname: '/(app)/onboarding/continue', params: { familyId: family.id } });
    },
    onError: () => {
      Alert.alert('Error', 'Could not create your family. Please try again.');
    },
  });

  function addKid() {
    const nextColor = SPENDER_COLORS[kids.length % SPENDER_COLORS.length];
    setKids(prev => [...prev, { name: '', color: nextColor, balance: '' }]);
    setTimeout(() => {
      const node = findNodeHandle(lastKidInputRef.current);
      if (node) scrollRef.current?.scrollToFocusedInput(node, 16);
    }, 100);
  }

  function updateKid(idx: number, field: keyof KidRow, value: string) {
    setKids(prev => prev.map((k, i) => (i === idx ? { ...k, [field]: value } : k)));
    if (field === 'name' && kidErrors[idx]) {
      setKidErrors(prev => prev.map((e, i) => (i === idx ? '' : e)));
    }
  }

  function removeKid(idx: number) {
    setKids(prev => prev.filter((_, i) => i !== idx));
  }

  function next() {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      const errors = kids.map(k => (!isValidKidName(k.name) ? 'Enter a valid name' : ''));
      setKidErrors(errors);
      if (errors.some(e => e)) return;
      createFamily.mutate();
    }
  }

  const canProceed =
    step === 0
      ? familyName.trim().length > 0
      : step === 1
        ? currencyType === 'real' || (customSymbol.trim().length > 0 && customName.trim().length > 0)
        : true;

  const STEP_LABELS = ['Your family', 'Currency', 'Add kids'];

  return (
    <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
      >
        {/* Header */}
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.heading}>Welcome to Quiddo</Text>
        <Text style={styles.subheading}>Let's get your family set up.</Text>

        {/* Step indicators */}
        <View style={styles.steps}>
          {STEP_LABELS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]}>
                {i < step
                  ? <Feather name="check" size={10} color={colors.white} />
                  : <Text style={[styles.stepNumber, i === step && styles.stepNumberActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
              {i < STEP_LABELS.length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Step 0: Family name */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.cardTitle}>Your family</Text>
              <Text style={styles.cardDesc}>
                Give your family a name. This is your workspace in Quiddo. Everything belongs to a family: kids, accounts, chores, and goals.
              </Text>
              <Text style={styles.label}>Family name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. The Smiths"
                placeholderTextColor={colors.bark[400]}
                value={familyName}
                onChangeText={setFamilyName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => canProceed && next()}
              />
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>What's a family?</Text>
                <Text style={styles.infoText}>
                  Your family is your shared workspace. Most families only need one, but you can create more for different arrangements, like shared custody or separate groups of kids.
                </Text>
              </View>
            </View>
          )}

          {/* Step 1: Currency */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.cardTitle}>What do your kids earn?</Text>
              <Text style={styles.cardDesc}>Choose a currency for chore rewards and pocket money.</Text>

              <View style={styles.toggleRow}>
                {(['real', 'custom'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.toggleBtn, currencyType === type && styles.toggleBtnActive]}
                    onPress={() => setCurrencyType(type)}
                  >
                    <Text style={[styles.toggleBtnTitle, currencyType === type && styles.toggleBtnTitleActive]}>
                      {type === 'real' ? '💵 Real money' : '⭐ Custom currency'}
                    </Text>
                    <Text style={styles.toggleBtnDesc}>
                      {type === 'real' ? 'Dollars, pounds, euros, etc.' : 'Points, stars, gems, or anything'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {currencyType === 'real' && (
                <View style={styles.symbolGrid}>
                  {CURRENCY_SYMBOLS.map((p, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.symbolBtn, selectedSymbolIdx === i && styles.symbolBtnActive]}
                      onPress={() => setSelectedSymbolIdx(i)}
                    >
                      <Text style={[styles.symbolText, selectedSymbolIdx === i && styles.symbolTextActive]}>
                        {p.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {currencyType === 'custom' && (
                <View style={{ gap: 12 }}>
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.labelSmall}>Symbol</Text>
                      <TouchableOpacity style={styles.emojiButton} onPress={() => setEmojiPickerOpen(true)}>
                        <Text style={styles.emojiButtonText}>{customSymbol}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labelSmall}>Singular</Text>
                      <TextInput
                        style={[styles.input, { fontSize: currencyInputFontSize(customName), height: 44 }]}
                        value={customName}
                        onChangeText={(v) => {
                          setCustomName(v);
                          if (!customNamePlural || customNamePlural === pluralize(customName)) {
                            setCustomNamePlural(pluralize(v));
                          }
                        }}
                        placeholder="Star"
                        placeholderTextColor={colors.bark[400]}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labelSmall}>Plural</Text>
                      <TextInput
                        style={[styles.input, { fontSize: currencyInputFontSize(customNamePlural), height: 44 }]}
                        value={customNamePlural}
                        onChangeText={setCustomNamePlural}
                        placeholder="Stars"
                        placeholderTextColor={colors.bark[400]}
                      />
                    </View>
                  </View>
                  <EmojiPicker
                    open={emojiPickerOpen}
                    onClose={() => setEmojiPickerOpen(false)}
                    onEmojiSelected={(emojiObject: EmojiType) => {
                      const name = emojiObject.name
                        .split(' ')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                      setCustomSymbol(emojiObject.emoji);
                      setCustomName(name);
                      setCustomNamePlural(pluralize(name));
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
                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setUseIntegerAmounts(v => !v)}
                    activeOpacity={1}
                  >
                    <View style={[styles.checkbox, useIntegerAmounts && styles.checkboxChecked]}>
                      {useIntegerAmounts && <Feather name="check" size={10} color={colors.white} />}
                    </View>
                    <Text style={styles.checkLabel}>
                      Whole numbers only (e.g. 1 {customName || 'Star'}, not 0.5)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Step 2: Kids */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.cardTitle}>Add your kids</Text>
              <Text style={styles.cardDesc}>
                Each kid gets their own account. You can add more kids later.
              </Text>

              {kids.length > 0 && (
                <View style={styles.kidHeaderRow}>
                  <Text style={[styles.kidHeaderLabel, { flex: 1 }]}>Name</Text>
                  <Text style={[styles.kidHeaderLabel, { width: 80 }]}>Starting balance</Text>
                  <View style={{ width: 24 }} />
                </View>
              )}

              {kids.map((kid, idx) => (
                <View key={idx} style={styles.kidRow}>
                  {/* Color picker */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                    {SPENDER_COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.colorDot, { backgroundColor: c }, kid.color === c && styles.colorDotSelected]}
                        onPress={() => updateKid(idx, 'color', c)}
                      />
                    ))}
                  </ScrollView>
                  <View style={styles.kidInputRow}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        ref={idx === kids.length - 1 ? lastKidInputRef : null}
                        style={[styles.input, kidErrors[idx] ? styles.inputError : null]}
                        placeholder={`Kid ${idx + 1} name`}
                        placeholderTextColor={colors.bark[400]}
                        value={kid.name}
                        onChangeText={v => updateKid(idx, 'name', v)}
                        autoFocus={idx === kids.length - 1}
                      />
                      {!!kidErrors[idx] && (
                        <Text style={styles.fieldError}>{kidErrors[idx]}</Text>
                      )}
                    </View>
                    <View style={styles.balanceInput}>
                      <Text style={styles.currencyPrefix}>{currencySymbol || '$'}</Text>
                      <TextInput
                        style={styles.balanceTextInput}
                        placeholder="0"
                        placeholderTextColor={colors.bark[400]}
                        value={kid.balance}
                        onChangeText={v => updateKid(idx, 'balance', v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeKid(idx)}>
                      <Feather name="x" size={16} color={colors.bark[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addKidBtn} onPress={addKid}>
                <Feather name="plus-circle" size={15} color={colors.eucalyptus[400]} />
                <Text style={styles.addKidText}>Add a kid</Text>
              </TouchableOpacity>

              {kids.length === 0 && (
                <Text style={styles.skipNote}>You can skip this and add kids later from the dashboard.</Text>
              )}
            </View>
          )}

          {/* Navigation */}
          <View style={styles.navRow}>
            {step > 0 ? (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
                <Feather name="chevron-left" size={16} color={colors.bark[600]} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <View style={styles.navRight}>
              <TouchableOpacity
                style={[styles.nextBtn, (!canProceed || createFamily.isPending) && styles.nextBtnDisabled]}
                onPress={next}
                disabled={!canProceed || createFamily.isPending}
              >
                <Text style={styles.nextBtnText}>
                  {createFamily.isPending
                    ? 'Creating...'
                    : step === 2 && kids.length === 0
                      ? 'Do this later'
                      : step < 2
                        ? 'Continue'
                        : 'Create family'}
                </Text>
                {!createFamily.isPending && <Feather name="chevron-right" size={16} color={colors.white} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  logo: { fontFamily: fonts.display, fontSize: 28, color: colors.eucalyptus[400], textAlign: 'center', marginBottom: 8 },
  heading: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600', color: colors.bark[700], textAlign: 'center' },
  subheading: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], textAlign: 'center', marginBottom: 24 },

  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 2 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    borderColor: colors.bark[200], alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stepDotActive: { borderColor: colors.eucalyptus[400] },
  stepDotDone: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  stepNumber: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700', color: colors.bark[600] },
  stepNumberActive: { color: colors.eucalyptus[400] },
  stepLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600] },
  stepLabelActive: { color: colors.eucalyptus[400], fontWeight: '600' },
  stepLine: { width: 16, height: 1, backgroundColor: colors.bark[200] },

  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: colors.bark[200],
  },
  stepContent: { gap: 14, marginBottom: 4 },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: colors.bark[700] },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], lineHeight: 19 },

  label: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700], marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14, color: colors.bark[700],
    backgroundColor: colors.white,
  },
  infoBox: { backgroundColor: colors.bark[100], borderRadius: 8, padding: 12, gap: 4 },
  infoTitle: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700] },
  infoText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], lineHeight: 17 },

  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.bark[200], borderRadius: 10, padding: 10,
  },
  toggleBtnActive: { borderColor: colors.eucalyptus[400], backgroundColor: '#F0F7F3' },
  toggleBtnTitle: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700], marginBottom: 2 },
  toggleBtnTitleActive: { color: colors.eucalyptus[400] },
  toggleBtnDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600] },

  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symbolBtn: {
    width: 52, height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: colors.bark[200], alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  symbolBtnActive: { borderColor: colors.eucalyptus[400], backgroundColor: '#F0F7F3' },
  symbolText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  symbolTextActive: { color: colors.eucalyptus[400], fontWeight: '700' },

  row: { flexDirection: 'row', gap: 8 },
  emojiButton: {
    width: 52, height: 44, borderRadius: 8, borderWidth: 1,
    borderColor: colors.bark[200], backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiButtonText: { fontSize: 24 },
  labelSmall: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', color: colors.bark[700], marginBottom: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.bark[200], alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  checkLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[700], flex: 1 },

  kidHeaderRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 2 },
  kidHeaderLabel: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', color: colors.bark[600] },
  kidRow: { gap: 6 },
  colorScroll: { marginBottom: 2 },
  colorDot: { width: 22, height: 22, borderRadius: 11, marginRight: 6 },
  colorDotSelected: { borderWidth: 2.5, borderColor: colors.bark[700] },
  kidInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  inputError: { borderColor: colors.redearth[400] },
  fieldError: { fontFamily: fonts.body, fontSize: 11, color: colors.redearth[400], marginTop: 3 },
  balanceInput: {
    flexDirection: 'row', alignItems: 'center', width: 80,
    borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 10, backgroundColor: colors.white,
  },
  currencyPrefix: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginRight: 2 },
  balanceTextInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.bark[700], padding: 0 },
  removeBtn: { padding: 4 },
  addKidBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  addKidText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400], fontWeight: '600' },
  skipNote: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.bark[200] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 },
  backBtnText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.eucalyptus[400], borderRadius: 99,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.white },
});
