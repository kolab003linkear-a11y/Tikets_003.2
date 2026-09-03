import React from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { computeSeatCount, useAdminStadiumsController } from './AdminStadiumsScreen.controller';

// ---------------------------------------------------------------------------
// Vista del módulo "Estadios" (arquitectura Vista-Controlador).
//
// Este componente solo dibuja la interfaz: todo el estado, las validaciones
// y las llamadas a la API viven en `useAdminStadiumsController`
// (AdminStadiumsScreen.controller.ts).
// ---------------------------------------------------------------------------

export default function AdminStadiumsScreen() {
  const {
    isAdmin,
    stadiums,
    draft,
    loading,
    saving,
    error,
    totalCapacity,
    totalSectors,
    stadiumSeatCount,
    sectorsCapacitySum,
    loadStadiums,
    updateField,
    updateSector,
    addSector,
    removeSector,
    save,
  } = useAdminStadiumsController();

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
            <Text style={styles.title}>Estadios</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="football-outline" size={21} color={colors.text} />
          </View>
        </View>
        <Text style={styles.subtitle}>Registra sedes, imágenes y sectores para vender entradas de partidos.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stadiums.length}</Text>
            <Text style={styles.statLabel}>Sedes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCapacity.toLocaleString('es-ES')}</Text>
            <Text style={styles.statLabel}>Aforo total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statSuccess]}>{totalSectors}</Text>
            <Text style={styles.statLabel}>Sectores</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.sectionTitle}>Nueva sede</Text>
              <Text style={styles.formHint}>La capacidad debe coincidir con filas, columnas y sectores.</Text>
            </View>
            <Ionicons name="add-circle-outline" size={23} color={colors.primary} />
          </View>

          <Field label="Nombre del estadio" value={draft.name} onChangeText={(name) => updateField('name', name)} placeholder="Ej. Estadio Banco Guayaquil" />
          <Field label="Ciudad" value={draft.city} onChangeText={(city) => updateField('city', city)} placeholder="Ej. Quito" />
          <Field label="Capacidad total" value={draft.capacity} keyboardType="numeric" onChangeText={(capacity) => updateField('capacity', capacity)} placeholder="Ej. 40000" />
          <Field label="URL de imagen" value={draft.imageUrl} onChangeText={(imageUrl) => updateField('imageUrl', imageUrl)} placeholder="https://..." autoCapitalize="none" />

          <View style={styles.inline}>
            <View style={styles.inlineField}>
              <Field label="Filas (separadas por coma)" value={draft.rowsText} onChangeText={(rowsText) => updateField('rowsText', rowsText)} placeholder="A,B,C,D" autoCapitalize="characters" />
            </View>
            <View style={styles.inlineField}>
              <Field label="Columnas" value={draft.columns} keyboardType="numeric" onChangeText={(columns) => updateField('columns', columns)} placeholder="Ej. 40" />
            </View>
          </View>
          <Text style={styles.formHint}>Aforo calculado: {stadiumSeatCount.toLocaleString('es-ES')} asientos</Text>

          <Text style={styles.label}>Sectores</Text>
          {draft.sectors.map((sector, index) => (
            <View style={styles.sectorBox} key={sector.key}>
              <View style={styles.sectorHeader}>
                <Text style={styles.sectorTitle}>Sector {index + 1}</Text>
                {draft.sectors.length > 1 && (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Quitar sector ${index + 1}`} onPress={() => removeSector(sector.key)}>
                    <Ionicons name="trash-outline" size={17} color={colors.critical} />
                  </Pressable>
                )}
              </View>

              <Field label="Nombre" value={sector.name} onChangeText={(value) => updateSector(sector.key, { name: value })} placeholder="Ej. General Norte" />
              <Field label="Código" value={sector.code} onChangeText={(value) => updateSector(sector.key, { code: value.toUpperCase() })} placeholder="GEN_N" autoCapitalize="characters" />

              <View style={styles.inline}>
                <View style={styles.inlineField}>
                  <Field label="Capacidad" value={sector.capacity} keyboardType="numeric" onChangeText={(value) => updateSector(sector.key, { capacity: value })} />
                </View>
                <View style={styles.inlineField}>
                  <Field label="Precio" value={sector.price} keyboardType="decimal-pad" onChangeText={(value) => updateSector(sector.key, { price: value })} />
                </View>
              </View>

              <View style={styles.inline}>
                <View style={styles.inlineField}>
                  <Field label="Filas (separadas por coma)" value={sector.rowsText} onChangeText={(value) => updateSector(sector.key, { rowsText: value })} placeholder="A,B,C" autoCapitalize="characters" />
                </View>
                <View style={styles.inlineField}>
                  <Field label="Columnas" value={sector.columns} keyboardType="numeric" onChangeText={(value) => updateSector(sector.key, { columns: value })} placeholder="Ej. 20" />
                </View>
              </View>
              <Text style={styles.sectorHint}>Aforo del sector: {computeSeatCount(sector.rowsText, sector.columns).toLocaleString('es-ES')} asientos</Text>
            </View>
          ))}
          <Text style={styles.formHint}>
            Capacidad asignada en sectores: {sectorsCapacitySum.toLocaleString('es-ES')} / {draft.capacity || '—'}
          </Text>

          <Pressable accessibilityRole="button" style={styles.addSector} onPress={addSector}>
            <Ionicons name="add" size={17} color={colors.primary} />
            <Text style={styles.addSectorText}>Añadir sector</Text>
          </Pressable>

          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => void save()} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.text} />
                <Text style={styles.buttonText}>Guardar estadio</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Sedes registradas</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar lista de estadios" onPress={() => void loadStadiums()}>
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          stadiums.map((stadium) => (
            <View style={styles.stadiumRow} key={stadium.id}>
              {stadium.imageUrl ? (
                <Image source={{ uri: stadium.imageUrl }} style={styles.stadiumImage} />
              ) : (
                <View style={styles.stadiumImageFallback}>
                  <Ionicons name="football-outline" size={22} color={colors.primary} />
                </View>
              )}
              <View style={styles.stadiumInfo}>
                <Text style={styles.stadiumName}>{stadium.name}</Text>
                <Text style={styles.meta}>{stadium.city} · {stadium.capacity.toLocaleString('es-ES')} localidades</Text>
                <Text style={styles.meta}>{stadium.sectors.length} sectores · {stadium._count?.matches ?? 0} partidos</Text>
              </View>
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
  sectorBox: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 12, gap: 7 },
  sectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectorTitle: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sectorHint: { color: colors.textSecondary, fontSize: 10 },
  inline: { flexDirection: 'row', gap: 8 },
  inlineField: { flex: 1 },
  addSector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  addSectorText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  primaryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: 10, marginTop: 4 },
  buttonText: { color: colors.text, fontWeight: '800' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  stadiumRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surfaceRaised, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 },
  stadiumImage: { width: 62, height: 62, borderRadius: 9 },
  stadiumImageFallback: { width: 62, height: 62, borderRadius: 9, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  stadiumInfo: { flex: 1 },
  stadiumName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  error: { color: colors.critical, fontWeight: '700' },
});
