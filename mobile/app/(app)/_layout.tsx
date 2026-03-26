import { Stack } from 'expo-router';
import { colors } from '@/lib/colors';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bark[100] },
        headerTintColor: colors.bark[700],
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bark[100] },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="accounts/[id]" options={{ title: 'Account' }} />
      <Stack.Screen name="accounts/create" options={{ title: 'New Account', presentation: 'modal' }} />
      <Stack.Screen name="transactions/create" options={{ title: 'Add Transaction', presentation: 'modal' }} />
      <Stack.Screen name="transactions/transfer" options={{ title: 'Transfer', presentation: 'modal' }} />
      <Stack.Screen name="goals/[id]" options={{ title: 'Goal' }} />
      <Stack.Screen name="goals/create" options={{ title: 'New Goal', presentation: 'modal' }} />
      <Stack.Screen name="chores/create" options={{ title: 'New Chore', presentation: 'modal' }} />
      <Stack.Screen name="kids/create" options={{ title: 'Add Kid', presentation: 'modal' }} />
      <Stack.Screen name="kids/[id]/edit" options={{ title: 'Edit Kid' }} />
      <Stack.Screen name="kids/[id]/devices" options={{ title: 'Linked Devices' }} />
      <Stack.Screen name="family/index" options={{ title: 'Family' }} />
      <Stack.Screen name="family/[id]" options={{ title: 'Family Details' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen name="billing" options={{ title: 'Billing' }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/continue" options={{ headerShown: false }} />
    </Stack>
  );
}
