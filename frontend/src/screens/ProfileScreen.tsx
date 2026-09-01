import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';
import ProfileAvatar from '../components/ProfileAvatar';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile, signInAdmin, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? '');
    setFullName(user?.fullName ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.email, user?.fullName, user?.phone]);

  const initials = (fullName || user?.email?.split('@')[0] || 'OM').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'SCANNER' ? 'Control de acceso' : 'Cliente';
  const showDemoAdmin = !!user && user.role !== 'ADMIN' && user.role !== 'SCANNER';
  
  // Debug logging
  console.log('[ProfileScreen] user:', user);
  console.log('[ProfileScreen] user?.role:', user?.role);
  console.log('[ProfileScreen] showDemoAdmin:', showDemoAdmin);
  
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Hoy';

  const save = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      Alert.alert('ERROR: correo no válido', 'Escribe un correo electrónico válido.');
      return;
    }
    if (fullName.trim() && fullName.trim().length < 2) {
      Alert.alert('ERROR: nombre no válido', 'El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (phone.trim() && !/^[+\d\s()-]{7,30}$/.test(phone.trim())) {
      Alert.alert('ERROR: teléfono no válido', 'Escribe un número de teléfono válido.');
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ email: normalizedEmail, fullName: fullName.trim(), phone: phone.trim() });
      setSaved(true);
      Alert.alert('PERFIL ACTUALIZADO', 'Tu correo se guardó correctamente.');
    } catch (error) {
      Alert.alert('ERROR: no se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const loginAsAdmin = async () => {
    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || !adminPassword) {
      setAdminLoginError('Ingresa un correo y una contraseña.');
      return;
    }

    setAdminLoggingIn(true);
    setAdminLoginError('');
    try {
      await signInAdmin(normalizedEmail, adminPassword);
      setAdminLoginOpen(false);
      setAdminEmail('');
      setAdminPassword('');
    } catch (error) {
      setAdminLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver a la cartelera" style={styles.backButton} onPress={() => navigation.navigate('HomeTabs', { screen: 'Cartelera' })}><Ionicons name="arrow-back" size={17} color={colors.primary} /><Text style={styles.backText}>Cartelera</Text></Pressable>
            <Text style={styles.overline}>Tu cuenta</Text>
            <Text style={styles.title}>Perfil</Text>
            <Text style={styles.subtitle}>Tu espacio para gestionar entradas y preferencias.</Text>
          </View>
          <View style={styles.headerActions}><ProfileAvatar /><Pressable accessibilityRole="button" accessibilityLabel={settingsOpen ? 'Cerrar configuración' : 'Abrir configuración'} accessibilityState={{ expanded: settingsOpen }} style={[styles.headerIcon, settingsOpen && styles.headerIconActive]} onPress={() => setSettingsOpen((open) => !open)}><Ionicons name={settingsOpen ? 'close-outline' : 'settings-outline'} size={21} color={colors.text} /></Pressable></View>
        </View>
        {settingsOpen && <View style={styles.settingsPanel}>
          <View style={styles.settingsHeading}><Ionicons name="options-outline" size={18} color={colors.primary} /><Text style={styles.settingsTitle}>Configuración rápida</Text></View>
          <Pressable style={styles.settingsRow} onPress={() => setSettingsOpen(false)}><Ionicons name="create-outline" size={18} color={colors.textSecondary} /><View style={styles.settingsCopy}><Text style={styles.settingsRowTitle}>Datos personales</Text><Text style={styles.settingsRowText}>Edita tu correo más abajo</Text></View><Ionicons name="chevron-down" size={17} color={colors.textSecondary} /></Pressable>
          {showDemoAdmin && (
            <Pressable style={styles.settingsRow} onPress={() => {
              setSettingsOpen(false);
              setAdminLoginError('');
              setAdminLoginOpen(true);
            }}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.warning} />
              <View style={styles.settingsCopy}><Text style={styles.settingsRowTitle}>Entrar como admin</Text><Text style={styles.settingsRowText}>Demo: admin@tikets.com</Text></View>
              <Ionicons name="chevron-forward" size={17} color={colors.textSecondary} />
            </Pressable>
          )}
          <View style={styles.settingsRow}><Ionicons name="shield-checkmark-outline" size={18} color={colors.success} /><View style={styles.settingsCopy}><Text style={styles.settingsRowTitle}>Sesión protegida</Text><Text style={styles.settingsRowText}>Tus datos se mantienen seguros</Text></View><View style={styles.activeDot} /></View>
        </View>}

        <Modal visible={adminLoginOpen} transparent animationType="fade" onRequestClose={() => setAdminLoginOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.adminModal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleCopy}>
                  <Text style={styles.modalOverline}>Acceso restringido</Text>
                  <Text style={styles.modalTitle}>Ingresar como admin</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar acceso admin" style={styles.modalClose} onPress={() => setAdminLoginOpen(false)}>
                  <Ionicons name="close-outline" size={21} color={colors.text} />
                </Pressable>
              </View>
              <Text style={styles.modalDescription}>Usa las credenciales autorizadas para entrar al centro administrativo.</Text>
              <AppInput label="Correo de administrador" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={adminEmail} onChangeText={setAdminEmail} placeholder="admin@ejemplo.com" style={styles.input} />
              <AppInput label="Contraseña" secureTextEntry value={adminPassword} onChangeText={setAdminPassword} placeholder="Contraseña" style={styles.input} />
              {!!adminLoginError && <Text style={styles.loginError}>{adminLoginError}</Text>}
              <Pressable style={[styles.primaryButton, adminLoggingIn && styles.disabled]} onPress={() => void loginAsAdmin()} disabled={adminLoggingIn}>
                {adminLoggingIn ? <ActivityIndicator color={colors.text} /> : <><Ionicons name="log-in-outline" size={18} color={colors.text} /><Text style={styles.buttonText}>Ingresar</Text></>}
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setAdminLoginOpen(false)} disabled={adminLoggingIn}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
            </View>
          </View>
        </Modal>

        <View style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.identityCopy}>
              <Text style={styles.greeting}>Hola, qué gusto verte</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.success} />
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.memberLine}>
            <Ionicons name="calendar-clear-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.memberText}>Miembro desde {memberSince}</Text>
            <View style={styles.sessionStatus}><View style={styles.sessionDot} /><Text style={styles.sessionText}>Sesión activa</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickItem} onPress={() => navigation.navigate('HomeTabs', { screen: 'Mis Tickets' })}>
            <View style={[styles.quickIcon, styles.quickIconBlue]}><Ionicons name="ticket-outline" size={20} color={colors.primary} /></View>
            <Text style={styles.quickTitle}>Mis tickets</Text>
            <Text style={styles.quickHint}>Ver tus entradas</Text>
          </Pressable>
          <Pressable style={styles.quickItem} onPress={() => navigation.navigate('HomeTabs', { screen: 'Estadios' })}>
            <View style={[styles.quickIcon, styles.quickIconGold]}><Ionicons name="football-outline" size={20} color={colors.warning} /></View>
            <Text style={styles.quickTitle}>Estadios</Text>
            <Text style={styles.quickHint}>Explorar partidos</Text>
          </Pressable>
          <Pressable style={styles.quickItem} onPress={() => setSettingsOpen(true)}>
            <View style={[styles.quickIcon, styles.quickIconGreen]}><Ionicons name="lock-closed-outline" size={20} color={colors.success} /></View>
            <Text style={styles.quickTitle}>Cuenta segura</Text>
            <Text style={styles.quickHint}>Sesión protegida</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Acceso de cuenta</Text>
        <View style={styles.accessCard}>
          <View style={styles.accessIcon}><Ionicons name={user?.role === 'CLIENT' ? 'person-outline' : 'shield-outline'} size={21} color={colors.warning} /></View>
          <View style={styles.accessCopy}>
            <Text style={styles.accessTitle}>{roleLabel}</Text>
            <Text style={styles.accessText}>{user?.role === 'ADMIN' ? 'Puedes gestionar eventos, salas y validaciones.' : user?.role === 'SCANNER' ? 'Puedes validar accesos desde el escáner.' : 'Puedes comprar entradas y consultar tus tickets.'}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        </View>

        <Text style={styles.sectionTitle}>Datos personales</Text>
        <AppCard style={styles.card}>
          <AppInput
            label="Nombre completo"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tu nombre completo"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <AppInput
            label="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.textSecondary}
          />
          <AppInput
            label="Teléfono"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="+593 99 999 9999"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.text} /> : <><Ionicons name="checkmark-circle-outline" size={18} color={colors.text} /><Text style={styles.buttonText}>Guardar cambios</Text></>}
          </Pressable>
          {saved && <View style={styles.savedLine}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={styles.savedText}>Cambios guardados correctamente</Text></View>}
        </AppCard>

        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" style={styles.logoutButton} onPress={() => {
          if (Platform.OS === 'web') {
            void signOut();
            return;
          }
          Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() }]);
        }}>
          <Ionicons name="log-out-outline" size={19} color={colors.critical} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, backgroundColor: colors.background, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 9 },
  backText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  headerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerIconActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 260 },
  settingsPanel: { backgroundColor: colors.surfaceRaised, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong, padding: 13, marginBottom: 18, gap: 10 },
  settingsHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  settingsTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  settingsCopy: { flex: 1 },
  settingsRowTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  settingsRowText: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlayStrong, justifyContent: 'center', padding: 18 },
  adminModal: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  modalTitleCopy: { flex: 1 },
  modalOverline: { color: colors.warning, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  modalTitle: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 5 },
  modalClose: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  modalDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 12, marginBottom: 8 },
  loginError: { color: colors.critical, fontSize: 12, lineHeight: 17, marginTop: 9 },
  cancelButton: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  identityCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, padding: 18, marginBottom: 24 },
  identityTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 22, fontWeight: '800' },
  identityCopy: { flex: 1, marginLeft: 14 },
  greeting: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  email: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: 7 },
  roleText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  memberLine: { flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 17, paddingTop: 13 },
  memberText: { color: colors.textSecondary, fontSize: 12 },
  sessionStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  sessionText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 11 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  quickItem: { flex: 1, minWidth: '46%', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  quickIconBlue: { backgroundColor: colors.primary + '20' },
  quickIconGreen: { backgroundColor: colors.success + '20' },
  quickIconGold: { backgroundColor: colors.warning + '20' },
  quickTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  quickHint: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  accessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 25, gap: 11 },
  accessIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warning + '20', alignItems: 'center', justifyContent: 'center' },
  accessCopy: { flex: 1 },
  accessTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  accessText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { height: 50, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, color: colors.text, paddingHorizontal: 14 },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 12 },
  primaryButton: { minHeight: 48, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 18 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.text, fontWeight: '800' },
  savedLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  savedText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  logoutButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, borderColor: colors.critical + '80', borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 24 },
  logoutText: { color: colors.critical, fontWeight: '800' },
});
