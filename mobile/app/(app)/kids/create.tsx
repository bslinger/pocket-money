import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { useFamily } from '@/lib/family';
import { SPENDER_COLORS } from '@quiddo/shared';

export default function CreateKidScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFamily } = useFamily();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(SPENDER_COLORS[0]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeFamily?.id) {
        throw new Error('No active family');
      }
      return api.post('/spenders', {
        name,
        color: selectedColor,
        family_id: activeFamily.id,
      });
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
        <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
          <Text style={styles.previewAvatarText}>
            {name.trim().length > 0 ? name[0].toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.previewName}>{name.trim() || 'Kid name'}</Text>
      </View>

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
              <Text style={styles.colorCheck}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.createButtonDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={!isValid || createMutation.isPending}
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
  content: { padding: 16 },
  preview: { alignItems: 'center', marginVertical: 24 },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: { color: colors.white, fontSize: 32, fontWeight: '700' },
  previewName: { fontSize: 20, fontWeight: '600', color: colors.bark[700], marginTop: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.bark[700],
  },
  colorCheck: { color: colors.white, fontSize: 18, fontWeight: '700' },
  createButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
});
