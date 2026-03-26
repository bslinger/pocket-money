import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Family, Spender } from '@quiddo/shared';

interface PocketMoneyRow {
  enabled: boolean;
  amount: string;
  frequency: 'weekly' | 'monthly';
  day_of_week: number;
  day_of_month: number;
}

interface ChoreRow {
  name: string;
  emoji: string;
  reward_type: 'earns' | 'responsibility' | 'no_reward';
  amount: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one_off';
  spender_ids: string[];
  emojiPickerOpen: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STEP_LABELS = ['Pocket money', 'Chores', 'Invite'];

export default function OnboardingContinue() {
  const { familyId } = useLocalSearchParams<{ familyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);

  const { data: family, isLoading } = useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      const res = await api.get(`/families/${familyId}`);
      return res.data.data as Family & { spenders: Spender[] };
    },
    enabled: !!familyId,
  });

  const spenders = family?.spenders ?? [];

  const [pocketMoney, setPocketMoney] = useState<Record<string, PocketMoneyRow>>({});
  const [chores, setChores] = useState<ChoreRow[]>([]);
  const [sharedCodes, setSharedCodes] = useState<Record<string, string>>({});

  // Initialise pocket money state once spenders load
  const [pmInitialised, setPmInitialised] = useState(false);
  if (spenders.length > 0 && !pmInitialised) {
    const initial: Record<string, PocketMoneyRow> = {};
    spenders.forEach(s => {
      initial[s.id] = { enabled: false, amount: '', frequency: 'weekly', day_of_week: 0, day_of_month: 1 };
    });
    setPocketMoney(initial);
    setPmInitialised(true);
  }

  function updatePm(spenderId: string, updates: Partial<PocketMoneyRow>) {
    setPocketMoney(prev => ({ ...prev, [spenderId]: { ...prev[spenderId], ...updates } }));
  }

  function addChore() {
    setChores(prev => [...prev, {
      name: '', emoji: '📋', reward_type: 'earns', amount: '',
      frequency: 'weekly', spender_ids: spenders.map(s => s.id),
      emojiPickerOpen: false,
    }]);
  }

  function updateChore(idx: number, updates: Partial<ChoreRow>) {
    setChores(prev => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)));
  }

  function removeChore(idx: number) {
    setChores(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleChoreSpender(choreIdx: number, spenderId: string) {
    const current = chores[choreIdx].spender_ids;
    updateChore(choreIdx, {
      spender_ids: current.includes(spenderId)
        ? current.filter(id => id !== spenderId)
        : [...current, spenderId],
    });
  }

  async function submitPocketMoney() {
    const schedules = spenders
      .filter(s => pocketMoney[s.id]?.enabled && pocketMoney[s.id]?.amount)
      .map(s => {
        const pm = pocketMoney[s.id];
        return {
          spenderId: s.id,
          amount: pm.amount,
          frequency: pm.frequency,
          day_of_week: pm.frequency === 'weekly' ? pm.day_of_week : null,
          day_of_month: pm.frequency === 'monthly' ? pm.day_of_month : null,
        };
      });

    if (schedules.length === 0) { setStep(1); return; }

    setProcessing(true);
    try {
      await Promise.all(
        schedules.map(s =>
          api.post(`/spenders/${s.spenderId}/pocket-money-schedule`, {
            amount: s.amount,
            frequency: s.frequency,
            day_of_week: s.day_of_week,
            day_of_month: s.day_of_month,
          })
        )
      );
      setStep(1);
    } catch {
      Alert.alert('Error', 'Could not save pocket money schedules. Try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function submitChores() {
    const valid = chores.filter(c => c.name.trim() && c.spender_ids.length > 0);

    if (valid.length === 0) { setStep(2); return; }

    setProcessing(true);
    try {
      await Promise.all(
        valid.map(c =>
          api.post('/chores', {
            family_id: familyId,
            name: c.name.trim(),
            emoji: c.emoji,
            reward_type: c.reward_type,
            amount: c.reward_type === 'earns' ? c.amount : null,
            frequency: c.frequency,
            spender_ids: c.spender_ids,
          })
        )
      );
      setStep(2);
    } catch {
      Alert.alert('Error', 'Could not save chores. Try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function generateFamilyCode() {
    try {
      const res = await api.post(`/families/${familyId}/link-code`);
      const { code, family_name } = res.data.data;
      await Share.share({
        message: `Join my family "${family_name}" on Quiddo! Enter code: ${code}\n\nDownload Quiddo and use this code on the login screen.`,
        title: 'Join my family on Quiddo',
      });
    } catch {
      Alert.alert('Error', 'Could not generate a code. Try again.');
    }
  }

  async function generateSpenderCode(spender: Spender) {
    try {
      const res = await api.post(`/spenders/${spender.id}/link-code`);
      const { code } = res.data.data;
      setSharedCodes(prev => ({ ...prev, [spender.id]: code }));
      await Share.share({
        message: `Link ${spender.name}'s Quiddo account! Enter code: ${code}\n\nDownload Quiddo and use this code on the login screen.`,
        title: `Link ${spender.name} on Quiddo`,
      });
    } catch {
      Alert.alert('Error', 'Could not generate a code. Try again.');
    }
  }

  function finish() {
    queryClient.invalidateQueries({ queryKey: ['families'] });
    router.replace('/(app)/(tabs)');
  }

  if (isLoading || !family) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Setting up...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.heading}>{family.name} is ready!</Text>
        <Text style={styles.subheading}>A few optional steps to get the most out of Quiddo.</Text>

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

        <View style={styles.card}>
          {/* Step 0: Pocket money */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.cardTitle}>Set up pocket money</Text>
              <Text style={styles.cardDesc}>
                Choose how much each kid earns and when. You can skip any kid or come back later.
              </Text>

              {spenders.length === 0 && (
                <View style={styles.emptyNote}>
                  <Text style={styles.emptyText}>No kids added yet. Add kids from the dashboard.</Text>
                </View>
              )}

              {spenders.map(spender => {
                const pm = pocketMoney[spender.id] ?? { enabled: false, amount: '', frequency: 'weekly', day_of_week: 0, day_of_month: 1 };
                return (
                  <View key={spender.id} style={styles.spenderCard}>
                    <TouchableOpacity
                      style={styles.spenderHeader}
                      onPress={() => updatePm(spender.id, { enabled: !pm.enabled })}
                    >
                      <View style={[styles.checkbox, pm.enabled && styles.checkboxChecked]}>
                        {pm.enabled && <Feather name="check" size={10} color={colors.white} />}
                      </View>
                      <SpenderAvatar name={spender.name} color={spender.color} avatarUrl={spender.avatar_url} size={32} />
                      <Text style={styles.spenderName}>{spender.name}</Text>
                    </TouchableOpacity>

                    {pm.enabled && (
                      <View style={styles.pmFields}>
                        <View style={styles.row}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Amount ({family.currency_symbol || '$'})</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="decimal-pad"
                              placeholder="5.00"
                              placeholderTextColor={colors.bark[600]}
                              value={pm.amount}
                              onChangeText={v => updatePm(spender.id, { amount: v })}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Frequency</Text>
                            <View style={styles.segmentRow}>
                              {(['weekly', 'monthly'] as const).map(f => (
                                <TouchableOpacity
                                  key={f}
                                  style={[styles.segmentBtn, pm.frequency === f && styles.segmentBtnActive]}
                                  onPress={() => updatePm(spender.id, { frequency: f })}
                                >
                                  <Text style={[styles.segmentText, pm.frequency === f && styles.segmentTextActive]}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>

                        {pm.frequency === 'weekly' && (
                          <View>
                            <Text style={styles.label}>Pay day</Text>
                            <View style={styles.dayRow}>
                              {DAY_LABELS.map((d, i) => (
                                <TouchableOpacity
                                  key={i}
                                  style={[styles.dayBtn, pm.day_of_week === i && styles.dayBtnActive]}
                                  onPress={() => updatePm(spender.id, { day_of_week: i })}
                                >
                                  <Text style={[styles.dayText, pm.day_of_week === i && styles.dayTextActive]}>{d}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        )}

                        {pm.frequency === 'monthly' && (
                          <View>
                            <Text style={styles.label}>Day of month</Text>
                            <TextInput
                              style={[styles.input, { width: 80 }]}
                              keyboardType="number-pad"
                              value={String(pm.day_of_month)}
                              onChangeText={v => updatePm(spender.id, { day_of_month: parseInt(v) || 1 })}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Step 1: Chores */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.cardTitle}>Add some chores</Text>
              <Text style={styles.cardDesc}>
                Chores let kids earn money by completing tasks. You can always add more later.
              </Text>

              {chores.map((chore, idx) => (
                <View key={idx} style={styles.choreCard}>
                  <View style={styles.choreHeader}>
                    <TouchableOpacity
                      style={styles.emojiBtn}
                      onPress={() => updateChore(idx, { emojiPickerOpen: true })}
                    >
                      <Text style={styles.emojiText}>{chore.emoji}</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Tidy bedroom"
                      placeholderTextColor={colors.bark[600]}
                      value={chore.name}
                      onChangeText={v => updateChore(idx, { name: v })}
                      autoFocus={idx === chores.length - 1}
                    />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeChore(idx)}>
                      <Feather name="x" size={16} color={colors.bark[600]} />
                    </TouchableOpacity>
                  </View>

                  {/* Reward type */}
                  <View style={styles.segmentRow3}>
                    {([
                      { value: 'earns', label: 'Earns money' },
                      { value: 'responsibility', label: 'Responsibility' },
                      { value: 'no_reward', label: 'No reward' },
                    ] as const).map(({ value, label }) => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.segmentBtn3, chore.reward_type === value && styles.segmentBtnActive]}
                        onPress={() => updateChore(idx, { reward_type: value })}
                      >
                        <Text style={[styles.segmentText3, chore.reward_type === value && styles.segmentTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {chore.reward_type === 'earns' && (
                    <View>
                      <Text style={styles.label}>Amount ({family.currency_symbol || '$'})</Text>
                      <TextInput
                        style={[styles.input, { width: 100 }]}
                        keyboardType="decimal-pad"
                        placeholder="2.00"
                        placeholderTextColor={colors.bark[600]}
                        value={chore.amount}
                        onChangeText={v => updateChore(idx, { amount: v })}
                      />
                    </View>
                  )}

                  <View style={styles.row}>
                    <Text style={[styles.label, { alignSelf: 'center', marginBottom: 0 }]}>Frequency</Text>
                    <View style={styles.segmentRow}>
                      {(['daily', 'weekly', 'monthly', 'one_off'] as const).map(f => (
                        <TouchableOpacity
                          key={f}
                          style={[styles.segmentBtn, chore.frequency === f && styles.segmentBtnActive]}
                          onPress={() => updateChore(idx, { frequency: f })}
                        >
                          <Text style={[styles.segmentText, chore.frequency === f && styles.segmentTextActive]}>
                            {f === 'one_off' ? 'One-off' : f.charAt(0).toUpperCase() + f.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {spenders.length > 0 && (
                    <View>
                      <Text style={styles.label}>Assigned to</Text>
                      <View style={styles.spenderChips}>
                        {spenders.map(s => {
                          const sel = chore.spender_ids.includes(s.id);
                          return (
                            <TouchableOpacity
                              key={s.id}
                              style={[styles.chip, sel && styles.chipActive]}
                              onPress={() => toggleChoreSpender(idx, s.id)}
                            >
                              <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={16} />
                              <Text style={[styles.chipText, sel && styles.chipTextActive]}>{s.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <EmojiPicker
                    onEmojiSelected={(emoji: EmojiType) => updateChore(idx, { emoji: emoji.emoji, emojiPickerOpen: false })}
                    open={chore.emojiPickerOpen}
                    onClose={() => updateChore(idx, { emojiPickerOpen: false })}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.addKidBtn} onPress={addChore}>
                <Feather name="plus-circle" size={15} color={colors.eucalyptus[400]} />
                <Text style={styles.addKidText}>Add a chore</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Invite */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.cardTitle}>Invite others</Text>
              <Text style={styles.cardDesc}>
                Add a co-parent or link your kids' devices so they can see their balance and mark chores as done.
              </Text>

              {/* Co-parent invite */}
              <View style={styles.inviteSection}>
                <Text style={styles.inviteTitle}>Invite a co-parent</Text>
                <Text style={styles.inviteDesc}>
                  Share a code that another parent can enter on the login screen to join {family.name}.
                </Text>
                <TouchableOpacity style={styles.shareBtn} onPress={generateFamilyCode}>
                  <Feather name="share-2" size={15} color={colors.white} />
                  <Text style={styles.shareBtnText}>Share invite code</Text>
                </TouchableOpacity>
              </View>

              {/* Child device links */}
              {spenders.length > 0 && (
                <View style={styles.inviteSection}>
                  <Text style={styles.inviteTitle}>Link child accounts</Text>
                  <Text style={styles.inviteDesc}>
                    Let your kids log in with their own device to see their balance and mark chores as done.
                  </Text>
                  {spenders.map(spender => (
                    <View key={spender.id} style={styles.spenderInviteRow}>
                      <SpenderAvatar name={spender.name} color={spender.color} avatarUrl={spender.avatar_url} size={32} />
                      <Text style={styles.spenderName}>{spender.name}</Text>
                      <TouchableOpacity
                        style={styles.shareBtnSmall}
                        onPress={() => generateSpenderCode(spender)}
                      >
                        <Feather name="share-2" size={13} color={colors.eucalyptus[400]} />
                        <Text style={styles.shareBtnSmallText}>
                          {sharedCodes[spender.id] ? 'Share again' : 'Share code'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.skipNote}>You can also do this later from the Family settings.</Text>
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
              {step < 2 && (
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => setStep(s => s + 1)}
                  disabled={processing}
                >
                  <Text style={styles.skipBtnText}>Do this later</Text>
                </TouchableOpacity>
              )}
              {step === 0 && (
                <TouchableOpacity
                  style={[styles.nextBtn, processing && styles.nextBtnDisabled]}
                  onPress={submitPocketMoney}
                  disabled={processing}
                >
                  <Text style={styles.nextBtnText}>{processing ? 'Saving...' : 'Continue'}</Text>
                  {!processing && <Feather name="chevron-right" size={16} color={colors.white} />}
                </TouchableOpacity>
              )}
              {step === 1 && (
                <TouchableOpacity
                  style={[styles.nextBtn, processing && styles.nextBtnDisabled]}
                  onPress={submitChores}
                  disabled={processing}
                >
                  <Text style={styles.nextBtnText}>{processing ? 'Saving...' : 'Continue'}</Text>
                  {!processing && <Feather name="chevron-right" size={16} color={colors.white} />}
                </TouchableOpacity>
              )}
              {step === 2 && (
                <TouchableOpacity style={styles.nextBtn} onPress={finish}>
                  <Text style={styles.nextBtnText}>Go to dashboard</Text>
                  <Feather name="chevron-right" size={16} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {step < 2 && (
          <TouchableOpacity style={styles.skipAll} onPress={finish}>
            <Text style={styles.skipAllText}>Skip setup and go to dashboard</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bark[100] },
  loadingText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },

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

  card: { backgroundColor: colors.white, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: colors.bark[200] },
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

  spenderCard: { borderWidth: 1, borderColor: colors.bark[200], borderRadius: 10, padding: 12, gap: 10 },
  spenderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spenderName: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], flex: 1 },
  pmFields: { gap: 10, paddingLeft: 4 },

  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  segmentRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  segmentBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1,
    borderColor: colors.bark[200],
  },
  segmentBtnActive: { borderColor: colors.eucalyptus[400], backgroundColor: '#F0F7F3' },
  segmentText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  segmentTextActive: { color: colors.eucalyptus[400], fontWeight: '600' },

  dayRow: { flexDirection: 'row', gap: 4 },
  dayBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    borderColor: colors.bark[200], alignItems: 'center', justifyContent: 'center',
  },
  dayBtnActive: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },
  dayText: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600] },
  dayTextActive: { color: colors.white, fontWeight: '600' },

  choreCard: { borderWidth: 1, borderColor: colors.bark[200], borderRadius: 10, padding: 12, gap: 10 },
  choreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emojiBtn: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: colors.bark[200], alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bark[100],
  },
  emojiText: { fontSize: 20 },
  removeBtn: { padding: 4 },
  segmentRow3: { flexDirection: 'row', gap: 4 },
  segmentBtn3: { flex: 1, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.bark[200], alignItems: 'center' },
  segmentText3: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600] },
  spenderChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: colors.bark[200],
  },
  chipActive: { borderColor: colors.eucalyptus[400], backgroundColor: '#F0F7F3' },
  chipText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  chipTextActive: { color: colors.eucalyptus[400], fontWeight: '600' },

  addKidBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  addKidText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400], fontWeight: '600' },

  inviteSection: { gap: 8 },
  inviteTitle: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700] },
  inviteDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], lineHeight: 18 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.eucalyptus[400], borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
  },
  shareBtnText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.white },
  spenderInviteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shareBtnSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    borderWidth: 1, borderColor: colors.eucalyptus[400], borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5,
  },
  shareBtnSmallText: { fontFamily: fonts.body, fontSize: 12, color: colors.eucalyptus[400], fontWeight: '600' },

  emptyNote: { padding: 16, backgroundColor: colors.bark[100], borderRadius: 8, alignItems: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600] },
  skipNote: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },

  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.bark[200], alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.eucalyptus[400], borderColor: colors.eucalyptus[400] },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.bark[200] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 },
  backBtnText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { padding: 4 },
  skipBtnText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.eucalyptus[400], borderRadius: 99,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.white },

  skipAll: { alignItems: 'center', marginTop: 16 },
  skipAllText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], textDecorationLine: 'underline' },
});
