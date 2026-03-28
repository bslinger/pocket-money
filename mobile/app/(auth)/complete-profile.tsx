import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function CompleteProfileScreen() {
  const { pendingSocialLogin, completeSocialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const firstName = pendingSocialLogin?.providerName?.split(' ')[0] ?? null;

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await completeSocialLogin(email.trim());
    } catch (e: any) {
      const msg = e.response?.data?.errors?.email?.[0]
        ?? e.response?.data?.message
        ?? 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.heading}>
          One more step{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.body}>
          We couldn't get your email from your social account. Please enter it to finish signing in.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.bark[400]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontFamily: fonts.display, fontSize: 40, color: colors.eucalyptus[400], textAlign: 'center', marginBottom: 32 },
  heading: { fontFamily: fonts.bodyMedium, fontSize: 20, color: colors.bark[700], marginBottom: 8 },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], marginBottom: 24, lineHeight: 20 },
  error: { fontFamily: fonts.body, color: colors.redearth[400], marginBottom: 12, fontSize: 14 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 8,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
});
