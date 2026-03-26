import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import type { Family, ApiResponse } from '@quiddo/shared';

export default function FamilyListScreen() {
  const router = useRouter();

  const { data: families, isLoading, refetch } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Family[]>>('/families');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonText, { width: '40%', height: 28, margin: 16 }]} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={families ?? []}

        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/family/${item.id}`)}
          >
            <View style={styles.familyIcon}>
              <Text style={styles.familyIconText}>{item.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.familyName}>{item.name}</Text>
              <Text style={styles.familyMeta}>
                {item.currency_symbol} · {(item.spenders ?? []).length} kid{(item.spenders ?? []).length !== 1 ? 's' : ''}
                {item.family_users ? ` · ${item.family_users.length} member${item.family_users.length !== 1 ? 's' : ''}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No families found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  listContent: { padding: 16 },
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
  familyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.eucalyptus[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyIconText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  cardInfo: { marginLeft: 12, flex: 1 },
  familyName: { fontSize: 17, fontWeight: '600', color: colors.bark[700] },
  familyMeta: { fontSize: 13, color: colors.bark[600], marginTop: 3 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.bark[600] },
  // Skeleton
  skeletonText: { backgroundColor: colors.bark[200], borderRadius: 6 },
  skeletonCard: {
    height: 80,
    backgroundColor: colors.bark[200],
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
