import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { AdminMatch } from '../api/client';
import AdminMatchPricesScreen from './AdminMatchPricesScreen';
import { MatchStatusOption, useAdminMatchesController } from './AdminMatchesScreen.controller';

// ---------------------------------------------------------------------------
// Vista del módulo "Partidos" (arquitectura Vista-Controlador).
// Solo dibuja la interfaz; toda la lógica vive en
// `useAdminMatchesController` (AdminMatchesScreen.controller.ts).
// ---------------------------------------------------------------------------

const statusLabels: Record<MatchStatusOption, string> = {
  SCHEDULED: 'PROGRAMADO',
  LIVE: 'EN VIVO',
  FINISHED: 'FINALIZADO',
  CANCELLED: 'CANCELADO',
};

export default function AdminMatchesScreen() {
  const {
    isAdmin,
    matches,
    stadiums,
    teams,
    draft,
    editingId,
    loading,
    saving,
    error,
    upcomingCount,
    selectedStadiumSectors,
    loadAll,
    updateDraft,
    selectStadium,
    updateSectorPrice,
    startEditing,
    resetForm,
    save,
  } = useAdminMatchesController();

  // Estado de navegación local (igual que AdminHubScreen con `section`): qué
  // partido está abierto en la pantalla de "Precios por partido". No es
  // lógica de negocio, así que vive en la Vista, no en el controlador.
  const [pricingMatch, setPricingMatch] = useState<AdminMatch | null>(null);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Acceso restringido</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pricingMatch) {
    return <AdminMatchPricesScreen match={pricingMatch} onBack={() => setPricingMatch(null)} />;
  }

  const hasCatalogs = stadiums.length > 0 && teams.length > 0;

  // Mismo formulario para crear (inline, arriba de la lista) y para editar
  // (dentro del cuadro/Modal que se abre al tocar el lápiz de un partido).
  // Es una función, no un componente aparte, para no perder el estado de los
  // TextInput al cambiar entre los dos lugares donde se dibuja.
  function renderMatchForm() {
    return (
      <>
        <View style={styles.formHeader}>
          <View>
            <Text style={styles.sectionTitle}>{editingId ? 'Editar partido' : 'Nuevo partido'}</Text>
            <Text style={styles.formHint}>{editingId ? 'Actualiza estadio, equipos, fecha o precios.' : 'Selecciona estadio, equipos y fecha.'}</Text>
          </View>
          <Ionicons name={editingId ? 'create-outline' : 'add-circle-outline'} size={24} color={colors.primary} />
        </View>

        <Text style={styles.label}>Estadio</Text>
        <View style={styles.optionRow}>
          {stadiums.map((stadium) => (
            <Pressable
              key={stadium.id}
              style={[styles.option, draft.stadiumId === stadium.id && styles.optionSelected]}
              onPress={() => selectStadium(stadium.id)}
            >
              <Text style={styles.optionText}>{stadium.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Equipo local</Text>
        <View style={styles.optionRow}>
          {teams.map((team) => (
            <Pressable
              key={team.id}
              style={[styles.option, draft.homeTeamId === team.id && styles.optionSelected]}
              onPress={() => updateDraft('homeTeamId', team.id)}
            >
              <Text style={styles.optionText}>{team.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Equipo visitante</Text>
        <View style={styles.optionRow}>
          {teams.map((team) => (
            <Pressable
              key={team.id}
              style={[styles.option, draft.awayTeamId === team.id && styles.optionSelected]}
              onPress={() => updateDraft('awayTeamId', team.id)}
            >
              <Text style={styles.optionText}>{team.name}</Text>
            </Pressable>
          ))}
        </View>

        <Field
          label="Fecha y hora (ISO)"
          value={draft.startTime}
          placeholder="2026-09-15T20:00"
          onChangeText={(value) => updateDraft('startTime', value)}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Estado</Text>
        <View style={styles.optionRow}>
          {(Object.keys(statusLabels) as MatchStatusOption[]).map((status) => (
            <Pressable
              key={status}
              style={[styles.option, draft.status === status && styles.optionSelected]}
              onPress={() => updateDraft('status', status)}
            >
              <Text style={styles.optionText}>{statusLabels[status]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Precios por sector (opcional)</Text>
        {!draft.stadiumId ? (
          <Text style={styles.formHint}>Selecciona un estadio para fijar el precio de cada sector.</Text>
        ) : selectedStadiumSectors.length === 0 ? (
          <Text style={styles.formHint}>Este estadio no tiene sectores registrados.</Text>
        ) : (
          <>
            <Text style={styles.formHint}>Deja un sector vacío para venderlo a su precio base.</Text>
            {selectedStadiumSectors.map((sector) => (
              <View key={sector.id} style={styles.sectorPriceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectorPriceName}>
                    {sector.name} <Text style={styles.optionText}>({sector.code})</Text>
                  </Text>
                  <Text style={styles.meta}>Precio base: ${sector.price}</Text>
                </View>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="decimal-pad"
                  placeholder={`${sector.price}`}
                  placeholderTextColor={colors.textSecondary}
                  value={draft.sectorPrices[sector.id] ?? ''}
                  onChangeText={(value) => updateSectorPrice(sector.id, value)}
                />
              </View>
            ))}
          </>
        )}

        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>{editingId ? 'Guardar cambios' : 'Crear partido'}</Text>}
        </Pressable>
        {editingId && (
          <Pressable style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryText}>Cancelar edición</Text>
          </Pressable>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>Programación</Text>
            <Text style={styles.title}>Partidos</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy-outline" size={21} color={colors.text} />
          </View>
        </View>
        <Text style={styles.subtitle}>Programa partidos combinando un estadio, un equipo local y uno visitante.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{matches.length}</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statSuccess]}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>Próximos / en vivo</Text>
          </View>
        </View>

        {!hasCatalogs && !loading && (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.warningText}>
              Necesitas al menos un estadio y dos equipos registrados antes de poder crear un partido.
            </Text>
          </View>
        )}

        {!editingId && <View style={styles.form}>{renderMatchForm()}</View>}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Partidos programados</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar partidos" onPress={() => void loadAll()}>
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          matches.map((match) => (
            <View key={match.id} style={styles.matchRow}>
              <View style={styles.matchInfo}>
                <View style={styles.matchTitleRow}>
                  <Text style={styles.matchTeams} numberOfLines={1}>
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </Text>
                  <View style={[styles.statusBadge, (match.status === 'LIVE' || match.status === 'SCHEDULED') && styles.statusActive]}>
                    <Text style={styles.statusText}>{statusLabels[match.status]}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {match.stadium.name} · {new Date(match.startTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
                <Text style={styles.meta}>
                  {match._count?.tickets ?? 0} boletos vendidos ·{' '}
                  {match._count?.sectorPrices ? `${match._count.sectorPrices} precio(s) personalizado(s)` : 'precios base'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Precios de ${match.homeTeam.name} vs ${match.awayTeam.name}`}
                style={styles.editButton}
                onPress={() => setPricingMatch(match)}
              >
                <Ionicons name="pricetag-outline" size={17} color={colors.primary} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Editar partido ${match.homeTeam.name} vs ${match.awayTeam.name}`} style={styles.editButton} onPress={() => void startEditing(match)}>
                <Ionicons name="pencil-outline" size={17} color={colors.primary} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!editingId} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTap} onPress={resetForm} accessibilityLabel="Cerrar" accessibilityRole="button" />
          <View style={styles.modalCard}>
            <View style={styles.modalTopBar}>
              <View style={styles.modalHandle} />
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar edición" style={styles.modalCloseButton} onPress={resetForm}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {renderMatchForm()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overline: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: colors.text, fontSize: 19, fontWeight: '800' },
  statSuccess: { color: colors.success },
  statLabel: { color: colors.textSecondary, fontSize: 10 },
  statDivider: { width: 1, backgroundColor: colors.border },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warning + '18', borderRadius: 12, borderWidth: 1, borderColor: colors.warning + '40', padding: 12 },
  warningText: { color: colors.text, fontSize: 12, flex: 1, lineHeight: 17 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 9 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  formHint: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { minHeight: 44, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 10, color: colors.text, paddingHorizontal: 12 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  sectorPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 10 },
  sectorPriceName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  priceInput: { width: 88, minHeight: 40, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 10, color: colors.text, paddingHorizontal: 10, textAlign: 'right' },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 10, marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.text, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: colors.textSecondary, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlayStrong, justifyContent: 'flex-end' },
  modalBackdropTap: { flex: 1 },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  modalTopBar: { alignItems: 'center', paddingTop: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  modalCloseButton: { position: 'absolute', right: 12, top: 6, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  modalScroll: { padding: 16, paddingTop: 8, gap: 9 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surfaceRaised, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 },
  matchInfo: { flex: 1 },
  matchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchTeams: { color: colors.text, fontSize: 15, fontWeight: '800', flexShrink: 1 },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: colors.border },
  statusActive: { backgroundColor: colors.success + '25' },
  statusText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  editButton: { width: 36, height: 36, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.critical, fontWeight: '700' },
});
