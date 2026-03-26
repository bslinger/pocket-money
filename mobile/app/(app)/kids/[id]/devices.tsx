import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { formatDistanceToNow } from 'date-fns';
import type { SpenderDevice } from '@quiddo/shared';

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

export default function SpenderDevicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [linkCode, setLinkCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const { secondsLeft, display: countdown } = useCountdown(linkCode?.expires_at ?? null);

  // Clear expired code
  useEffect(() => {
    if (linkCode && secondsLeft <= 0) {
      setLinkCode(null);
    }
  }, [secondsLeft, linkCode]);

  const [refreshing, setRefreshing] = useState(false);

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['spender-devices', id],
    queryFn: async () => {
      const res = await api.get(`/spenders/${id}/devices`);
      return res.data.data as SpenderDevice[];
    },
    enabled: !!id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/spenders/${id}/link-code`);
      setLinkCode(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to generate link code');
    } finally {
      setGenerating(false);
    }
  };

  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await api.delete(`/spender-devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spender-devices', id] });
    },
  });

  const handleRevoke = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Revoke device',
      `Remove ${deviceName || 'this device'}? They will need a new link code to reconnect.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: () => revokeMutation.mutate(deviceId) },
      ],
    );
  };

  const qrValue = linkCode ? `quiddo://link?code=${linkCode.code}` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.eucalyptus[400]} />}>
      <Text style={styles.description}>
        Link a child's device so they can view their accounts and mark chores complete. No email needed.
      </Text>

      {/* Link Code with QR */}
      {linkCode && secondsLeft > 0 ? (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Scan this QR code or enter the code below</Text>

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
          <Feather name="smartphone" size={18} color={colors.white} />
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : 'Generate Link Code'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Device List */}
      {devices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Devices</Text>
          {devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <Feather name="smartphone" size={18} color={colors.bark[600]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.deviceName}>{device.device_name || 'Unnamed device'}</Text>
                {device.last_active_at && (
                  <Text style={styles.deviceMeta}>
                    Active {formatDistanceToNow(new Date(device.last_active_at), { addSuffix: true })}
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

      {devices.length === 0 && !linkCode && (
        <Text style={styles.emptyText}>No devices linked yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  description: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginBottom: 16 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  generateButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
  section: { marginTop: 8 },
  sectionTitle: { fontFamily: fonts.body, fontSize: 11, color: colors.bark[600], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  deviceName: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  deviceMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 2 },
  emptyText: { fontFamily: fonts.body, color: colors.bark[600], fontSize: 14, textAlign: 'center', padding: 24 },
});
