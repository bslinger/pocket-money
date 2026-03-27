import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, RefreshControl, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { getEcho } from '@/lib/echo';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import type { Family, FamilyScreenDevice, ApiResponse } from '@quiddo/shared';

function useCountdown(expiresAt: string | null) {
  const calc = () => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  };
  const [secondsLeft, setSecondsLeft] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return;
    setSecondsLeft(calc());
    const id = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return { secondsLeft, display: `${minutes}:${seconds.toString().padStart(2, '0')}` };
}

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Family invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Family details edit state
  const [editingDetails, setEditingDetails] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCurrencySymbol, setEditCurrencySymbol] = useState('');
  const [editCurrencyName, setEditCurrencyName] = useState('');
  const [editCurrencyNamePlural, setEditCurrencyNamePlural] = useState('');

  // Family member invite via QR
  const [memberLinkCode, setMemberLinkCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [memberQrModalVisible, setMemberQrModalVisible] = useState(false);
  const [generatingMemberCode, setGeneratingMemberCode] = useState(false);
  const { secondsLeft: memberCodeSecondsLeft } = useCountdown(memberLinkCode?.expires_at ?? null);

  useEffect(() => {
    if (memberLinkCode && memberCodeSecondsLeft <= 0) {
      setMemberLinkCode(null);
      setMemberQrModalVisible(false);
    }
  }, [memberCodeSecondsLeft, memberLinkCode]);

  // Family screen state
  const [familyScreenCode, setFamilyScreenCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [generatingScreenCode, setGeneratingScreenCode] = useState(false);
  const { secondsLeft: screenCodeSecondsLeft, display: screenCodeCountdown } = useCountdown(familyScreenCode?.expires_at ?? null);

  useEffect(() => {
    if (familyScreenCode && screenCodeSecondsLeft <= 0) {
      setFamilyScreenCode(null);
    }
  }, [screenCodeSecondsLeft, familyScreenCode]);

  const { data: family, isLoading, refetch } = useQuery({
    queryKey: ['family', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Family>>(`/families/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: familyScreenDevices = [], refetch: refetchScreenDevices } = useQuery({
    queryKey: ['family-screen-devices', id],
    queryFn: async () => {
      const res = await api.get(`/families/${id}/family-screen-devices`);
      return res.data.data as FamilyScreenDevice[];
    },
    enabled: !!id,
  });

  // Populate edit form when family loads
  useEffect(() => {
    if (family && !editingDetails) {
      setEditName(family.name);
      setEditCurrencySymbol(family.currency_symbol ?? '');
      setEditCurrencyName(family.currency_name ?? '');
      setEditCurrencyNamePlural(family.currency_name_plural ?? '');
    }
  }, [family]);

  // Live updates via Echo — refresh device list when a screen device connects or is removed
  useEffect(() => {
    if (!id) return;
    const echo = getEcho(false);
    const channel = echo.private(`family.${id}`);
    channel.listen('.FamilyUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['family-screen-devices', id] });
    });
    return () => {
      echo.leave(`private-family.${id}`);
    };
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchScreenDevices()]);
    setRefreshing(false);
  }, [refetch, refetchScreenDevices]);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/families/${id}`, {
        _method: 'PUT',
        invite_email: inviteEmail,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      Alert.alert('Success', 'Invitation sent!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to send invitation');
    },
  });

  const updateFamilyMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/families/${id}`, {
        name: editName,
        currency_symbol: editCurrencySymbol || null,
        currency_name: editCurrencyName || null,
        currency_name_plural: editCurrencyNamePlural || null,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditingDetails(false);
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to update family');
    },
  });

  const revokeFamilyScreenDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      await api.delete(`/family-screen-devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-screen-devices', id] });
    },
  });

  const generateMemberCode = async () => {
    setGeneratingMemberCode(true);
    try {
      const res = await api.post(`/families/${id}/link-code`);
      setMemberLinkCode(res.data.data);
      setMemberQrModalVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to generate code');
    } finally {
      setGeneratingMemberCode(false);
    }
  };

  const generateFamilyScreenCode = async () => {
    setGeneratingScreenCode(true);
    try {
      const res = await api.post(`/families/${id}/family-screen-link-code`);
      setFamilyScreenCode(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to generate link code');
    } finally {
      setGeneratingScreenCode(false);
    }
  };

  const handleRevokeFamilyScreenDevice = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Remove family screen',
      `Remove ${deviceName || 'this device'} as a family screen?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => revokeFamilyScreenDevice.mutate(deviceId) },
      ],
    );
  };

  if (isLoading || !family) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonText, { width: '50%', height: 28, margin: 16 }]} />
        <View style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
        <View style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
      </View>
    );
  }

  const familyScreenQrValue = familyScreenCode ? `quiddo://link?code=${familyScreenCode.code}` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.eucalyptus[400]} />}>

      {/* Family Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Family details</Text>
          {!editingDetails && (
            <TouchableOpacity onPress={() => setEditingDetails(true)}>
              <Feather name="edit-2" size={16} color={colors.eucalyptus[400]} />
            </TouchableOpacity>
          )}
        </View>

        {editingDetails ? (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Family name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={colors.bark[400]}
            />
            <Text style={styles.fieldLabel}>Currency symbol</Text>
            <TextInput
              style={styles.input}
              value={editCurrencySymbol}
              onChangeText={setEditCurrencySymbol}
              placeholder="$"
              placeholderTextColor={colors.bark[400]}
            />
            <Text style={styles.fieldLabel}>Currency name (singular)</Text>
            <TextInput
              style={styles.input}
              value={editCurrencyName}
              onChangeText={setEditCurrencyName}
              placeholder="dollar"
              placeholderTextColor={colors.bark[400]}
            />
            <Text style={styles.fieldLabel}>Currency name (plural)</Text>
            <TextInput
              style={styles.input}
              value={editCurrencyNamePlural}
              onChangeText={setEditCurrencyNamePlural}
              placeholder="dollars"
              placeholderTextColor={colors.bark[400]}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => updateFamilyMutation.mutate()}
                disabled={updateFamilyMutation.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {updateFamilyMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingDetails(false);
                  setEditName(family.name);
                  setEditCurrencySymbol(family.currency_symbol ?? '');
                  setEditCurrencyName(family.currency_name ?? '');
                  setEditCurrencyNamePlural(family.currency_name_plural ?? '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.familyIcon}>
                <Text style={styles.familyIconText}>{family.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.familyName}>{family.name}</Text>
                <Text style={styles.familyMeta}>
                  {family.currency_symbol} · {family.currency_name}
                  {family.currency_name_plural ? ` / ${family.currency_name_plural}` : ''}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Members */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members</Text>
        {(family.family_users ?? []).map((fu) => (
          <View key={fu.id} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{fu.user?.name?.[0] ?? '?'}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{fu.user?.name ?? 'Unknown'}</Text>
              <Text style={styles.memberEmail}>{fu.user?.email}</Text>
            </View>
            <View style={[styles.roleBadge, fu.role === 'admin' && styles.roleBadgeAdmin]}>
              <Text style={[styles.roleBadgeText, fu.role === 'admin' && styles.roleBadgeTextAdmin]}>
                {fu.role}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Spenders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kids</Text>
        {(family.spenders ?? []).map((spender) => (
          <TouchableOpacity
            key={spender.id}
            style={styles.spenderCard}
            onPress={() => router.push(`/(app)/(tabs)/kids/${spender.id}`)}
          >
            <View style={[styles.spenderAvatar, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]}>
              <Text style={styles.spenderAvatarText}>{spender.name[0]}</Text>
            </View>
            <Text style={styles.spenderName}>{spender.name}</Text>
          </TouchableOpacity>
        ))}
        {(family.spenders ?? []).length === 0 && (
          <Text style={styles.mutedText}>No kids in this family yet</Text>
        )}
      </View>

      {/* Invite a parent */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite a parent</Text>
        <View style={styles.inviteRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.bark[400]}
          />
          <TouchableOpacity
            style={[styles.inviteButton, !inviteEmail && styles.inviteButtonDisabled]}
            onPress={() => inviteMutation.mutate()}
            disabled={!inviteEmail || inviteMutation.isPending}
          >
            <Text style={styles.inviteButtonText}>
              {inviteMutation.isPending ? '...' : 'Invite'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity
          style={styles.qrButton}
          onPress={generateMemberCode}
          disabled={generatingMemberCode}
        >
          <Feather name="maximize" size={18} color={colors.eucalyptus[400]} />
          <Text style={styles.qrButtonText}>
            {generatingMemberCode ? 'Generating...' : 'Share QR Code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Family Screen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family screen</Text>
        <Text style={styles.mutedText}>
          Link a tablet or shared device as a family screen. It shows all kids' chores for today, savings goals, and balances.
        </Text>

        <View style={{ marginTop: 12 }}>
          {familyScreenCode && screenCodeSecondsLeft > 0 ? (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Scan this QR code or enter the code on the other device</Text>
              <View style={styles.qrContainer}>
                <QRCode value={familyScreenQrValue} size={160} color={colors.bark[700]} backgroundColor={colors.white} />
              </View>
              <Text style={styles.codeDivider}>or enter manually</Text>
              <Text style={styles.codeText}>{familyScreenCode.code}</Text>
              <Text style={[styles.codeExpiry, screenCodeSecondsLeft < 60 && styles.codeExpiryUrgent]}>
                Expires in {screenCodeCountdown}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateFamilyScreenCode}
              disabled={generatingScreenCode}
            >
              <Feather name="monitor" size={18} color={colors.white} />
              <Text style={styles.generateButtonText}>
                {generatingScreenCode ? 'Generating...' : 'Generate Link Code'}
              </Text>
            </TouchableOpacity>
          )}

          {familyScreenDevices.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.devicesSectionTitle}>Active family screens</Text>
              {familyScreenDevices.map((device) => (
                <View key={device.id} style={styles.deviceCard}>
                  <Feather name="monitor" size={18} color={colors.bark[600]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.deviceName}>{device.device_name || 'Unnamed device'}</Text>
                    {device.last_active_at ? (
                      <Text style={styles.deviceMeta}>
                        Last active {format(new Date(device.last_active_at), 'd MMM yyyy, h:mm a')}
                      </Text>
                    ) : (
                      <Text style={styles.deviceMeta}>
                        Added {format(new Date(device.created_at), 'd MMM yyyy, h:mm a')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevokeFamilyScreenDevice(device.id, device.device_name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="trash-2" size={18} color={colors.redearth[400]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {familyScreenDevices.length === 0 && !familyScreenCode && (
            <Text style={[styles.mutedText, { marginTop: 8 }]}>No family screens linked yet.</Text>
          )}
        </View>
      </View>

      {/* Member QR Code Modal */}
      <Modal visible={memberQrModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan to join family</Text>
            <Text style={styles.modalSubtitle}>{family.name}</Text>

            {memberLinkCode && (
              <>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={`quiddo://join-family?code=${memberLinkCode.code}`}
                    size={200}
                    color={colors.bark[700]}
                    backgroundColor={colors.white}
                  />
                </View>
                <Text style={styles.codeText}>{memberLinkCode.code}</Text>
                <Text style={styles.codeExpiry}>
                  Expires in {Math.floor(memberCodeSecondsLeft / 60)}:{String(memberCodeSecondsLeft % 60).padStart(2, '0')}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMemberQrModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.body, fontSize: 12, fontWeight: '600', color: colors.bark[600], textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  familyIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.eucalyptus[400],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  familyIconText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  familyName: { fontFamily: fonts.display, fontSize: 18, fontWeight: '700', color: colors.bark[700] },
  familyMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginTop: 4 },
  fieldLabel: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700], marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: colors.bark[100],
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.bark[700],
    fontFamily: fonts.body,
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveButton: {
    flex: 1,
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 14 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: { fontFamily: fonts.body, color: colors.bark[600], fontWeight: '600', fontSize: 14 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.eucalyptus[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  memberInfo: { marginLeft: 10, flex: 1 },
  memberName: { fontFamily: fonts.body, fontSize: 15, fontWeight: '500', color: colors.bark[700] },
  memberEmail: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 1 },
  roleBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bark[200],
  },
  roleBadgeAdmin: { backgroundColor: colors.eucalyptus[400] },
  roleBadgeText: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', color: colors.bark[700], textTransform: 'uppercase' },
  roleBadgeTextAdmin: { color: colors.white },
  spenderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  spenderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spenderAvatarText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  spenderName: { marginLeft: 10, fontFamily: fonts.body, fontSize: 15, fontWeight: '500', color: colors.bark[700] },
  mutedText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600] },
  inviteRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  inviteButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  inviteButtonDisabled: { opacity: 0.5 },
  inviteButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 14 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.bark[200] },
  orText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  qrButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.eucalyptus[400],
    borderRadius: 8, paddingVertical: 12,
  },
  qrButtonText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400], fontWeight: '600' },
  codeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.eucalyptus[400] + '30',
    marginBottom: 12,
  },
  codeLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginBottom: 16, textAlign: 'center' },
  qrContainer: { padding: 12, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.bark[200], marginBottom: 16 },
  codeDivider: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginBottom: 12 },
  codeText: { fontFamily: fonts.display, fontSize: 32, color: colors.eucalyptus[400], letterSpacing: 6, marginBottom: 12 },
  codeExpiry: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600] },
  codeExpiryUrgent: { color: colors.redearth[400] },
  generateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.eucalyptus[400], borderRadius: 12, padding: 14,
    marginBottom: 8,
  },
  generateButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 15 },
  devicesSectionTitle: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.bark[200],
  },
  deviceName: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  deviceMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: colors.white, borderRadius: 16, padding: 24, width: '85%', alignItems: 'center',
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.bark[700], marginBottom: 4 },
  modalSubtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginBottom: 20 },
  closeButton: { paddingVertical: 10, paddingHorizontal: 24, marginTop: 8 },
  closeButtonText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400], fontWeight: '600' },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: {
    height: 100, backgroundColor: colors.bark[200], borderRadius: 12, marginBottom: 12,
  },
});
