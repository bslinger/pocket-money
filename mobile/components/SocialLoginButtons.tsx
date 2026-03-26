import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
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

  const handleFacebook = async () => {
    setLoading('facebook');
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) return;

      const data = await AccessToken.getCurrentAccessToken();
      if (!data) throw new Error('No access token');

      await socialLogin({ provider: 'facebook', token: data.accessToken, deviceName: Platform.OS });
    } catch (e: any) {
      const msg = e.response?.status === 429 ? 'Too many attempts. Please wait a moment and try again.' : 'Something went wrong. Please try again.';
      Alert.alert('Facebook Sign In', msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.google]} onPress={handleGoogle} disabled={!!loading}>
        <Text style={styles.googleText}>{loading === 'google' ? 'Signing in...' : `${verb} with Google`}</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity style={[styles.button, styles.apple]} onPress={handleApple} disabled={!!loading}>
          <Text style={styles.appleText}>{loading === 'apple' ? 'Signing in...' : `${verb} with Apple`}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, styles.facebook]} onPress={handleFacebook} disabled={!!loading}>
        <Text style={styles.facebookText}>{loading === 'facebook' ? 'Signing in...' : `${verb} with Facebook`}</Text>
      </TouchableOpacity>

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
  google: { backgroundColor: colors.white, borderColor: colors.bark[200] },
  apple: { backgroundColor: '#000000' },
  facebook: { backgroundColor: '#1877F2' },
  googleText: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[700] },
  appleText: { fontFamily: fonts.body, fontSize: 15, color: colors.white },
  facebookText: { fontFamily: fonts.body, fontSize: 15, color: colors.white },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.bark[200] },
  dividerText: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600] },
});
