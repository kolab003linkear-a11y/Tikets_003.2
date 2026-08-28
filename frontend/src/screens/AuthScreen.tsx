import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password) {
      setError('Completa un correo electrónico válido y tu contraseña.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (registerMode && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
      if (registerMode && !acceptedTerms) {
        setError('Debes aceptar los términos y condiciones.');
        return;
      }

    setBusy(true);
    setError(null);
    try {
      if (registerMode) await signUp(normalizedEmail, password);
      else await signIn(normalizedEmail, password);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}><View style={styles.brandMark}><Ionicons name="ticket" size={23} color={colors.text} /></View><View style={styles.brandLine} /></View>
        <Text style={styles.overline}>Tu experiencia, a un toque</Text>
        <Text style={styles.title}>Bienvenido a <Text style={styles.titleAccent}>TiKetSafe</Text></Text>
        <Text style={styles.subtitle}>{registerMode ? 'Crea tu cuenta en pocos segundos. Te pediremos tus datos al reservar.' : 'Inicia sesión para descubrir tus próximas experiencias.'}</Text>

        <View style={styles.modeSwitch}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: !registerMode }} style={[styles.modeOption, !registerMode && styles.modeOptionActive]} onPress={() => { setRegisterMode(false); setError(null); }}><Text style={[styles.modeText, !registerMode && styles.modeTextActive]}>Iniciar sesión</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: registerMode }} style={[styles.modeOption, registerMode && styles.modeOptionActive]} onPress={() => { setRegisterMode(true); setError(null); }}><Text style={[styles.modeText, registerMode && styles.modeTextActive]}>Crear cuenta</Text></Pressable>
        </View>

        <AppCard style={styles.form}>
          <AppInput
            label="Correo electrónico"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.passwordWrap}>
            <AppInput label="Contraseña" autoCapitalize="none" autoComplete="password" secureTextEntry={!showPassword} style={[styles.input, styles.passwordInput]} value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.textSecondary} />
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={styles.eyeButton} onPress={() => setShowPassword((visible) => !visible)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textSecondary} /></Pressable>
          </View>
          {registerMode && <AppInput label="Confirmar contraseña" autoCapitalize="none" autoComplete="password" secureTextEntry={!showPassword} style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite tu contraseña" placeholderTextColor={colors.textSecondary} />}
            {registerMode && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} style={styles.termsRow} onPress={() => setAcceptedTerms((accepted) => !accepted)}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>{acceptedTerms && <Ionicons name="checkmark" size={14} color={colors.background} />}</View>
              <Text style={styles.termsText}>Acepto los términos y condiciones y el uso de mis datos.</Text>
            </Pressable>}
          {error && <Text style={styles.error}>{error}</Text>}
          <AppButton
            label={registerMode ? 'Crear cuenta' : 'Iniciar sesión'}
            onPress={() => void submit()}
            disabled={busy}
            loading={busy}
          />
        </AppCard>

        <View style={styles.footerLine}><Ionicons name="shield-checkmark-outline" size={16} color={colors.success} /><Text style={styles.footerText}>Tu sesión se guarda de forma segura</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  brandMark: { width: 54, height: 54, borderRadius: 17, backgroundColor: colors.critical, alignItems: 'center', justifyContent: 'center' },
  brandLine: { height: 1, flex: 1, backgroundColor: colors.border, marginLeft: 14 },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 4, fontFamily: typography.display },
  titleAccent: { color: colors.primary },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 20 },
  modeSwitch: { flexDirection: 'row', backgroundColor: colors.input, borderRadius: 12, padding: 4, marginBottom: 14 },
  modeOption: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 9 },
  modeOptionActive: { backgroundColor: colors.surfaceRaised },
  modeText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: colors.text },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  input: { height: 50, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, color: colors.text, paddingHorizontal: 14, marginBottom: 14 },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 10, bottom: 21, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  error: { color: colors.critical, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  primaryButton: { minHeight: 50, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  primaryText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  footerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  footerText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
