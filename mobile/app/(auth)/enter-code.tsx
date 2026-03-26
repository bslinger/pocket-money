import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api, setToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PasswordField from '@/components/PasswordField';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

type CodeInfo =
  | { type: 'spender'; spender_name: string; family_name: string }
  | { type: 'family'; family_name: string };

type Step = 'code' | 'looking_up' | 'confirm_spender' | 'join_family';

export default function EnterCodeScreen() {
  const router = useRouter();
  const { childLogin } = useAuth();

  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Family join fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const lookupCode = async (rawCode: string) => {
    const trimmed = rawCode.toUpperCase().trim();
    if (trimmed.length !== 6) {
      return;
    }
    setError('');
    setStep('looking_up');
    try {
      const res = await api.post('/codes/lookup', { code: trimmed });
      const info: CodeInfo = res.data.data;
      setCodeInfo(info);
      setStep(info.type === 'spender' ? 'confirm_spender' : 'join_family');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Invalid or expired code.');
      setStep('code');
    }
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) {
      lookupCode(cleaned);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    const match = data.match(/[?&]code=([A-Za-z0-9]{6})/);
    const scanned = match
      ? match[1].toUpperCase()
      : /^[A-Za-z0-9]{6}$/.test(data.trim())
        ? data.trim().toUpperCase()
        : null;

    if (scanned) {
      setCode(scanned);
      lookupCode(scanned);
    } else {
      setError('Invalid QR code. Please try again or enter the code manually.');
    }
  };

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError('Camera permission is needed to scan QR codes.');
        return;
      }
    }
    setError('');
    setScanning(true);
  };

  const handleConfirmSpender = async () => {
    setLoading(true);
    setError('');
    try {
      await childLogin(code, Platform.OS);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Invalid or expired code.');
      setStep('code');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/family-link-codes/claim', {
        code,
        name,
        email,
        password,
      });
      const { token } = res.data.data;
      await setToken(token);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to join family.');
    } finally {
      setLoading(false);
    }
  };

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerTitle}>Scan the QR code</Text>
          <Text style={styles.scannerSubtitle}>
            Point your camera at the code on the other screen
          </Text>
          <View style={styles.scannerFrame} />
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Step: enter code */}
        {(step === 'code' || step === 'looking_up') && (
          <>
            <Text style={styles.title}>Enter your code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-character code you were given, or scan the QR code.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or enter code</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.codeInput}
              placeholder="ABC123"
              value={code}
              onChangeText={handleCodeChange}
              autoCapitalize="characters"
              maxLength={6}
              placeholderTextColor={colors.bark[600]}
              textAlign="center"
              autoFocus
            />

            {step === 'looking_up' && (
              <ActivityIndicator color={colors.eucalyptus[400]} style={styles.spinner} />
            )}
          </>
        )}

        {/* Step: confirm spender device link */}
        {step === 'confirm_spender' && codeInfo?.type === 'spender' && (
          <>
            <Text style={styles.title}>Link device</Text>
            <Text style={styles.subtitle}>
              This code will link your device to:
            </Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoName}>{codeInfo.spender_name}</Text>
              <Text style={styles.infoFamily}>{codeInfo.family_name}</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleConfirmSpender}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Linking...' : `Link as ${codeInfo.spender_name}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => { setStep('code'); setCode(''); setError(''); }}
            >
              <Text style={styles.backLinkText}>Enter a different code</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step: join family (parent/adult) */}
        {step === 'join_family' && codeInfo?.type === 'family' && (
          <>
            <Text style={styles.title}>Join {codeInfo.family_name}</Text>
            <Text style={styles.subtitle}>
              Create an account or sign in with your existing one.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.bark[600]}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.bark[600]}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <PasswordField
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
            />
            <Text style={styles.hint}>Already have an account? Use your existing email and password.</Text>

            <TouchableOpacity
              style={[styles.button, (!name.trim() || !email.trim() || password.length < 8) && styles.buttonDisabled]}
              onPress={handleJoinFamily}
              disabled={loading || !name.trim() || !email.trim() || password.length < 8}
            >
              <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Family'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => { setStep('code'); setCode(''); setError(''); }}
            >
              <Text style={styles.backLinkText}>Enter a different code</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginLinkText}>Back to sign in</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bark[100] },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.bark[700], marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[600], marginBottom: 24 },
  error: { fontFamily: fonts.body, color: colors.redearth[400], marginBottom: 12 },
  scanButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.bark[200] },
  dividerText: { fontFamily: fonts.body, color: colors.bark[600], fontSize: 12, marginHorizontal: 12 },
  codeInput: {
    fontFamily: fonts.display,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.bark[200],
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    color: colors.bark[700],
    letterSpacing: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  spinner: { marginTop: 16 },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.bark[200],
  },
  infoName: { fontFamily: fonts.display, fontSize: 24, color: colors.bark[700], marginBottom: 4 },
  infoFamily: { fontFamily: fonts.body, fontSize: 15, color: colors.bark[600] },
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
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.bark[600], marginTop: 6 },
  button: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontWeight: '600', fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  backLinkText: { fontFamily: fonts.body, fontSize: 14, color: colors.eucalyptus[400] },
  loginLink: { alignItems: 'center', marginTop: 32 },
  loginLinkText: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600] },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.white, marginBottom: 8 },
  scannerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: colors.eucalyptus[400],
    borderRadius: 16,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
});
