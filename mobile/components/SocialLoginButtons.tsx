import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function SocialLoginButtons({ verb = 'Continue' }: { verb?: string }) {
  const { socialLogin } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading('google');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      await socialLogin({ provider: 'google', token: tokens.idToken, deviceName: Platform.OS });
    } catch (e: any) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        const msg = e.response?.status === 429 ? 'Too many attempts. Please wait a moment and try again.' : 'Something went wrong. Please try again.';
        Alert.alert('Google Sign In', msg);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    setLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await socialLogin({
        provider: 'apple',
        token: credential.identityToken!,
        deviceName: Platform.OS,
        firstName: credential.fullName?.givenName ?? undefined,
        lastName: credential.fullName?.familyName ?? undefined,
      });
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        const msg = e.response?.status === 429 ? 'Too many attempts. Please wait a moment and try again.' : 'Something went wrong. Please try again.';
        Alert.alert('Apple Sign In', msg);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.google]} onPress={handleGoogle} disabled={!!loading}>
        <View style={styles.buttonInner}>
          {loading !== 'google' && (
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <Path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <Path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </Svg>
          )}
          <Text style={styles.googleText}>{loading === 'google' ? 'Signing in...' : `${verb} with Google`}</Text>
        </View>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity style={[styles.button, styles.apple]} onPress={handleApple} disabled={!!loading}>
          <Text style={styles.appleText}>{loading === 'apple' ? 'Signing in...' : `${verb} with Apple`}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with email</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginBottom: 8 },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  google: { backgroundColor: colors.white, borderColor: colors.bark[200] },
  apple: { backgroundColor: '#000000' },
  googleText: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  appleText: { fontFamily: fonts.body, fontSize: 15, color: colors.white },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.bark[200] },
  dividerText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
});
