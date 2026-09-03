import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useAdminStadiumsDashboardController } from './AdminStadiumsDashboardScreen.controller';

// ---------------------------------------------------------------------------
// Vista del "Dashboard" dentro del módulo Estadios (arquitectura
// Vista-Controlador). Solo dibuja la interfaz: los datos y los cálculos
// viven en useAdminStadiumsDashboardController.
// ---------------------------------------------------------------------------

export default function AdminStadiumsDashboardScreen() {
  const { loading, error, stats, nextMatches, loadAll } = useAdminStadiumsDashboardController();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Resumen</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Actualizar dashboard" onPress={() => void loadAll()}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Vista general del módulo de estadios: sedes, equipos y partidos.</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="football-outline" value={stats.totalStadiums} label="Estadios" />
            <StatCard icon="shield-outline" value={stats.totalTeams} label="Equipos" />
            <StatCard icon="trophy-outline" value={stats.totalMatches} label="Partidos" />
            <StatCard icon="pricetag-outline" value={stats.ticketsSold} label="Tickets vendidos" accent />
            <StatCard icon="radio-outline" value={stats.liveMatches} label="En vivo" accent={stats.liveMatches > 0} />
            <StatCard icon="calendar-outline" value={stats.upcomingMatches} label="Próximos" />
            <StatCard icon="people-outline" value={stats.totalCapacity.toLocaleString('es-ES')} label="Aforo total" />
            <StatCard icon="grid-outline" value={stats.totalSectors} label="Sectores" />
          </View>

          <Text style={styles.sectionTitle}>Próximos partidos</Text>
          {nextMatches.length === 0 ? (
            <Text style={styles.emptyText}>No hay partidos programados o en vivo.</Text>
          ) : (
            nextMatches.map((match) => (
              <View key={match.id} style={styles.matchRow}>
                <View style={[styles.statusDot, match.status === 'LIVE' && styles.statusDotLive]} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTeams} numberOfLines={1}>
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </Text>
                  <Text style={styles.matchMeta} numberOfLines={1}>
                    {new Date(match.startTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })} · {match.stadium.name}
                  </Text>
                </View>
                <Text style={styles.ticketsBadge}>{match._count?.tickets ?? 0} tickets</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, accent && styles.statIconBoxAccent]}>
        <Ionicons name={icon} size={17} color={accent ? colors.background : colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  error: { color: colors.critical, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, gap: 6 },
  statIconBox: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' },
  statIconBoxAccent: { backgroundColor: colors.primary },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 6 },
  emptyText: { color: colors.textSecondary, fontSize: 13 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 11 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusDotLive: { backgroundColor: colors.critical },
  matchInfo: { flex: 1 },
  matchTeams: { color: colors.text, fontSize: 14, fontWeight: '800' },
  matchMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  ticketsBadge: { color: colors.primary, fontSize: 11, fontWeight: '800' },
});
