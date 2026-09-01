import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createParkingTicket, getParking, ParkingLot } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';
import AppState from '../components/AppState';

export default function ParkingScreen() {
  const navigation = useNavigation<any>();
  const { user, token, startGuestSession } = useAuth();
  const [parking, setParking] = useState<ParkingLot[]>([]);
  const [selected, setSelected] = useState<ParkingLot | null>(null);
  const [space, setSpace] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  const load = async () => { setLoading(true); try { setParking((await getParking(date)).parking); setError(''); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar parqueaderos.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [date]);

  const buy = async () => {
    const number = Number(space);
    if (!selected || !Number.isInteger(number) || number < 1 || number > selected.totalSpaces || !date) { Alert.alert('Datos incompletos', 'Elige un parqueadero, espacio y fecha válidos.'); return; }
    if ((!user || !token) && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || fullName.trim().length < 2 || phone.trim().length < 7)) { Alert.alert('Completa tus datos', 'Necesitamos correo, nombre y teléfono para continuar.'); return; }
    setBuying(true);
    try { const session = user && token ? { user, token } : await startGuestSession(email.trim().toLowerCase(), fullName.trim(), phone.trim()); const response = await createParkingTicket(session.token, selected.id, number, new Date(`${date}T12:00:00`).toISOString()); navigation.navigate('Ticket', { ticketId: response.ticket.id, qrPayload: response.ticket.qrPayload, status: response.ticket.status, movieTitle: selected.name, selectedSeats: [`Espacio ${response.ticket.spaceNumber}`], startTime: response.ticket.date, roomName: `${selected.city} · ${selected.address}` }); setSelected(null); } catch (buyError) { Alert.alert('No se pudo generar el ticket', buyError instanceof Error ? buyError.message : 'Inténtalo nuevamente.'); } finally { setBuying(false); }
  };

  if (selected) return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={() => setSelected(null)} style={styles.back}><Ionicons name="arrow-back" size={18} color={colors.primary} /><Text style={styles.backText}>Volver a parqueaderos</Text></Pressable><AppCard style={styles.card}><Text style={styles.kicker}>Pase demo de estacionamiento</Text><Text style={styles.title}>{selected.name}</Text><Text style={styles.meta}>{selected.city} · {selected.address}</Text><Text style={styles.meta}>Operador: {selected.operator} · Horario: {selected.openingHours}</Text><Text style={styles.meta}>{selected.terminalName ? `Terminal: ${selected.terminalName} · ` : ''}Acceso: {selected.accessMode} · Vehículos: {selected.vehicleTypes.join(', ')}</Text><Text style={styles.meta}>Disponibles para {date}: {selected.availableSpaces ?? 0} de {selected.totalSpaces}</Text><Text style={styles.notice}>Demo: esta reserva representa un espacio lógico y no confirma disponibilidad oficial ni integración con sensores.</Text><Text style={styles.price}>${Number(selected.price).toFixed(2)} por espacio</Text><AppInput label={`Espacio (1-${selected.totalSpaces})`} value={space} onChangeText={setSpace} keyboardType="numeric" placeholder="Ej. 24" /><AppInput label="Fecha" value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" /><GuestFields user={user} email={email} setEmail={setEmail} fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone} /><AppButton label="Comprar pase QR demo" onPress={() => void buy()} loading={buying} disabled={buying || selected.availableSpaces === 0} /><AppButton label="Cancelar" variant="secondary" onPress={() => setSelected(null)} disabled={buying} /></AppCard></ScrollView></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><View><Text style={styles.kicker}>Movilidad</Text><Text style={styles.title}>Parqueaderos</Text></View><Ionicons name="car-outline" size={28} color={colors.primary} /></View><AppInput label="Fecha de consulta" value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" />{loading ? <AppState loading title="Cargando disponibilidad..." /> : error ? <><AppState title="No se pudieron cargar" message={error} /><AppButton label="Reintentar" onPress={() => void load()} /></> : parking.length === 0 ? <AppState title="No hay parqueaderos disponibles" message="Vuelve a consultar más tarde." /> : parking.map((item) => <Pressable key={item.id} onPress={() => { setSelected(item); setSpace(''); }}><AppCard style={styles.listCard}><View style={styles.icon}><Ionicons name="car-sport-outline" size={23} color={colors.primary} /></View><View style={styles.info}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.city} · {item.address}</Text><Text style={styles.meta}>{item.availableSpaces ?? 0} libres de {item.totalSpaces} · {item.accessMode}</Text><Text style={styles.meta}>{item.operator} · {item.terminalName ?? 'Sin terminal'}</Text></View><Text style={styles.price}>${Number(item.price).toFixed(2)}</Text></AppCard></Pressable>)}</ScrollView></SafeAreaView>;
}

function GuestFields({ user, email, setEmail, fullName, setFullName, phone, setPhone }: any) { return !user?.fullName || !user?.phone ? <View style={styles.guest}><Text style={styles.section}>Datos para tu compra</Text><AppInput label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><AppInput label="Nombre completo" value={fullName} onChangeText={setFullName} /><AppInput label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View> : null; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, gap: 14 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kicker: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }, title: { color: colors.text, fontSize: 29, fontWeight: '800', fontFamily: typography.display }, card: { padding: 18, gap: 12 }, listCard: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center' }, info: { flex: 1, gap: 4 }, name: { color: colors.text, fontSize: 17, fontWeight: '800' }, meta: { color: colors.textSecondary, fontSize: 12 }, notice: { color: colors.warning, fontSize: 12 }, price: { color: colors.success, fontSize: 16, fontWeight: '800' }, back: { flexDirection: 'row', alignItems: 'center', gap: 8 }, backText: { color: colors.primary, fontWeight: '700' }, guest: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 7 }, section: { color: colors.text, fontSize: 16, fontWeight: '800' } });