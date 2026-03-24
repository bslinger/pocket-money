import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_FAMILY_KEY = 'active_family_id';

export async function getActiveFamilyId(): Promise<string | undefined> {
  const val = await AsyncStorage.getItem(ACTIVE_FAMILY_KEY);
  return val ?? undefined;
}

export async function setActiveFamilyId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_FAMILY_KEY, id);
}

export async function clearActiveFamilyId(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_FAMILY_KEY);
}
