import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setStatus('');
    setLoading(true);
    try {
      // Uses the web route since password reset is email-based
      await api.post('/forgot-password', { email });
      setStatus('Password reset link sent to your email.');
    } catch (e: any) {
      const msg = e.response?.data?.message ?? e.response?.data?.errors?.email?.[0] ?? 'Failed to send reset link';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {status ? <Text style={styles.success}>{status}</Text> : null}

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.bark[600]} />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Back to login</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.bark[700], textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.bark[600], textAlign: 'center', marginBottom: 24 },
  error: { color: colors.redearth[400], textAlign: 'center', marginBottom: 16 },
  success: { color: colors.gumleaf[400], textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8, padding: 14, fontSize: 16, color: colors.bark[700], marginBottom: 12 },
  button: { backgroundColor: colors.eucalyptus[400], borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.eucalyptus[400], fontSize: 14 },
});
