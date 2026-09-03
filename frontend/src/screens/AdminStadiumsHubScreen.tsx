import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { StadiumsHubTab, useAdminStadiumsHubController } from './AdminStadiumsHubScreen.controller';
import AdminStadiumsDashboardScreen from './AdminStadiumsDashboardScreen';
import AdminStadiumsScreen from './AdminStadiumsScreen';
import AdminTeamsScreen from './AdminTeamsScreen';
import AdminMatchesScreen from './AdminMatchesScreen';

// ---------------------------------------------------------------------------
// Hub del módulo "Estadios" (arquitectura Vista-Controlador). Agrupa, detrás
// de un sub-navbar propio (Dashboard/Estadios/Equipos/Partidos), las tres
// pantallas que antes vivían como secciones sueltas del menú principal del
// administrador. AdminHubScreen.tsx ahora solo monta este componente para
// la sección "Estadios".
// ---------------------------------------------------------------------------

const TABS: Array<{ key: StadiumsHubTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'dashboard', label: 'Dashboard', icon: 'stats-chart-outline' },
  { key: 'stadiums', label: 'Estadios', icon: 'football-outline' },
  { key: 'teams', label: 'Equipos', icon: 'shield-outline' },
  { key: 'matches', label: 'Partidos', icon: 'trophy-outline' },
];

export default function AdminStadiumsHubScreen() {
  const { tab, setTab } = useAdminStadiumsHubController();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navbar} contentContainerStyle={styles.navbarContent}>
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === item.key }}
            onPress={() => setTab(item.key)}
            style={styles.navItem}
          >
            <Ionicons name={item.icon} size={16} color={tab === item.key ? colors.text : colors.textSecondary} />
            <Text style={[styles.navText, tab === item.key && styles.navTextActive]}>{item.label}</Text>
            {tab === item.key && <View style={styles.navActiveLine} />}
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.content}>
        {tab === 'dashboard' && <AdminStadiumsDashboardScreen />}
        {tab === 'stadiums' && <AdminStadiumsScreen />}
        {tab === 'teams' && <AdminTeamsScreen />}
        {tab === 'matches' && <AdminMatchesScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  navbar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  navbarContent: { flexDirection: 'row', paddingHorizontal: 12 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 14, position: 'relative' },
  navText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  navTextActive: { color: colors.text },
  navActiveLine: { position: 'absolute', bottom: -1, left: 10, right: 10, height: 2, borderRadius: 2, backgroundColor: colors.primary },
  content: { flex: 1 },
});
