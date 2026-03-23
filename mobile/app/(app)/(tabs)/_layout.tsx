import { Tabs } from 'expo-router';
import { colors } from '@/lib/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.eucalyptus[400],
        tabBarInactiveTintColor: colors.bark[600],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.bark[200],
        },
        headerStyle: { backgroundColor: colors.bark[100] },
        headerTintColor: colors.bark[700],
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          // TODO: Add icon
        }}
      />
      <Tabs.Screen
        name="kids"
        options={{
          title: 'Kids',
          headerShown: false,
          // TODO: Add icon
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          title: 'Chores',
          headerShown: false,
          // TODO: Add icon
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          headerShown: false,
          // TODO: Add icon
        }}
      />
      <Tabs.Screen
        name="pocket-money"
        options={{
          title: 'Pocket Money',
          headerShown: false,
          // TODO: Add icon
        }}
      />
    </Tabs>
  );
}
