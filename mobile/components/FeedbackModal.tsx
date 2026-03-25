import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

const FEEDBACK_TYPES = ['Bug Report', 'Feature Request', 'General Feedback'] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: Props) {
  const [type, setType] = useState<FeedbackType>('General Feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        type,
        title: title.trim(),
        description: description.trim(),
        platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
        app_version: appVersion,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
        setType('General Feedback');
        onClose();
      }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {submitted ? (
            <View style={styles.thankYou}>
              <Feather name="check-circle" size={48} color={colors.gumleaf[400]} />
              <Text style={styles.thankYouTitle}>Thank you!</Text>
              <Text style={styles.thankYouSub}>We read every submission.</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Send Feedback</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="x" size={22} color={colors.bark[600]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {FEEDBACK_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, type === t && styles.typeChipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Brief summary"
                placeholderTextColor={colors.bark[600]}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us more..."
                placeholderTextColor={colors.bark[600]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitButton, (!title.trim() || !description.trim()) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting || !title.trim() || !description.trim()}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.bark[700] },
  label: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700], marginTop: 12, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  typeChipActive: { borderColor: colors.eucalyptus[400], backgroundColor: colors.eucalyptus[400] },
  typeChipText: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[700] },
  typeChipTextActive: { color: colors.white },
  input: {
    fontFamily: fonts.body,
    backgroundColor: colors.bark[100],
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.bark[700],
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  thankYou: { alignItems: 'center', paddingVertical: 40 },
  thankYouTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.bark[700], marginTop: 16 },
  thankYouSub: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginTop: 4 },
});
