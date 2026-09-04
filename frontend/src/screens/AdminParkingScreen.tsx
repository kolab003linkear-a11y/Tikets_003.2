// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AdminParkingDashboard, AdminParkingInput, ParkingLot, ParkingSpace, createAdminParking, createAdminParkingSpace, deleteAdminParking, getAdminParking, updateAdminParking, updateAdminParkingSpace } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppScreenHeader from '../components/AppScreenHeader';
import AppInput from '../components/AppInput';
import AppState from '../components/AppState';

const empty: AdminParkingInput = { name: '', address: '', city: '', totalSpaces: 24, price: 10, operator: 'Operador TiKetSafe', openingHours: '06:00 - 23:00', terminalName: null, accessMode: 'QR', vehicleTypes: ['AUTO'], status: 'ACTIVE' };
const statusLabels: Record<ParkingSpace['status'], string> = { AVAILABLE: 'Disponible', MAINTENANCE: 'Mantenimiento', CLOSED: 'Cerrada' };
type FloorFilter = 'ALL' | '1' | '2' | '3';
const floorFilters: Array<{ key: FloorFilter; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: '1', label: 'Piso 1 (Nivel A)' },
  { key: '2', label: 'Piso 2 (Nivel B)' },
  { key: '3', label: 'Piso 3 (Nivel C)' },
];

const parseSpaceInput = (value: string, totalSpaces: number) => {
  const normalized = value.trim().toUpperCase();
  if (/^\d+$/.test(normalized)) return { spaceNumber: Number(normalized), code: undefined };
  const match = normalized.match(/^([ABC])(\d+)-(\d+)$/);
  if (!match) return null;
  const [, row, position, floor] = match;
  if (Number(floor) < 1 || Number(floor) > 3 || Number(floor) !== row.charCodeAt(0) - 64) return null;
  const baseSize = Math.floor(totalSpaces / 3);
  const remainder = totalSpaces % 3;
  const firstFloorSize = baseSize + (remainder > 0 ? 1 : 0);
  const secondFloorSize = baseSize + (remainder > 1 ? 1 : 0);
  const offset = row === 'A' ? 0 : row === 'B' ? firstFloorSize : firstFloorSize + secondFloorSize;
  return { spaceNumber: offset + Number(position), code: normalized };
};

export default function AdminParkingScreen() {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const [items, setItems] = useState<ParkingLot[]>([]);
  const [dashboard, setDashboard] = useState<AdminParkingDashboard | null>(null);
  const [draft, setDraft] = useState<AdminParkingInput>(empty);
  const [spaceNumber, setSpaceNumber] = useState('');
  const [editing, setEditing] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [floorFilter, setFloorFilter] = useState<FloorFilter>('ALL');
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const load = useCallback(async (background = false) => {
    if (!token) return;
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (!background) setLoading(true);
    try {
      const response = await getAdminParking(token);
      setItems(response.parking);
      setDashboard(response);
      setLastUpdated(response.updatedAt);
      setIsLive(true);
      setError('');
    } catch (e) {
      setIsLive(false);
      if (!background) setError(e instanceof Error ? e.message : 'No se pudo cargar los parqueaderos.');
    }
    finally { setLoading(false); requestInFlight.current = false; }
  }, [token]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    void load();
    const timer = setInterval(() => void load(true), 5000);
    return () => clearInterval(timer);
  }, [load, user?.role]);

  if (!user || user.role !== 'ADMIN') return <AppState title="Acceso restringido" />;
  if (loading && items.length === 0) return <AppState title="Cargando parqueaderos" message="Sincronizando las plazas del cliente y del administrador." loading />;
  if (error && items.length === 0) return <AppState title="No se pudo cargar" message={error} />;

  const saveParking = async () => {
    if (!token || !draft.name.trim() || !draft.address.trim() || !draft.city.trim() || draft.totalSpaces < 1) { Alert.alert('Datos incompletos', 'Completa nombre, dirección, ciudad y capacidad.'); return; }
    setSaving(true);
    try {
      if (editing) await updateAdminParking(token, editing, draft); else await createAdminParking(token, draft);
      setDraft(empty); setEditing(''); await load();
    } catch (e) { Alert.alert('No se pudo guardar', e instanceof Error ? e.message : 'Revisa los datos.'); }
    finally { setSaving(false); }
  };

  const editParking = (item: ParkingLot) => {
    setEditing(item.id);
    setDraft({ name: item.name, address: item.address, city: item.city, totalSpaces: item.totalSpaces, price: Number(item.price), operator: item.operator, openingHours: item.openingHours, terminalName: item.terminalName, accessMode: item.accessMode, vehicleTypes: item.vehicleTypes, status: item.status });
  };

  const removeParking = (parking: ParkingLot) => {
    if (!token) return;
    Alert.alert('Eliminar parqueadero', '¿Estás seguro de eliminar este parqueadero y todas sus plazas asociadas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void (async () => {
        try { await deleteAdminParking(token, parking.id); if (editing === parking.id) { setEditing(''); setDraft(empty); } await load(); }
        catch (e) { Alert.alert('No se pudo eliminar', e instanceof Error ? e.message : 'Inténtalo nuevamente.'); }
      })() },
    ]);
  };

  const addSpace = async (parking: ParkingLot) => {
    const parsed = parseSpaceInput(spaceNumber, parking.totalSpaces);
    if (!token || !parsed || parsed.spaceNumber < 1) { Alert.alert('Plaza inválida', 'Usa un número, por ejemplo 128, o un código como B4-16.'); return; }
    try { await createAdminParkingSpace(token, parking.id, parsed); setSpaceNumber(''); await load(); }
    catch (e) { Alert.alert('No se pudo agregar la plaza', e instanceof Error ? e.message : 'La plaza ya existe o está fuera de capacidad.'); }
  };

  const changeSpaceStatus = async (parking: ParkingLot, space: ParkingSpace, status: ParkingSpace['status']) => {
    if (!token || space.status === status) return;
    try { await updateAdminParkingSpace(token, parking.id, space.id, status); await load(); }
    catch (e) { Alert.alert('No se pudo cambiar el estado', e instanceof Error ? e.message : 'La plaza no pudo actualizarse.'); }
  };

  const allSpaces = items.flatMap((parking) => parking.spaces ?? []);
  const totalSpaces = allSpaces.length;
  const occupiedSpaces = allSpaces.filter((space) => space.occupied).length;
  const availableSpaces = allSpaces.filter((space) => space.status === 'AVAILABLE' && !space.occupied).length;
  const occupancyPercent = totalSpaces ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;
  const projectedRevenue = dashboard?.projectedRevenue ?? 0;
  const demandLabels = ['08h', '10h', '12h', '14h', '18h', '20h'];
  const demandCounts = demandLabels.map((label) => dashboard?.demandByHour.find((item) => item.hour === Number(label.slice(0, 2)))?.count ?? 0);
  const maxDemand = Math.max(...demandCounts, 1);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <AppScreenHeader eyebrow="Parkswift admin" title="Parqueaderos" subtitle="Mismos parqueaderos y plazas disponibles para clientes y administradores." onBack={() => navigation.goBack()} />
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}><View style={[styles.liveDot, !isLive && { backgroundColor: colors.critical }]} /><Text style={{ color: isLive ? colors.success : colors.critical, fontSize: 11, fontWeight: '700' }}>{isLive ? 'EN VIVO · Actualización automática cada 5 segundos' : 'Sin conexión · Mostrando último estado disponible'}</Text>{lastUpdated ? <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text> : null}</View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Text style={styles.dashboardHeading}>Dashboard operativo</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir detalle de ocupación actual" onPress={() => setShowReports((visible) => !visible)}><AppCard style={styles.occupancyCard}><View style={styles.cardTop}><View><Text style={styles.cardLabel}>Ocupación actual</Text><Text style={styles.occupancyValue}>{occupancyPercent}%</Text><Text style={styles.cardMeta}>Capacidad usada</Text></View><View style={styles.liveBadge}><View style={[styles.liveDot, !isLive && { backgroundColor: colors.critical }]} /><Text style={[styles.liveText, !isLive && { color: colors.critical }]}>{isLive ? 'EN VIVO' : 'SIN CONEXIÓN'}</Text></View></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${occupancyPercent}%` }]} /></View><View style={styles.metricRow}><Text style={styles.metricText}>{availableSpaces} disponibles</Text><Text style={styles.metricText}>{occupiedSpaces} ocupadas</Text></View><Text style={styles.tapHint}>{showReports ? 'Ocultar detalle' : 'Toca para ver Estado en Tiempo Real y Reportes Avanzados'}</Text></AppCard></Pressable>
    <AppCard style={styles.revenueCard}><View><Text style={styles.cardLabel}>Ingresos proyectados</Text><Text style={styles.revenueValue}>${projectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text><Text style={styles.cardMeta}>Resumen estimado del día</Text></View><View style={styles.todayBadge}><Text style={styles.todayText}>HOY</Text></View></AppCard>
    {showReports && <AppCard style={styles.reportsCard}><View style={styles.reportHeader}><Text style={styles.reportTitle}>Estado en Tiempo Real</Text><Text style={styles.reportUpdated}>{isLive ? 'Actualización automática' : 'Último estado conocido'}</Text></View><View style={styles.chartRow}><View style={styles.donut}><View style={[styles.donutArc, { transform: [{ rotate: `${Math.max(0, occupancyPercent) * 3.6 - 45}deg` }] }]} /><Text style={styles.donutValue}>{occupancyPercent}%</Text><Text style={styles.donutCaption}>Capacidad usada</Text></View><View style={styles.reportNumbers}><Text style={styles.reportNumber}>{totalSpaces}</Text><Text style={styles.cardMeta}>Total plazas</Text><Text style={[styles.reportNumber, { color: colors.success }]}>{availableSpaces}</Text><Text style={styles.cardMeta}>Disponibles</Text></View></View><Text style={styles.reportTitle}>Reportes avanzados</Text><Text style={styles.cardMeta}>Horas de mayor demanda · ocupaciones reales del día</Text><View style={styles.barChart}>{demandCounts.map((count, index) => <View key={demandLabels[index]} style={styles.barColumn}><View style={styles.barTrack}><View style={[styles.bar, { height: `${(count / maxDemand) * 100}%` }]} /></View><Text style={styles.barLabel}>{demandLabels[index]}</Text><Text style={{ color: colors.textSecondary, fontSize: 9 }}>{count}</Text></View>)}</View></AppCard>}
    <AppCard style={styles.form}><Text style={styles.heading}>{editing ? 'Editar parqueadero' : 'Agregar parqueadero'}</Text><AppInput label="Nombre" value={draft.name} onChangeText={name => setDraft({ ...draft, name })} /><AppInput label="Dirección" value={draft.address} onChangeText={address => setDraft({ ...draft, address })} /><AppInput label="Ciudad" value={draft.city} onChangeText={city => setDraft({ ...draft, city })} /><AppInput label="Capacidad total" value={String(draft.totalSpaces)} keyboardType="numeric" onChangeText={value => setDraft({ ...draft, totalSpaces: Number(value) || 0 })} /><AppInput label="Precio por hora" value={String(draft.price)} keyboardType="numeric" onChangeText={value => setDraft({ ...draft, price: Number(value) || 0 })} /><AppButton label={saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar parqueadero'} onPress={() => void saveParking()} disabled={saving} />{editing ? <AppButton label="Cancelar edición" variant="secondary" onPress={() => { setEditing(''); setDraft(empty); }} /> : null}</AppCard>
    {items.map(parking => { const spaces = parking.spaces ?? []; const visibleSpaces = floorFilter === 'ALL' ? spaces : spaces.filter(space => space.code.startsWith(floorFilter === '1' ? 'A' : floorFilter === '2' ? 'B' : 'C') || space.floor === Number(floorFilter)); const occupied = spaces.filter(space => space.occupied).length; return <AppCard key={parking.id} style={styles.parkingCard}><View style={styles.parkingHeader}><View style={styles.copy}><Text style={styles.parkingName}>{parking.name}</Text><Text style={styles.meta}>{parking.address} · {parking.city}</Text><Text style={styles.meta}>{occupied} ocupadas · {spaces.filter(space => space.status === 'AVAILABLE' && !space.occupied).length} disponibles · {spaces.length} plazas</Text></View><View style={styles.headerActions}><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${parking.name}`} onPress={() => editParking(parking)}><Text style={styles.edit}>Editar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${parking.name}`} onPress={() => removeParking(parking)}><Ionicons name="trash-outline" size={18} color={colors.critical} /></Pressable></View></View><View style={styles.addRow}><AppInput label="Número o código (ej. B4-16)" value={spaceNumber} keyboardType="default" onChangeText={setSpaceNumber} style={styles.spaceInput} /><AppButton label="Agregar plaza" onPress={() => void addSpace(parking)} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{floorFilters.map(filter => <Pressable key={filter.key} accessibilityRole="button" accessibilityState={{ selected: floorFilter === filter.key }} onPress={() => setFloorFilter(filter.key)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: floorFilter === filter.key ? colors.primary : colors.input, borderWidth: 1, borderColor: floorFilter === filter.key ? colors.primary : colors.border }}><Text style={{ color: floorFilter === filter.key ? colors.text : colors.textSecondary, fontSize: 11, fontWeight: '800' }}>{filter.label}</Text></Pressable>)}</ScrollView><Text style={{ color: colors.textSecondary, fontSize: 11 }}>{visibleSpaces.length} plazas visibles</Text><View style={styles.spaceGrid}>{visibleSpaces.map(space => <View key={space.id} style={[styles.space, space.occupied && styles.occupied, space.status === 'MAINTENANCE' && styles.maintenance, space.status === 'CLOSED' && styles.closed]}><Text style={styles.spaceCode}>{space.code}</Text><Text style={styles.spaceStatus}>{space.occupied ? 'Ocupada' : statusLabels[space.status]}</Text><View style={styles.statusActions}>{(['AVAILABLE', 'MAINTENANCE', 'CLOSED'] as ParkingSpace['status'][]).map(status => <Pressable key={status} accessibilityRole="button" accessibilityLabel={`${space.code}: ${statusLabels[status]}`} onPress={() => void changeSpaceStatus(parking, space, status)} style={[styles.statusButton, space.status === status && styles.statusSelected]}><Text style={[styles.statusText, space.status === status && styles.statusTextSelected]}>{status === 'AVAILABLE' ? 'OK' : status === 'MAINTENANCE' ? 'M' : 'C'}</Text></Pressable>)}</View></View>)}</View></AppCard>; })}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 16, gap: 12, paddingBottom: 36 }, backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 }, backText: { color: colors.primary, fontSize: 13, fontWeight: '800' }, eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }, title: { color: colors.text, fontSize: 28, fontWeight: '800' }, subtitle: { color: colors.textSecondary, fontSize: 13 }, error: { color: colors.warning, fontSize: 12 }, dashboardHeading: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 4 }, occupancyCard: { padding: 18, borderColor: colors.borderStrong, borderWidth: 1 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, cardLabel: { color: colors.text, fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }, occupancyValue: { color: colors.primary, fontSize: 38, fontWeight: '900', marginTop: 6 }, cardMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 }, liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success + '20', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 16 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, liveText: { color: colors.success, fontSize: 10, fontWeight: '800' }, progressTrack: { height: 10, backgroundColor: colors.input, borderRadius: 5, overflow: 'hidden', marginTop: 16 }, progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 }, metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }, metricText: { color: colors.text, fontSize: 12, fontWeight: '700' }, tapHint: { color: colors.primary, fontSize: 11, marginTop: 13 }, revenueCard: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderColor: colors.success, borderWidth: 1 }, revenueValue: { color: colors.success, fontSize: 30, fontWeight: '900', marginTop: 6 }, todayBadge: { backgroundColor: colors.success + '20', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16 }, todayText: { color: colors.success, fontSize: 11, fontWeight: '800' }, reportsCard: { padding: 18, gap: 12 }, reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, reportTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, reportUpdated: { color: colors.success, fontSize: 10, fontWeight: '700' }, chartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8 }, donut: { width: 142, height: 142, borderRadius: 71, borderWidth: 14, borderColor: colors.input, alignItems: 'center', justifyContent: 'center', position: 'relative' }, donutArc: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 14, borderColor: colors.primary, borderRightColor: 'transparent', borderBottomColor: 'transparent' }, donutValue: { color: colors.text, fontSize: 30, fontWeight: '900' }, donutCaption: { color: colors.textSecondary, fontSize: 10 }, reportNumbers: { gap: 2 }, reportNumber: { color: colors.text, fontSize: 23, fontWeight: '900', marginTop: 8 }, barChart: { height: 145, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 12 }, barColumn: { height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }, barTrack: { height: 112, width: 24, backgroundColor: colors.input, borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden' }, bar: { width: '100%', backgroundColor: colors.primary, borderRadius: 5 }, barLabel: { color: colors.textSecondary, fontSize: 10 }, form: { padding: 16, gap: 7 }, heading: { color: colors.text, fontSize: 17, fontWeight: '800' }, parkingCard: { padding: 14, gap: 12 }, parkingHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, copy: { flex: 1, gap: 4 }, parkingName: { color: colors.text, fontSize: 17, fontWeight: '800' }, meta: { color: colors.textSecondary, fontSize: 12 }, edit: { color: colors.primary, fontWeight: '800' }, addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, spaceInput: { flex: 1 }, spaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, space: { width: '31%', minHeight: 84, padding: 8, borderRadius: 10, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, occupied: { borderColor: colors.warning, backgroundColor: '#493A18' }, maintenance: { borderColor: colors.warning }, closed: { borderColor: colors.critical, backgroundColor: '#401B2A' }, spaceCode: { color: colors.text, fontWeight: '800', fontSize: 13 }, spaceStatus: { color: colors.textSecondary, fontSize: 10, marginTop: 3 }, statusActions: { flexDirection: 'row', gap: 4, marginTop: 7 }, statusButton: { width: 22, height: 22, borderRadius: 5, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' }, statusSelected: { backgroundColor: colors.primary }, statusText: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' }, statusTextSelected: { color: colors.text } });
