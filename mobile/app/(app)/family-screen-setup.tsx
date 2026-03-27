import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useFamily } from '@/lib/family';

export default function FamilyScreenSetupRedirect() {
  const { activeFamily } = useFamily();
  const router = useRouter();

  useEffect(() => {
    if (activeFamily?.id) {
      router.replace(`/(app)/family/${activeFamily.id}`);
    }
  }, [activeFamily?.id]);

  return null;
}
