import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { AdminEvent, AdminRoom, AdminRoomInput, AdminShowtime, AdminShowtimeInput, createAdminRoom, createAdminShowtime, getAdminEvents, getAdminRooms, getAdminShowtimes, updateAdminRoom, updateAdminShowtime } from '../api/client';
import { colors, typography } from '../theme';

const emptyRoom: AdminRoomInput = { name: '', capacity: 64, seatLayout: { rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 8 } };
const emptyShowtime: AdminShowtimeInput = { movieId: '', roomId: '', startTime: '', price: 0, availableSeats: 0 };

export default function AdminScheduleScreen() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([]);
  const [roomDraft, setRoomDraft] = useState<AdminRoomInput>(emptyRoom);
  const [showtimeDraft, setShowtimeDraft] = useState<AdminShowtimeInput>(emptyShowtime);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingShowtimeId, setEditingShowtimeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalCapacity = useMemo(() => rooms.reduce((total, room) => total + room.capacity, 0), [rooms]);
  const roomSchedule = useMemo(() => {
  return rooms.map((room) => {
    const roomShowtimes = showtimes
      .filter((showtime) => showtime.room?.id === room.id)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return {
      room,
      showtimes: roomShowtimes,
    };
  });
}, [rooms, showtimes]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [eventResponse, roomResponse, showtimeResponse] = await Promise.all([getAdminEvents(token), getAdminRooms(token), getAdminShowtimes(token)]);
      setEvents(eventResponse.events);
      setRooms(roomResponse.rooms);
      setShowtimes(showtimeResponse.showtimes);
      setShowtimeDraft((current) => ({ ...current, movieId: current.movieId || eventResponse.events[0]?.id || '', roomId: current.roomId || roomResponse.rooms[0]?.id || '' }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar salas y funciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') void loadData();
  }, [token, user?.role]);

  if (!user || user.role !== 'ADMIN') {
    return <SafeAreaView style={styles.safeArea}><View style={styles.centered}><Text style={styles.title}>Acceso restringido</Text></View></SafeAreaView>;
  }

  const saveRoom = async () => {
    if (!token || !roomDraft.name.trim() || roomDraft.capacity < 1) {
      Alert.alert('Datos incompletos', 'Indica nombre y capacidad para la sala.');
      return;
    }
    setSaving(true);
    try {
      const response = editingRoomId ? await updateAdminRoom(token, editingRoomId, roomDraft) : await createAdminRoom(token, roomDraft);
      setRooms((current) => editingRoomId ? current.map((room) => room.id === editingRoomId ? response.room : room) : [...current, response.room]);
      setRoomDraft(emptyRoom);
      setEditingRoomId(null);
    } catch (saveError) {
      Alert.alert('No se pudo guardar la sala', saveError instanceof Error ? saveError.message : 'Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  const saveShowtime = async () => {
    if (!token || !showtimeDraft.movieId || !showtimeDraft.roomId || !showtimeDraft.startTime || showtimeDraft.price <= 0) {
      Alert.alert('Datos incompletos', 'Selecciona evento, sala, fecha y precio.');
      return;
    }
    setSaving(true);
    try {
      const response = editingShowtimeId ? await updateAdminShowtime(token, editingShowtimeId, showtimeDraft) : await createAdminShowtime(token, showtimeDraft);
      setShowtimes((current) => editingShowtimeId ? current.map((item) => item.id === editingShowtimeId ? response.showtime : item) : [...current, response.showtime]);
      setShowtimeDraft({ ...emptyShowtime, movieId: events[0]?.id ?? '', roomId: rooms[0]?.id ?? '' });
      setEditingShowtimeId(null);
    } catch (saveError) {
      Alert.alert('No se pudo guardar la función', saveError instanceof Error ? saveError.message : 'Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  const editRoom = (room: AdminRoom) => {
    setEditingRoomId(room.id);
    setRoomDraft({ name: room.name, capacity: room.capacity, seatLayout: room.seatLayout });
  };

  const editShowtime = (showtime: AdminShowtime) => {
    setEditingShowtimeId(showtime.id);
    setShowtimeDraft({ movieId: showtime.movieEvent.id, roomId: showtime.room.id, startTime: showtime.startTime.slice(0, 16), price: Number(showtime.price), availableSeats: showtime.availableSeats });
  };

  const selectValue = (label: string, options: Array<{ id: string; name: string }>, selected: string, onSelect: (id: string) => void) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>{options.map((option) => <Pressable key={option.id} style={[styles.option, selected === option.id && styles.optionSelected]} onPress={() => onSelect(option.id)}><Text style={styles.optionText}>{option.name}</Text></Pressable>)}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View><Text style={styles.overline}>Programación</Text><Text style={styles.title}>Salas y funciones</Text></View>
          <View style={styles.headerIcon}><Ionicons name="calendar-outline" size={21} color={colors.text} /></View>
        </View>
        <Text style={styles.subtitle}>Configura la distribución y publica horarios con precio y disponibilidad.</Text>
        {loading ? <ActivityIndicator color={colors.primary} size="large" /> : error ? <Text style={styles.error}>{error}</Text> : <>
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statValue}>{rooms.length}</Text><Text style={styles.statLabel}>Salas</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={styles.statValue}>{totalCapacity}</Text><Text style={styles.statLabel}>Aforo total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={[styles.statValue, styles.statSuccess]}>{showtimes.length}</Text><Text style={styles.statLabel}>Funciones</Text></View>
          </View>
          <View style={styles.form}>
            <View style={styles.formHeader}><View><Text style={styles.sectionTitle}>{editingRoomId ? 'Editar sala' : 'Nueva sala'}</Text><Text style={styles.formHint}>Define el mapa de localidades y su capacidad.</Text></View><Ionicons name="business-outline" size={23} color={colors.primary} /></View>
            <Field label="Nombre" value={roomDraft.name} onChangeText={(value) => setRoomDraft({ ...roomDraft, name: value })} />
            <Field label="Capacidad" value={String(roomDraft.capacity)} keyboardType="numeric" onChangeText={(value) => setRoomDraft({ ...roomDraft, capacity: Number(value) || 0 })} />
            <Field label="Filas (separadas por comas)" value={roomDraft.seatLayout.rows.join(', ')} onChangeText={(value) => setRoomDraft({ ...roomDraft, seatLayout: { ...roomDraft.seatLayout, rows: value.split(',').map((item) => item.trim()).filter(Boolean) } })} />
            <Field label="Columnas" value={String(roomDraft.seatLayout.columns)} keyboardType="numeric" onChangeText={(value) => setRoomDraft({ ...roomDraft, seatLayout: { ...roomDraft.seatLayout, columns: Number(value) || 0 } })} />
            <Pressable style={styles.primaryButton} onPress={() => void saveRoom()} disabled={saving}><Text style={styles.buttonText}>{editingRoomId ? 'Guardar sala' : 'Crear sala'}</Text></Pressable>
          </View>
          <Text style={styles.listTitle}>Salas registradas</Text>
          {rooms.map((room) => <View style={styles.row} key={room.id}><View style={styles.roomIcon}><Ionicons name="grid-outline" size={21} color={colors.primary} /></View><View style={styles.info}><Text style={styles.rowTitle}>{room.name}</Text><Text style={styles.meta}>{room.capacity} plazas · {room.seatLayout.rows.length} filas x {room.seatLayout.columns} columnas</Text><View style={styles.roomFooter}><Text style={styles.roomFunctions}>{room._count?.showtimes ?? 0} funciones programadas</Text><View style={styles.capacityBar}><View style={[styles.capacityFill, { width: `${Math.min(100, (room.capacity / Math.max(totalCapacity, 1)) * 100)}%` }]} /></View></View></View><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${room.name}`} style={styles.editButton} onPress={() => editRoom(room)}><Ionicons name="pencil-outline" size={17} color={colors.primary} /></Pressable></View>)}

          <View style={styles.form}>
            <View style={styles.formHeader}><View><Text style={styles.sectionTitle}>{editingShowtimeId ? 'Editar función' : 'Nueva función'}</Text><Text style={styles.formHint}>Publica cuándo y dónde ocurre cada evento.</Text></View><Ionicons name="time-outline" size={23} color={colors.primary} /></View>
            {selectValue('Evento', events.map((event) => ({ id: event.id, name: event.title })), showtimeDraft.movieId, (movieId) => setShowtimeDraft({ ...showtimeDraft, movieId }))}
            {selectValue('Sala', rooms.map((room) => ({ id: room.id, name: room.name })), showtimeDraft.roomId, (roomId) => setShowtimeDraft({ ...showtimeDraft, roomId }))}
            <Field label="Fecha y hora (ISO)" value={showtimeDraft.startTime} placeholder="2026-09-15T20:00" onChangeText={(value) => setShowtimeDraft({ ...showtimeDraft, startTime: value })} />
            <Field label="Precio" value={String(showtimeDraft.price || '')} keyboardType="decimal-pad" onChangeText={(value) => setShowtimeDraft({ ...showtimeDraft, price: Number(value) || 0 })} />
            <Field label="Disponibilidad" value={String(showtimeDraft.availableSeats || '')} keyboardType="numeric" onChangeText={(value) => setShowtimeDraft({ ...showtimeDraft, availableSeats: Number(value) || 0 })} />
            <Pressable style={styles.primaryButton} onPress={() => void saveShowtime()} disabled={saving}><Text style={styles.buttonText}>{editingShowtimeId ? 'Guardar función' : 'Crear función'}</Text></Pressable>
          </View>
          <Text style={styles.listTitle}>Funciones programadas</Text>
          {showtimes.map((showtime) => <View style={styles.row} key={showtime.id}><View style={styles.dateBadge}><Text style={styles.dateDay}>{new Date(showtime.startTime).getDate()}</Text><Text style={styles.dateMonth}>{new Date(showtime.startTime).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()}</Text></View><View style={styles.info}><Text style={styles.rowTitle}>{showtime.movieEvent.title}</Text><Text style={styles.meta}>{new Date(showtime.startTime).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} · {showtime.room.name}</Text><Text style={styles.showtimeMeta}>${Number(showtime.price).toFixed(2)} · {showtime.availableSeats}/{showtime.room.capacity} libres</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Editar función de ${showtime.movieEvent.title}`} style={styles.editButton} onPress={() => editShowtime(showtime)}><Ionicons name="pencil-outline" size={17} color={colors.primary} /></Pressable></View>)}
        </>}
        <Text style={styles.listTitle}>Horario de salas</Text>

{roomSchedule.map(({ room, showtimes: roomShowtimes }) => (
  <View style={styles.row} key={`schedule-${room.id}`}>
    <View style={styles.roomIcon}>
      <Ionicons name="calendar-outline" size={21} color={colors.primary} />
    </View>

    <View style={styles.info}>
      <Text style={styles.rowTitle}>{room.name}</Text>

      {roomShowtimes.length === 0 ? (
        <Text style={styles.meta}>
  {roomShowtimes.length === 0
    ? 'Sala disponible · Sin funciones'
    : `${roomShowtimes.length} función(es) programada(s)`}
</Text>
      ) : (
        roomShowtimes.map((showtime) => (
          <View key={showtime.id} style={{ marginTop: 6 }}>
            <Text style={styles.meta}>
              {showtime.movieEvent?.title ?? 'Evento'} ·{' '}
              {new Date(showtime.startTime).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.showtimeMeta}>
              {showtime.availableSeats}/{room.capacity} asientos libres
            </Text>
          </View>
        ))
      )}
    </View>
  </View>
))}
        <Pressable onPress={() => void loadData()}><Text style={styles.refresh}>Actualizar datos</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={colors.textSecondary} /></View>;
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
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, marginTop: 8 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  formHint: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { minHeight: 46, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, color: colors.text, paddingHorizontal: 12 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 46, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: colors.text, fontWeight: '800' },
  listTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  row: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  roomIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  roomFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  roomFunctions: { color: colors.textSecondary, fontSize: 10 },
  capacityBar: { flex: 1, height: 4, backgroundColor: colors.input, borderRadius: 2, overflow: 'hidden' },
  capacityFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  dateBadge: { width: 45, height: 49, borderRadius: 11, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.text, fontSize: 19, fontWeight: '800', lineHeight: 21 },
  dateMonth: { color: colors.primary, fontSize: 9, fontWeight: '800' },
  showtimeMeta: { color: colors.success, fontSize: 11, fontWeight: '700', marginTop: 5 },
  editButton: { width: 36, height: 36, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  editText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  refresh: { color: colors.primary, textAlign: 'center', fontWeight: '800', paddingVertical: 10 },
  error: { color: colors.critical, fontWeight: '700' },
});
