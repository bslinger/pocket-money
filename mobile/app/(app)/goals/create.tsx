import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import SpenderAvatar from '@/components/SpenderAvatar';
import type { Spender, Account, ApiResponse } from '@quiddo/shared';

export default function CreateGoalScreen() {
  const { spenderId: preselectedSpenderId } = useLocalSearchParams<{ spenderId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [spenderId, setSpenderId] = useState(preselectedSpenderId ?? '');
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: spenders, isLoading } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  const selectedSpender = (spenders ?? []).find((s) => s.id === spenderId);
  const accounts = selectedSpender?.accounts ?? [];
  const selectedAccount = accounts.find((a) => a.id === accountId);

  // Determine currency symbol from selected account or family default
  const currencySymbol = selectedAccount?.currency_symbol
    ?? selectedSpender?.currency_symbol
    ?? '$';

  const pickImage = async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImagePreview(asset.uri);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'cover.jpg',
        } as any);

        const res = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImageKey(res.data.key);
      } catch {
        Alert.alert('Upload failed', 'Could not upload the image. Please try again.');
        setImagePreview(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/goals', {
        spender_id: spenderId,
        account_id: accountId || null,
        name,
        target_amount: targetAmount,
        target_date: targetDate || null,
        image_key: imageKey || null,
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
      {/* Child Selection — rich list with avatars */}
      <Text style={styles.label}>Kid</Text>
      <View style={styles.childList}>
        {(spenders ?? []).map((s) => {
          const selected = spenderId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.childChip, selected && styles.childChipActive]}
              onPress={() => {
                setSpenderId(s.id);
                setAccountId('');
              }}
            >
              <SpenderAvatar name={s.name} color={s.color} avatarUrl={s.avatar_url} size={32} />
              <Text style={[styles.childName, selected && styles.childNameActive]}>{s.name}</Text>
              {selected && <Feather name="check-circle" size={18} color={colors.eucalyptus[400]} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account Selection */}
      {spenderId && accounts.length > 0 && (
        <>
          <Text style={styles.label}>Account</Text>
          <View style={styles.accountList}>
            <TouchableOpacity
              style={[styles.accountChip, !accountId && styles.accountChipActive]}
              onPress={() => setAccountId('')}
            >
              <Text style={[styles.accountChipText, !accountId && styles.accountChipTextActive]}>
                Auto (highest priority)
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
                <Text style={[styles.accountChipBalance, accountId === a.id && { color: colors.white }]}>
                  {a.currency_symbol ?? '$'}{parseFloat(a.balance).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Goal Name */}
      <Text style={styles.label}>Goal Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. New Bike, Holiday Fund"
        placeholderTextColor={colors.bark[600]}
      />

      {/* Target Amount — with dynamic currency symbol */}
      <Text style={styles.label}>Target Amount</Text>
      <View style={styles.amountRow}>
        <Text style={styles.dollarSign}>{currencySymbol}</Text>
        <TextInput
          style={styles.amountInput}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.bark[600]}
        />
      </View>

      {/* Cover Photo */}
      <Text style={styles.label}>Cover Photo <Text style={styles.optional}>(optional)</Text></Text>
      {imagePreview ? (
        <View>
          <Image source={{ uri: imagePreview }} style={styles.coverPreview} resizeMode="cover" />
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeCover}
            onPress={() => {
              setImagePreview(null);
              setImageKey('');
            }}
          >
            <Feather name="x" size={16} color={colors.redearth[400]} />
            <Text style={styles.removeCoverText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={() => pickImage('camera')}>
            <Feather name="camera" size={20} color={colors.eucalyptus[400]} />
            <Text style={styles.photoButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={() => pickImage('gallery')}>
            <Feather name="image" size={20} color={colors.eucalyptus[400]} />
            <Text style={styles.photoButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Target Date */}
      <Text style={styles.label}>Target Date <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.dateRow}>
        <Feather name="calendar" size={16} color={colors.bark[600]} />
        <TextInput
          style={styles.dateInput}
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.bark[600]}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending || uploading}
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
  content: { padding: 16, paddingBottom: 40 },
  label: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  optional: { fontWeight: '400', color: colors.bark[600] },
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
  // Account selection
  accountList: { gap: 8 },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  accountChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  accountChipText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[700] },
  accountChipTextActive: { color: colors.white, fontWeight: '600' },
  accountChipBalance: { fontFamily: fonts.display, fontSize: 14, color: colors.bark[600] },
  // Amount
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: colors.wattle[400], marginRight: 6 },
  amountInput: {
    flex: 1,
    fontFamily: fonts.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    color: colors.bark[700],
  },
  // Cover photo
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 10,
    paddingVertical: 14,
  },
  photoButtonText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400] },
  coverPreview: { width: '100%', height: 160, borderRadius: 12 },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600' },
  removeCover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  removeCoverText: { fontFamily: fonts.body, fontSize: 13, color: colors.redearth[400] },
  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  dateInput: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.bark[700], paddingVertical: 14 },
  // Submit
  createButton: {
    backgroundColor: colors.wattle[400],
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
