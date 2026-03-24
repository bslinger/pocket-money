import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.eucalyptus[400],
        tabBarInactiveTintColor: colors.bark[600],
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.bark[200],
        },
        headerStyle: { backgroundColor: colors.bark[100] },
        headerTintColor: colors.bark[700],
        headerTitleStyle: { fontFamily: fonts.display, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Feather name="layout" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kids/index"
        options={{
          title: 'Kids',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kids/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="chores/index"
        options={{
          title: 'Chores',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="check-square" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chores/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Goals',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="target" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pocket-money/index"
        options={{
          title: 'Pocket Money',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
