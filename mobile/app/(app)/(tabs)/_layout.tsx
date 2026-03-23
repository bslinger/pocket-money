import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CheckSquare, Target, Coins } from 'lucide-react-native';
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
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kids"
        options={{
          title: 'Kids',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          title: 'Chores',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pocket-money"
        options={{
          title: 'Pocket Money',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Coins size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
