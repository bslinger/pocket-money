import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FamilyProvider } from '@/lib/family';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading } = useAuth();

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
