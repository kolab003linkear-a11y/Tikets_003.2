import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BusRoute, BusTrip, AdminBusRouteInput, AdminBusTripInput, createAdminRoute, createAdminTrip, getAdminRoutes, getAdminTrips, updateAdminRoute, updateAdminTrip } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';
import AppState from '../components/AppState';

const CITIES = ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta'];
const TERMINALS = ['QUITUMBE', 'CALDERON', 'CARCELEN', 'GYE', 'ABA', 'MTA'];

const routeEmpty: AdminBusRouteInput = { origin: '', originCity: '', destination: '', operator: '', originTerminal: 'QUITUMBE', status: 'ACTIVE' };
const tripEmpty: AdminBusTripInput = { routeId: '', departureTime: new Date().toISOString().slice(0, 16), arrivalTime: null, boardingPlatform: null, baggageInfo: null, price: 10, totalSeats: 40, status: 'SCHEDULED' };

export default function AdminBusesScreen() {
  const { user, token } = useAuth();
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [trips, setTrips] = useState<BusTrip[]>([]);
  const [route, setRoute] = useState(routeEmpty);
  const [trip, setTrip] = useState(tripEmpty);
  const [editingRoute, setEditingRoute] = useState('');
  const [editingTrip, setEditingTrip] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [routeResponse, tripResponse] = await Promise.all([getAdminRoutes(token), getAdminTrips(token)]);
      setRoutes(routeResponse.routes);
      setTrips(tripResponse.trips);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') void load();
  }, [token, user?.role]);

  if (!user || user.role !== 'ADMIN') return <AppState title="Acceso restringido" />;

  const saveRoute = async () => {
    if (!token || !route.origin.trim() || !route.originCity?.trim() || !route.destination.trim() || !route.operator.trim()) {
      Alert.alert('Datos incompletos', 'Completa ciudad, origen, destino y operador.');
      return;
    }
    setSaving(true);
    try {
      const response = editingRoute ? await updateAdminRoute(token, editingRoute, route) : await createAdminRoute(token, route);
      setRoutes((current) => (editingRoute ? current.map((item) => (item.id === editingRoute ? response.route : item)) : [response.route, ...current]));
      setRoute(routeEmpty);
      setEditingRoute('');
    } catch (e) {
      Alert.alert('No se pudo guardar la ruta', e instanceof Error ? e.message : 'Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  const saveTrip = async () => {
    if (!token || !trip.routeId || !trip.departureTime || Number(trip.price) <= 0 || trip.totalSeats < 1) {
      Alert.alert('Datos incompletos', 'Completa ruta, fecha, precio y asientos.');
      return;
    }
    setSaving(true);
    try {
      const response = editingTrip ? await updateAdminTrip(token, editingTrip, trip) : await createAdminTrip(token, trip);
      setTrips((current) => (editingTrip ? current.map((item) => (item.id === editingTrip ? response.trip : item)) : [response.trip, ...current]));
      setTrip(tripEmpty);
      setEditingTrip('');
    } catch (e) {
      Alert.alert('No se pudo guardar el viaje', e instanceof Error ? e.message : 'Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Administrar Buses</Text>
        {error ? <AppState title="No se pudieron cargar" message={error} /> : loading ? <AppState loading title="Cargando..." /> : null}

        <AppCard style={styles.form}>
          <Text style={styles.heading}>{editingRoute ? 'Editar ruta' : 'Nueva ruta'}</Text>
          <View style={styles.cityRow}>
            {CITIES.map((city) => (
              <Pressable
                key={city}
                onPress={() => setRoute((current) => ({ ...current, originCity: city, origin: city }))}
                style={[styles.chip, route.originCity === city && styles.chipActive]}
              >
                <Text style={[styles.chipText, route.originCity === city && styles.chipTextActive]}>{city}</Text>
              </Pressable>
            ))}
          </View>
          <AppInput label="Destino" value={route.destination} onChangeText={(destination) => setRoute((current) => ({ ...current, destination }))} placeholder="Ej. Guayaquil" />
          <AppInput label="Operador" value={route.operator} onChangeText={(operator) => setRoute((current) => ({ ...current, operator }))} placeholder="Ej. TransEsmeraldas" />
          <View style={styles.cityRow}>
            {TERMINALS.map((terminal) => (
              <Pressable
                key={terminal}
                onPress={() => setRoute((current) => ({ ...current, originTerminal: terminal as AdminBusRouteInput['originTerminal'] }))}
                style={[styles.chip, route.originTerminal === terminal && styles.chipActive]}
              >
                <Text style={[styles.chipText, route.originTerminal === terminal && styles.chipTextActive]}>{terminal}</Text>
              </Pressable>
            ))}
          </View>
          <AppButton label={editingRoute ? 'Actualizar ruta' : 'Crear ruta'} onPress={() => void saveRoute()} loading={saving} />
          {editingRoute ? <AppButton label="Cancelar edición" variant="secondary" onPress={() => { setEditingRoute(''); setRoute(routeEmpty); }} /> : null}
        </AppCard>

        {routes.map((item) => (
          <AppCard key={item.id} style={styles.rowCard}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.originCity ?? item.origin} → {item.destination}</Text>
              <Text style={styles.meta}>{item.operator} · {item.originTerminal} · {item._count?.trips ?? 0} viajes</Text>
            </View>
            <Pressable onPress={() => { setEditingRoute(item.id); setRoute({ origin: item.originCity ?? item.origin, originCity: item.originCity ?? item.origin, destination: item.destination, operator: item.operator, originTerminal: item.originTerminal, status: item.status }); }} style={styles.editBtn}>
              <Text style={styles.editText}>Editar</Text>
            </Pressable>
          </AppCard>
        ))}

        <AppCard style={styles.form}>
          <Text style={styles.heading}>{editingTrip ? 'Editar viaje' : 'Nuevo viaje'}</Text>
          <View style={styles.cityRow}>
            {routes.map((item) => (
              <Pressable key={item.id} onPress={() => setTrip((current) => ({ ...current, routeId: item.id }))} style={[styles.chip, trip.routeId === item.id && styles.chipActive]}>
                <Text style={[styles.chipText, trip.routeId === item.id && styles.chipTextActive]}>{item.originCity ?? item.origin}→{item.destination}</Text>
              </Pressable>
            ))}
          </View>
          <AppInput label="Fecha y hora de salida" value={trip.departureTime} onChangeText={(departureTime) => setTrip((current) => ({ ...current, departureTime }))} />
          <AppInput label="Andén" value={trip.boardingPlatform ?? ''} onChangeText={(boardingPlatform) => setTrip((current) => ({ ...current, boardingPlatform }))} placeholder="Andén 12" />
          <AppInput label="Equipaje" value={trip.baggageInfo ?? ''} onChangeText={(baggageInfo) => setTrip((current) => ({ ...current, baggageInfo }))} placeholder="1 pieza incluida" />
          <AppInput label="Precio ($)" value={String(trip.price)} onChangeText={(price) => setTrip((current) => ({ ...current, price: Number(price) || 0 }))} keyboardType="numeric" />
          <AppInput label="Asientos totales" value={String(trip.totalSeats)} onChangeText={(totalSeats) => setTrip((current) => ({ ...current, totalSeats: Number(totalSeats) || 0 }))} keyboardType="numeric" />
          <AppButton label={editingTrip ? 'Actualizar viaje' : 'Crear viaje'} onPress={() => void saveTrip()} loading={saving} />
          {editingTrip ? <AppButton label="Cancelar edición" variant="secondary" onPress={() => { setEditingTrip(''); setTrip(tripEmpty); }} /> : null}
        </AppCard>

        {trips.map((item) => (
          <AppCard key={item.id} style={styles.rowCard}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.route ? `${item.route.originCity ?? item.route.origin} → ${item.route.destination}` : 'Ruta'}</Text>
              <Text style={styles.meta}>{new Date(item.departureTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })} · ${Number(item.price).toFixed(2)} · {item.totalSeats} asientos</Text>
            </View>
            <Pressable onPress={() => { setEditingTrip(item.id); setTrip({ routeId: item.routeId, departureTime: item.departureTime.slice(0, 16), arrivalTime: item.arrivalTime, boardingPlatform: item.boardingPlatform, baggageInfo: item.baggageInfo, price: Number(item.price), totalSeats: item.totalSeats, status: item.status }); }} style={styles.editBtn}>
              <Text style={styles.editText}>Editar</Text>
            </Pressable>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  heading: { color: colors.text, fontSize: 17, fontWeight: '800' },
  form: { padding: 16, gap: 10 },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.text },
  rowCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1, gap: 4 },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  meta: { color: colors.textSecondary, fontSize: 12 },
  editBtn: { backgroundColor: colors.surfaceRaised, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
