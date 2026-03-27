import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { api } from '@/lib/api';
import { useFamily } from '@/lib/family';
import { getEcho } from '@/lib/echo';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { format } from 'date-fns';
import type { FamilyScreenDevice } from '@quiddo/shared';

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

export default function FamilyScreenSetupScreen() {
  const { activeFamily } = useFamily();
  const queryClient = useQueryClient();
  const [linkCode, setLinkCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { secondsLeft, display: countdown } = useCountdown(linkCode?.expires_at ?? null);

  useEffect(() => {
    if (linkCode && secondsLeft <= 0) {
      setLinkCode(null);
    }
  }, [secondsLeft, linkCode]);

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['family-screen-devices', activeFamily?.id],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily!.id}/family-screen-devices`);
      return res.data.data as FamilyScreenDevice[];
    },
    enabled: !!activeFamily?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Live updates via Echo — refresh device list when another device connects or is removed
  useEffect(() => {
    if (!activeFamily?.id) return;
    const echo = getEcho(false);
    const channel = echo.private(`family.${activeFamily.id}`);
    channel.listen('.FamilyUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['family-screen-devices', activeFamily.id] });
    });
    return () => {
      echo.leave(`private-family.${activeFamily.id}`);
    };
  }, [activeFamily?.id]);

  const generateCode = async () => {
    if (!activeFamily) return;
    setGenerating(true);
    try {
      const res = await api.post(`/families/${activeFamily.id}/family-screen-link-code`);
      setLinkCode(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to generate link code');
    } finally {
      setGenerating(false);
    }
  };

  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await api.delete(`/family-screen-devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-screen-devices', activeFamily?.id] });
    },
  });

  const handleRevoke = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Remove family screen',
      `Remove ${deviceName || 'this device'} as a family screen?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => revokeMutation.mutate(deviceId) },
      ],
    );
  };

  const qrValue = linkCode ? `quiddo://link?code=${linkCode.code}` : '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.eucalyptus[400]} />}
    >
      <Text style={styles.description}>
        Link a tablet or shared device as a family screen. It shows all kids' chores for today, savings goals, and balances — and lets kids mark chores done without logging in.
      </Text>

      {/* Link Code with QR */}
      {linkCode && secondsLeft > 0 ? (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Scan this QR code or enter the code on the other device</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={180}
              color={colors.bark[700]}
              backgroundColor={colors.white}
            />
          </View>

          <Text style={styles.codeDivider}>or enter manually</Text>
          <Text style={styles.codeText}>{linkCode.code}</Text>

          <Text style={[styles.codeExpiry, secondsLeft < 60 && styles.codeExpiryUrgent]}>
            Expires in {countdown}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateCode}
          disabled={generating}
        >
          <Feather name="monitor" size={18} color={colors.white} />
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : 'Generate Link Code'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Device List */}
      {!isLoading && devices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active family screens</Text>
          {devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <Feather name="monitor" size={18} color={colors.bark[600]} />
              <View style={styles.deviceInfo}>
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
                onPress={() => handleRevoke(device.id, device.device_name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="trash-2" size={18} color={colors.redearth[400]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!isLoading && devices.length === 0 && !linkCode && (
        <Text style={styles.emptyText}>No family screens linked yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  description: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginBottom: 16, lineHeight: 20 },

  codeCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.eucalyptus[400] + '30',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginBottom: 16, textAlign: 'center' },
  qrContainer: {
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bark[200],
    marginBottom: 16,
  },
  codeDivider: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginBottom: 12 },
  codeText: { fontFamily: fonts.display, fontSize: 36, color: colors.eucalyptus[400], letterSpacing: 6, marginBottom: 12 },
  codeExpiry: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600] },
  codeExpiryUrgent: { color: colors.redearth[400] },

  generateButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  generateButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16, fontWeight: '600' },

  section: { marginTop: 8 },
  sectionTitle: { fontFamily: fonts.body, fontSize: 12, fontWeight: '600', color: colors.bark[600], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  deviceCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  deviceInfo: { flex: 1, marginLeft: 12 },
  deviceName: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700], fontWeight: '500' },
  deviceMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[500], marginTop: 2 },

  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[400], textAlign: 'center', marginTop: 24 },
});
