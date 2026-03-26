import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import FeedbackModal from '@/components/FeedbackModal';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name ?? '');
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [parentTitle, setParentTitle] = useState(user?.parent_title ?? '');
  const [editingProfile, setEditingProfile] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await api.put('/auth/user', {
        name,
        display_name: displayName || null,
        parent_title: parentTitle || null,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to update profile');
    },
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'A data export will be emailed to you. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              await api.post('/auth/export');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Success', 'Your data export has been queued. Check your email shortly.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message ?? 'Failed to request data export');
            }
          },
        },
      ],
    );
  };

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  const handleDeleteAccount = () => {
    setDeleteConfirmEmail('');
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmEmail.toLowerCase().trim() !== (user?.email ?? '').toLowerCase().trim()) {
      Alert.alert('Email does not match', 'Please enter your email address exactly as shown.');
      return;
    }
    try {
      setDeleteConfirmVisible(false);
      await api.delete('/auth/user');
      await logout();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to delete account');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          {editingProfile ? (
            <>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.bark[400]}
              />
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How kids see you"
                placeholderTextColor={colors.bark[400]}
              />
              <Text style={styles.fieldLabel}>Parent Title</Text>
              <TextInput
                style={styles.input}
                value={parentTitle}
                onChangeText={setParentTitle}
                placeholder="e.g. Mum, Dad, Parent"
                placeholderTextColor={colors.bark[400]}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                >
                  <Text style={styles.saveButtonText}>
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={() => setEditingProfile(false)}
                >
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.profileRow}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name}</Text>
                  {user?.display_name && (
                    <Text style={styles.profileDisplay}>"{user.display_name}"</Text>
                  )}
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditingProfile(true)}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Navigation Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(app)/family/')}>
          <Text style={styles.menuItemText}>Families</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(app)/billing')}>
          <Text style={styles.menuItemText}>Billing & Subscription</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Data & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
          <Text style={styles.menuItemText}>Export My Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
          <Text style={[styles.menuItemText, { color: colors.redearth[400] }]}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Send Feedback */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.feedbackButton} onPress={() => setFeedbackVisible(true)}>
          <Text style={styles.feedbackButtonText}>Send Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Quiddo v1.0.0</Text>

      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />

      {/* Delete account confirmation modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDesc}>
              This is permanent and cannot be undone. All your families, kids, accounts, chores, and goals will be deleted.
            </Text>
            <Text style={styles.modalDesc}>
              Enter your email address to confirm:
            </Text>
            <Text style={styles.modalEmail}>{user?.email}</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmEmail}
              onChangeText={setDeleteConfirmEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.bark[400]}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDelete} onPress={confirmDeleteAccount}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.bark[600], marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.eucalyptus[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  profileInfo: { marginLeft: 14, flex: 1 },
  profileName: { fontSize: 17, fontWeight: '600', color: colors.bark[700] },
  profileDisplay: { fontSize: 13, color: colors.bark[600], marginTop: 2 },
  profileEmail: { fontSize: 13, color: colors.bark[600], marginTop: 2 },
  editProfileButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editProfileText: { color: colors.eucalyptus[400], fontWeight: '600', fontSize: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.bark[700], marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: colors.bark[100],
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.bark[700],
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveButton: {
    flex: 1,
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  cancelEditButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelEditText: { color: colors.bark[600], fontWeight: '600', fontSize: 14 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  menuItemText: { fontSize: 15, color: colors.bark[700] },
  menuChevron: { fontSize: 20, color: colors.bark[600] },
  feedbackButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  feedbackButtonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 15 },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.redearth[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: { color: colors.redearth[400], fontWeight: '600', fontSize: 16 },
  versionText: { textAlign: 'center', color: colors.bark[600], fontSize: 12, marginTop: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.white, borderRadius: 14, padding: 20, gap: 12 },
  modalTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: colors.bark[700] },
  modalDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.bark[600], lineHeight: 19 },
  modalEmail: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.bark[700] },
  modalInput: {
    borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14, color: colors.bark[700],
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8,
    padding: 12, alignItems: 'center',
  },
  modalCancelText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], fontWeight: '600' },
  modalDelete: { flex: 1, backgroundColor: colors.redearth[400], borderRadius: 8, padding: 12, alignItems: 'center' },
  modalDeleteText: { fontFamily: fonts.body, fontSize: 14, color: colors.white, fontWeight: '600' },
});
