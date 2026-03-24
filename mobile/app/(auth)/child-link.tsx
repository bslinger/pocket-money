import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function ChildLinkScreen() {
  const { childLogin } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Please enter a 6-character code');
      return;
    }
    setLoading(true);
    try {
      await childLogin(code.toUpperCase(), Platform.OS);
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message ?? 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.title}>Link your device</Text>
        <Text style={styles.subtitle}>
          Ask your parent for a 6-character code to connect your device.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.codeInput}
          placeholder="ABC123"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          maxLength={6}
          placeholderTextColor={colors.bark[600]}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, code.length !== 6 && styles.buttonDisabled]}
          onPress={handleLink}
          disabled={loading || code.length !== 6}
        >
          <Text style={styles.buttonText}>{loading ? 'Linking...' : 'Link Device'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>I have an account — sign in instead</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.nightsky[900] },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontFamily: fonts.display, fontSize: 40, color: colors.eucalyptus[400], textAlign: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], textAlign: 'center', marginBottom: 32 },
  error: { fontFamily: fonts.body, color: colors.redearth[400], textAlign: 'center', marginBottom: 16 },
  codeInput: {
    fontFamily: fonts.display,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: colors.eucalyptus[400],
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    color: colors.white,
    letterSpacing: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { fontFamily: fonts.body, color: colors.eucalyptus[400], fontSize: 14 },
});
