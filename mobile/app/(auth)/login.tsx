import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/lib/auth';
import PasswordField from '@/components/PasswordField';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function LoginScreen() {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(authError ?? '');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password, Platform.OS);
    } catch (e: any) {
      console.error('Login error:', e.response?.status, JSON.stringify(e.response?.data ?? e.message));
      if (e.response?.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(e.response?.data?.message ?? e.message ?? 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.subtitle}>Family pocket money, sorted.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <SocialLoginButtons />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.bark[600]}
        />
        <PasswordField
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={colors.bark[600]}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/forgot-password" style={styles.link}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Link>

        <Link href="/(auth)/register" style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </Link>

        <Link href="/(auth)/enter-code" style={styles.link}>
          <Text style={styles.linkText}>Have a code? Enter it here</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontFamily: fonts.display, fontSize: 40, color: colors.eucalyptus[400], textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.bark[600], textAlign: 'center', marginBottom: 32 },
  error: { fontFamily: fonts.body, color: colors.redearth[400], textAlign: 'center', marginBottom: 16 },
  input: {
    fontFamily: fonts.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { fontFamily: fonts.body, color: colors.eucalyptus[400], fontSize: 14 },
});
