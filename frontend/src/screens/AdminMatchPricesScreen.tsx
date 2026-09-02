import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { AdminMatch } from '../api/client';
import { useAdminMatchPricesController } from './AdminMatchPricesScreen.controller';

// ---------------------------------------------------------------------------
// Vista de "Precios por partido" (arquitectura Vista-Controlador).
// Solo dibuja la interfaz; toda la lógica vive en
// `useAdminMatchPricesController` (AdminMatchPricesScreen.controller.ts).
//
// Se abre desde AdminMatchesScreen al tocar "Precios" en un partido.
// ---------------------------------------------------------------------------

type Props = {
  match: AdminMatch;
  onBack: () => void;
};

export default function AdminMatchPricesScreen({ match, onBack }: Props) {
  const { isAdmin, entries, loading, saving, error, customizedCount, load, updateValue, resetToBase, save } =
    useAdminMatchPricesController(match);

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
        <Pressable accessibilityRole="button" style={styles.backRow} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Volver a partidos</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>Precios de este partido</Text>
            <Text style={styles.title} numberOfLines={1}>
              {match.homeTeam.name} vs {match.awayTeam.name}
            </Text>
            <Text style={styles.subtitle}>{match.stadium.name}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="pricetag-outline" size={21} color={colors.text} />
          </View>
        </View>

        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.hintText}>
            Deja un sector vacío para que use su precio base. Los precios que fijes aquí solo aplican a este partido y
            son los que verá el cliente al comprar.
          </Text>
        </View>

        {!loading && !error && (
          <Text style={styles.summary}>
            {customizedCount} de {entries.length} sectores con precio personalizado
          </Text>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.sectorId} style={styles.sectorRow}>
              <View style={styles.sectorInfo}>
                <Text style={styles.sectorName}>
                  {entry.sectorName} <Text style={styles.sectorCode}>({entry.sectorCode})</Text>
                </Text>
                <Text style={styles.meta}>Precio base: ${entry.basePrice}</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                keyboardType="decimal-pad"
                placeholder={`${entry.basePrice}`}
                placeholderTextColor={colors.textSecondary}
                value={entry.value}
                onChangeText={(value) => updateValue(entry.sectorId, value)}
              />
              {entry.value.trim() !== '' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Usar precio base para ${entry.sectorName}`}
                  style={styles.resetButton}
                  onPress={() => resetToBase(entry.sectorId)}
                >
                  <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          ))
        )}

        {!loading && !error && (
          <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.text} />
                <Text style={styles.buttonText}>Guardar precios</Text>
              </>
            )}
          </Pressable>
        )}

        {!loading && (
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => void load()}>
            <Ionicons name="refresh-outline" size={15} color={colors.primary} />
            <Text style={styles.secondaryText}>Actualizar</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  backText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overline: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', fontFamily: typography.display, marginTop: 2 },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.primary + '18', borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '30', padding: 12 },
  hintText: { color: colors.text, fontSize: 12, flex: 1, lineHeight: 17 },
  summary: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  sectorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceRaised, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 },
  sectorInfo: { flex: 1 },
  sectorName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  sectorCode: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  priceInput: { width: 92, minHeight: 40, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 10, color: colors.text, paddingHorizontal: 10, textAlign: 'right' },
  resetButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: 10, marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.text, fontWeight: '800' },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  secondaryText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  error: { color: colors.critical, fontWeight: '700' },
});
