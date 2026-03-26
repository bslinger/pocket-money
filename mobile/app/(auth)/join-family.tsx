import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PasswordField from '@/components/PasswordField';
import { api, setToken } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function JoinFamilyScreen() {
  const { code: prefilledCode } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();

  const [code, setCode] = useState(prefilledCode ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/family-link-codes/claim', {
        code: code.toUpperCase(),
        name,
        email,
        password,
      });

      const { token, family } = res.data.data;
      Alert.alert('Welcome!', `You've joined ${family.name}.`);
      await setToken(token);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to join family';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isValid = code.length === 6 && name.trim() && email.trim() && password.length >= 8;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Join a Family</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character code or scan the QR code shared by a family member.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Invite Code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={colors.bark[400]}
          maxLength={6}
          autoCapitalize="characters"
          autoFocus={!prefilledCode}
        />

        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.bark[400]}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.bark[400]}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <PasswordField
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
        />
        <Text style={styles.hint}>
          Already have an account? Enter your existing email and password.
        </Text>

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleClaim}
          disabled={!isValid || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Family'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  content: { padding: 24, paddingTop: 60 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.bark[700], marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[600], marginBottom: 24 },
  label: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bark[700], marginBottom: 6, marginTop: 16 },
  input: {
    fontFamily: fonts.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.bark[700],
  },
  codeInput: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
  },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 6 },
  error: { fontFamily: fonts.body, fontSize: 14, color: colors.redearth[400], marginBottom: 12 },
  button: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  backLinkText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400] },
});
