import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function EditKidRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace({ pathname: '/(app)/(tabs)/kids/[id]', params: { id, tab: 'manage' } });
    }
  }, [id]);

  return null;
}
