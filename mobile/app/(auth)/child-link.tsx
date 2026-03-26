import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

export default function ChildLinkScreen() {
  const { childLogin } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleLink = async (linkCode: string) => {
    setError('');
    const trimmed = linkCode.toUpperCase().trim();
    if (trimmed.length !== 6) {
      setError('Please enter a 6-character code');
      return;
    }
    setLoading(true);
    try {
      await childLogin(trimmed, Platform.OS);
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message ?? 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);

    // QR contains quiddo://link?code=XXXXXX
    const match = data.match(/[?&]code=([A-Za-z0-9]{6})/);
    if (match) {
      const scannedCode = match[1].toUpperCase();
      setCode(scannedCode);
      handleLink(scannedCode);
    } else if (/^[A-Za-z0-9]{6}$/.test(data.trim())) {
      // Plain 6-char code
      const scannedCode = data.trim().toUpperCase();
      setCode(scannedCode);
      handleLink(scannedCode);
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
          <Text style={styles.scannerSubtitle}>Point your camera at the code on your parent's screen</Text>
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
      <View style={styles.inner}>
        <Text style={styles.logo}>Quiddo</Text>
        <Text style={styles.title}>Link your device</Text>
        <Text style={styles.subtitle}>
          Scan the QR code on your parent's screen, or enter the 6-character code.
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
          onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          maxLength={6}
          placeholderTextColor={colors.bark[400]}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, code.length !== 6 && styles.buttonDisabled]}
          onPress={() => handleLink(code)}
          disabled={loading || code.length !== 6}
        >
          <Text style={styles.buttonText}>{loading ? 'Linking...' : 'Link Device'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>I have an account - sign in instead</Text>
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
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bark[600], textAlign: 'center', marginBottom: 24 },
  error: { fontFamily: fonts.body, color: colors.redearth[400], textAlign: 'center', marginBottom: 16 },
  scanButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: { fontFamily: fonts.body, color: colors.white, fontSize: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { fontFamily: fonts.body, color: colors.bark[600], fontSize: 12, marginHorizontal: 12 },
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
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.body, color: colors.white, fontSize: 16 },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { fontFamily: fonts.body, color: colors.eucalyptus[400], fontSize: 14 },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.white, marginBottom: 8 },
  scannerSubtitle: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 32, textAlign: 'center', paddingHorizontal: 40 },
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
