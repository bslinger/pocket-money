import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Family {
  id: string;
  name: string;
}

export default function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const res = await api.get('/families');
      return res.data.data as Family[];
    },
  });

  // TODO: track active family in state/storage
  const activeFamily = families?.[0];

  async function switchFamily(familyId: string) {
    await api.post(`/families/${familyId}/switch`);
    queryClient.invalidateQueries();
    setMenuOpen(false);
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.logo}>Quiddo</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setMenuOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="user" size={20} color={colors.bark[600]} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.overlayLeft} onPress={() => setMenuOpen(false)} />
          <View style={[styles.panel, { paddingTop: insets.top + 16 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* User info */}
              <View style={styles.section}>
                <Text style={styles.userName}>{user?.display_name ?? user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>

              {/* Active family */}
              {activeFamily && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Family</Text>
                  <View style={styles.familyCard}>
                    <View style={styles.familyAvatar}>
                      <Text style={styles.familyAvatarText}>{activeFamily.name[0]}</Text>
                    </View>
                    <Text style={styles.familyName}>{activeFamily.name}</Text>
                  </View>
                  <View style={styles.familyActions}>
                    <TouchableOpacity
                      style={styles.familyActionButton}
                      onPress={() => { setMenuOpen(false); router.push('/(app)/family'); }}
                    >
                      <Feather name="settings" size={14} color={colors.bark[600]} />
                      <Text style={styles.familyActionText}>Settings</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Family switcher */}
              {families && families.length > 1 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Switch family</Text>
                  {families.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={styles.menuItem}
                      onPress={() => switchFamily(f.id)}
                    >
                      <View style={[styles.familyDot, { backgroundColor: f.id === activeFamily?.id ? colors.eucalyptus[400] : colors.bark[200] }]} />
                      <Text style={styles.menuItemText}>{f.name}</Text>
                      {f.id === activeFamily?.id && (
                        <Feather name="check" size={16} color={colors.eucalyptus[400]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.divider} />

              {/* Account actions */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/(app)/settings'); }}
              >
                <Feather name="user" size={18} color={colors.bark[600]} />
                <Text style={styles.menuItemText}>Profile settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/(app)/billing'); }}
              >
                <Feather name="credit-card" size={18} color={colors.bark[600]} />
                <Text style={styles.menuItemText}>Billing</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Feather name="log-out" size={18} color={colors.redearth[400]} />
                <Text style={[styles.menuItemText, { color: colors.redearth[400] }]}>Log out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.bark[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.bark[200],
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.eucalyptus[400],
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: 300,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.bark[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  userName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.bark[700],
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bark[600],
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  familyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.eucalyptus[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyAvatarText: {
    fontFamily: fonts.body,
    color: colors.white,
    fontSize: 14,
  },
  familyName: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.bark[700],
  },
  familyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  familyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  familyActionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bark[600],
  },
  familyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.bark[200],
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  menuItemText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.bark[700],
    flex: 1,
  },
});
