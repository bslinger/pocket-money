import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { formatDistanceToNow } from 'date-fns';
import type { SpenderDevice } from '@quiddo/shared';

export default function SpenderDevicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [linkCode, setLinkCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['spender-devices', id],
    queryFn: async () => {
      const res = await api.get(`/spenders/${id}/devices`);
      return res.data.data as SpenderDevice[];
    },
    enabled: !!id,
  });

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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Link a child's device so they can view their accounts and mark chores complete — no email needed.
        </Text>

        {/* Generate Link Code */}
        {linkCode ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Enter this code on the child's device</Text>
            <Text style={styles.codeText}>{linkCode.code}</Text>
            <Text style={styles.codeExpiry}>Expires in 10 minutes</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16 },
  description: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginBottom: 16 },
  codeCard: {
    backgroundColor: colors.eucalyptus[400] + '10',
    borderWidth: 2,
    borderColor: colors.eucalyptus[400] + '30',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], marginBottom: 8 },
  codeText: { fontFamily: fonts.display, fontSize: 36, color: colors.eucalyptus[400], letterSpacing: 6 },
  codeExpiry: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 8 },
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
