import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, passwordConfirmation, Platform.OS);
    } catch (e: any) {
      const errors = e.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join('\n'));
      } else {
        setError(e.response?.data?.message ?? 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} placeholderTextColor={colors.bark[600]} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.bark[600]} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.bark[600]} />
        <TextInput style={styles.input} placeholder="Confirm Password" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry placeholderTextColor={colors.bark[600]} />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo: { fontFamily: fonts.display, fontSize: 40, fontWeight: '700', color: colors.eucalyptus[400], textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.bark[600], textAlign: 'center', marginBottom: 32 },
  error: { fontFamily: fonts.body, color: colors.redearth[400], textAlign: 'center', marginBottom: 16 },
  input: { fontFamily: fonts.body, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bark[200], borderRadius: 8, padding: 14, fontSize: 16, color: colors.bark[700], marginBottom: 12 },
  button: { backgroundColor: colors.eucalyptus[400], borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { fontFamily: fonts.body, color: colors.eucalyptus[400], fontSize: 14 },
});
