import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

export const storage: MMKV = createMMKV({ id: 'quiddo-storage' });

const ACTIVE_FAMILY_KEY = 'active_family_id';

export function getActiveFamilyId(): string | undefined {
  return storage.getString(ACTIVE_FAMILY_KEY);
}

export function setActiveFamilyId(id: string): void {
  storage.set(ACTIVE_FAMILY_KEY, id);
}

export function clearActiveFamilyId(): void {
  storage.remove(ACTIVE_FAMILY_KEY);
}
