import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { useAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';

export default function TabLayout() {
  const { isChildDevice } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: isChildDevice ? colors.nightsky[900] : colors.bark[100] }}>
      {!isChildDevice && <AppHeader />}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.eucalyptus[400],
          tabBarInactiveTintColor: colors.bark[600],
          tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11 },
          tabBarStyle: isChildDevice
            ? { display: 'none' }
            : {
                backgroundColor: colors.white,
                borderTopColor: colors.bark[200],
              },
          headerShown: false,
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
            tabBarIcon: ({ color, size }) => <Feather name="target" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="pocket-money/index"
          options={{
            title: 'Pocket Money',
            tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
