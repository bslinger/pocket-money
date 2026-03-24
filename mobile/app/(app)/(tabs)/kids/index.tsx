import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import type { Spender, ApiResponse } from '@quiddo/shared';

export default function KidsListScreen() {
  const router = useRouter();

  const { data: spenders, isLoading, refetch } = useQuery({
    queryKey: ['spenders'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Spender[]>>('/spenders');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={[styles.skeletonText, { width: '30%', height: 28 }]} />
          <View style={[styles.skeletonButton, { width: 90 }]} />
        </View>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  const totalBalance = (spenders ?? []).reduce(
    (sum, s) => sum + (s.accounts ?? []).reduce((a, acc) => a + parseFloat(acc.balance), 0),
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Kids</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(app)/kids/create')}
        >
          <Text style={styles.addButtonText}>+ Add Kid</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={spenders ?? []}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const balance = (item.accounts ?? []).reduce(
            (sum, a) => sum + parseFloat(a.balance),
            0,
          );
          const avatarColor = item.color ?? colors.eucalyptus[400];

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(app)/(tabs)/kids/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardBalance}>${balance.toFixed(2)}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => { e.stopPropagation(); router.push(`/(app)/(tabs)/kids/${item.id}`); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="eye" size={16} color={colors.bark[600]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => { e.stopPropagation(); router.push(`/(app)/kids/${item.id}/edit`); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="edit-2" size={16} color={colors.bark[600]} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No kids yet. Tap "Add Kid" to get started.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100], padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.bark[700] },
  addButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  totalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.bark[200],
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, color: colors.bark[600], marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: '700', color: colors.bark[700] },
  listContent: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '600' },
  cardInfo: { marginLeft: 12, flex: 1 },
  cardName: { fontFamily: fonts.body, fontSize: 16, color: colors.bark[700] },
  cardBalance: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.bark[200],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.bark[600], textAlign: 'center' },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonButton: { backgroundColor: colors.bark[200], borderRadius: 8, height: 36 },
  skeletonCard: {
    height: 80,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginBottom: 8,
  },
});
