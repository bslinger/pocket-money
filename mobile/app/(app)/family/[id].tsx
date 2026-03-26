import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, RefreshControl, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import type { Family, ApiResponse } from '@quiddo/shared';

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [linkCode, setLinkCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const { data: family, isLoading, refetch } = useQuery({
    queryKey: ['family', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Family>>(`/families/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // The invite endpoint is part of the web app's family management
      // For the mobile app, we use the family update endpoint approach
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

  const generateLinkCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await api.post(`/families/${id}/link-code`);
      setLinkCode(res.data.data);
      setQrModalVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to generate code');
    } finally {
      setGeneratingCode(false);
    }
  };

  // Countdown for code expiry
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!linkCode) return;
    const calc = () => Math.max(0, Math.floor((new Date(linkCode.expires_at).getTime() - Date.now()) / 1000));
    setSecondsLeft(calc());
    const interval = setInterval(() => {
      const s = calc();
      setSecondsLeft(s);
      if (s <= 0) {
        setLinkCode(null);
        setQrModalVisible(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [linkCode]);

  if (isLoading || !family) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonText, { width: '50%', height: 28, margin: 16 }]} />
        <View style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
        <View style={[styles.skeletonCard, { marginHorizontal: 16 }]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.eucalyptus[400]} />}>
      {/* Family Header */}
      <View style={styles.header}>
        <View style={styles.familyIcon}>
          <Text style={styles.familyIconText}>{family.name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.familyName}>{family.name}</Text>
        <Text style={styles.familyMeta}>
          Currency: {family.currency_symbol} {family.currency_name}
        </Text>
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

      {/* Invite */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite a Parent</Text>
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
          onPress={generateLinkCode}
          disabled={generatingCode}
        >
          <Feather name="maximize" size={18} color={colors.eucalyptus[400]} />
          <Text style={styles.qrButtonText}>
            {generatingCode ? 'Generating...' : 'Share QR Code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <Modal visible={qrModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan to Join Family</Text>
            <Text style={styles.modalSubtitle}>{family.name}</Text>

            {linkCode && (
              <>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={`quiddo://join-family?code=${linkCode.code}`}
                    size={200}
                    color={colors.bark[700]}
                    backgroundColor={colors.white}
                  />
                </View>
                <Text style={styles.codeText}>{linkCode.code}</Text>
                <Text style={styles.expiryText}>
                  Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQrModalVisible(false)}
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
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  familyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.eucalyptus[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyIconText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  familyName: { fontSize: 22, fontWeight: '700', color: colors.bark[700], marginTop: 12 },
  familyMeta: { fontSize: 14, color: colors.bark[600], marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.bark[700], marginBottom: 12 },
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
    backgroundColor: colors.eucalyptus[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  memberInfo: { marginLeft: 10, flex: 1 },
  memberName: { fontSize: 15, fontWeight: '500', color: colors.bark[700] },
  memberEmail: { fontSize: 12, color: colors.bark[600], marginTop: 1 },
  roleBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bark[200],
  },
  roleBadgeAdmin: { backgroundColor: colors.eucalyptus[400] },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: colors.bark[700], textTransform: 'uppercase' },
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
  spenderName: { marginLeft: 10, fontSize: 15, fontWeight: '500', color: colors.bark[700] },
  inviteRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  inviteButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  inviteButtonDisabled: { opacity: 0.5 },
  inviteButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  mutedText: { fontSize: 14, color: colors.bark[600] },
  // Or divider
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.bark[200] },
  orText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
  // QR button
  qrButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.eucalyptus[400],
    borderRadius: 8, paddingVertical: 12,
  },
  qrButtonText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400], fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: colors.white, borderRadius: 16, padding: 24, width: '85%',
    alignItems: 'center',
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.bark[700], marginBottom: 4 },
  modalSubtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginBottom: 20 },
  qrContainer: { padding: 16, backgroundColor: colors.white, borderRadius: 12, marginBottom: 16 },
  codeText: { fontFamily: fonts.display, fontSize: 28, letterSpacing: 4, color: colors.bark[700], marginBottom: 8 },
  expiryText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginBottom: 20 },
  closeButton: { paddingVertical: 10, paddingHorizontal: 24 },
  closeButtonText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400], fontWeight: '600' },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: {
    height: 100,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 12,
  },
});
