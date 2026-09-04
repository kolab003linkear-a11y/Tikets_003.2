import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AdminEventsScreen from './AdminEventsScreen';
import AdminScannerScreen from './AdminScannerScreen';
import AdminScheduleScreen from './AdminScheduleScreen';
import AdminStadiumsScreen from './AdminStadiumsScreen';
import AdminTeamsScreen from './AdminTeamsScreen';
import AdminMatchesScreen from './AdminMatchesScreen';
import ProfileAvatar from '../components/ProfileAvatar';
import AdminParkingScreen from './AdminParkingScreen';
import AdminFoodScreen from './AdminFoodScreen';
import { createAdminUser, getAdminModules, getAdminParking, getAdminStadiums, getCatalog, getMatches, ModuleKey, updateAdminModule } from '../api/client';
import { useModules } from '../modules/ModuleContext';

type AdminSection =
  | 'dashboard'
  | 'scanner'
  | 'events'
  | 'schedule'
  | 'stadiums'
  | 'teams'
  | 'matches'
  | 'parking'
  | 'modules'
  | 'admins'
  | 'food';

export default function AdminHubScreen() {
  const { user, token } = useAuth();
  const { modules, setModules } = useModules();
  const isAdmin = user?.role === 'ADMIN';
  const sections: Array<{ key: AdminSection; label: string; icon: keyof typeof Ionicons.glyphMap }> = isAdmin
    ? [
        { key: 'dashboard', label: 'Dashboard', icon: 'stats-chart-outline' },
        { key: 'scanner', label: 'Escáner', icon: 'scan-outline' },
        { key: 'events', label: 'Eventos', icon: 'film-outline' },
        { key: 'schedule', label: 'Salas', icon: 'calendar-outline' },
        { key: 'stadiums', label: 'Estadios', icon: 'football-outline' },
        { key: 'teams', label: 'Equipos', icon: 'shield-outline' },
        { key: 'matches', label: 'Partidos', icon: 'trophy-outline' },
        { key: 'parking', label: 'Parqueaderos', icon: 'car-outline' },
        { key: 'modules', label: 'Módulos', icon: 'options-outline' },
        { key: 'admins', label: 'Admins', icon: 'people-outline' },
        { key: 'food', label: 'Comidas', icon: 'fast-food-outline' },
      ]
    : [{ key: 'scanner', label: 'Escáner', icon: 'scan-outline' }];
  const [section, setSection] = useState<AdminSection>(isAdmin ? 'dashboard' : 'scanner');
  const [moduleError, setModuleError] = useState('');
  const [moduleLoading, setModuleLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summary, setSummary] = useState({
    events: 0,
    matches: 0,
    stadiums: 0,
    parking: 0,
    modules: 0,
  });
  const [adminDraft, setAdminDraft] = useState({ email: '', fullName: '', phone: '', password: '' });
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin || !token) return;

    let active = true;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError('');

      try {
        const [catalogResult, matchesResult, stadiumsResult, parkingResult] = await Promise.allSettled([
          getCatalog(),
          getMatches(),
          getAdminStadiums(token),
          getAdminParking(token),
        ]);

        if (!active) return;

        const catalogCount = catalogResult.status === 'fulfilled' ? catalogResult.value.movies.length : 0;
        const matchesCount = matchesResult.status === 'fulfilled' ? matchesResult.value.matches.length : 0;
        const stadiumsCount = stadiumsResult.status === 'fulfilled' ? stadiumsResult.value.stadiums.length : 0;
        const parkingCount = parkingResult.status === 'fulfilled' ? parkingResult.value.parking.length : 0;
        setSummary({
          events: catalogCount,
          matches: matchesCount,
          stadiums: stadiumsCount,
          parking: parkingCount,
          modules: Object.entries(modules).filter(([key, enabled]) => key !== 'buses' && enabled).length,
        });
      } catch (error) {
        if (!active) return;
        setSummaryError(error instanceof Error ? error.message : 'No se pudo cargar el resumen del sistema.');
      } finally {
        if (active) setSummaryLoading(false);
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [isAdmin, token, modules]);

  const moduleItems: Array<{ key: ModuleKey; label: string; description: string }> = [
    { key: 'catalog', label: 'Inicio', description: 'Dashboard con cine, teatro y accesos a todos los módulos' },
    { key: 'events', label: 'Eventos', description: 'Acceso a conciertos, teatro y experiencias' },
    { key: 'stadiums', label: 'Estadios', description: 'Partidos y venta de localidades' },
    { key: 'parking', label: 'Parqueaderos', description: 'Reservas de estacionamiento' },
    { key: 'assistant', label: 'Asistente', description: 'Asistente de búsqueda para clientes' },
  ];

  const loadModules = async () => {
    if (!token) return;
    setModuleLoading(true);
    try { setModules({ ...(await getAdminModules(token)).modules, buses: false }); setModuleError(''); }
    catch (error) { setModuleError(error instanceof Error ? error.message : 'No se pudo cargar la configuración.'); }
    finally { setModuleLoading(false); }
  };

  const toggleModule = async (key: ModuleKey, enabled: boolean) => {
    if (!token) return;
    setModuleLoading(true);
    try { setModules({ ...(await updateAdminModule(token, key, enabled)).modules, buses: false }); setModuleError(''); }
    catch (error) { setModuleError(error instanceof Error ? error.message : 'No se pudo actualizar el módulo.'); }
    finally { setModuleLoading(false); }
  };

  const createAdministrator = async () => {
    if (!token) return;
    if (!adminDraft.email.trim() || !adminDraft.fullName.trim() || adminDraft.password.length < 8) {
      Alert.alert('Datos incompletos', 'Ingresa nombre, correo y una contraseña de al menos 8 caracteres.');
      return;
    }
    setAdminSaving(true);
    try {
      await createAdminUser(token, { ...adminDraft, email: adminDraft.email.trim().toLowerCase(), fullName: adminDraft.fullName.trim(), phone: adminDraft.phone.trim() || undefined });
      setAdminDraft({ email: '', fullName: '', phone: '', password: '' });
      Alert.alert('Administrador creado', 'La nueva cuenta ya puede iniciar sesión.');
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setAdminSaving(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SCANNER')) {
    return <AdminScannerScreen />;
  }

  const dashboardCards = [
    { label: 'Eventos', value: String(summary.events), accent: colors.primary, icon: 'film-outline' },
    { label: 'Partidos', value: String(summary.matches), accent: colors.warning, icon: 'football-outline' },
    { label: 'Estadios', value: String(summary.stadiums), accent: colors.success, icon: 'business-outline' },
    { label: 'Parqueaderos', value: String(summary.parking), accent: '#7C3AED', icon: 'car-outline' },
    { label: 'Módulos activos', value: String(summary.modules), accent: '#F97316', icon: 'toggle-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarTitle}>
          <View style={styles.iconBox}><Ionicons name="grid-outline" size={19} color={colors.text} /></View>
          <View>
            <Text style={styles.overline}>Operación</Text>
            <Text style={styles.title}>Centro admin</Text>
          </View>
        </View>
        <View style={styles.toolbarActions}><View style={styles.roleBadge}><Ionicons name="shield-checkmark-outline" size={13} color={colors.success} /><Text style={styles.roleText}>{isAdmin ? 'ADMIN' : 'SCANNER'}</Text></View><ProfileAvatar /></View>
      </View>
      <View style={styles.selector}>
        {sections.map((item) => (
          <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: section === item.key }} onPress={() => setSection(item.key)} style={styles.selectorItem}>
            <Ionicons name={item.icon} size={17} color={section === item.key ? colors.text : colors.textSecondary} />
            <Text style={[styles.selectorText, section === item.key && styles.selectorTextActive]}>{item.label}</Text>
            {section === item.key && <View style={styles.activeLine} />}
          </Pressable>
        ))}
      </View>
      <View style={styles.content}>
        {section === 'dashboard' && isAdmin && (
          <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardHeader}>
              <View>
                <Text style={styles.kicker}>Sistema operativo</Text>
                <Text style={styles.sectionTitle}>Dashboard administrativo</Text>
              </View>
              <Pressable style={styles.refreshButton} onPress={() => void loadModules()} accessibilityRole="button" accessibilityLabel="Actualizar dashboard">
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {summaryLoading && <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />}
            {!!summaryError && <Text style={styles.error}>{summaryError}</Text>}

            <View style={styles.dashboardGrid}>
              {dashboardCards.map((card) => (
                <View key={card.label} style={[styles.metricCard, { borderColor: card.accent + '44' }]}>
                  <View style={[styles.metricIcon, { backgroundColor: card.accent + '18' }]}>
                    <Ionicons name={card.icon as keyof typeof Ionicons.glyphMap} size={20} color={card.accent} />
                  </View>
                  <Text style={styles.metricValue}>{card.value}</Text>
                  <Text style={styles.metricLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panelCard}>
              <Text style={styles.panelTitle}>Resumen operativo</Text>
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Módulos activos</Text>
                <Text style={styles.listValue}>{summary.modules}/{moduleItems.length}</Text>
              </View>
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Capacidad de venta</Text>
                <Text style={styles.listValue}>{summary.events + summary.matches + summary.stadiums} unidades</Text>
              </View>
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Cobertura operativa</Text>
                <Text style={styles.listValue}>{summary.parking} puntos activos</Text>
              </View>
            </View>

            <View style={styles.panelCard}>
              <Text style={styles.panelTitle}>Qué revisar hoy</Text>
              <View style={styles.todoRow}><Ionicons name="checkmark-circle-outline" size={16} color={colors.success} /><Text style={styles.todoText}>Validar tickets con alta demanda.</Text></View>
              <View style={styles.todoRow}><Ionicons name="calendar-outline" size={16} color={colors.primary} /><Text style={styles.todoText}>Confirmar próximos partidos y horarios.</Text></View>
              <View style={styles.todoRow}><Ionicons name="car-outline" size={16} color={colors.warning} /><Text style={styles.todoText}>Revisar disponibilidad de parqueaderos y rutas.</Text></View>
            </View>
          </ScrollView>
        )}
        {section === 'scanner' && <AdminScannerScreen />}
        {section === 'events' && <AdminEventsScreen />}
        {section === 'schedule' && <AdminScheduleScreen />}
        {section === 'stadiums' && <AdminStadiumsScreen />}
        {section === 'teams' && <AdminTeamsScreen />}
        {section === 'matches' && <AdminMatchesScreen />}
        {section === 'parking' && <AdminParkingScreen />}
        {section === 'food' && <AdminFoodScreen />}
        {section === 'modules' && <View style={styles.modulesPanel}>
          <View style={styles.modulesHeader}><View><Text style={styles.sectionTitle}>Módulos del cliente</Text><Text style={styles.formHint}>Controla qué experiencias aparecen en la app.</Text></View><Pressable onPress={() => void loadModules()}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></Pressable></View>
          {moduleLoading && <ActivityIndicator color={colors.primary} />}
          {!!moduleError && <Text style={styles.error}>{moduleError}</Text>}
          {moduleItems.map((item) => <View key={item.key} style={styles.moduleRow}><View style={styles.moduleCopy}><Text style={styles.moduleLabel}>{item.label}</Text><Text style={styles.moduleDescription}>{item.description}</Text></View><Switch accessibilityLabel={`Activar ${item.label}`} value={modules[item.key]} onValueChange={(enabled) => void toggleModule(item.key, enabled)} trackColor={{ false: colors.border, true: colors.primary + '88' }} thumbColor={modules[item.key] ? colors.primary : colors.textSecondary} /></View>)}
        </View>}
        {section === 'admins' && isAdmin && <ScrollView contentContainerStyle={styles.adminsPanel}>
          <Text style={styles.sectionTitle}>Agregar administrador</Text>
          <Text style={styles.formHint}>Crea una cuenta con permisos completos del centro administrativo.</Text>
          <TextInput placeholder="Nombre completo" placeholderTextColor={colors.textSecondary} value={adminDraft.fullName} onChangeText={(fullName) => setAdminDraft({ ...adminDraft, fullName })} style={styles.adminInput} />
          <TextInput placeholder="Correo electrónico" placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="email-address" value={adminDraft.email} onChangeText={(email) => setAdminDraft({ ...adminDraft, email })} style={styles.adminInput} />
          <TextInput placeholder="Teléfono (opcional)" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" value={adminDraft.phone} onChangeText={(phone) => setAdminDraft({ ...adminDraft, phone })} style={styles.adminInput} />
          <TextInput placeholder="Contraseña temporal" placeholderTextColor={colors.textSecondary} secureTextEntry value={adminDraft.password} onChangeText={(password) => setAdminDraft({ ...adminDraft, password })} style={styles.adminInput} />
          <Pressable accessibilityRole="button" style={[styles.createAdminButton, adminSaving && styles.disabled]} onPress={() => void createAdministrator()} disabled={adminSaving}>
            {adminSaving ? <ActivityIndicator color={colors.text} /> : <><Ionicons name="person-add-outline" size={18} color={colors.text} /><Text style={styles.createAdminText}>Crear administrador</Text></>}
          </Pressable>
        </ScrollView>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  toolbarTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overline: { color: colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', fontFamily: typography.display, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success + '18', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  roleText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selector: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 8 },
  selectorItem: { width: '25%', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, position: 'relative' },
  selectorText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  selectorTextActive: { color: colors.text },
  activeLine: { position: 'absolute', bottom: -1, left: 12, right: 12, height: 2, borderRadius: 2, backgroundColor: colors.primary },
  content: { flex: 1 },
  dashboardScroll: { flex: 1 },
  dashboardContainer: { padding: 18, gap: 16 },
  dashboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  refreshButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  summaryLoader: { marginVertical: 8 },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', borderWidth: 1, borderRadius: 14, backgroundColor: colors.surface, padding: 14, minHeight: 110 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { color: colors.text, fontSize: 26, fontWeight: '800', fontFamily: typography.display },
  metricLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  panelCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 10 },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  listLabel: { color: colors.textSecondary, fontSize: 13 },
  listValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  todoText: { color: colors.text, fontSize: 13, flexShrink: 1 },
  modulesPanel: { padding: 18, gap: 14 },
  adminsPanel: { padding: 18, gap: 12 },
  adminInput: { minHeight: 48, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, color: colors.text, paddingHorizontal: 14 },
  createAdminButton: { minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  createAdminText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  modulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  formHint: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  error: { color: colors.critical, fontSize: 13 },
  moduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 14 },
  moduleCopy: { flex: 1, paddingRight: 12 },
  moduleLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  moduleDescription: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
});
