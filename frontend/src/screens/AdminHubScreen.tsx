import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AdminEventsScreen from './AdminEventsScreen';
import AdminScannerScreen from './AdminScannerScreen';
import AdminScheduleScreen from './AdminScheduleScreen';
import AdminStadiumsScreen from './AdminStadiumsScreen';
import ProfileAvatar from '../components/ProfileAvatar';
import AdminParkingScreen from './AdminParkingScreen';
import AdminBusesScreen from './AdminBusesScreen';
import AdminFoodScreen from './AdminFoodScreen';

type AdminSection =
  | 'scanner'
  | 'events'
  | 'schedule'
  | 'stadiums'
  | 'parking'
  | 'buses'
  | 'food';
import { getAdminModules, ModuleKey, updateAdminModule } from '../api/client';
import { useModules } from '../modules/ModuleContext';



export default function AdminHubScreen() {
  const { user, token } = useAuth();
  const { modules, setModules } = useModules();
  const isAdmin = user?.role === 'ADMIN';
  const sections: Array<{
  key: AdminSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = isAdmin
  ? [
      { key: 'scanner', label: 'Escáner', icon: 'scan-outline' },
      { key: 'events', label: 'Eventos', icon: 'film-outline' },
      { key: 'schedule', label: 'Salas', icon: 'calendar-outline' },
      { key: 'stadiums', label: 'Estadios', icon: 'football-outline' },
      { key: 'parking', label: 'Parqueaderos', icon: 'car-outline' },
      { key: 'buses', label: 'Buses', icon: 'bus-outline' },
      { key: 'food', label: 'Comidas', icon: 'fast-food-outline' },
    ]
  : [{ key: 'scanner', label: 'Escáner', icon: 'scan-outline' }];
  const [section, setSection] = useState<AdminSection>('scanner');
  const [moduleError, setModuleError] = useState('');
  const [moduleLoading, setModuleLoading] = useState(false);

  const moduleItems: Array<{ key: ModuleKey; label: string; description: string }> = [
    { key: 'catalog', label: 'Cartelera', description: 'Cine, teatro y conciertos' },
    { key: 'stadiums', label: 'Estadios', description: 'Partidos y venta de localidades' },
    { key: 'parking', label: 'Parqueaderos', description: 'Reservas de estacionamiento' },
    { key: 'buses', label: 'Buses', description: 'Rutas y tickets de transporte' },
    { key: 'assistant', label: 'Asistente', description: 'Asistente de búsqueda para clientes' },
  ];

  const loadModules = async () => {
    if (!token) return;
    setModuleLoading(true);
    try { setModules((await getAdminModules(token)).modules); setModuleError(''); }
    catch (error) { setModuleError(error instanceof Error ? error.message : 'No se pudo cargar la configuración.'); }
    finally { setModuleLoading(false); }
  };

  const toggleModule = async (key: ModuleKey, enabled: boolean) => {
    if (!token) return;
    setModuleLoading(true);
    try { setModules((await updateAdminModule(token, key, enabled)).modules); setModuleError(''); }
    catch (error) { setModuleError(error instanceof Error ? error.message : 'No se pudo actualizar el módulo.'); }
    finally { setModuleLoading(false); }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SCANNER')) {
    return <AdminScannerScreen />;
  }

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
        {section === 'scanner' && <AdminScannerScreen />}
        {section === 'events' && <AdminEventsScreen />}
        {section === 'schedule' && <AdminScheduleScreen />}
        {section === 'stadiums' && <AdminStadiumsScreen />}
        {section === 'parking' && <AdminParkingScreen />}
        {section === 'buses' && <AdminBusesScreen />}
        {section === 'food' && <AdminFoodScreen />}
        {section === 'events' && <View style={styles.modulesPanel}>
          <View style={styles.modulesHeader}><View><Text style={styles.sectionTitle}>Módulos del cliente</Text><Text style={styles.formHint}>Controla qué experiencias aparecen en la app.</Text></View><Pressable onPress={() => void loadModules()}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></Pressable></View>
          {moduleLoading && <ActivityIndicator color={colors.primary} />}
          {!!moduleError && <Text style={styles.error}>{moduleError}</Text>}
          {moduleItems.map((item) => <View key={item.key} style={styles.moduleRow}><View style={styles.moduleCopy}><Text style={styles.moduleLabel}>{item.label}</Text><Text style={styles.moduleDescription}>{item.description}</Text></View><Switch accessibilityLabel={`Activar ${item.label}`} value={modules[item.key]} onValueChange={(enabled) => void toggleModule(item.key, enabled)} trackColor={{ false: colors.border, true: colors.primary + '88' }} thumbColor={modules[item.key] ? colors.primary : colors.textSecondary} /></View>)}
        </View>}
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
  selector: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12 },
  selectorItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, position: 'relative' },
  selectorText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  selectorTextActive: { color: colors.text },
  activeLine: { position: 'absolute', bottom: -1, left: 12, right: 12, height: 2, borderRadius: 2, backgroundColor: colors.primary },
  content: { flex: 1 },
  modulesPanel: { padding: 18, gap: 14 },
  modulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  formHint: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  error: { color: colors.critical, fontSize: 13 },
  moduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 14 },
  moduleCopy: { flex: 1, paddingRight: 12 },
  moduleLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  moduleDescription: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
});
