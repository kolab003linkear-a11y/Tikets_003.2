import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { validateTicket } from '../api/client';
import { colors, typography } from '../theme';

export default function AdminScannerScreen() {
  const { user, token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [lastResult, setLastResult] = useState<{ status: string; message: string; valid: boolean; event?: string; seat?: string } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [validCount, setValidCount] = useState(0);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SCANNER')) {
      void requestPermission();
    }
  }, [user, requestPermission]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SCANNER')) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Acceso restringido</Text>
          <Text style={styles.body}>Necesitas un rol de administrador o escáner para usar esta pantalla.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission || permission.status === 'undetermined') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Solicitando permiso</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Cámara no disponible</Text>
          <Text style={styles.body}>No se pudo acceder a la cámara del dispositivo.</Text>
          <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}><Ionicons name="camera-outline" size={18} color={colors.background} /><Text style={styles.permissionText}>Intentar de nuevo</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleScan = async ({ data }: { data: string }) => {
    if (!token) {
      Alert.alert('Sesión expirada', 'Inicia sesión otra vez.');
      return;
    }

    setScanning(false);
    setScanCount((count) => count + 1);
    try {
      const response = await validateTicket(token, data);
      if (response.valid) setValidCount((count) => count + 1);
      setLastResult({
        status: response.status,
        message: response.message,
        valid: response.valid,
        event: response.ticket?.event?.title,
        seat: response.ticket?.seatNumber,
      });
      Alert.alert(response.valid ? 'Entrada validada' : 'Resultado de validación', response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo validar el ticket.';
      setLastResult({ status: 'ERROR', message, valid: false });
      Alert.alert('Error', message);
    } finally {
      setScanning(false);
    }
  };

  const scanNext = () => {
    setLastResult(null);
    setScanning(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.overline}>Panel administrativo</Text>
        <Text style={styles.title}>Escáner QR</Text>
        <Text style={styles.subtitle}>Valida entradas de cine y estadio en segundos.</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{scanCount}</Text><Text style={styles.statLabel}>Lecturas</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statValue, styles.statSuccess]}>{validCount}</Text><Text style={styles.statLabel}>Válidas</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>{scanCount - validCount}</Text><Text style={styles.statLabel}>Revisar</Text></View>
        </View>

        <View style={styles.cameraFrame}>
          {scanning ? (
            <>
              <CameraView
                accessibilityLabel="Cámara para escanear el código QR"
                onBarcodeScanned={handleScan}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.scanGuide} pointerEvents="none">
                <View style={[styles.corner, styles.cornerTopLeft]} /><View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} /><View style={[styles.corner, styles.cornerBottomRight]} />
                <View style={styles.scanHint}><Ionicons name="scan-outline" size={18} color={colors.text} /><Text style={styles.scanHintText}>Centra el código QR</Text></View>
              </View>
            </>
          ) : (
            <View style={styles.centeredOverlay}>
              <Ionicons name="checkmark-done-outline" size={34} color={colors.primary} />
              <Text style={styles.scanningText}>Lectura procesada</Text>
            </View>
          )}
        </View>

        {lastResult ? (
          <View style={[styles.resultBox, lastResult.valid ? styles.resultValid : styles.resultInvalid]}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultIcon, lastResult.valid ? styles.resultIconValid : styles.resultIconInvalid]}>
                <Ionicons name={lastResult.valid ? 'checkmark' : 'close'} size={22} color={colors.text} />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultLabel}>Resultado de validación</Text>
                <Text style={[styles.resultStatus, lastResult.valid ? styles.resultStatusValid : styles.resultStatusInvalid]}>{lastResult.valid ? 'VÁLIDA' : lastResult.status === 'ERROR' ? 'ERROR' : 'NO VÁLIDA'}</Text>
              </View>
            </View>
            <Text style={styles.resultValue}>{lastResult.message}</Text>
            {lastResult.event && <Text style={styles.resultDetail}>{lastResult.event}{lastResult.seat ? ` · Localidad ${lastResult.seat}` : ''}</Text>}
            <Pressable accessibilityRole="button" style={styles.nextButton} onPress={scanNext}><Ionicons name="scan-outline" size={18} color={colors.background} /><Text style={styles.nextButtonText}>Escanear siguiente</Text></Pressable>
          </View>
        ) : (
          <View style={styles.waitingBox}><Ionicons name="qr-code-outline" size={21} color={colors.primary} /><View><Text style={styles.waitingTitle}>Listo para validar</Text><Text style={styles.waitingText}>El resultado aparecerá aquí.</Text></View></View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 6, fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 7, lineHeight: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, marginTop: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statSuccess: { color: colors.success },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: colors.border },
  body: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10 },
  permissionButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 18 },
  permissionText: { color: colors.background, fontWeight: '800' },
  cameraFrame: {
    width: '100%',
    height: 420,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanGuide: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.primary },
  cornerTopLeft: { top: '24%', left: '14%', borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTopRight: { top: '24%', right: '14%', borderTopWidth: 3, borderRightWidth: 3 },
  cornerBottomLeft: { bottom: '24%', left: '14%', borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBottomRight: { bottom: '24%', right: '14%', borderBottomWidth: 3, borderRightWidth: 3 },
  scanHint: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.overlayStrong, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  scanHintText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  centeredOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.overlayStrong },
  scanningText: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  resultValid: { borderColor: colors.success + '90' },
  resultInvalid: { borderColor: colors.critical + '90' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  resultIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  resultIconValid: { backgroundColor: colors.success },
  resultIconInvalid: { backgroundColor: colors.critical },
  resultCopy: { flex: 1 },
  resultLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  resultStatus: { fontSize: 15, fontWeight: '800', marginTop: 3 },
  resultStatusValid: { color: colors.success },
  resultStatusInvalid: { color: colors.critical },
  resultValue: { color: colors.text, fontSize: 14, marginTop: 14, fontWeight: '600', lineHeight: 20 },
  resultDetail: { color: colors.textSecondary, fontSize: 12, marginTop: 7 },
  nextButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: 12, marginTop: 16 },
  nextButtonText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  waitingBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 16 },
  waitingTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  waitingText: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
});
