import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { createAdminRoom, getAdminRooms, AdminRoom } from '../api/client';
import { colors } from '../theme';
import AdminEventsScreen from './AdminEventsScreen';

const existingTheaters = [
  { name: 'Teatro Scala', capacity: 300 },
  { name: 'Teatro Nacional Sucre', capacity: 480 },
];

export default function AdminTheatersScreen() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCapacity, setManualCapacity] = useState('200');
  const [manualRows, setManualRows] = useState('A, B, C, D, E, F, G, H');
  const [manualColumns, setManualColumns] = useState('20');

  const loadRooms = async () => {
    if (!token) return;
    setLoading(true);
    try {
      setRooms((await getAdminRooms(token)).rooms);
    } catch {
      Alert.alert('No se pudieron cargar los teatros', 'Revisa la conexión e inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRooms();
  }, [token]);

  const addExistingTheater = async (theater: typeof existingTheaters[number]) => {
    if (!token || rooms.some((room) => room.name.toLowerCase() === theater.name.toLowerCase())) return;
    setAdding(theater.name);
    try {
      const rows = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
      const response = await createAdminRoom(token, {
        name: theater.name,
        capacity: theater.capacity,
        seatLayout: { rows, columns: 30 },
      });
      setRooms((current) => [...current, response.room]);
      Alert.alert('Teatro agregado', `${theater.name} ya está disponible para programar funciones.`);
    } catch (error) {
      Alert.alert('No se pudo agregar', error instanceof Error ? error.message : 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setAdding('');
    }
  };

  const addManualTheater = async () => {
    const name = manualName.trim();
    const capacity = Number(manualCapacity);
    const columns = Number(manualColumns);
    const rows = manualRows.split(',').map((row) => row.trim()).filter(Boolean);
    if (!token || !name || !Number.isInteger(capacity) || capacity < 1 || !Number.isInteger(columns) || columns < 1 || rows.length === 0) {
      Alert.alert('Datos incompletos', 'Indica nombre, capacidad, filas y columnas válidas.');
      return;
    }
    if (rooms.some((room) => room.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Teatro ya registrado', 'Ya existe un teatro con ese nombre.');
      return;
    }
    setAdding('manual');
    try {
      const response = await createAdminRoom(token, { name, capacity, seatLayout: { rows, columns } });
      setRooms((current) => [...current, response.room]);
      setManualName('');
      Alert.alert('Teatro agregado', `${name} ya está disponible para programar funciones.`);
    } catch (error) {
      Alert.alert('No se pudo agregar', error instanceof Error ? error.message : 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setAdding('');
    }
  };

  return (
    <AdminEventsScreen
      categoryFilter="TEATRO"
      topContent={(
        <View style={styles.existingPanel}>
        <View style={styles.panelHeader}>
          <View style={styles.iconBox}><Ionicons name="business-outline" size={19} color={colors.primary} /></View>
          <View style={styles.panelCopy}>
            <Text style={styles.panelTitle}>Espacios teatrales</Text>
            <Text style={styles.panelHint}>Elige un teatro conocido o registra uno propio.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar teatros" onPress={() => void loadRooms()}>
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.subheading}>Teatros conocidos</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : existingTheaters.map((theater) => {
          const added = rooms.some((room) => room.name.toLowerCase() === theater.name.toLowerCase());
          return (
            <View key={theater.name} style={styles.theaterRow}>
              <View style={styles.theaterIcon}><Ionicons name="easel-outline" size={20} color={colors.primary} /></View>
              <View style={styles.theaterCopy}>
                <Text style={styles.theaterName}>{theater.name}</Text>
                <Text style={styles.theaterMeta}>{added ? 'Disponible para programar funciones' : `${theater.capacity} localidades`}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={added ? `${theater.name} agregado` : `Agregar ${theater.name}`}
                disabled={added || adding !== ''}
                onPress={() => void addExistingTheater(theater)}
                style={[styles.addButton, added && styles.addedButton]}
              >
                {adding === theater.name ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.addButtonText}>{added ? 'Agregado' : 'Agregar'}</Text>}
              </Pressable>
            </View>
          );
        })}
        <View style={styles.manualForm}>
          <View style={styles.manualHeader}>
            <View style={styles.manualIcon}><Ionicons name="add-outline" size={19} color={colors.text} /></View>
            <View style={styles.panelCopy}>
              <Text style={styles.manualTitle}>Agregar teatro</Text>
              <Text style={styles.panelHint}>Registra cualquier espacio que no esté en la lista.</Text>
            </View>
          </View>
          <TextInput value={manualName} onChangeText={setManualName} placeholder="Nombre del teatro" placeholderTextColor={colors.textSecondary} style={styles.input} />
          <View style={styles.inputRow}>
            <TextInput value={manualCapacity} onChangeText={setManualCapacity} placeholder="Capacidad" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={[styles.input, styles.smallInput]} />
            <TextInput value={manualColumns} onChangeText={setManualColumns} placeholder="Columnas" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={[styles.input, styles.smallInput]} />
          </View>
          <TextInput value={manualRows} onChangeText={setManualRows} placeholder="Filas: A, B, C" placeholderTextColor={colors.textSecondary} style={styles.input} />
          <Pressable accessibilityRole="button" style={[styles.manualButton, adding === 'manual' && styles.disabled]} onPress={() => void addManualTheater()} disabled={adding !== ''}>
            {adding === 'manual' ? <ActivityIndicator color={colors.text} /> : <><Ionicons name="add-circle-outline" size={17} color={colors.text} /><Text style={styles.addButtonText}>Agregar teatro</Text></>}
          </Pressable>
        </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  existingPanel: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, gap: 10 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  panelCopy: { flex: 1 },
  panelTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  panelHint: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  subheading: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8 },
  theaterRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  theaterIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  theaterCopy: { flex: 1 },
  theaterName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  theaterMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  addButton: { minWidth: 78, minHeight: 34, paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addedButton: { backgroundColor: colors.success + '55' },
  addButtonText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  manualForm: { marginTop: 8, padding: 12, backgroundColor: colors.surfaceRaised, borderRadius: 13, borderWidth: 1, borderColor: colors.borderStrong, gap: 9 },
  manualHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 2 },
  manualIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  manualTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  input: { minHeight: 40, flex: 1, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9, color: colors.text, paddingHorizontal: 11, fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  smallInput: { minWidth: 0 },
  manualButton: { minHeight: 40, borderRadius: 9, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  disabled: { opacity: 0.65 },
});