import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { AdminEvent, AdminEventInput, createAdminEvent, getAdminEvents, updateAdminEvent } from '../api/client';
import { colors, typography } from '../theme';
import AppScreenHeader from '../components/AppScreenHeader';

type EventDraft = AdminEventInput;

const emptyDraft: EventDraft = {
  title: '',
  synopsis: '',
  duration: 90,
  category: 'CINE',
  posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c',
  trailerUrl: null,
  rating: null,
  status: 'COMING_SOON',
};

export default function AdminEventsScreen() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'NOW_SHOWING' | 'COMING_SOON'>('ALL');

  const loadEvents = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await getAdminEvents(token);
      setEvents(response.events);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los eventos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') void loadEvents();
  }, [token, user?.role]);

  const visibleEvents = useMemo(
    () => filter === 'ALL' ? events : events.filter((event) => event.status === filter),
    [events, filter],
  );

  if (!user || user.role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}><Text style={styles.title}>Acceso restringido</Text></View>
      </SafeAreaView>
    );
  }

  const updateDraft = <Key extends keyof EventDraft>(key: Key, value: EventDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const startEditing = (event: AdminEvent) => {
    setEditingId(event.id);
    setDraft({
      title: event.title,
      synopsis: event.synopsis,
      duration: event.duration,
      category: event.category,
      posterUrl: event.posterUrl,
      trailerUrl: event.trailerUrl,
      rating: event.rating === null ? null : Number(event.rating),
      status: event.status,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const saveEvent = async () => {
    if (!token || !draft.title.trim() || !draft.synopsis.trim() || !draft.posterUrl.trim()) {
      Alert.alert('Datos incompletos', 'Completa título, sinopsis y URL del póster.');
      return;
    }

    setSaving(true);
    try {
      const response = editingId
        ? await updateAdminEvent(token, editingId, draft)
        : await createAdminEvent(token, draft);
      setEvents((current) => editingId
        ? current.map((event) => event.id === editingId ? response.event : event)
        : [response.event, ...current]);
      resetForm();
      Alert.alert('Evento guardado', 'Los cambios ya están disponibles en la cartelera.');
    } catch (saveError) {
      Alert.alert('No se pudo guardar', saveError instanceof Error ? saveError.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppScreenHeader eyebrow="Catálogo" title="Eventos" subtitle="Administra lo que aparece en la cartelera y mantén tu programación al día." right={<View style={styles.headerIcon}><Ionicons name="film-outline" size={21} color={colors.text} /></View>} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{events.length}</Text><Text style={styles.statLabel}>Eventos</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statValue, styles.statSuccess]}>{events.filter((event) => event.status === 'NOW_SHOWING').length}</Text><Text style={styles.statLabel}>En cartelera</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statValue, styles.statWarning]}>{events.reduce((total, event) => total + (event._count?.showtimes ?? 0), 0)}</Text><Text style={styles.statLabel}>Funciones</Text></View>
        </View>

        <View style={styles.form}>
          <View style={styles.formHeader}><View><Text style={styles.sectionTitle}>{editingId ? 'Editar evento' : 'Nuevo evento'}</Text><Text style={styles.formHint}>{editingId ? 'Actualiza la información publicada.' : 'Añade una nueva experiencia a la cartelera.'}</Text></View><Ionicons name={editingId ? 'create-outline' : 'add-circle-outline'} size={24} color={colors.primary} /></View>
          <Field label="Título" value={draft.title} onChangeText={(value) => updateDraft('title', value)} />
          <Field label="Sinopsis" value={draft.synopsis} onChangeText={(value) => updateDraft('synopsis', value)} multiline />
          <Field label="Duración (minutos)" value={String(draft.duration)} keyboardType="numeric" onChangeText={(value) => updateDraft('duration', Number(value) || 0)} />
          <Field label="URL del póster" value={draft.posterUrl} onChangeText={(value) => updateDraft('posterUrl', value)} autoCapitalize="none" />
          <Field label="URL del tráiler (opcional)" value={draft.trailerUrl ?? ''} onChangeText={(value) => updateDraft('trailerUrl', value || null)} autoCapitalize="none" />
          <Field label="Valoración (0 a 10, opcional)" value={draft.rating === null ? '' : String(draft.rating)} keyboardType="decimal-pad" onChangeText={(value) => updateDraft('rating', value ? Number(value) : null)} />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.optionRow}>
            {(['CINE', 'TEATRO', 'CONCIERTO'] as const).map((category) => (
              <Pressable key={category} style={[styles.option, draft.category === category && styles.optionSelected]} onPress={() => updateDraft('category', category)}>
                <Text style={styles.optionText}>{category}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.optionRow}>
            {(['NOW_SHOWING', 'COMING_SOON'] as const).map((status) => (
              <Pressable key={status} style={[styles.option, draft.status === status && styles.optionSelected]} onPress={() => updateDraft('status', status)}>
                <Text style={styles.optionText}>{status === 'NOW_SHOWING' ? 'EN CARTELERA' : 'PRÓXIMAMENTE'}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void saveEvent()} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>{editingId ? 'Guardar cambios' : 'Crear evento'}</Text>}
          </Pressable>
          {editingId && <Pressable style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryText}>Cancelar edición</Text></Pressable>}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Cartelera registrada</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar eventos" onPress={() => void loadEvents()}><Ionicons name="refresh-outline" size={19} color={colors.primary} /></Pressable>
        </View>
        <View style={styles.filters}>
          {(['ALL', 'NOW_SHOWING', 'COMING_SOON'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} style={[styles.filter, filter === item && styles.filterSelected]} onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextSelected]}>{item === 'ALL' ? 'Todos' : item === 'NOW_SHOWING' ? 'En cartelera' : 'Próximamente'}</Text>
            </Pressable>
          ))}
        </View>
        {loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={styles.error}>{error}</Text> : visibleEvents.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <Image source={{ uri: event.posterUrl }} style={styles.eventPoster} />
            <View style={styles.eventInfo}>
              <View style={styles.eventTitleRow}><Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text><View style={[styles.statusBadge, event.status === 'NOW_SHOWING' ? styles.statusLive : styles.statusSoon]}><Text style={styles.statusText}>{event.status === 'NOW_SHOWING' ? 'ACTIVO' : 'PRÓXIMO'}</Text></View></View>
              <Text style={styles.meta}>{event.category} · {event._count?.showtimes ?? 0} funciones</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${event.title}`} style={styles.editButton} onPress={() => startEditing(event)}><Ionicons name="pencil-outline" size={17} color={colors.primary} /></Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, multiline, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, marginTop: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statSuccess: { color: colors.success },
  statWarning: { color: colors.warning },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  formHint: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { minHeight: 46, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, color: colors.text, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 82, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  primaryButton: { minHeight: 48, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.text, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: colors.textSecondary, fontWeight: '700' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  refresh: { color: colors.primary, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 2 },
  filter: { backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8 },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterTextSelected: { color: colors.text },
  eventRow: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  eventPoster: { width: 52, height: 68, borderRadius: 8, backgroundColor: colors.input },
  eventInfo: { flex: 1 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  eventTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 5 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  statusLive: { backgroundColor: colors.success + '25' },
  statusSoon: { backgroundColor: colors.warning + '25' },
  statusText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  editButton: { width: 36, height: 36, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.critical, fontWeight: '700' },
});
