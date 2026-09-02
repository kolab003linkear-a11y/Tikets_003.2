import React from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useAdminTeamsController } from './AdminTeamsScreen.controller';

// ---------------------------------------------------------------------------
// Vista del módulo "Equipos" (arquitectura Vista-Controlador).
// Solo dibuja la interfaz; toda la lógica vive en
// `useAdminTeamsController` (AdminTeamsScreen.controller.ts).
// ---------------------------------------------------------------------------

export default function AdminTeamsScreen() {
  const {
    isAdmin,
    teams,
    draft,
    editingId,
    loading,
    saving,
    deletingId,
    error,
    teamsWithLogo,
    loadTeams,
    updateDraft,
    startEditing,
    resetForm,
    save,
    confirmRemove,
  } = useAdminTeamsController();

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Acceso restringido</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>Infraestructura</Text>
            <Text style={styles.title}>Equipos</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-outline" size={21} color={colors.text} />
          </View>
        </View>
        <Text style={styles.subtitle}>Registra los equipos que participan en los partidos de cada estadio.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{teams.length}</Text>
            <Text style={styles.statLabel}>Equipos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statSuccess]}>{teamsWithLogo}</Text>
            <Text style={styles.statLabel}>Con logo</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.sectionTitle}>{editingId ? 'Editar equipo' : 'Nuevo equipo'}</Text>
              <Text style={styles.formHint}>{editingId ? 'Actualiza los datos del equipo.' : 'Añade un equipo para poder programar partidos.'}</Text>
            </View>
            <Ionicons name={editingId ? 'create-outline' : 'add-circle-outline'} size={24} color={colors.primary} />
          </View>

          <Field label="Nombre del equipo" value={draft.name} onChangeText={(value) => updateDraft('name', value)} placeholder="Ej. LDU Quito" />
          <Field label="Ciudad (opcional)" value={draft.city} onChangeText={(value) => updateDraft('city', value)} placeholder="Ej. Quito" />
          <Field label="URL del logo (opcional)" value={draft.logoUrl} onChangeText={(value) => updateDraft('logoUrl', value)} placeholder="https://..." autoCapitalize="none" />

          <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>{editingId ? 'Guardar cambios' : 'Crear equipo'}</Text>}
          </Pressable>
          {editingId && (
            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryText}>Cancelar edición</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Equipos registrados</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar equipos" onPress={() => void loadTeams()}>
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          teams.map((team) => (
            <View key={team.id} style={styles.teamRow}>
              {team.logoUrl ? (
                <Image source={{ uri: team.logoUrl }} style={styles.teamLogo} />
              ) : (
                <View style={styles.teamLogoFallback}>
                  <Text style={styles.teamInitial}>{team.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                {team.city ? <Text style={styles.meta}>{team.city}</Text> : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${team.name}`} style={styles.iconButton} onPress={() => startEditing(team)}>
                <Ionicons name="pencil-outline" size={17} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${team.name}`}
                style={styles.iconButton}
                onPress={() => confirmRemove(team)}
                disabled={deletingId === team.id}
              >
                {deletingId === team.id ? <ActivityIndicator color={colors.critical} size="small" /> : <Ionicons name="trash-outline" size={17} color={colors.critical} />}
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
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
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 9 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  formHint: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { minHeight: 44, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 10, color: colors.text, paddingHorizontal: 12 },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 10, marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.text, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: colors.textSecondary, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surfaceRaised, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 },
  teamLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.input },
  teamLogoFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  teamInitial: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  teamInfo: { flex: 1 },
  teamName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  iconButton: { width: 36, height: 36, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.critical, fontWeight: '700' },
});
