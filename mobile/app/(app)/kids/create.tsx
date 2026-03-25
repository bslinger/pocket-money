import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { useFamily } from '@/lib/family';
import { SPENDER_COLORS } from '@quiddo/shared';

export default function CreateKidScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFamily } = useFamily();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(SPENDER_COLORS[0]);
  const [avatarKey, setAvatarKey] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Custom currency
  const [overrideCurrency, setOverrideCurrency] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('⭐');
  const [currencyName, setCurrencyName] = useState('Star');
  const [currencyNamePlural, setCurrencyNamePlural] = useState('Stars');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAvatarPreview(asset.uri);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'avatar.jpg',
        } as any);
        const res = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAvatarKey(res.data.key);
      } catch {
        Alert.alert('Upload failed', 'Could not upload the photo.');
        setAvatarPreview(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeFamily?.id) {
        throw new Error('No active family');
      }
      const payload: Record<string, unknown> = {
        name,
        color: selectedColor,
        family_id: activeFamily.id,
      };
      if (avatarKey) payload.avatar_key = avatarKey;
      if (overrideCurrency) {
        payload.currency_symbol = currencySymbol;
        payload.currency_name = currencyName;
        payload.currency_name_plural = currencyNamePlural;
      }
      return api.post('/spenders', payload);
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to add kid');
    },
  });

  const isValid = name.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Preview */}
      <View style={styles.preview}>
        {avatarPreview ? (
          <Image source={{ uri: avatarPreview }} style={styles.previewAvatarImg} />
        ) : (
          <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewAvatarText}>
              {name.trim().length > 0 ? name[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <Text style={styles.previewName}>{name.trim() || 'Kid name'}</Text>
      </View>

      {/* Photo */}
      <Text style={styles.label}>Photo <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickPhoto('camera')}>
          <Feather name="camera" size={18} color={colors.eucalyptus[400]} />
          <Text style={styles.photoButtonText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickPhoto('gallery')}>
          <Feather name="image" size={18} color={colors.eucalyptus[400]} />
          <Text style={styles.photoButtonText}>Gallery</Text>
        </TouchableOpacity>
        {avatarPreview && (
          <TouchableOpacity onPress={() => { setAvatarPreview(null); setAvatarKey(''); }}>
            <Feather name="x-circle" size={20} color={colors.redearth[400]} />
          </TouchableOpacity>
        )}
      </View>
      {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter kid's name"
        placeholderTextColor={colors.bark[600]}
        autoFocus
      />

      {/* Color Picker */}
      <Text style={styles.label}>Colour</Text>
      <View style={styles.colorGrid}>
        {SPENDER_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.colorSwatchSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <Feather name="check" size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Currency Toggle */}
      <Text style={styles.label}>Custom Currency</Text>
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setOverrideCurrency(!overrideCurrency)}
      >
        <View style={[styles.toggleDot, overrideCurrency && styles.toggleDotActive]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, overrideCurrency && styles.toggleLabelActive]}>
            {overrideCurrency ? 'Yes — this kid uses a custom currency' : 'No — uses family default'}
          </Text>
          {activeFamily && !overrideCurrency && (
            <Text style={styles.toggleHint}>
              Currently: {activeFamily.currency_symbol ?? '$'} {activeFamily.currency_name ?? 'Dollar'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {overrideCurrency && (
        <View style={styles.currencySection}>
          <Text style={styles.subLabel}>Emoji</Text>
          <TouchableOpacity style={styles.emojiButton} onPress={() => setEmojiPickerOpen(true)}>
            <Text style={styles.emojiButtonText}>{currencySymbol}</Text>
          </TouchableOpacity>
          <EmojiPicker
            open={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            onEmojiSelected={(emojiObject: EmojiType) => {
              setCurrencySymbol(emojiObject.emoji);
              const words = (emojiObject.name ?? '').split(' ');
              const guessed = (words[words.length - 1] ?? '').charAt(0).toUpperCase() + (words[words.length - 1] ?? '').slice(1);
              if (guessed) {
                setCurrencyName(guessed);
                setCurrencyNamePlural(guessed.endsWith('s') ? guessed : guessed + 's');
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

          {currencySymbol && currencyName && (
            <Text style={styles.previewCurrency}>
              Preview: {currencySymbol}1 {currencyName} · {currencySymbol}25 {currencyNamePlural}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending || uploading}
      >
        <Text style={styles.createButtonText}>
          {createMutation.isPending ? 'Adding...' : 'Add Kid'}
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
  // Preview
  preview: { alignItems: 'center', marginVertical: 24 },
  previewAvatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  previewAvatarImg: { width: 80, height: 80, borderRadius: 40 },
  previewAvatarText: { fontFamily: fonts.display, color: colors.white, fontSize: 32, fontWeight: '700' },
  previewName: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.bark[700], marginTop: 12 },
  // Photo
  photoButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200],
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
  },
  photoButtonText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400] },
  uploadingText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 4 },
  // Color
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.bark[700] },
  // Currency toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8, padding: 14,
  },
  toggleDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bark[200] },
  toggleDotActive: { backgroundColor: colors.eucalyptus[400] },
  toggleLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  toggleLabelActive: { color: colors.eucalyptus[400], fontWeight: '600' },
  toggleHint: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 2 },
  // Currency section
  currencySection: { marginTop: 12 },
  emojiButton: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1,
    borderColor: colors.bark[200], backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiButtonText: { fontSize: 28 },
  nameFields: { flexDirection: 'row', gap: 8, marginTop: 12 },
  previewCurrency: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 8 },
  // Submit
  createButton: {
    backgroundColor: colors.eucalyptus[400], borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 32,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
});
