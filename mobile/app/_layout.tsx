import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FamilyProvider } from '@/lib/family';
import { useNotificationListeners } from '@/lib/notifications';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import { api } from '@/lib/api';
import CatchupModal from '@/components/CatchupModal';
import type { CatchupData } from '@quiddo/shared';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading, isAuthenticated, isChildDevice, isFamilyScreen } = useAuth();
  const [catchupDismissed, setCatchupDismissed] = useState(false);
  useNotificationListeners();

  const isParent = isAuthenticated && !isChildDevice && !isFamilyScreen;

  const { data: catchupData } = useQuery<CatchupData>({
    queryKey: ['catchup'],
    queryFn: async () => {
      const response = await api.get<{ data: CatchupData }>('/catchup');
      return response.data.data;
    },
    enabled: isParent,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.logo}>Quiddo</Text>
        <ActivityIndicator size="small" color={colors.eucalyptus[400]} style={loadingStyles.spinner} />
      </View>
    );
  }

  return (
    <FamilyProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      {catchupData && catchupData.has_events && !catchupDismissed && (
        <CatchupModal
          visible
          catchup={catchupData}
          onDismiss={() => setCatchupDismissed(true)}
        />
      )}
    </FamilyProvider>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bark[100] },
  logo: { fontFamily: fonts.display, fontSize: 40, color: colors.eucalyptus[400], marginBottom: 16 },
  spinner: { marginTop: 8 },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Fraunces': require('@/assets/fonts/Fraunces-Variable.ttf'),
    'Fraunces-Italic': require('@/assets/fonts/Fraunces-Italic-Variable.ttf'),
    'DMSans': require('@/assets/fonts/DMSans-Variable.ttf'),
    'DMSans-Italic': require('@/assets/fonts/DMSans-Italic-Variable.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
